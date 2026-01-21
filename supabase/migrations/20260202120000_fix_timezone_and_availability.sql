-- Migration: Fix Timezone, Capacity, and Visibility Logic
-- Description:
-- 1. Updates get_available_professionals_at_time_dynamic to use 'America/Sao_Paulo' and correct capacity logic.
-- 2. Updates get_available_slots_dynamic to use 'America/Sao_Paulo' for Day-of-Week and Override checks.
-- 3. Updates book_appointment_dynamic to robustly handle concurrent bookings and capacity.

-- Drop functions to ensure clean replacement
DROP FUNCTION IF EXISTS public.get_available_professionals_at_time_dynamic(uuid, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_available_slots_dynamic(uuid, uuid, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.book_appointment_dynamic(uuid, uuid, uuid, timestamp with time zone, uuid, boolean);


-- 1. get_available_professionals_at_time_dynamic (Timezone Aware)
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
    v_start_time_sp TIMESTAMP; -- Local time in SP
    v_end_time_sp TIMESTAMP;   -- Local time in SP
    v_day_of_week INTEGER;
BEGIN
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;

    v_end_time := p_start_time + (v_service_duration || ' minutes')::INTERVAL;
    
    -- Convert to SP time for logic checks
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
        
        -- AVAILABILITY CHECK (Using SP Time)
        AND (
            -- 1. Positive Override (Available=TRUE) covering this slot
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
                -- 2. Recurring Availability covering this slot
                -- AND NO Blocking Override overlapping this slot
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


-- 2. get_available_slots_dynamic (Timezone Aware)
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
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;

    -- Iterate using UTC time (database storage), but check availability using SP time
    FOR v_slot_start IN SELECT generate_series(p_start_date, p_end_date - (v_service_duration || ' minutes')::INTERVAL, '30 minutes'::INTERVAL) LOOP
        v_slot_end := v_slot_start + (v_service_duration || ' minutes')::INTERVAL;
        
        -- Convert to SP time for logic
        v_slot_start_sp := v_slot_start AT TIME ZONE v_timezone;
        v_slot_end_sp := v_slot_end AT TIME ZONE v_timezone;
        v_day_of_week := EXTRACT(DOW FROM v_slot_start_sp);
        
        -- Availability Check
        v_is_available := FALSE;
        
        -- 1. Check Blocking Override (Any overlap in SP time)
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides
            WHERE professional_id = p_professional_id 
            AND override_date = v_slot_start_sp::DATE
            AND is_available = FALSE
            AND start_time < v_slot_end_sp::TIME
            AND end_time > v_slot_start_sp::TIME
        ) INTO v_has_blocking_override;

        -- 2. Check Positive Override (Must fully cover slot in SP time)
        SELECT EXISTS (
            SELECT 1 FROM professional_availability_overrides
            WHERE professional_id = p_professional_id 
            AND override_date = v_slot_start_sp::DATE
            AND is_available = TRUE
            AND start_time <= v_slot_start_sp::TIME
            AND end_time >= v_slot_end_sp::TIME
            AND (service_ids IS NULL OR p_service_id = ANY(service_ids))
        ) INTO v_has_positive_override;

        -- 3. Check Recurring (Must fully cover slot in SP time)
        SELECT EXISTS (
            SELECT 1 FROM professional_recurring_availability
            WHERE professional_id = p_professional_id 
            AND day_of_week = v_day_of_week
            AND start_time <= v_slot_start_sp::TIME
            AND end_time >= v_slot_end_sp::TIME
            AND (service_ids IS NULL OR p_service_id = ANY(service_ids))
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
                -- Schedule Exists: Check service match and capacity
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
                -- No Schedule Exists: Check for overlaps with OTHER schedules
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


-- 3. book_appointment_dynamic (Safe Capacity Handling)
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
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;
    
    v_end_time := p_start_time + (v_service_duration || ' minutes')::INTERVAL;

    -- Ensure Schedule Exists (Idempotent)
    SELECT id INTO v_schedule_id
    FROM schedules
    WHERE professional_id = p_professional_id 
    AND start_time = p_start_time;
    
    IF v_schedule_id IS NOT NULL THEN
        -- Check Service Mismatch
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
        
        -- Check Duplicate Client
        IF EXISTS (SELECT 1 FROM appointments WHERE schedule_id = v_schedule_id AND client_id = p_client_id AND status != 'cancelled') THEN
             RAISE EXCEPTION 'Cliente já está agendado neste horário.';
        END IF;
        
    ELSE
        -- Check Overlap with Staggered Schedules
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

    -- Create Appointment
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

    -- Update Package
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
