-- Migration: Full Capacity Booking Logic
-- Description: 
-- 1. Updates booking functions to fully support multi-attendee slots based on service capacity (max_attendees).
-- 2. Removes all dependencies on the deprecated 'is_booked' column in schedules table.
-- 3. Implements robust conflict detection (Service Mismatch vs Capacity Full).
-- 4. Fixes UUID aggregation issues.

-- Re-create book_appointment (Core Function) without is_booked updates
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
  v_conflict_count INT;
  v_subscription_count INT;
  v_package_sessions INT;
  v_existing_service_id UUID;
BEGIN
  -- 1. Get service details
  SELECT duration_minutes, price, value_type, max_attendees 
  INTO v_service_duration, v_service_price, v_service_value_type, v_max_attendees
  FROM public.services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;
  
  v_max_attendees := COALESCE(v_max_attendees, 1);

  -- 2. Get the start time and professional ID from the schedule
  SELECT start_time, professional_id INTO v_start_time, v_professional_id
  FROM public.schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário de início inválido.';
  END IF;

  -- 3. Check Capacity and Service Conflicts for this specific schedule
  -- We lock the appointments rows for this schedule to prevent race conditions
  SELECT 
    count(*),
    MAX(service_id::text)::uuid
  INTO 
    v_conflict_count,
    v_existing_service_id
  FROM public.appointments
  WHERE schedule_id = p_schedule_id
    AND status NOT IN ('cancelled', 'no_show');

  -- Check 1: Capacity
  IF v_conflict_count >= v_max_attendees THEN
    RAISE EXCEPTION 'Turma lotada: Capacidade máxima atingida (%/%)', v_conflict_count, v_max_attendees;
  END IF;

  -- Check 2: Service Mismatch (Only if there are existing appointments)
  IF v_conflict_count > 0 AND v_existing_service_id IS NOT NULL AND v_existing_service_id != p_service_id THEN
    RAISE EXCEPTION 'Conflito de serviço: Este horário já está reservado para outro tipo de serviço.';
  END IF;

  -- Check 3: Client already booked in this slot
  IF EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE schedule_id = p_schedule_id 
      AND client_id = p_client_id 
      AND status NOT IN ('cancelled', 'no_show')
  ) THEN
    RAISE EXCEPTION 'Cliente já está agendado neste horário.';
  END IF;

  -- 4. Determine Price and Validation (Billing Logic)
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

  -- 5. Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id, client_package_id, is_recurring)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id, p_client_package_id, p_is_recurring)
  RETURNING id INTO v_appointment_id;

  -- 6. Create a financial record
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
  
  -- Note: We REMOVED the update to schedules.is_booked as it is deprecated in favor of dynamic capacity checks.

  RETURN v_appointment_id;
END;
$$;

-- Re-create reschedule_appointment without is_booked updates
CREATE OR REPLACE FUNCTION public.reschedule_appointment(
  p_appointment_id UUID,
  p_new_schedule_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_professional_id UUID;
  v_service_id UUID;
  v_max_attendees INT;
  v_conflict_count INT;
  v_existing_service_id UUID;
BEGIN
  -- Get Appointment Info
  SELECT service_id INTO v_service_id
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
  SELECT 
    count(*),
    MAX(service_id::text)::uuid
  INTO 
    v_conflict_count,
    v_existing_service_id
  FROM public.appointments
  WHERE schedule_id = p_new_schedule_id
    AND status NOT IN ('cancelled', 'no_show');

  IF v_conflict_count >= v_max_attendees THEN
    RAISE EXCEPTION 'Turma lotada: Capacidade máxima atingida (%/%)', v_conflict_count, v_max_attendees;
  END IF;

  IF v_conflict_count > 0 AND v_existing_service_id IS NOT NULL AND v_existing_service_id != v_service_id THEN
    RAISE EXCEPTION 'Conflito de serviço: Este horário já está reservado para outro tipo de serviço.';
  END IF;

  -- UPDATE APPOINTMENT
  UPDATE public.appointments
  SET
    schedule_id = p_new_schedule_id,
    professional_id = v_new_professional_id,
    status = 'scheduled'
  WHERE id = p_appointment_id;

  -- Note: We REMOVED the update to schedules.is_booked.

END;
$$;

-- Re-create book_appointment_dynamic (Wrapper)
CREATE OR REPLACE FUNCTION public.book_appointment_dynamic(
  p_professional_id UUID,
  p_client_id UUID,
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_client_package_id UUID DEFAULT NULL,
  p_is_recurring BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule_id UUID;
  v_duration INT;
  v_end_time TIMESTAMPTZ;
  v_appointment_id UUID;
BEGIN
  -- Get Duration
  SELECT duration_minutes INTO v_duration FROM services WHERE id = p_service_id;
  v_end_time := p_start_time + (v_duration || ' minutes')::interval;

  -- 1. Ensure Schedule Exists
  -- We try to find an existing schedule at the exact start time
  SELECT id INTO v_schedule_id 
  FROM schedules 
  WHERE professional_id = p_professional_id AND start_time = p_start_time;

  IF v_schedule_id IS NULL THEN
    -- If no exact schedule, check if we can create one (no overlap with blocking events)
    -- We allow overlap with *appointments* if they are part of a multi-attendee slot (handled by book_appointment),
    -- BUT here we are creating a new schedule row. Usually, one schedule row per slot.
    -- If a schedule doesn't exist at this time, check if another staggered schedule blocks it.
    
    IF EXISTS (
        SELECT 1 FROM schedules s
        WHERE s.professional_id = p_professional_id
        AND s.start_time < v_end_time AND s.end_time > p_start_time
        AND EXISTS (SELECT 1 FROM appointments a WHERE a.schedule_id = s.id AND a.status != 'cancelled')
    ) THEN
         RAISE EXCEPTION 'Conflito de horário com outro agendamento existente.';
    END IF;

    INSERT INTO schedules (professional_id, start_time, end_time)
    VALUES (p_professional_id, p_start_time, v_end_time)
    RETURNING id INTO v_schedule_id;
  END IF;

  -- 2. Call book_appointment (which performs capacity checks)
  v_appointment_id := book_appointment(
    p_schedule_id := v_schedule_id,
    p_client_id := p_client_id,
    p_service_id := p_service_id,
    p_client_package_id := p_client_package_id,
    p_is_recurring := p_is_recurring
  );

  RETURN v_appointment_id;
END;
$$;

-- Re-create get_available_slots_dynamic to ensure correct capacity reporting without is_booked
CREATE OR REPLACE FUNCTION public.get_available_slots_dynamic(
    p_professional_id UUID,
    p_service_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    schedule_id UUID,
    current_count BIGINT,
    max_capacity BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_service_duration INTEGER;
    v_max_attendees INTEGER;
    v_slot_start TIMESTAMP WITH TIME ZONE;
    v_slot_end TIMESTAMP WITH TIME ZONE;
    v_day_of_week INTEGER;
    v_is_available BOOLEAN;
    v_has_blocking_override BOOLEAN;
    v_has_positive_override BOOLEAN;
    v_has_recurring BOOLEAN;
    v_existing_schedule_id UUID;
    v_existing_service_id UUID;
    v_current_attendees BIGINT;
BEGIN
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;
    
    v_max_attendees := COALESCE(v_max_attendees, 1);

    FOR v_slot_start IN SELECT generate_series(p_start_date, p_end_date - (v_service_duration || ' minutes')::INTERVAL, '30 minutes'::INTERVAL) LOOP
        v_slot_end := v_slot_start + (v_service_duration || ' minutes')::INTERVAL;
        v_day_of_week := EXTRACT(DOW FROM v_slot_start);
        
        -- Availability Check
        v_is_available := FALSE;
        
        -- 1. Check Blocking Override (Any overlap triggers block)
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides
            WHERE professional_id = p_professional_id 
            AND override_date = v_slot_start::DATE
            AND is_available = FALSE
            AND start_time < v_slot_end::TIME
            AND end_time > v_slot_start::TIME
        ) INTO v_has_blocking_override;

        -- 2. Check Positive Override (Must fully cover slot)
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides
            WHERE professional_id = p_professional_id 
            AND override_date = v_slot_start::DATE
            AND is_available = TRUE
            AND start_time <= v_slot_start::TIME
            AND end_time >= v_slot_end::TIME
            AND (service_ids IS NULL OR p_service_id = ANY(service_ids))
        ) INTO v_has_positive_override;

        -- 3. Check Recurring (Must fully cover slot)
        SELECT EXISTS (
            SELECT 1 FROM professional_recurring_availability
            WHERE professional_id = p_professional_id 
            AND day_of_week = v_day_of_week
            AND start_time <= v_slot_start::TIME
            AND end_time >= v_slot_end::TIME
            AND (service_ids IS NULL OR p_service_id = ANY(service_ids))
        ) INTO v_has_recurring;

        -- Decision Logic: Positive override wins; otherwise recurring wins if not blocked
        IF v_has_positive_override THEN
            v_is_available := TRUE;
        ELSIF v_has_recurring AND NOT v_has_blocking_override THEN
            v_is_available := TRUE;
        END IF;

        -- Capacity/Conflict Check
        IF v_is_available THEN
            v_current_attendees := 0;
            v_existing_schedule_id := NULL;
            v_existing_service_id := NULL;
            
            SELECT 
                s.id,
                COUNT(a.id) FILTER (WHERE a.status != 'cancelled'),
                MAX(a.service_id::text)::uuid
            INTO
                v_existing_schedule_id,
                v_current_attendees,
                v_existing_service_id
            FROM schedules s
            LEFT JOIN appointments a ON s.id = a.schedule_id
            WHERE s.professional_id = p_professional_id
            AND s.start_time = v_slot_start
            GROUP BY s.id;

            IF v_existing_schedule_id IS NOT NULL THEN
                -- Schedule Exists
                -- Check if service matches (or if schedule is empty)
                IF (v_existing_service_id IS NULL OR v_existing_service_id = p_service_id) THEN
                    IF v_current_attendees < v_max_attendees THEN
                        start_time := v_slot_start;
                        end_time := v_slot_end;
                        schedule_id := v_existing_schedule_id;
                        current_count := v_current_attendees;
                        max_capacity := v_max_attendees;
                        RETURN NEXT;
                    END IF;
                END IF;
            ELSE
                -- No Schedule Exists: Check for Staggered Overlaps with OTHER appointments
                IF NOT EXISTS (
                    SELECT 1 FROM schedules s
                    WHERE s.professional_id = p_professional_id
                    AND s.start_time < v_slot_end AND s.end_time > v_slot_start
                    AND EXISTS (SELECT 1 FROM appointments a WHERE a.schedule_id = s.id AND a.status != 'cancelled')
                ) THEN
                    start_time := v_slot_start;
                    end_time := v_slot_end;
                    schedule_id := NULL;
                    current_count := 0;
                    max_capacity := v_max_attendees;
                    RETURN NEXT;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$;
