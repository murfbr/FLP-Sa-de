-- Fix ambiguous column reference 'start_time' in get_available_slots_dynamic
-- The output parameters 'start_time' and 'end_time' conflict with column names in the queries.
-- This migration adds explicit table aliases to resolve the ambiguity.

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
            SELECT 1 FROM professional_availability_overrides pao
            WHERE pao.professional_id = p_professional_id 
            AND pao.override_date = v_slot_local_start::DATE
            AND pao.is_available = FALSE
            AND pao.start_time < v_slot_local_end::TIME
            AND pao.end_time > v_slot_local_start::TIME
        ) INTO v_has_blocking_override;

        -- 3.2 Positive Override
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides pao
            WHERE pao.professional_id = p_professional_id 
            AND pao.override_date = v_slot_local_start::DATE
            AND pao.is_available = TRUE
            AND pao.start_time <= v_slot_local_start::TIME
            AND pao.end_time >= v_slot_local_end::TIME
            AND (pao.service_ids IS NULL OR p_service_id = ANY(pao.service_ids))
        ) INTO v_has_positive_override;

        -- 3.3 Recurring Availability
        SELECT EXISTS (
            SELECT 1 FROM professional_recurring_availability pra
            WHERE pra.professional_id = p_professional_id 
            AND pra.day_of_week = v_day_of_week
            AND pra.start_time <= v_slot_local_start::TIME
            AND pra.end_time >= v_slot_local_end::TIME
            AND (pra.service_ids IS NULL OR p_service_id = ANY(pra.service_ids))
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
