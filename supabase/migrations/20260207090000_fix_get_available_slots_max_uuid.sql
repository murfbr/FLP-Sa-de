-- Fixes runtime error "function max(uuid) does not exist" in get_available_slots_dynamic
-- This error occurs because MAX() aggregate function cannot be applied directly to UUID columns
-- We need to cast to text first, then cast back to UUID in the service conflict check logic

DROP FUNCTION IF EXISTS get_available_slots_dynamic(uuid, uuid, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION get_available_slots_dynamic(
  p_professional_id UUID,
  p_service_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  schedule_id UUID,
  current_count INT,
  max_capacity INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration INT;
  v_service_capacity INT;
  v_slot_interval INTERVAL := '30 minutes';
  v_timezone TEXT := 'America/Sao_Paulo';
BEGIN
  -- Get Service Config
  SELECT duration_minutes, max_attendees INTO v_duration, v_service_capacity
  FROM services WHERE id = p_service_id;

  RETURN QUERY
  WITH 
  -- Generate 30-min slots for the requested range
  raw_slots AS (
    SELECT generate_series(
      date_trunc('hour', p_start_date),
      date_trunc('hour', p_end_date),
      v_slot_interval
    ) AS slot_start
  ),
  
  -- Filter by Recurring Availability & Overrides
  available_slots AS (
    SELECT rs.slot_start
    FROM raw_slots rs
    JOIN professional_recurring_availability pra 
      ON pra.professional_id = p_professional_id 
      AND pra.day_of_week = EXTRACT(DOW FROM (rs.slot_start AT TIME ZONE v_timezone))
      AND (rs.slot_start AT TIME ZONE v_timezone)::time >= pra.start_time
      AND ((rs.slot_start AT TIME ZONE v_timezone) + (v_duration || ' minutes')::interval)::time <= pra.end_time
      AND (pra.service_ids IS NULL OR p_service_id = ANY(pra.service_ids))
    
    -- Exclude Blocked Days/Times
    WHERE NOT EXISTS (
      SELECT 1 FROM professional_availability_overrides o
      WHERE o.professional_id = p_professional_id
        AND o.override_date = (rs.slot_start AT TIME ZONE v_timezone)::date
        AND o.is_available = false
        AND (
            (o.start_time IS NULL OR o.end_time IS NULL)
            OR
            (
               (rs.slot_start AT TIME ZONE v_timezone)::time >= o.start_time 
               AND (rs.slot_start AT TIME ZONE v_timezone)::time < o.end_time
            )
        )
    )
    
    -- Include Extra Availability (Positive Overrides)
    UNION
    SELECT rs.slot_start
    FROM raw_slots rs
    JOIN professional_availability_overrides o
      ON o.professional_id = p_professional_id
      AND o.override_date = (rs.slot_start AT TIME ZONE v_timezone)::date
      AND o.is_available = true
      AND (rs.slot_start AT TIME ZONE v_timezone)::time >= o.start_time
      AND ((rs.slot_start AT TIME ZONE v_timezone) + (v_duration || ' minutes')::interval)::time <= o.end_time
      AND (o.service_ids IS NULL OR p_service_id = ANY(o.service_ids))
  ),
  
  -- Calculate End Times
  slots_with_end AS (
    SELECT 
      slot_start,
      slot_start + (v_duration || ' minutes')::interval as slot_end
    FROM available_slots
  )
  
  -- Join with existing data to check conflicts/capacity
  SELECT 
    swe.slot_start,
    swe.slot_end,
    s.id as schedule_id,
    COALESCE(count(a.id), 0)::INT as current_count,
    COALESCE(v_service_capacity, 1) as max_capacity
  FROM slots_with_end swe
  LEFT JOIN schedules s 
    ON s.professional_id = p_professional_id 
    AND s.start_time = swe.slot_start
  LEFT JOIN appointments a 
    ON a.schedule_id = s.id 
    AND a.status NOT IN ('cancelled', 'no_show')
  WHERE 
    -- Ensure NO overlap with other appointments at different times (e.g. staggering)
    NOT EXISTS (
      SELECT 1 FROM schedules s2
      JOIN appointments a2 ON a2.schedule_id = s2.id
      WHERE s2.professional_id = p_professional_id
        AND a2.status NOT IN ('cancelled', 'no_show')
        AND s2.start_time != swe.slot_start -- Different start time
        AND (s2.start_time, s2.end_time) OVERLAPS (swe.slot_start, swe.slot_end)
    )
  GROUP BY swe.slot_start, swe.slot_end, s.id
  HAVING 
    COALESCE(count(a.id), 0) < COALESCE(v_service_capacity, 1)
    AND (
      count(a.id) = 0 
      OR 
      -- FIX: Cast to text before MAX to avoid "function max(uuid) does not exist"
      MAX(a.service_id::text)::uuid = p_service_id
    )
  ORDER BY swe.slot_start;
END;
$$;
