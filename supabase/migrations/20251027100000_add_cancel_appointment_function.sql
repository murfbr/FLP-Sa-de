CREATE OR REPLACE FUNCTION cancel_appointment(p_appointment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule_id UUID;
BEGIN
  -- Get the schedule_id from the appointment
  SELECT schedule_id INTO v_schedule_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado.';
  END IF;

  -- Update appointment status to cancelled
  UPDATE public.appointments
  SET status = 'cancelled'
  WHERE id = p_appointment_id;

  -- Free up the schedule slot
  UPDATE public.schedules
  SET is_booked = FALSE
  WHERE id = v_schedule_id;
END;
$$;
