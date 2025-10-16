CREATE OR REPLACE FUNCTION get_available_dates(
    p_professional_id UUID,
    p_service_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(available_date DATE)
LANGUAGE plpgsql
AS $$
DECLARE
    v_service_duration INT;
    v_slot_interval_minutes INT := 30; -- Assuming slots are 30 minutes
BEGIN
    -- Get the duration of the service
    SELECT duration_minutes INTO v_service_duration
    FROM public.services
    WHERE id = p_service_id;

    IF NOT FOUND THEN
        -- Return an empty table if service not found
        RETURN;
    END IF;

    RETURN QUERY
    WITH date_series AS (
        -- Generate all dates in the requested range
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS day
    ),
    -- Find all unbooked schedules for the professional in the date range
    unbooked_schedules AS (
        SELECT
            id,
            start_time,
            (start_time::date) as schedule_date
        FROM public.schedules
        WHERE professional_id = p_professional_id
          AND is_booked = FALSE
          AND start_time >= p_start_date
          AND start_time < (p_end_date + interval '1 day')
    ),
    -- For each unbooked slot, check if there's enough consecutive free time for the service
    potential_appointments AS (
        SELECT
            s1.schedule_date,
            s1.start_time,
            -- Lead function finds the start_time of the Nth next slot
            LEAD(s1.start_time, (v_service_duration / v_slot_interval_minutes) - 1) OVER (PARTITION BY s1.schedule_date ORDER BY s1.start_time) as end_time_of_last_slot
        FROM unbooked_schedules s1
    ),
    -- Filter to only include valid start times where the full duration is available
    valid_start_times AS (
        SELECT
            pa.schedule_date
        FROM potential_appointments pa
        WHERE pa.end_time_of_last_slot IS NOT NULL
          -- Check if the time difference between the start of the first slot and the start of the last slot + its duration equals the service duration
          AND (pa.end_time_of_last_slot + (v_slot_interval_minutes * interval '1 minute')) = (pa.start_time + (v_service_duration * interval '1 minute'))
    )
    -- Return the distinct dates that have at least one valid start time
    SELECT DISTINCT schedule_date
    FROM valid_start_times
    ORDER BY schedule_date;

END;
$$;
