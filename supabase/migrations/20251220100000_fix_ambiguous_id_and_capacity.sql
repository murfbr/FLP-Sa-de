-- Fixes "column reference 'id' is ambiguous" error in get_available_slots_for_service
-- by strictly aliasing all column references in the query.
-- Also ensures capacity logic is correctly implemented for group services.

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
  end_time TIMESTAMPTZ,
  current_count BIGINT,
  max_capacity INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_ts TIMESTAMPTZ;
  v_end_ts TIMESTAMPTZ;
  v_service_duration INT;
  v_service_max_attendees INT;
  v_slot_interval_minutes INT := 30;
  v_slots_needed INT;
  v_lead_offset INT;
BEGIN
  -- Validate required inputs
  IF p_professional_id IS NULL OR p_service_id IS NULL OR p_start_date IS NULL OR p_end_date IS NULL THEN
    RETURN;
  END IF;

  -- Safe cast from TEXT to TIMESTAMPTZ
  BEGIN
    v_start_ts := p_start_date::TIMESTAMPTZ;
    v_end_ts := p_end_date::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;

  -- Get service details with strict aliasing
  SELECT s.duration_minutes, s.max_attendees 
  INTO v_service_duration, v_service_max_attendees
  FROM services s
  WHERE s.id = p_service_id;
  
  IF v_service_duration IS NULL THEN
    RETURN;
  END IF;

  -- Default max_attendees to 1 if null (single session by default)
  IF v_service_max_attendees IS NULL THEN
    v_service_max_attendees := 1;
  END IF;

  -- Calculate how many 30-min slots are needed
  v_slots_needed := CEIL(v_service_duration::numeric / v_slot_interval_minutes::numeric);
  IF v_slots_needed < 1 THEN v_slots_needed := 1; END IF;
  
  -- Calculate offset for LEAD function (N-1)
  v_lead_offset := v_slots_needed - 1;

  RETURN QUERY
  WITH slot_metrics AS (
    SELECT
      sch.id AS schedule_id,
      sch.professional_id AS professional_id,
      sch.start_time AS start_time,
      sch.end_time AS end_time,
      -- Count appointments that are not cancelled
      COUNT(appt.id) AS appt_count,
      -- Check for conflicting services. 
      -- A conflict exists if there is an active appointment with a different service_id.
      BOOL_OR(appt.service_id IS NOT NULL AND appt.service_id != p_service_id) AS has_service_conflict
    FROM schedules sch
    LEFT JOIN appointments appt ON sch.id = appt.schedule_id AND appt.status != 'cancelled'
    WHERE sch.professional_id = p_professional_id
      AND sch.start_time >= v_start_ts
      AND sch.start_time <= v_end_ts
    GROUP BY sch.id, sch.professional_id, sch.start_time, sch.end_time
  ),
  valid_slots AS (
    SELECT
      sm.schedule_id,
      sm.professional_id,
      sm.start_time,
      sm.end_time,
      sm.appt_count
    FROM slot_metrics sm
    WHERE 
      -- 1. No conflict with other services (must be same service or empty)
      (sm.has_service_conflict IS NULL OR sm.has_service_conflict = FALSE)
      -- 2. Capacity check: Current count must be less than max capacity
      AND sm.appt_count < v_service_max_attendees
      -- 3. Not blocked by 'unavailable' override
      AND NOT EXISTS (
          SELECT 1 FROM professional_availability_overrides ovr
          WHERE ovr.professional_id = p_professional_id
          AND ovr.override_date = sm.start_time::date
          AND ovr.start_time <= sm.start_time::time
          AND ovr.end_time > sm.start_time::time
          AND ovr.is_available = false
      )
  ),
  consecutive_slots AS (
      SELECT
          vs.schedule_id,
          vs.professional_id,
          vs.start_time,
          vs.end_time,
          vs.appt_count,
          -- Check if we have enough consecutive slots
          -- LEAD returns the start_time of the Nth next slot.
          LEAD(vs.start_time, v_lead_offset) OVER (ORDER BY vs.start_time) as nth_slot_start_time,
          -- Get the max count across the required slots (bottleneck check)
          MAX(vs.appt_count) OVER (ORDER BY vs.start_time ROWS BETWEEN CURRENT ROW AND v_lead_offset FOLLOWING) as max_count_in_block
      FROM valid_slots vs
  )
  SELECT
    cs.schedule_id AS id,
    cs.professional_id,
    cs.start_time,
    cs.end_time,
    COALESCE(cs.max_count_in_block, 0)::BIGINT AS current_count,
    v_service_max_attendees AS max_capacity
  FROM consecutive_slots cs
  WHERE cs.nth_slot_start_time IS NOT NULL
  -- Verify continuity
  AND cs.nth_slot_start_time = (cs.start_time + (v_lead_offset * v_slot_interval_minutes || ' minutes')::interval);
END;
$$;
