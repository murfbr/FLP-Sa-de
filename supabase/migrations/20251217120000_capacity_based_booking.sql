-- Update get_available_slots_for_service to support capacity logic
DROP FUNCTION IF EXISTS get_available_slots_for_service(uuid, uuid, text, text);

CREATE OR REPLACE FUNCTION get_available_slots_for_service(
  p_professional_id UUID,
  p_service_id UUID,
  p_start_date TEXT,
  p_end_date TEXT
)
RETURNS TABLE (
  id UUID,
  professional_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  current_count BIGINT,
  max_capacity INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_ts TIMESTAMPTZ;
  v_end_ts TIMESTAMPTZ;
  v_service_duration INT;
  v_service_max_attendees INT;
  v_slot_interval_minutes INT := 30;
  v_slots_needed INT;
  v_lead_offset INT;
BEGIN
  -- Validate
  IF p_professional_id IS NULL OR p_service_id IS NULL OR p_start_date IS NULL OR p_end_date IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    v_start_ts := p_start_date::TIMESTAMPTZ;
    v_end_ts := p_end_date::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;

  -- Get service details
  SELECT duration_minutes, max_attendees INTO v_service_duration, v_service_max_attendees
  FROM services
  WHERE id = p_service_id;
  
  IF v_service_duration IS NULL THEN
    RETURN;
  END IF;

  v_slots_needed := CEIL(v_service_duration::numeric / v_slot_interval_minutes::numeric);
  IF v_slots_needed < 1 THEN v_slots_needed := 1; END IF;
  v_lead_offset := v_slots_needed - 1;

  RETURN QUERY
  WITH slot_status AS (
    SELECT
      s.id,
      s.professional_id,
      s.start_time,
      s.end_time,
      -- Count appointments for this slot
      COUNT(a.id) as appt_count,
      -- Check if there are appointments for OTHER services
      BOOL_OR(a.service_id IS NOT NULL AND a.service_id != p_service_id) as has_conflict
    FROM schedules s
    LEFT JOIN appointments a ON s.id = a.schedule_id AND a.status != 'cancelled'
    WHERE s.professional_id = p_professional_id
      AND s.start_time >= v_start_ts
      AND s.start_time <= v_end_ts
    GROUP BY s.id, s.professional_id, s.start_time, s.end_time
  ),
  valid_slots AS (
    SELECT
      ss.id,
      ss.professional_id,
      ss.start_time,
      ss.end_time,
      ss.appt_count
    FROM slot_status ss
    WHERE 
      -- 1. No conflict with other services
      ss.has_conflict = FALSE
      -- 2. Capacity check (for this specific slot)
      AND ss.appt_count < v_service_max_attendees
      -- 3. Not blocked by override
      AND NOT EXISTS (
          SELECT 1 FROM professional_availability_overrides o
          WHERE o.professional_id = p_professional_id
          AND o.override_date = ss.start_time::date
          AND o.start_time <= ss.start_time::time
          AND o.end_time > ss.start_time::time
          AND o.is_available = false
      )
  ),
  consecutive_check AS (
      SELECT
          vs.id,
          vs.professional_id,
          vs.start_time,
          vs.end_time,
          vs.appt_count,
          -- Check if we have enough consecutive slots that are ALSO valid
          LEAD(vs.start_time, v_lead_offset) OVER (ORDER BY vs.start_time) as nth_slot_start_time,
          -- Get the max count across the required slots (bottleneck)
          MAX(vs.appt_count) OVER (ORDER BY vs.start_time ROWS BETWEEN CURRENT ROW AND v_lead_offset FOLLOWING) as max_count_in_block
      FROM valid_slots vs
  )
  SELECT
    cc.id,
    cc.professional_id,
    cc.start_time,
    cc.end_time,
    COALESCE(cc.max_count_in_block, 0)::BIGINT as current_count,
    v_service_max_attendees as max_capacity
  FROM consecutive_check cc
  WHERE cc.nth_slot_start_time IS NOT NULL
  AND cc.nth_slot_start_time = (cc.start_time + (v_lead_offset * v_slot_interval_minutes || ' minutes')::interval);
END;
$$;

-- Update book_appointment to enforce capacity and exclusivity
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
  v_service_max_attendees INT;
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_slots_to_book UUID[];
  v_slot_record RECORD;
  v_subscription_count INT;
  v_package_sessions INT;
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
    
  IF array_length(v_slots_to_book, 1) IS NULL THEN
     RAISE EXCEPTION 'Horários insuficientes para a duração do serviço.';
  END IF;

  -- 5. Validate Capacity and Exclusivity for ALL required slots
  -- We lock the schedule rows to prevent race conditions
  PERFORM 1 FROM public.schedules WHERE id = ANY(v_slots_to_book) FOR UPDATE;

  FOR v_slot_record IN 
    SELECT s.id, count(a.id) as current_count, bool_or(a.service_id IS NOT NULL AND a.service_id != p_service_id) as has_other_service
    FROM public.schedules s
    LEFT JOIN public.appointments a ON s.id = a.schedule_id AND a.status != 'cancelled'
    WHERE s.id = ANY(v_slots_to_book)
    GROUP BY s.id
  LOOP
    IF v_slot_record.has_other_service THEN
      RAISE EXCEPTION 'O profissional já possui agendamento de outro serviço neste horário.';
    END IF;
    
    IF v_slot_record.current_count >= v_service_max_attendees THEN
      RAISE EXCEPTION 'Capacidade máxima atingida para um ou mais horários.';
    END IF;
  END LOOP;

  -- 6. Determine Price (Existing Logic)
  IF v_service_value_type = 'monthly' THEN
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

  ELSE 
    IF p_client_package_id IS NOT NULL THEN
      SELECT sessions_remaining INTO v_package_sessions
      FROM public.client_packages
      WHERE id = p_client_package_id
        AND client_id = p_client_id
        FOR UPDATE; 

      IF NOT FOUND OR v_package_sessions <= 0 THEN
        RAISE EXCEPTION 'Pacote inválido ou sem sessões disponíveis.';
      END IF;

      UPDATE public.client_packages
      SET sessions_remaining = sessions_remaining - 1
      WHERE id = p_client_package_id;

      v_final_price := 0; 
    ELSE
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

  -- 7. Mark schedules as "booked" (has activity)
  UPDATE public.schedules
  SET is_booked = TRUE
  WHERE id = ANY(v_slots_to_book);

  -- 8. Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id, client_package_id)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id, p_client_package_id)
  RETURNING id INTO v_appointment_id;

  -- 9. Create financial record
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
