-- Fix scheduling functions to improve accuracy, prevent 400 errors, and add logging

-- 1. Redefine get_available_slots_for_service to accept TEXT dates and handle casting safely
-- This prevents "Bad Request" when client sends string formats
DROP FUNCTION IF EXISTS get_available_slots_for_service(uuid, uuid, timestamp, timestamp);
DROP FUNCTION IF EXISTS get_available_slots_for_service(uuid, uuid, text, text);

CREATE OR REPLACE FUNCTION get_available_slots_for_service(
  p_professional_id UUID,
  p_service_id UUID,
  p_start_date TEXT,
  p_end_date TEXT
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
  v_start_ts TIMESTAMPTZ;
  v_end_ts TIMESTAMPTZ;
  v_service_duration INT;
  v_slot_interval_minutes INT := 30;
  v_slot_count INT := 0;
BEGIN
  -- Cast inputs to TIMESTAMPTZ
  v_start_ts := p_start_date::TIMESTAMPTZ;
  v_end_ts := p_end_date::TIMESTAMPTZ;

  -- Debug Log
  RAISE LOG 'get_available_slots_for_service: Prof=%, Svc=%, Start=%, End=%', 
    p_professional_id, p_service_id, v_start_ts, v_end_ts;

  SELECT duration_minutes INTO v_service_duration FROM services WHERE id = p_service_id;
  
  IF v_service_duration IS NULL THEN
    RAISE LOG 'Service not found or duration null: %', p_service_id;
    RETURN;
  END IF;

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
      AND s.start_time < v_end_ts + (ser.duration_minutes || ' minutes')::interval
      AND (s.start_time + (ser.duration_minutes || ' minutes')::interval) > v_start_ts
  ),
  valid_slots AS (
      SELECT
          s.id,
          s.professional_id,
          s.start_time,
          s.end_time
      FROM schedules s
      WHERE s.professional_id = p_professional_id
      AND s.start_time >= v_start_ts
      AND s.start_time <= v_end_ts
      -- 1. Ensure not blocked by 'unavailable' override
      AND NOT EXISTS (
          SELECT 1 FROM professional_availability_overrides o
          WHERE o.professional_id = p_professional_id
          AND o.override_date = s.start_time::date
          AND o.start_time <= s.start_time::time
          AND o.end_time > s.start_time::time
          AND o.is_available = false
      )
      -- 2. Ensure allowed by Service restrictions
      AND (
          EXISTS (
              SELECT 1 FROM professional_availability_overrides o
              WHERE o.professional_id = p_professional_id
              AND o.override_date = s.start_time::date
              AND o.start_time <= s.start_time::time
              AND o.end_time > s.start_time::time
              AND o.is_available = true
              AND (o.service_ids IS NULL OR p_service_id = ANY(o.service_ids))
          )
          OR
          (
              NOT EXISTS (
                  SELECT 1 FROM professional_availability_overrides o
                  WHERE o.professional_id = p_professional_id
                  AND o.override_date = s.start_time::date
                  AND o.start_time <= s.start_time::time
                  AND o.end_time > s.start_time::time
                  AND o.is_available = true
              )
              AND EXISTS (
                  SELECT 1 FROM professional_recurring_availability r
                  WHERE r.professional_id = p_professional_id
                  AND r.day_of_week = EXTRACT(DOW FROM s.start_time)
                  AND r.start_time <= s.start_time::time
                  AND r.end_time > s.start_time::time
                  AND (r.service_ids IS NULL OR p_service_id = ANY(r.service_ids))
              )
          )
      )
      -- 3. Ensure not booked
      AND NOT EXISTS (
          SELECT 1 FROM busy_intervals b
          WHERE (s.start_time, s.end_time) OVERLAPS (b.start_time, b.end_time)
      )
  ),
  consecutive_check AS (
      SELECT
          vs.*,
          LEAD(vs.start_time, (v_service_duration / v_slot_interval_minutes) - 1) OVER (ORDER BY vs.start_time) as end_time_of_last_slot
      FROM valid_slots vs
  )
  SELECT
    cc.id,
    cc.professional_id,
    cc.start_time,
    cc.end_time
  FROM consecutive_check cc
  WHERE end_time_of_last_slot IS NOT NULL
  AND (end_time_of_last_slot + (v_slot_interval_minutes || ' minutes')::interval) = (start_time + (v_service_duration || ' minutes')::interval);

  -- Log completion (Note: GET DIAGNOSTICS ROW_COUNT doesn't work well with RETURN QUERY in some pg versions/contexts inside loops, but generic log is fine)
  RAISE LOG 'get_available_slots_for_service completed for professional %', p_professional_id;
END;
$$;
