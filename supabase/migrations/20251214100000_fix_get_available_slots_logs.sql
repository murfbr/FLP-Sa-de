-- Replaces the get_available_slots_for_service function to add logging and fix potential 400 errors
-- due to negative LEAD offset or casting issues.

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
  v_slots_needed INT;
  v_lead_offset INT;
BEGIN
  -- Log inputs for debugging
  RAISE LOG 'get_available_slots_for_service called with: professional_id=%, service_id=%, start=%, end=%', 
    p_professional_id, p_service_id, p_start_date, p_end_date;

  -- Validate required inputs
  IF p_professional_id IS NULL OR p_service_id IS NULL OR p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE LOG 'get_available_slots_for_service: Missing required parameters';
    RETURN;
  END IF;

  -- Safe cast from TEXT to TIMESTAMPTZ with error handling
  BEGIN
    v_start_ts := p_start_date::TIMESTAMPTZ;
    v_end_ts := p_end_date::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'get_available_slots_for_service: Error casting dates: %', SQLERRM;
    -- Return empty result set instead of throwing 400 error to client
    RETURN;
  END;

  SELECT duration_minutes INTO v_service_duration FROM services WHERE id = p_service_id;
  
  IF v_service_duration IS NULL THEN
    RAISE LOG 'get_available_slots_for_service: Service duration not found for service_id=%', p_service_id;
    RETURN;
  END IF;

  RAISE LOG 'get_available_slots_for_service: Service duration: % minutes', v_service_duration;

  -- Calculate how many 30-min slots are needed to cover the service duration
  -- Use CEIL to handle non-30 multiple durations (e.g., 45 mins needs 2 slots)
  -- Ensure integer division handles floats correctly
  v_slots_needed := CEIL(v_service_duration::numeric / v_slot_interval_minutes::numeric);
  
  -- Safety check: ensure we look for at least 1 slot (the current one)
  IF v_slots_needed < 1 THEN
    v_slots_needed := 1;
  END IF;
  
  -- Calculate offset for LEAD function (N-1)
  v_lead_offset := v_slots_needed - 1;
  
  RAISE LOG 'get_available_slots_for_service: Slots needed: %, Lead offset: %', v_slots_needed, v_lead_offset;

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
      AND s.start_time < v_end_ts + (v_service_duration || ' minutes')::interval
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
      -- 2. Ensure not booked
      AND NOT EXISTS (
          SELECT 1 FROM busy_intervals b
          WHERE (s.start_time, s.end_time) OVERLAPS (b.start_time, b.end_time)
      )
  ),
  consecutive_check AS (
      SELECT
          vs.id,
          vs.professional_id,
          vs.start_time,
          vs.end_time,
          -- Check if we have enough consecutive slots
          -- LEAD returns the start_time of the Nth next slot.
          LEAD(vs.start_time, v_lead_offset) OVER (ORDER BY vs.start_time) as nth_slot_start_time
      FROM valid_slots vs
  )
  SELECT
    cc.id,
    cc.professional_id,
    cc.start_time,
    cc.end_time
  FROM consecutive_check cc
  WHERE cc.nth_slot_start_time IS NOT NULL
  -- Verify continuity: The Nth slot start time must be exactly (slots_needed - 1) * 30 mins after current start time
  AND cc.nth_slot_start_time = (cc.start_time + (v_lead_offset * v_slot_interval_minutes || ' minutes')::interval);
END;
$$;
