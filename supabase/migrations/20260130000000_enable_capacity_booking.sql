-- Migration: Enable Capacity-Based Scheduling and Flexible Packages
-- Description: Updates booking logic to support multi-attendee slots (based on max_attendees) and flexible recurring packages.

-- Drop existing function to allow return type change
DROP FUNCTION IF EXISTS public.get_available_slots_dynamic(uuid, uuid, timestamp with time zone, timestamp with time zone);

-- 1. Update get_available_slots_dynamic to return slots with capacity info
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
    v_override RECORD;
    v_recurring RECORD;
    v_existing_schedule_id UUID;
    v_existing_service_id UUID;
    v_current_attendees BIGINT;
    v_is_available BOOLEAN;
BEGIN
    -- Get service details
    SELECT duration_minutes, max_attendees INTO v_service_duration, v_max_attendees
    FROM services WHERE id = p_service_id;

    -- Generate slots every 30 minutes (Standard Grid)
    FOR v_slot_start IN SELECT generate_series(p_start_date, p_end_date - (v_service_duration || ' minutes')::INTERVAL, '30 minutes'::INTERVAL) LOOP
        v_slot_end := v_slot_start + (v_service_duration || ' minutes')::INTERVAL;
        v_day_of_week := EXTRACT(DOW FROM v_slot_start);
        v_is_available := FALSE;
        
        -- 1. Check Availability Overrides
        SELECT * INTO v_override FROM professional_availability_overrides
        WHERE professional_id = p_professional_id 
        AND override_date = v_slot_start::DATE
        AND start_time <= v_slot_start::TIME
        AND end_time >= v_slot_end::TIME;
        
        IF FOUND THEN
            v_is_available := v_override.is_available;
            IF v_is_available AND v_override.service_ids IS NOT NULL THEN
                 IF NOT (p_service_id = ANY(v_override.service_ids)) THEN
                     v_is_available := FALSE;
                 END IF;
            END IF;
        ELSE
            -- 2. Check Recurring Availability
            SELECT * INTO v_recurring FROM professional_recurring_availability
            WHERE professional_id = p_professional_id 
            AND day_of_week = v_day_of_week
            AND start_time <= v_slot_start::TIME
            AND end_time >= v_slot_end::TIME;
            
            IF FOUND THEN
                v_is_available := TRUE;
                IF v_recurring.service_ids IS NOT NULL THEN
                    IF NOT (p_service_id = ANY(v_recurring.service_ids)) THEN
                        v_is_available := FALSE;
                    END IF;
                END IF;
            END IF;
        END IF;

        -- 3. Check Conflicts and Capacity
        IF v_is_available THEN
            v_current_attendees := 0;
            v_existing_schedule_id := NULL;
            v_existing_service_id := NULL;
            
            -- Check for existing schedule at this exact time (or overlapping)
            -- We assume schedules must align for multi-booking.
            -- Overlapping but non-aligned schedules are considered blockers.
            
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
            AND s.start_time = v_slot_start -- Strict alignment for simplicity
            GROUP BY s.id;

            IF v_existing_schedule_id IS NOT NULL THEN
                -- Existing aligned schedule
                -- Check if service matches
                IF v_existing_service_id IS NULL OR v_existing_service_id = p_service_id THEN
                    -- Check Capacity
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
                -- No exact aligned schedule. Check for any generic blocking overlap
                IF NOT EXISTS (
                    SELECT 1 FROM schedules 
                    WHERE professional_id = p_professional_id
                    AND start_time < v_slot_end AND end_time > v_slot_start
                ) THEN
                    -- Completely free
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

-- 2. Update book_appointment_dynamic to enforce max_attendees
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
        
        -- Check service compatibility
        SELECT service_id INTO v_existing_service_id
        FROM appointments
        WHERE schedule_id = v_schedule_id
        AND status != 'cancelled'
        LIMIT 1;
        
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
        -- Verify overlap
        IF EXISTS (
            SELECT 1 FROM schedules 
            WHERE professional_id = p_professional_id
            AND start_time < v_end_time AND end_time > p_start_time
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
