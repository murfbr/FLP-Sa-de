-- Migration to strictly implement capacity-aware availability logic
-- Ensures slots are available if current_count < max_capacity
-- Enforces service consistency (same service) for multi-attendee slots

-- 1. Update get_available_slots_dynamic to handle capacity logic precisely
-- This function drives the UI availability display
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
SECURITY DEFINER
AS $$
DECLARE
    v_service_duration INTEGER;
    v_max_attendees INTEGER;
    v_slot_start TIMESTAMP WITH TIME ZONE;
    v_slot_end TIMESTAMP WITH TIME ZONE;
    v_slot_local_start TIMESTAMP WITHOUT TIME ZONE;
    v_slot_local_end TIMESTAMP WITHOUT TIME ZONE;
    v_day_of_week INTEGER;
    v_is_available BOOLEAN;
    v_has_blocking_override BOOLEAN;
    v_has_positive_override BOOLEAN;
    v_has_recurring BOOLEAN;
    v_existing_schedule_id UUID;
    v_existing_service_id UUID;
    v_current_attendees BIGINT;
    v_timezone TEXT := 'America/Sao_Paulo';
BEGIN
    -- 1. Get Service Info
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;
    
    -- Default capacity to 1 if not set
    v_max_attendees := COALESCE(v_max_attendees, 1);

    -- 2. Iterate through slots
    FOR v_slot_start IN SELECT generate_series(p_start_date, p_end_date - (v_service_duration || ' minutes')::INTERVAL, '30 minutes'::INTERVAL) LOOP
        v_slot_end := v_slot_start + (v_service_duration || ' minutes')::INTERVAL;
        
        -- Convert to Local Time for Availability Rules (Overrides are stored in local Date/Time)
        v_slot_local_start := v_slot_start AT TIME ZONE v_timezone;
        v_slot_local_end := v_slot_end AT TIME ZONE v_timezone;
        v_day_of_week := EXTRACT(DOW FROM v_slot_local_start);
        
        -- 3. Check Availability Rules
        v_is_available := FALSE;
        
        -- 3.1 Blocking Override
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides
            WHERE professional_id = p_professional_id 
            AND override_date = v_slot_local_start::DATE
            AND is_available = FALSE
            AND start_time < v_slot_local_end::TIME
            AND end_time > v_slot_local_start::TIME
        ) INTO v_has_blocking_override;

        -- 3.2 Positive Override
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides
            WHERE professional_id = p_professional_id 
            AND override_date = v_slot_local_start::DATE
            AND is_available = TRUE
            AND start_time <= v_slot_local_start::TIME
            AND end_time >= v_slot_local_end::TIME
            AND (service_ids IS NULL OR p_service_id = ANY(service_ids))
        ) INTO v_has_positive_override;

        -- 3.3 Recurring Availability
        SELECT EXISTS (
            SELECT 1 FROM professional_recurring_availability
            WHERE professional_id = p_professional_id 
            AND day_of_week = v_day_of_week
            AND start_time <= v_slot_local_start::TIME
            AND end_time >= v_slot_local_end::TIME
            AND (service_ids IS NULL OR p_service_id = ANY(service_ids))
        ) INTO v_has_recurring;

        IF v_has_positive_override THEN
            v_is_available := TRUE;
        ELSIF v_has_recurring AND NOT v_has_blocking_override THEN
            v_is_available := TRUE;
        END IF;

        -- 4. Check Capacity & Conflicts
        IF v_is_available THEN
            v_current_attendees := 0;
            v_existing_schedule_id := NULL;
            v_existing_service_id := NULL;
            
            -- Check for existing schedule at this EXACT time
            SELECT 
                s.id,
                COUNT(a.id) FILTER (WHERE a.status NOT IN ('cancelled', 'no_show')),
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
                -- Schedule Exists: Check Capacity and Service Match
                -- The slot is available ONLY IF current count < max capacity AND service matches
                IF v_current_attendees < v_max_attendees THEN
                     IF (v_existing_service_id IS NULL OR v_existing_service_id = p_service_id) THEN
                        start_time := v_slot_start;
                        end_time := v_slot_end;
                        schedule_id := v_existing_schedule_id;
                        current_count := v_current_attendees;
                        max_capacity := v_max_attendees;
                        RETURN NEXT;
                     END IF;
                END IF;
            ELSE
                -- No Exact Schedule: Check for Staggered Overlaps
                -- We cannot create a slot if it overlaps with another existing schedule
                IF NOT EXISTS (
                    SELECT 1 FROM schedules s
                    WHERE s.professional_id = p_professional_id
                    AND s.start_time < v_slot_end AND s.end_time > v_slot_start
                    AND EXISTS (SELECT 1 FROM appointments a WHERE a.schedule_id = s.id AND a.status NOT IN ('cancelled', 'no_show'))
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

-- 2. Update reschedule_appointment_dynamic to handle capacity checks during rescheduling
CREATE OR REPLACE FUNCTION public.reschedule_appointment_dynamic(
  p_appointment_id UUID,
  p_new_professional_id UUID,
  p_new_start_time TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_id UUID;
  v_duration INT;
  v_end_time TIMESTAMPTZ;
  v_schedule_id UUID;
  v_max_attendees INT;
  v_conflict_count INT;
  v_existing_service_id UUID;
BEGIN
  -- 1. Get Service Info
  SELECT service_id INTO v_service_id FROM public.appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Agendamento não encontrado.'; END IF;

  SELECT duration_minutes, max_attendees INTO v_duration, v_max_attendees 
  FROM public.services WHERE id = v_service_id;
  
  v_max_attendees := COALESCE(v_max_attendees, 1);
  v_end_time := p_new_start_time + (v_duration || ' minutes')::interval;

  -- 2. Find or Create Schedule
  SELECT id INTO v_schedule_id
  FROM public.schedules
  WHERE professional_id = p_new_professional_id
    AND start_time = p_new_start_time;

  IF v_schedule_id IS NULL THEN
    -- Check Staggered Conflicts
    IF EXISTS (
        SELECT 1 FROM public.schedules s
        WHERE s.professional_id = p_new_professional_id
        AND s.start_time < v_end_time 
        AND s.end_time > p_new_start_time
        AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.schedule_id = s.id AND a.status NOT IN ('cancelled', 'no_show'))
    ) THEN
         RAISE EXCEPTION 'Conflito de horário com outro agendamento existente.';
    END IF;

    INSERT INTO public.schedules (professional_id, start_time, end_time)
    VALUES (p_new_professional_id, p_new_start_time, v_end_time)
    RETURNING id INTO v_schedule_id;
  END IF;

  -- 3. Validate Capacity and Service on Target Schedule
  SELECT 
    count(*),
    MAX(service_id::text)::uuid
  INTO 
    v_conflict_count,
    v_existing_service_id
  FROM public.appointments
  WHERE schedule_id = v_schedule_id
    AND status NOT IN ('cancelled', 'no_show')
    AND id != p_appointment_id; -- Exclude self if rescheduling to same slot

  IF v_conflict_count >= v_max_attendees THEN
    RAISE EXCEPTION 'Turma lotada: Capacidade máxima atingida (%/%)', v_conflict_count, v_max_attendees;
  END IF;

  IF v_conflict_count > 0 AND v_existing_service_id IS NOT NULL AND v_existing_service_id != v_service_id THEN
    RAISE EXCEPTION 'Conflito de serviço: Este horário já está reservado para outro tipo de serviço.';
  END IF;

  -- 4. Update Appointment
  UPDATE public.appointments
  SET
    schedule_id = v_schedule_id,
    professional_id = p_new_professional_id,
    status = 'scheduled'
  WHERE id = p_appointment_id;

END;
$$;
