-- Fixes runtime error "function max(uuid) does not exist" in get_available_professionals_at_time_dynamic
-- Updates the aggregation logic to cast UUID to text before applying MAX()

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
    -- Explicitly alias 'services' table to 's' to avoid collision with output parameter 'id' if exists
    SELECT s.duration_minutes, s.max_attendees 
    INTO v_service_duration, v_max_attendees
    FROM services s 
    WHERE s.id = p_service_id;

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
            MAX(a.service_id::text)::uuid as booked_service_id
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
            AND EXISTS (
                SELECT 1 FROM appointments a 
                WHERE a.schedule_id = s_overlap.id 
                AND a.status != 'cancelled'
            )
        );
END;
$$;
