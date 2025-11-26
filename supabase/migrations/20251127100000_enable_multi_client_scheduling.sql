-- 1. Add max_attendees column to services table
ALTER TABLE public.services
ADD COLUMN max_attendees INTEGER NOT NULL DEFAULT 1;

-- 2. Remove is_booked column from schedules table
ALTER TABLE public.schedules
DROP COLUMN is_booked;

-- 3. Update foreign key constraint for appointments.schedule_id to allow one-to-many
-- First, drop the existing unique constraint if it exists (it was created as UNIQUE in the original table definition)
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_schedule_id_key;

-- Also drop the foreign key to recreate it without unique implication if needed, though standard FK is non-unique.
-- The original definition was: schedule_id UUID UNIQUE NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE
-- The UNIQUE keyword created the unique constraint/index. Dropping the constraint is enough.
-- Just to be safe and clean:
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_schedule_id_fkey;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_schedule_id_fkey
FOREIGN KEY (schedule_id) REFERENCES public.schedules(id) ON DELETE CASCADE;


-- 4. Create RPC to get available slots considering capacity
CREATE OR REPLACE FUNCTION get_available_slots_for_service(
  p_professional_id UUID,
  p_service_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
)
RETURNS SETOF public.schedules
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_attendees INTEGER;
BEGIN
  -- Get max attendees for the service
  SELECT max_attendees INTO v_max_attendees
  FROM public.services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT s.*
  FROM public.schedules s
  LEFT JOIN public.appointments a ON s.id = a.schedule_id AND a.status IN ('scheduled', 'confirmed')
  WHERE s.professional_id = p_professional_id
    AND s.start_time >= p_start_date
    AND s.start_time <= p_end_date
  GROUP BY s.id
  HAVING
    -- Slot is available if:
    -- 1. It has no appointments (count = 0)
    -- OR
    -- 2. It has appointments for the SAME service AND count < max_attendees
    (COUNT(a.id) = 0) OR
    (
      -- Check if all existing appointments are for the requested service
      BOOL_AND(a.service_id = p_service_id) AND
      COUNT(a.id) < v_max_attendees
    )
  ORDER BY s.start_time;
END;
$$;


-- 5. Update book_appointment function to handle capacity checks
CREATE OR REPLACE FUNCTION book_appointment(
  p_schedule_id UUID,
  p_client_id UUID,
  p_service_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_professional_id UUID;
  v_appointment_id UUID;
  v_service_price NUMERIC;
  v_service_duration INT;
  v_max_attendees INT;
  v_current_attendees INT;
  v_existing_service_id UUID;
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_start_time TIMESTAMPTZ;
BEGIN
  -- 1. Get service details
  SELECT duration_minutes, price, max_attendees INTO v_service_duration, v_service_price, v_max_attendees
  FROM public.services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;

  -- 2. Get schedule details
  SELECT start_time, professional_id INTO v_start_time, v_professional_id
  FROM public.schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário não encontrado.';
  END IF;

  -- 3. Check capacity and service compatibility
  -- Lock the schedule rows (via appointments) to prevent race conditions
  -- We lock the appointments associated with this schedule
  PERFORM 1 FROM public.appointments WHERE schedule_id = p_schedule_id FOR UPDATE;

  SELECT COUNT(*), MIN(service_id) INTO v_current_attendees, v_existing_service_id
  FROM public.appointments
  WHERE schedule_id = p_schedule_id AND status IN ('scheduled', 'confirmed');

  -- If there are existing appointments
  IF v_current_attendees > 0 THEN
    -- Check if the service matches
    IF v_existing_service_id <> p_service_id THEN
      RAISE EXCEPTION 'Este horário já está reservado para outro tipo de serviço.';
    END IF;

    -- Check capacity
    IF v_current_attendees >= v_max_attendees THEN
      RAISE EXCEPTION 'Este horário atingiu a capacidade máxima de participantes.';
    END IF;
  END IF;

  -- 4. Check if client is already booked for this slot
  PERFORM 1 FROM public.appointments
  WHERE schedule_id = p_schedule_id AND client_id = p_client_id AND status IN ('scheduled', 'confirmed');

  IF FOUND THEN
    RAISE EXCEPTION 'O cliente já está agendado para este horário.';
  END IF;

  -- 5. Calculate final price with potential discount
  SELECT partnership_id INTO v_client_partnership_id
  FROM public.clients
  WHERE id = p_client_id;

  v_final_price := v_service_price;

  IF v_client_partnership_id IS NOT NULL THEN
    SELECT discount_percentage INTO v_discount_percentage
    FROM public.partnership_discounts
    WHERE partnership_id = v_client_partnership_id AND (service_id = p_service_id OR service_id IS NULL)
    ORDER BY service_id IS NOT NULL DESC
    LIMIT 1;

    IF FOUND AND v_discount_percentage IS NOT NULL THEN
      v_final_price := v_service_price * (1 - (v_discount_percentage / 100.0));
    END IF;
  END IF;

  -- 6. Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id)
  RETURNING id INTO v_appointment_id;

  -- 7. Create a financial record
  INSERT INTO public.financial_records (client_id, professional_id, appointment_id, amount, description, payment_method)
  VALUES (p_client_id, v_professional_id, v_appointment_id, v_final_price, 'Pagamento por agendamento de serviço', 'Pendente');

  RETURN v_appointment_id;
END;
$$;


-- 6. Update get_available_dates function to use the new logic
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
    v_max_attendees INT;
BEGIN
    -- Get max attendees
    SELECT max_attendees INTO v_max_attendees
    FROM public.services
    WHERE id = p_service_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT DISTINCT (s.start_time::date) as schedule_date
    FROM public.schedules s
    LEFT JOIN public.appointments a ON s.id = a.schedule_id AND a.status IN ('scheduled', 'confirmed')
    WHERE s.professional_id = p_professional_id
      AND s.start_time >= p_start_date
      AND s.start_time < (p_end_date + interval '1 day')
    GROUP BY s.id, s.start_time
    HAVING
      (COUNT(a.id) = 0) OR
      (BOOL_AND(a.service_id = p_service_id) AND COUNT(a.id) < v_max_attendees)
    ORDER BY schedule_date;
END;
$$;


-- 7. Update cancel_appointment to NOT touch is_booked (since it's gone)
CREATE OR REPLACE FUNCTION cancel_appointment(p_appointment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if appointment exists
  PERFORM 1 FROM public.appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado.';
  END IF;

  -- Update appointment status to cancelled
  UPDATE public.appointments
  SET status = 'cancelled'
  WHERE id = p_appointment_id;
END;
$$;


-- 8. Update reschedule_appointment to use new booking logic and not touch is_booked
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
  v_client_id UUID;
  v_service_id UUID;
  v_max_attendees INT;
  v_current_attendees INT;
  v_existing_service_id UUID;
BEGIN
  -- Get appointment details
  SELECT schedule_id, client_id, service_id INTO v_old_schedule_id, v_client_id, v_service_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado.';
  END IF;

  -- Get new schedule details
  SELECT professional_id INTO v_new_professional_id
  FROM public.schedules
  WHERE id = p_new_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Novo horário não encontrado.';
  END IF;

  -- Get service max attendees
  SELECT max_attendees INTO v_max_attendees
  FROM public.services
  WHERE id = v_service_id;

  -- Check capacity of new slot
  SELECT COUNT(*), MIN(service_id) INTO v_current_attendees, v_existing_service_id
  FROM public.appointments
  WHERE schedule_id = p_new_schedule_id AND status IN ('scheduled', 'confirmed');

  IF v_current_attendees > 0 THEN
    IF v_existing_service_id <> v_service_id THEN
      RAISE EXCEPTION 'Este horário já está reservado para outro tipo de serviço.';
    END IF;
    IF v_current_attendees >= v_max_attendees THEN
      RAISE EXCEPTION 'Este horário atingiu a capacidade máxima.';
    END IF;
  END IF;

  -- Update appointment
  UPDATE public.appointments
  SET
    schedule_id = p_new_schedule_id,
    professional_id = v_new_professional_id,
    status = 'scheduled'
  WHERE id = p_appointment_id;

END;
$$;

