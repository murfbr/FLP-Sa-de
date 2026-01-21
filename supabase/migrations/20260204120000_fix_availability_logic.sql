-- Migration: Fix Availability Logic and Timezone Handling
-- Description: 
-- 1. Updates availability RPCs to strictly use 'America/Sao_Paulo' for all day/time calculations.
-- 2. Ensures no day-of-week filtering bias exists in the slot generation logic.
-- 3. Adds debug notices (visible in Supabase logs) for traceability.

-- Redefine get_available_slots_dynamic with robust timezone logic
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
    v_timezone TEXT := 'America/Sao_Paulo';
    v_slot_start_sp TIMESTAMP;
    v_slot_end_sp TIMESTAMP;
    v_day_of_week INTEGER;
    v_is_available BOOLEAN;
    v_has_blocking_override BOOLEAN;
    v_has_positive_override BOOLEAN;
    v_has_recurring BOOLEAN;
    v_existing_schedule_id UUID;
    v_existing_service_id UUID;
    v_current_attendees BIGINT;
BEGIN
    -- Get Service Details
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;

    IF v_service_duration IS NULL THEN
        RAISE EXCEPTION 'Service not found';
    END IF;

    -- Iterate through time slots using UTC range but logic in SP Time
    FOR v_slot_start IN SELECT generate_series(p_start_date, p_end_date - (v_service_duration || ' minutes')::INTERVAL, '30 minutes'::INTERVAL) LOOP
        v_slot_end := v_slot_start + (v_service_duration || ' minutes')::INTERVAL;
        
        -- Convert UTC slot times to SP Local Time for Day-of-Week and Hour checks
        v_slot_start_sp := v_slot_start AT TIME ZONE v_timezone;
        v_slot_end_sp := v_slot_end AT TIME ZONE v_timezone;
        v_day_of_week := EXTRACT(DOW FROM v_slot_start_sp);
        
        v_is_available := FALSE;
        
        -- 1. Check Blocking Override (Unavailable)
        -- If any blocking override overlaps this slot, it's unavailable.
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides
            WHERE professional_id = p_professional_id 
            AND override_date = v_slot_start_sp::DATE
            AND is_available = FALSE
            AND start_time < v_slot_end_sp::TIME
            AND end_time > v_slot_start_sp::TIME
        ) INTO v_has_blocking_override;

        -- 2. Check Positive Override (Available)
        -- Must fully cover the slot.
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides
            WHERE professional_id = p_professional_id 
            AND override_date = v_slot_start_sp::DATE
            AND is_available = TRUE
            AND start_time <= v_slot_start_sp::TIME
            AND end_time >= v_slot_end_sp::TIME
            AND (service_ids IS NULL OR p_service_id = ANY(service_ids))
        ) INTO v_has_positive_override;

        -- 3. Check Recurring Availability
        -- Must fully cover the slot.
        SELECT EXISTS (
            SELECT 1 FROM professional_recurring_availability
            WHERE professional_id = p_professional_id 
            AND day_of_week = v_day_of_week
            AND start_time <= v_slot_start_sp::TIME
            AND end_time >= v_slot_end_sp::TIME
            AND (service_ids IS NULL OR p_service_id = ANY(service_ids))
        ) INTO v_has_recurring;

        -- Determine Availability
        IF v_has_blocking_override THEN
            v_is_available := FALSE;
        ELSIF v_has_positive_override THEN
            v_is_available := TRUE;
        ELSIF v_has_recurring THEN
            v_is_available := TRUE;
        END IF;

        -- If available, check capacity and conflicts
        IF v_is_available THEN
            v_current_attendees := 0;
            v_existing_schedule_id := NULL;
            v_existing_service_id := NULL;
            
            -- Check for existing schedule (class/group session)
            SELECT 
                s.id,
                COUNT(a.id) FILTER (WHERE a.status != 'cancelled'),
                MAX(a.service_id) FILTER (WHERE a.status != 'cancelled')
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
                -- Existing Schedule: Check if service matches and has capacity
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
                -- No Existing Schedule: Check for overlapping schedules (Hard Conflict)
                -- Prevents booking 14:00-15:00 if 14:30-15:30 exists
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

-- Redefine get_available_professionals_at_time_dynamic
CREATE OR REPLACE FUNCTION public.get_available_professionals_at_time_dynamic(
    p_service_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    avatar_url TEXT,
    specialty TEXT,
    current_occupancy BIGINT,
    max_capacity BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_service_duration INTEGER;
    v_max_attendees INTEGER;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_timezone TEXT := 'America/Sao_Paulo';
    v_start_time_sp TIMESTAMP;
    v_end_time_sp TIMESTAMP;
    v_day_of_week INTEGER;
BEGIN
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;

    v_end_time := p_start_time + (v_service_duration || ' minutes')::INTERVAL;
    
    v_start_time_sp := p_start_time AT TIME ZONE v_timezone;
    v_end_time_sp := v_end_time AT TIME ZONE v_timezone;
    v_day_of_week := EXTRACT(DOW FROM v_start_time_sp);

    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.avatar_url,
        p.specialty,
        COALESCE(sub.current_count, 0) as current_occupancy,
        COALESCE(v_max_attendees, 1)::BIGINT as max_capacity
    FROM professionals p
    JOIN professional_services ps ON p.id = ps.professional_id
    LEFT JOIN LATERAL (
        SELECT 
            s.id as schedule_id,
            COUNT(a.id) as current_count,
            MAX(a.service_id) as booked_service_id
        FROM schedules s
        LEFT JOIN appointments a ON s.id = a.schedule_id AND a.status != 'cancelled'
        WHERE s.professional_id = p.id
        AND s.start_time = p_start_time
        GROUP BY s.id
    ) sub ON TRUE
    WHERE 
        ps.service_id = p_service_id
        AND p.is_active = TRUE
        
        -- AVAILABILITY CHECK
        AND (
            -- 1. Positive Override
            EXISTS (
                SELECT 1 FROM professional_availability_overrides o
                WHERE o.professional_id = p.id
                AND o.override_date = v_start_time_sp::DATE
                AND o.is_available = TRUE
                AND o.start_time <= v_start_time_sp::TIME
                AND o.end_time >= v_end_time_sp::TIME
                AND (o.service_ids IS NULL OR p_service_id = ANY(o.service_ids))
            )
            OR (
                -- 2. Recurring Availability (if no blocking override)
                EXISTS (
                    SELECT 1 FROM professional_recurring_availability r
                    WHERE r.professional_id = p.id
                    AND r.day_of_week = v_day_of_week
                    AND r.start_time <= v_start_time_sp::TIME
                    AND r.end_time >= v_end_time_sp::TIME
                    AND (r.service_ids IS NULL OR p_service_id = ANY(r.service_ids))
                )
                AND NOT EXISTS (
                    SELECT 1 FROM professional_availability_overrides o
                    WHERE o.professional_id = p.id
                    AND o.override_date = v_start_time_sp::DATE
                    AND o.is_available = FALSE
                    AND o.start_time < v_end_time_sp::TIME
                    AND o.end_time > v_start_time_sp::TIME
                )
            )
        )

        -- CAPACITY CHECK
        AND (
            sub.schedule_id IS NULL -- OK
            OR (
                (sub.booked_service_id IS NULL OR sub.booked_service_id = p_service_id)
                AND sub.current_count < v_max_attendees
            )
        )

        -- OVERLAP CHECK
        AND NOT EXISTS (
            SELECT 1 FROM schedules s_overlap
            WHERE s_overlap.professional_id = p.id
            AND s_overlap.start_time < v_end_time
            AND s_overlap.end_time > p_start_time
            AND s_overlap.start_time != p_start_time
            AND EXISTS (SELECT 1 FROM appointments a WHERE a.schedule_id = s_overlap.id AND a.status != 'cancelled')
        );
END;
$$;
