-- Migration to improve rescheduling logic and availability checks
-- Ensures consistency between booking and rescheduling availability
-- Implements proper capacity checks for group sessions during rescheduling

-- 1. Re-implement get_available_dates_dynamic to reuse the exact logic from get_available_slots_dynamic
-- This guarantees that the calendar only enables dates that actually have valid slots (considering capacity, overrides, etc.)
CREATE OR REPLACE FUNCTION public.get_available_dates_dynamic(
    p_professional_id UUID,
    p_service_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    available_date TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- We simply select distinct dates from the slots function to ensure 100% consistency.
    -- If a slot is returned by get_available_slots_dynamic, it means it is valid for booking/rescheduling.
    RETURN QUERY
    SELECT DISTINCT to_char(start_time, 'YYYY-MM-DD')
    FROM public.get_available_slots_dynamic(p_professional_id, p_service_id, p_start_date, p_end_date)
    ORDER BY 1;
END;
$$;

-- 2. Implement reschedule_appointment_dynamic to handle dynamic schedule creation and capacity checks
-- This allows rescheduling to a time slot that might not have a schedule row yet (dynamic availability)
-- And ensures capacity rules are respected.
CREATE OR REPLACE FUNCTION public.reschedule_appointment_dynamic(
  p_appointment_id UUID,
  p_new_professional_id UUID,
  p_new_start_time TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_id UUID;
  v_duration INT;
  v_end_time TIMESTAMPTZ;
  v_schedule_id UUID;
BEGIN
  -- 2.1. Get Service Info from Appointment
  SELECT service_id INTO v_service_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado.';
  END IF;

  -- 2.2. Get Service Duration
  SELECT duration_minutes INTO v_duration
  FROM public.services
  WHERE id = v_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;
  
  v_end_time := p_new_start_time + (v_duration || ' minutes')::interval;

  -- 2.3. Find or Create Schedule
  -- Try to find an exact existing schedule for this professional at this time
  SELECT id INTO v_schedule_id
  FROM public.schedules
  WHERE professional_id = p_new_professional_id
    AND start_time = p_new_start_time;

  IF v_schedule_id IS NULL THEN
    -- If no exact schedule exists, we need to create one.
    -- First, check for conflicts with OTHER existing schedules (staggered overlap).
    -- We cannot create a schedule that overlaps with another schedule that already has appointments.
    IF EXISTS (
        SELECT 1 FROM public.schedules s
        WHERE s.professional_id = p_new_professional_id
        AND s.start_time < v_end_time 
        AND s.end_time > p_new_start_time
        AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.schedule_id = s.id AND a.status != 'cancelled')
    ) THEN
         RAISE EXCEPTION 'Conflito de horário com outro agendamento existente.';
    END IF;

    -- Create the new schedule
    INSERT INTO public.schedules (professional_id, start_time, end_time)
    VALUES (p_new_professional_id, p_new_start_time, v_end_time)
    RETURNING id INTO v_schedule_id;
  END IF;

  -- 2.4. Perform the Reschedule using the core function
  -- This core function (reschedule_appointment) handles:
  -- - Checking capacity of the target schedule (v_schedule_id)
  -- - Checking service type compatibility
  -- - Updating the appointment record
  PERFORM public.reschedule_appointment(p_appointment_id, v_schedule_id);

END;
$$;
