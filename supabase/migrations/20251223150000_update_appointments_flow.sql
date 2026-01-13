-- Add is_recurring column to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Update book_appointment function to handle is_recurring
CREATE OR REPLACE FUNCTION book_appointment(
  p_schedule_id UUID,
  p_client_id UUID,
  p_service_id UUID,
  p_client_package_id UUID DEFAULT NULL,
  p_is_recurring BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_appointment_id UUID;
  v_count INTEGER;
  v_max_attendees INTEGER;
BEGIN
  -- Get current booking count for the schedule
  SELECT COUNT(*) INTO v_count
  FROM appointments
  WHERE schedule_id = p_schedule_id
  AND status NOT IN ('cancelled', 'no_show');

  -- Get max attendees for the service
  SELECT max_attendees INTO v_max_attendees
  FROM services
  WHERE id = p_service_id;

  -- Check capacity (assuming 1 if not found, though schema enforces it)
  IF v_count >= COALESCE(v_max_attendees, 1) THEN
    RAISE EXCEPTION 'Schedule is fully booked';
  END IF;

  INSERT INTO appointments (
    schedule_id, 
    client_id, 
    service_id, 
    client_package_id, 
    is_recurring, 
    status
  )
  VALUES (
    p_schedule_id, 
    p_client_id, 
    p_service_id, 
    p_client_package_id, 
    p_is_recurring, 
    'scheduled'
  )
  RETURNING id INTO v_appointment_id;
  
  RETURN v_appointment_id;
END;
$$;

-- Function to get available professionals for a specific time and service
CREATE OR REPLACE FUNCTION get_available_professionals_for_service_at_time(
  p_service_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE
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
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.name,
    p.specialty,
    p.avatar_url
  FROM professionals p
  JOIN professional_services ps ON ps.professional_id = p.id
  JOIN schedules s ON s.professional_id = p.id
  WHERE ps.service_id = p_service_id
    AND s.start_time = p_start_time
    AND s.id NOT IN (
      SELECT schedule_id 
      FROM appointments 
      WHERE status NOT IN ('cancelled', 'no_show')
    )
  ORDER BY p.name;
END;
$$;
