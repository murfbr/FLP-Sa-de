-- Migration: Fix Capacity, Empty Slot Visibility, and Override Logic
-- Description:
-- 1. Updates get_available_professionals_at_time_dynamic to:
--    - Allow visibility of professionals with empty schedules (unassigned service)
--    - Refine override logic to allow partial day blocking instead of full day blocking
-- 2. Updates get_available_slots_dynamic to:
--    - Match the refined override logic (checking for overlapping blocking overrides)
--    - Ensure empty slots are visible even if service is not yet assigned to the schedule
-- 3. Updates book_appointment_dynamic to:
--    - Robustly handle concurrent bookings into the same slot
--    - Allow booking if the schedule exists but has no service assigned (first booking defines service)

-- Drop functions to ensure clean replacement (especially if return types were to change slightly in internal types)
DROP FUNCTION IF EXISTS public.get_available_professionals_at_time_dynamic(uuid, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_available_slots_dynamic(uuid, uuid, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.book_appointment_dynamic(uuid, uuid, uuid, timestamp with time zone, uuid, boolean);


-- 1. get_available_professionals_at_time_dynamic
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
    v_day_of_week INTEGER;
BEGIN
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;

    v_end_time := p_start_time + (v_service_duration || ' minutes')::INTERVAL;
    v_day_of_week := EXTRACT(DOW FROM p_start_time);

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
            -- 1. Positive Override (Available=TRUE) covering this slot
            EXISTS (
                SELECT 1 FROM professional_availability_overrides o
                WHERE o.professional_id = p.id
                AND o.override_date = p_start_time::DATE
                AND o.is_available = TRUE
                AND o.start_time <= p_start_time::TIME
                AND o.end_time >= v_end_time::TIME
                AND (o.service_ids IS NULL OR p_service_id = ANY(o.service_ids))
            )
            OR (
                -- 2. Recurring Availability covering this slot
                -- AND NO Blocking Override overlapping this slot
                EXISTS (
                    SELECT 1 FROM professional_recurring_availability r
                    WHERE r.professional_id = p.id
                    AND r.day_of_week = v_day_of_week
                    AND r.start_time <= p_start_time::TIME
                    AND r.end_time >= v_end_time::TIME
                    AND (r.service_ids IS NULL OR p_service_id = ANY(r.service_ids))
                )
                AND NOT EXISTS (
                    SELECT 1 FROM professional_availability_overrides o
                    WHERE o.professional_id = p.id
                    AND o.override_date = p_start_time::DATE
                    AND o.is_available = FALSE
                    AND o.start_time < v_end_time::TIME
                    AND o.end_time > p_start_time::TIME
                )
            )
        )

        -- CAPACITY / CONFLICT CHECK
        AND (
            sub.schedule_id IS NULL -- No schedule yet: OK
            OR (
                -- Schedule exists:
                -- Must match service (OR be empty/unassigned yet)
                (sub.booked_service_id IS NULL OR sub.booked_service_id = p_service_id)
                -- AND have capacity
                AND sub.current_count < v_max_attendees
            )
        )

        -- EXTERNAL OVERLAP CHECK
        -- Ensure no other staggered schedule blocks this time (only if it has appointments)
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


-- 2. get_available_slots_dynamic
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


-- 3. book_appointment_dynamic
CREATE OR REPLACE FUNCTION public.book_appointment_dynamic(
    p_professional_id UUID,
    p_client_id UUID,
    p_service_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_client_package_id UUID DEFAULT NULL,
    p_is_recurring BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_schedule_id UUID;
    v_appointment_id UUID;
    v_service_duration INTEGER;
    v_max_attendees INTEGER;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_existing_service_id UUID;
    v_current_count INTEGER;
    v_package_sessions INTEGER;
BEGIN
    -- 1. Get Service Info
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;
    
    v_end_time := p_start_time + (v_service_duration || ' minutes')::INTERVAL;

    -- 2. Check/Create Schedule
    SELECT id INTO v_schedule_id
    FROM schedules
    WHERE professional_id = p_professional_id 
    AND start_time = p_start_time;
    
    IF v_schedule_id IS NOT NULL THEN
        -- Schedule exists. Check constraints.
        
        -- Check service compatibility (allow if NULL/empty)
        SELECT MAX(service_id) INTO v_existing_service_id
        FROM appointments
        WHERE schedule_id = v_schedule_id
        AND status != 'cancelled';
        
        IF v_existing_service_id IS NOT NULL AND v_existing_service_id != p_service_id THEN
            RAISE EXCEPTION 'Conflito de horário: Profissional já agendado para outro serviço.';
        END IF;
        
        -- Check Capacity
        SELECT COUNT(*) INTO v_current_count
        FROM appointments
        WHERE schedule_id = v_schedule_id
        AND status != 'cancelled';
        
        IF v_current_count >= v_max_attendees THEN
            RAISE EXCEPTION 'Turma lotada: Capacidade máxima atingida (%/%)', v_current_count, v_max_attendees;
        END IF;
        
        -- Check if client is already booked
        IF EXISTS (SELECT 1 FROM appointments WHERE schedule_id = v_schedule_id AND client_id = p_client_id AND status != 'cancelled') THEN
             RAISE EXCEPTION 'Cliente já está agendado neste horário.';
        END IF;
        
    ELSE
        -- Verify overlap with active appointments
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

    -- 3. Create Appointment
    INSERT INTO appointments (
        client_id, 
        professional_id, 
        service_id, 
        schedule_id, 
        status, 
        client_package_id,
        is_recurring
    )
    VALUES (
        p_client_id, 
        p_professional_id, 
        p_service_id, 
        v_schedule_id, 
        'scheduled', 
        p_client_package_id,
        p_is_recurring
    )
    RETURNING id INTO v_appointment_id;

    -- 4. Deduct Package Session
    IF p_client_package_id IS NOT NULL THEN
        SELECT sessions_remaining INTO v_package_sessions
        FROM client_packages
        WHERE id = p_client_package_id;

        IF v_package_sessions <= 0 THEN
            RAISE EXCEPTION 'Pacote sem sessões disponíveis.';
        END IF;

        UPDATE client_packages
        SET sessions_remaining = sessions_remaining - 1
        WHERE id = p_client_package_id;
    END IF;

    RETURN v_appointment_id;
END;
$$;
