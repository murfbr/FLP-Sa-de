CREATE OR REPLACE FUNCTION reschedule_appointment(
  p_appointment_id UUID,
  p_new_schedule_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_schedule_id UUID;
  v_new_professional_id UUID;
BEGIN
  -- Get old schedule id
  SELECT schedule_id INTO v_old_schedule_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado.';
  END IF;

  -- Get new professional id from new schedule
  SELECT professional_id INTO v_new_professional_id
  FROM public.schedules
  WHERE id = p_new_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Novo horário não encontrado.';
  END IF;

  -- Update old schedule to free it
  UPDATE public.schedules
  SET is_booked = FALSE
  WHERE id = v_old_schedule_id;

  -- Update new schedule to book it
  UPDATE public.schedules
  SET is_booked = TRUE
  WHERE id = p_new_schedule_id;

  -- Update appointment with new schedule and professional
  UPDATE public.appointments
  SET
    schedule_id = p_new_schedule_id,
    professional_id = v_new_professional_id,
    status = 'scheduled' -- Reset status to scheduled
  WHERE id = p_appointment_id;

END;
$$;

