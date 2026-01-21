-- Fixes runtime error "function max(uuid) does not exist" in book_appointment
-- This error occurs because MAX() aggregate function cannot be applied directly to UUID columns
-- We need to cast to text first, then cast back to UUID in the capacity check logic

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
  -- We need to find all slots that overlap with the appointment time
  SELECT array_agg(id) INTO v_slots_to_book
  FROM public.schedules
  WHERE professional_id = v_professional_id
    AND start_time >= v_start_time
    AND start_time < v_end_time;

  -- 5. Check Capacity and Service Conflicts
  -- Fix: Cast service_id to text before MAX() to avoid "function max(uuid) does not exist" error
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
  
  -- 9. Update is_booked flag (based on new capacity check)
  UPDATE public.schedules s
  SET is_booked = (
    SELECT count(*) >= v_max_attendees
    FROM public.appointments a
    WHERE a.schedule_id = s.id
      AND a.status NOT IN ('cancelled', 'no_show')
  )
  WHERE id = ANY(v_slots_to_book);

  RETURN v_appointment_id;
END;
$$;
