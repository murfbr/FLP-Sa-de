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
  v_max_attendees INT;
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_slots_to_book UUID[];
  v_conflict_count INT;
  v_subscription_count INT;
  v_package_sessions INT;
BEGIN
  -- 1. Get service details
  SELECT duration_minutes, price, value_type, max_attendees 
  INTO v_service_duration, v_service_price, v_service_value_type, v_max_attendees
  FROM public.services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;
  
  -- Default max_attendees if null
  v_max_attendees := COALESCE(v_max_attendees, 1);

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

  -- 5. Check Capacity and Service Conflicts
  -- Cast service_id to text before MAX() to avoid "function max(uuid) does not exist" error
  SELECT count(*) INTO v_conflict_count
  FROM (
    SELECT a.schedule_id
    FROM public.appointments a
    WHERE a.schedule_id = ANY(v_slots_to_book)
      AND a.status NOT IN ('cancelled', 'no_show')
    GROUP BY a.schedule_id
    HAVING 
      -- Check 1: Capacity Reached
      count(*) >= v_max_attendees
      OR 
      -- Check 2: Different Service (if mixed services not allowed)
      (count(*) > 0 AND MAX(a.service_id::text)::uuid != p_service_id)
  ) conflicts;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Horário indisponível (capacidade excedida ou conflito de serviço).';
  END IF;

  -- 6. Determine Price and Validation
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

    v_final_price := 0; 

  ELSE -- 'session'
    IF p_client_package_id IS NOT NULL THEN
      -- Validate and use package
      SELECT sessions_remaining INTO v_package_sessions
      FROM public.client_packages
      WHERE id = p_client_package_id
        AND client_id = p_client_id
        FOR UPDATE; 

      IF NOT FOUND OR v_package_sessions <= 0 THEN
        RAISE EXCEPTION 'Pacote inválido ou sem sessões disponíveis.';
      END IF;

      -- Decrement session
      UPDATE public.client_packages
      SET sessions_remaining = sessions_remaining - 1
      WHERE id = p_client_package_id;

      v_final_price := 0; 
    ELSE
      -- Standard single session
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

  -- 7. Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id, client_package_id, is_recurring)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id, p_client_package_id, p_is_recurring)
  RETURNING id INTO v_appointment_id;

  -- 8. Create a financial record
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
  
  -- REMOVED: 9. Update is_booked flag (based on new capacity check)
  -- The is_booked column is deprecated and removed from logic.

  RETURN v_appointment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reschedule_appointment(
  p_appointment_id UUID,
  p_new_schedule_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_schedule_id UUID;
  v_new_professional_id UUID;
  v_service_id UUID;
  v_max_attendees INT;
  v_conflict_count INT;
BEGIN
  -- Get Appointment Info
  SELECT schedule_id, service_id INTO v_old_schedule_id, v_service_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado.';
  END IF;

  -- Get Service Info (Capacity)
  SELECT max_attendees INTO v_max_attendees
  FROM public.services
  WHERE id = v_service_id;
  
  v_max_attendees := COALESCE(v_max_attendees, 1);

  -- Get New Schedule Info
  SELECT professional_id INTO v_new_professional_id
  FROM public.schedules
  WHERE id = p_new_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Novo horário não encontrado.';
  END IF;

  -- CHECK CAPACITY ON NEW SCHEDULE
  -- Cast service_id to text before MAX() to avoid errors
  SELECT count(*) INTO v_conflict_count
  FROM (
    SELECT a.schedule_id
    FROM public.appointments a
    WHERE a.schedule_id = p_new_schedule_id
      AND a.status NOT IN ('cancelled', 'no_show')
    GROUP BY a.schedule_id
    HAVING 
      count(*) >= v_max_attendees
      OR 
      (count(*) > 0 AND MAX(a.service_id::text)::uuid != v_service_id)
  ) conflicts;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Horário indisponível para remarcação (capacidade excedida ou conflito de serviço).';
  END IF;

  -- UPDATE APPOINTMENT
  UPDATE public.appointments
  SET
    schedule_id = p_new_schedule_id,
    professional_id = v_new_professional_id,
    status = 'scheduled'
  WHERE id = p_appointment_id;

  -- REMOVED: UPDATE IS_BOOKED LOGIC

END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_appointment(p_appointment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule_id UUID;
BEGIN
  -- Get the schedule_id from the appointment
  SELECT schedule_id INTO v_schedule_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado.';
  END IF;

  -- Update appointment status to cancelled
  UPDATE public.appointments
  SET status = 'cancelled'
  WHERE id = p_appointment_id;

  -- REMOVED: Free up the schedule slot (is_booked) logic
END;
$$;
