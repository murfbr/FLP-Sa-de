-- Migration to implement Dynamic Scheduling
-- Replaces the need for pre-generated static schedules

-- 1. Dynamic Slots Calculation
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
  ORDER BY swe.slot_start;
END;
$$;

-- 2. Dynamic Available Dates (for Calendar Dots)
CREATE OR REPLACE FUNCTION get_available_dates_dynamic(
  p_professional_id UUID,
  p_service_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(available_date DATE)
LANGUAGE plpgsql
AS $$
DECLARE
    v_timezone TEXT := 'America/Sao_Paulo';
BEGIN
  -- Reuse the slots logic to be accurate
  -- Note: Convert DATE to TIMESTAMPTZ assuming start of day in the timezone
  -- p_start_date -> start of day in Sao Paulo -> converted to UTC for storage query
  RETURN QUERY
  SELECT DISTINCT (start_time AT TIME ZONE v_timezone)::date
  FROM get_available_slots_dynamic(
    p_professional_id, 
    p_service_id, 
    (p_start_date || ' 00:00:00 ' || v_timezone)::timestamptz, 
    (p_end_date || ' 23:59:59 ' || v_timezone)::timestamptz
  )
  ORDER BY 1;
END;
$$;

-- 3. Dynamic Booking Function (Get or Create Schedule)
CREATE OR REPLACE FUNCTION book_appointment_dynamic(
  p_professional_id UUID,
  p_client_id UUID,
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_client_package_id UUID DEFAULT NULL,
  p_is_recurring BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule_id UUID;
  v_duration INT;
  v_end_time TIMESTAMPTZ;
  v_appointment_id UUID;
BEGIN
  -- Get Duration
  SELECT duration_minutes INTO v_duration FROM services WHERE id = p_service_id;
  v_end_time := p_start_time + (v_duration || ' minutes')::interval;

  -- 1. Ensure Schedule Exists
  SELECT id INTO v_schedule_id 
  FROM schedules 
  WHERE professional_id = p_professional_id AND start_time = p_start_time;

  IF v_schedule_id IS NULL THEN
    INSERT INTO schedules (professional_id, start_time, end_time)
    VALUES (p_professional_id, p_start_time, v_end_time)
    RETURNING id INTO v_schedule_id;
  END IF;

  -- 2. Use existing logic (which checks capacity and inserts appointment)
  -- We call the existing book_appointment which expects a schedule_id
  v_appointment_id := book_appointment(
    p_schedule_id := v_schedule_id,
    p_client_id := p_client_id,
    p_service_id := p_service_id,
    p_client_package_id := p_client_package_id,
    p_is_recurring := p_is_recurring
  );

  RETURN v_appointment_id;
END;
$$;

-- 4. Dynamic Rescheduling Function
CREATE OR REPLACE FUNCTION reschedule_appointment_dynamic(
  p_appointment_id UUID,
  p_new_professional_id UUID,
  p_new_start_time TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_schedule_id UUID;
  v_duration INT;
  v_service_id UUID;
BEGIN
  -- Get service info
  SELECT service_id INTO v_service_id FROM appointments WHERE id = p_appointment_id;
  SELECT duration_minutes INTO v_duration FROM services WHERE id = v_service_id;

  -- Ensure new schedule exists
  SELECT id INTO v_new_schedule_id 
  FROM schedules 
  WHERE professional_id = p_new_professional_id AND start_time = p_new_start_time;

  IF v_new_schedule_id IS NULL THEN
    INSERT INTO schedules (professional_id, start_time, end_time)
    VALUES (p_new_professional_id, p_new_start_time, p_new_start_time + (v_duration || ' minutes')::interval)
    RETURNING id INTO v_new_schedule_id;
  END IF;

  -- Use existing reschedule logic
  PERFORM reschedule_appointment(p_appointment_id, v_new_schedule_id);
END;
$$;

-- 5. Dynamic Professionals for Time Slot (Context Aware)
CREATE OR REPLACE FUNCTION get_available_professionals_at_time_dynamic(
  p_service_id UUID,
  p_start_time TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  specialty TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return professionals who have this slot in their get_available_slots_dynamic output
  -- This is a bit inefficient to call the full function for everyone, but acceptable for small teams.
  -- Optimization: Inline the check logic for a single timestamp.
  
  RETURN QUERY
  SELECT p.id, p.name, p.specialty, p.avatar_url
  FROM professionals p
  WHERE p.is_active = true
    AND EXISTS (
      SELECT 1 FROM professional_services ps 
      WHERE ps.professional_id = p.id AND ps.service_id = p_service_id
    )
    AND EXISTS (
      -- Check if this specific time is returned as available
      SELECT 1 FROM get_available_slots_dynamic(
        p.id, 
        p_service_id, 
        p_start_time, 
        p_start_time + interval '1 minute' -- minimal range
      ) s
      WHERE s.start_time = p_start_time
    );
END;
$$;
