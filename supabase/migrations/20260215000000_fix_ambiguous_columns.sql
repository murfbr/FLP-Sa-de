-- Fixes ambiguous column references in get_available_slots_dynamic
-- Explicitly aliases table references to prevent PostgreSQL 42702 errors

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
    SELECT s.duration_minutes, s.max_attendees INTO v_service_duration, v_max_attendees
    FROM services s WHERE s.id = p_service_id;
    
    v_max_attendees := COALESCE(v_max_attendees, 1);

    FOR v_slot_start IN SELECT generate_series(p_start_date, p_end_date - (v_service_duration || ' minutes')::INTERVAL, '30 minutes'::INTERVAL) LOOP
        v_slot_end := v_slot_start + (v_service_duration || ' minutes')::INTERVAL;
        v_day_of_week := EXTRACT(DOW FROM v_slot_start);
        
        -- Availability Check
        v_is_available := FALSE;
        
        -- 1. Check Blocking Override (Any overlap triggers block)
        -- Aliased to 'pao' to avoid ambiguity with output param 'start_time'
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides pao
            WHERE pao.professional_id = p_professional_id 
            AND pao.override_date = v_slot_start::DATE
            AND pao.is_available = FALSE
            AND pao.start_time < v_slot_end::TIME
            AND pao.end_time > v_slot_start::TIME
        ) INTO v_has_blocking_override;

        -- 2. Check Positive Override (Must fully cover slot)
        -- Aliased to 'pao'
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides pao
            WHERE pao.professional_id = p_professional_id 
            AND pao.override_date = v_slot_start::DATE
            AND pao.is_available = TRUE
            AND pao.start_time <= v_slot_start::TIME
            AND pao.end_time >= v_slot_end::TIME
            AND (pao.service_ids IS NULL OR p_service_id = ANY(pao.service_ids))
        ) INTO v_has_positive_override;

        -- 3. Check Recurring (Must fully cover slot)
        -- Aliased to 'pra'
        SELECT EXISTS (
            SELECT 1 FROM professional_recurring_availability pra
            WHERE pra.professional_id = p_professional_id 
            AND pra.day_of_week = v_day_of_week
            AND pra.start_time <= v_slot_start::TIME
            AND pra.end_time >= v_slot_end::TIME
            AND (pra.service_ids IS NULL OR p_service_id = ANY(pra.service_ids))
        ) INTO v_has_recurring;

        -- Decision Logic
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
