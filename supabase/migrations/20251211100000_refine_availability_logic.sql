-- Migration to refine availability logic for 12-month accuracy and diagnostic logging support
-- Replaces previous versions of get_available_dates and get_available_slots_for_service

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
    v_slot_interval_minutes INT := 30;
    v_slots_needed INT;
BEGIN
    -- Diagnostic Log
    RAISE NOTICE 'get_available_dates called for Professional: %, Service: %, Range: % to %', p_professional_id, p_service_id, p_start_date, p_end_date;

    SELECT duration_minutes INTO v_service_duration FROM public.services WHERE id = p_service_id;

    IF NOT FOUND THEN
        RAISE NOTICE 'Service % not found', p_service_id;
        RETURN;
    END IF;

    -- Calculate slots needed
    v_slots_needed := CEIL(v_service_duration::float / v_slot_interval_minutes);
    RAISE NOTICE 'Service Duration: % min, Slots Needed: %', v_service_duration, v_slots_needed;

    RETURN QUERY
    WITH 
    -- 1. Identify Busy Intervals (Appointments)
    busy_intervals AS (
        SELECT
            s.start_time AS start_time,
            s.start_time + (ser.duration_minutes || ' minutes')::interval AS end_time
        FROM appointments a
        JOIN schedules s ON a.schedule_id = s.id
        JOIN services ser ON a.service_id = ser.id
        WHERE a.professional_id = p_professional_id
        AND a.status != 'cancelled'
        AND s.start_time >= p_start_date::timestamp
        AND s.start_time < (p_end_date + 1)::timestamp
    ),
    -- 2. Fetch Potential Slots from Schedules Table
    -- The schedules table is populated by the edge function based on recurring rules and overrides
    potential_slots AS (
        SELECT
            s.id,
            s.start_time,
            (s.start_time::date) as schedule_date
        FROM public.schedules s
        WHERE s.professional_id = p_professional_id
          AND s.start_time >= p_start_date::timestamp
          AND s.start_time < (p_end_date + 1)::timestamp
    ),
    -- 3. Filter Slots (Dynamic Overrides & Conflicts)
    valid_slots AS (
        SELECT
            ps.id,
            ps.start_time,
            ps.schedule_date
        FROM potential_slots ps
        WHERE 
          -- Check 1: Not blocked by a negative override (Granular blocking)
          NOT EXISTS (
              SELECT 1 FROM professional_availability_overrides o
              WHERE o.professional_id = p_professional_id
              AND o.override_date = ps.schedule_date
              AND o.start_time <= ps.start_time::time
              AND o.end_time > ps.start_time::time
              AND o.is_available = false
          )
          -- Check 2: Not overlapping with any existing appointment
          AND NOT EXISTS (
             SELECT 1 FROM busy_intervals b
             WHERE (ps.start_time, ps.start_time + (v_service_duration || ' minutes')::interval) OVERLAPS (b.start_time, b.end_time)
          )
    ),
    -- 4. Check for Consecutive Availability
    consecutive_groups AS (
        SELECT
            vs.schedule_date,
            vs.start_time,
            -- Look ahead to see if we have enough slots
            LEAD(vs.start_time, v_slots_needed - 1) OVER (PARTITION BY vs.schedule_date ORDER BY vs.start_time) as end_slot_start
        FROM valid_slots vs
    )
    SELECT DISTINCT cg.schedule_date
    FROM consecutive_groups cg
    WHERE cg.end_slot_start IS NOT NULL
    -- Verify the sequence is contiguous (difference between Nth slot start and current start equals (N-1) intervals)
    AND (cg.end_slot_start - cg.start_time) = ((v_slots_needed - 1) * v_slot_interval_minutes || ' minutes')::interval
    ORDER BY cg.schedule_date;
END;
$$;

CREATE OR REPLACE FUNCTION get_available_slots_for_service(
  p_professional_id UUID,
  p_service_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
)
RETURNS TABLE (
  id UUID,
  professional_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_service_duration INT;
  v_slot_interval_minutes INT := 30;
  v_slots_needed INT;
BEGIN
  RAISE NOTICE 'get_available_slots_for_service called for Professional: %, Service: %, Range: % to %', p_professional_id, p_service_id, p_start_date, p_end_date;

  SELECT duration_minutes INTO v_service_duration FROM services WHERE id = p_service_id;
  v_slots_needed := CEIL(v_service_duration::float / v_slot_interval_minutes);
  
  RETURN QUERY
  WITH busy_intervals AS (
      SELECT
          s.start_time AS start_time,
          s.start_time + (ser.duration_minutes || ' minutes')::interval AS end_time
      FROM appointments a
      JOIN schedules s ON a.schedule_id = s.id
      JOIN services ser ON a.service_id = ser.id
      WHERE a.professional_id = p_professional_id
      AND a.status != 'cancelled'
      -- Optimize overlap check
      AND s.start_time < p_end_date + (ser.duration_minutes || ' minutes')::interval
      AND (s.start_time + (ser.duration_minutes || ' minutes')::interval) > p_start_date
  ),
  valid_slots AS (
      SELECT
          s.id,
          s.professional_id,
          s.start_time,
          s.end_time
      FROM schedules s
      WHERE s.professional_id = p_professional_id
      AND s.start_time >= p_start_date
      AND s.start_time <= p_end_date
      -- 1. Ensure not blocked by 'unavailable' override
      AND NOT EXISTS (
          SELECT 1 FROM professional_availability_overrides o
          WHERE o.professional_id = p_professional_id
          AND o.override_date = s.start_time::date
          AND o.start_time <= s.start_time::time
          AND o.end_time > s.start_time::time
          AND o.is_available = false
      )
      -- 2. Ensure not booked
      AND NOT EXISTS (
          SELECT 1 FROM busy_intervals b
          WHERE (s.start_time, s.end_time) OVERLAPS (b.start_time, b.end_time)
      )
  ),
  consecutive_check AS (
      SELECT
          vs.*,
          LEAD(vs.start_time, v_slots_needed - 1) OVER (ORDER BY vs.start_time) as end_slot_start
      FROM valid_slots vs
  )
  SELECT
    cc.id,
    cc.professional_id,
    cc.start_time,
    cc.end_time
  FROM consecutive_check cc
  WHERE cc.end_slot_start IS NOT NULL
  AND (cc.end_slot_start - cc.start_time) = ((v_slots_needed - 1) * v_slot_interval_minutes || ' minutes')::interval;
END;
$$;
