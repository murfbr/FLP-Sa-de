-- Migration to update booking validation logic
-- Allows multiple recurring series for the same client
-- Enforces real time-slot conflicts for Client and Professional
-- Replaces previous restrictive logic regarding recurring series

-- Drop legacy/previous versions to ensure clean slate for the signature
DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, uuid, uuid, boolean);

-- Recreate book_appointment with explicit conflict checks and capacity logic
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_schedule_id UUID,
  p_client_id UUID,
  p_service_id UUID,
  p_client_package_id UUID DEFAULT NULL,
  p_is_recurring BOOLEAN DEFAULT FALSE
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
  v_service_max_attendees INT;
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_slots_to_book UUID[];
  v_current_attendees INT;
  v_subscription_count INT;
  v_package_sessions INT;
  v_schedule_id UUID;
BEGIN
  -- 1. Get service details
  SELECT duration_minutes, price, value_type, max_attendees 
  INTO v_service_duration, v_service_price, v_service_value_type, v_service_max_attendees
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

  IF v_slots_to_book IS NULL OR array_length(v_slots_to_book, 1) = 0 THEN
      RAISE EXCEPTION 'Não foram encontrados horários suficientes na agenda do profissional.';
  END IF;

  -- 5. VALIDATION: Check Client Availability (Avoid double booking for the client)
  -- Checks if client has any active appointment that overlaps with the requested time
  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.schedules s ON a.schedule_id = s.id
    JOIN public.services srv ON a.service_id = srv.id
    WHERE a.client_id = p_client_id
      AND a.status NOT IN ('cancelled', 'no_show')
      AND (
        s.start_time < v_end_time 
        AND 
        (s.start_time + (srv.duration_minutes * interval '1 minute')) > v_start_time
      )
  ) THEN
    RAISE EXCEPTION 'Cliente já está agendado neste horário.';
  END IF;

  -- 6. VALIDATION: Check Professional Capacity for EACH slot required
  -- We loop through required slots to check if any of them is full
  FOREACH v_schedule_id IN ARRAY v_slots_to_book LOOP
      SELECT count(*) INTO v_current_attendees
      FROM public.appointments
      WHERE schedule_id = v_schedule_id
        AND status NOT IN ('cancelled', 'no_show');
      
      IF v_current_attendees >= v_service_max_attendees THEN
         RAISE EXCEPTION 'Turma lotada para o horário de %.', v_start_time;
      END IF;
  END LOOP;

  -- 7. Determine Price and Validation based on Service Type
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
      -- Validate and use package
      SELECT sessions_remaining INTO v_package_sessions
      FROM public.client_packages
      WHERE id = p_client_package_id
        AND client_id = p_client_id
        FOR UPDATE; -- Lock row

      IF NOT FOUND OR v_package_sessions <= 0 THEN
        RAISE EXCEPTION 'Pacote inválido ou sem sessões disponíveis.';
      END IF;

      -- Decrement session
      UPDATE public.client_packages
      SET sessions_remaining = sessions_remaining - 1
      WHERE id = p_client_package_id;

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

  -- 8. Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id, client_package_id, is_recurring)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id, p_client_package_id, p_is_recurring)
  RETURNING id INTO v_appointment_id;

  -- 9. Update is_booked flag on schedules IF they reached capacity
  FOREACH v_schedule_id IN ARRAY v_slots_to_book LOOP
      SELECT count(*) INTO v_current_attendees
      FROM public.appointments
      WHERE schedule_id = v_schedule_id
        AND status NOT IN ('cancelled', 'no_show');
      
      IF v_current_attendees >= v_service_max_attendees THEN
         UPDATE public.schedules SET is_booked = TRUE WHERE id = v_schedule_id;
      END IF;
  END LOOP;

  -- 10. Create a financial record
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
