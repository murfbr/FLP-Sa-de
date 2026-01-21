-- Migration: Fix Professional Availability for Capacity-Based Booking
-- Description: Updates the logic for finding available professionals to respect max_attendees and handle multi-client sessions correctly.

-- Function to find professionals available at a specific time slot
-- Considers: Service association, Active status, Schedule Availability (Recurring/Overrides), and Current Capacity
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
    -- Get service details
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
        -- Check specific schedule status for this time
        -- We group by schedule to get the count of appointments for that slot
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
        -- Availability Check (Override or Recurring)
        AND (
            -- 1. Check if there is a specific 'available' override for this day/time
            EXISTS (
                SELECT 1 FROM professional_availability_overrides o
                WHERE o.professional_id = p.id
                AND o.override_date = p_start_time::DATE
                AND o.start_time <= p_start_time::TIME
                AND o.end_time >= v_end_time::TIME
                AND o.is_available = TRUE
                AND (o.service_ids IS NULL OR p_service_id = ANY(o.service_ids))
            )
            OR (
                -- 2. If NO override exists for this day, check recurring availability
                NOT EXISTS (
                    SELECT 1 FROM professional_availability_overrides o
                    WHERE o.professional_id = p.id
                    AND o.override_date = p_start_time::DATE
                )
                AND EXISTS (
                    SELECT 1 FROM professional_recurring_availability r
                    WHERE r.professional_id = p.id
                    AND r.day_of_week = v_day_of_week
                    AND r.start_time <= p_start_time::TIME
                    AND r.end_time >= v_end_time::TIME
                    AND (r.service_ids IS NULL OR p_service_id = ANY(r.service_ids))
                )
            )
        )
        -- Conflict/Capacity Check
        AND (
            sub.schedule_id IS NULL -- Case A: No schedule exists at this EXACT time (Free)
            OR (
                -- Case B: Schedule exists
                sub.booked_service_id = p_service_id -- Must match the requested service
                AND sub.current_count < v_max_attendees -- Must have capacity
            )
        )
        -- Ensure no overlapping blocking schedule if no exact schedule exists
        -- This prevents booking 10:30 if there is a 10:00-11:00 slot already, unless it aligns perfectly (handled above)
        AND (
            sub.schedule_id IS NOT NULL 
            OR NOT EXISTS (
                SELECT 1 FROM schedules s_overlap
                WHERE s_overlap.professional_id = p.id
                AND s_overlap.start_time < v_end_time
                AND s_overlap.end_time > p_start_time
            )
        );
END;
$$;
