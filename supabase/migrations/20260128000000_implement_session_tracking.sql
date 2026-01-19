-- 1. Add 'package_renewal' to notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'package_renewal';

-- 2. Update book_appointment function to NOT decrement sessions, but validate availability based on remaining - scheduled
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_schedule_id UUID,
  p_client_id UUID,
  p_service_id UUID,
  p_client_package_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_professional_id UUID;
  v_appointment_id UUID;
  v_service_price NUMERIC;
  v_service_duration INT;
  v_service_value_type TEXT;
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_slots_to_book UUID[];
  v_booked_slot_count INT;
  v_subscription_count INT;
  v_package_sessions INT;
  v_scheduled_count INT;
BEGIN
  -- 1. Get service details
  SELECT duration_minutes, price, value_type INTO v_service_duration, v_service_price, v_service_value_type
  FROM public.services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;

  -- 2. Get the start time and professional ID from the initial schedule slot
  SELECT start_time, professional_id INTO v_start_time, v_professional_id
  FROM public.schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário de início inválido.';
  END IF;

  -- 3. Calculate the appointment end time
  v_end_time := v_start_time + (v_service_duration * interval '1 minute');

  -- 4. Identify all schedule slots required for this appointment
  SELECT array_agg(id) INTO v_slots_to_book
  FROM public.schedules
  WHERE professional_id = v_professional_id
    AND start_time >= v_start_time
    AND start_time < v_end_time;

  -- 5. Check if any of the required slots are already booked
  SELECT count(*) INTO v_booked_slot_count
  FROM public.schedules
  WHERE id = ANY(v_slots_to_book) AND is_booked = TRUE;

  IF v_booked_slot_count > 0 THEN
    RAISE EXCEPTION 'Um ou mais horários necessários para este serviço já estão reservados.';
  END IF;

  -- 6. Determine Price and Validation based on Service Type
  IF v_service_value_type = 'monthly' THEN
    -- Check for active subscription
    SELECT count(*) INTO v_subscription_count
    FROM public.client_subscriptions
    WHERE client_id = p_client_id
      AND service_id = p_service_id
      AND status = 'active'
      AND (end_date IS NULL OR end_date > NOW());

    IF v_subscription_count = 0 THEN
      RAISE EXCEPTION 'Cliente não possui assinatura ativa para este serviço mensal.';
    END IF;

    v_final_price := 0; -- Subscription covers the cost

  ELSE -- 'session'
    IF p_client_package_id IS NOT NULL THEN
      -- Validate package availability (Remaining - Scheduled > 0)
      -- Lock row to prevent race conditions
      SELECT sessions_remaining INTO v_package_sessions
      FROM public.client_packages
      WHERE id = p_client_package_id
        AND client_id = p_client_id
        FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Pacote não encontrado.';
      END IF;

      -- Count currently scheduled (reserved) sessions for this package
      SELECT count(*) INTO v_scheduled_count
      FROM public.appointments
      WHERE client_package_id = p_client_package_id
        AND status IN ('scheduled', 'confirmed');

      -- Check if we have capacity
      IF (v_package_sessions - v_scheduled_count) <= 0 THEN
        RAISE EXCEPTION 'Pacote esgotado ou todas as sessões já estão agendadas.';
      END IF;

      -- NOTE: We do NOT decrement here anymore. Logic moved to completion trigger.
      
      v_final_price := 0; -- Paid via package
    ELSE
      -- Standard single session payment calculation
      SELECT partnership_id INTO v_client_partnership_id
      FROM public.clients
      WHERE id = p_client_id;

      v_final_price := v_service_price;

      IF v_client_partnership_id IS NOT NULL THEN
        SELECT discount_percentage INTO v_discount_percentage
        FROM public.partnership_discounts
        WHERE partnership_id = v_client_partnership_id AND (service_id = p_service_id OR service_id IS NULL)
        ORDER BY service_id IS NOT NULL DESC
        LIMIT 1;

        IF FOUND AND v_discount_percentage IS NOT NULL THEN
          v_final_price := v_service_price * (1 - (v_discount_percentage / 100.0));
        END IF;
      END IF;
    END IF;
  END IF;

  -- 7. Mark all required slots as booked
  UPDATE public.schedules
  SET is_booked = TRUE
  WHERE id = ANY(v_slots_to_book);

  -- 8. Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id, client_package_id)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id, p_client_package_id)
  RETURNING id INTO v_appointment_id;

  -- 9. Create a financial record
  INSERT INTO public.financial_records (client_id, professional_id, appointment_id, client_package_id, amount, description, payment_method)
  VALUES (
    p_client_id, 
    v_professional_id, 
    v_appointment_id, 
    p_client_package_id, 
    v_final_price, 
    CASE 
      WHEN v_service_value_type = 'monthly' THEN 'Agendamento via Assinatura Mensal'
      WHEN p_client_package_id IS NOT NULL THEN 'Agendamento via Pacote'
      ELSE 'Pagamento por agendamento avulso'
    END,
    CASE 
      WHEN v_service_value_type = 'monthly' OR p_client_package_id IS NOT NULL THEN 'Crédito/Assinatura'
      ELSE 'Pendente'
    END
  );

  RETURN v_appointment_id;
END;
$$;

-- 3. Data Fix: Refund sessions that are currently scheduled/confirmed
-- Since we changed logic from "decrement on booking" to "decrement on completion",
-- we need to add back sessions for appointments that are currently scheduled/confirmed
-- so the new validation logic works correctly (Remaining - Scheduled > 0).
UPDATE public.client_packages cp
SET sessions_remaining = sessions_remaining + (
  SELECT count(*)
  FROM public.appointments a
  WHERE a.client_package_id = cp.id
    AND a.status IN ('scheduled', 'confirmed')
);

-- 4. Create Trigger Function for Session Decrement and Notifications
CREATE OR REPLACE FUNCTION public.handle_session_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_remaining INT;
  v_client_name TEXT;
  v_package_name TEXT;
  v_admin_id UUID;
BEGIN
  -- Check if status changed to completed and has a package
  IF NEW.status = 'completed' AND OLD.status <> 'completed' AND NEW.client_package_id IS NOT NULL THEN
    
    -- Decrement session
    UPDATE public.client_packages
    SET sessions_remaining = sessions_remaining - 1
    WHERE id = NEW.client_package_id
    RETURNING sessions_remaining INTO v_new_remaining;

    -- Get details for notification
    SELECT c.name, p.name INTO v_client_name, v_package_name
    FROM public.clients c
    JOIN public.client_packages cp ON cp.id = NEW.client_package_id
    JOIN public.packages p ON p.id = cp.package_id
    WHERE c.id = NEW.client_id;

    -- Check for Notifications (1 remaining or 0 remaining)
    IF v_new_remaining = 1 OR v_new_remaining = 0 THEN
      
      -- Find all admin professionals
      FOR v_admin_id IN 
        SELECT p.id 
        FROM public.professionals p
        JOIN public.profiles pr ON pr.id = p.user_id
        WHERE pr.role = 'admin'
      LOOP
        IF v_new_remaining = 1 THEN
          INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
          VALUES (
            v_admin_id,
            'package_renewal',
            'Atenção: O cliente ' || v_client_name || ' realizou a penúltima sessão do pacote ' || v_package_name || '. Sugerir renovação.',
            NEW.client_id,
            '/admin/pacientes/' || NEW.client_id
          );
        ELSIF v_new_remaining = 0 THEN
          INSERT INTO public.professional_notifications (professional_id, type, message, related_entity_id, link)
          VALUES (
            v_admin_id,
            'package_renewal',
            'Atenção: O cliente ' || v_client_name || ' realizou a última sessão do pacote ' || v_package_name || '. Solicitar renovação imediata.',
            NEW.client_id,
            '/admin/pacientes/' || NEW.client_id
          );
        END IF;
      END LOOP;
      
    END IF;

  END IF;
  RETURN NEW;
END;
$$;

-- 5. Attach Trigger to Appointments
DROP TRIGGER IF EXISTS trigger_session_completion ON public.appointments;
CREATE TRIGGER trigger_session_completion
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.handle_session_completion();
