-- Fix scheduling functions to handle missing 'is_booked' column and ensure 12-month availability support

-- 1. Update book_appointment to use appointment overlap check instead of 'is_booked' column
CREATE OR REPLACE FUNCTION book_appointment(
  p_schedule_id UUID,
  p_client_id UUID,
  p_service_id UUID,
  p_client_package_id UUID DEFAULT NULL
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
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_conflict_count INT;
BEGIN
  -- Get service details
  SELECT duration_minutes, price INTO v_service_duration, v_service_price
  FROM public.services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;

  -- Get schedule details
  SELECT start_time, professional_id INTO v_start_time, v_professional_id
  FROM public.schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário inválido.';
  END IF;

  -- Calculate end time
  v_end_time := v_start_time + (v_service_duration || ' minutes')::interval;

  -- Check for conflicts with existing appointments (ignoring cancelled ones)
  -- This replaces the reliance on 'is_booked' column
  SELECT count(*) INTO v_conflict_count
  FROM public.appointments a
  JOIN public.schedules s ON a.schedule_id = s.id
  JOIN public.services ser ON a.service_id = ser.id
  WHERE a.professional_id = v_professional_id
  AND a.status != 'cancelled'
  AND (s.start_time, s.start_time + (ser.duration_minutes || ' minutes')::interval) OVERLAPS (v_start_time, v_end_time);

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'O horário selecionado conflita com outro agendamento.';
  END IF;

  -- Calculate Price (Partnership logic)
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

  -- Insert Appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id, client_package_id)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id, p_client_package_id)
  RETURNING id INTO v_appointment_id;

  -- Insert Financial Record
  INSERT INTO public.financial_records (client_id, professional_id, appointment_id, amount, description, payment_method)
  VALUES (p_client_id, v_professional_id, v_appointment_id, v_final_price, 'Pagamento por agendamento de serviço', 'Pendente');

  RETURN v_appointment_id;
END;
$$;

-- 2. Update get_available_dates to check for overlaps instead of 'is_booked'
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
    v_service_duration INT;
    v_slot_interval_minutes INT := 30;
BEGIN
    SELECT duration_minutes INTO v_service_duration FROM public.services WHERE id = p_service_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS day
    ),
    -- Get intervals that are already booked
    busy_intervals AS (
        SELECT
            s.start_time AS start_time,
            s.start_time + (ser.duration_minutes || ' minutes')::interval AS end_time
        FROM appointments a
        JOIN schedules s ON a.schedule_id = s.id
        JOIN services ser ON a.service_id = ser.id
        WHERE a.professional_id = p_professional_id
        AND a.status != 'cancelled'
        AND s.start_time >= p_start_date::timestamp
        AND s.start_time < (p_end_date + 1)::timestamp
    ),
    -- Get potential slots (schedules that don't overlap with busy intervals)
    valid_slots AS (
        SELECT
            s.id,
            s.start_time,
            (s.start_time::date) as schedule_date
        FROM public.schedules s
        WHERE s.professional_id = p_professional_id
          AND s.start_time >= p_start_date::timestamp
          AND s.start_time < (p_end_date + 1)::timestamp
          AND NOT EXISTS (
             SELECT 1 FROM busy_intervals b
             WHERE (s.start_time, s.end_time) OVERLAPS (b.start_time, b.end_time)
          )
    ),
    -- Check for consecutive slots required for the service duration
    consecutive_check AS (
        SELECT
            vs.schedule_date,
            vs.start_time,
            -- Calculate the end time of the slot sequence
            LEAD(vs.start_time, (v_service_duration / v_slot_interval_minutes) - 1) OVER (PARTITION BY vs.schedule_date ORDER BY vs.start_time) as end_time_of_last_slot
        FROM valid_slots vs
    )
    SELECT DISTINCT schedule_date
    FROM consecutive_check
    WHERE end_time_of_last_slot IS NOT NULL
    -- Ensure the sequence is contiguous (the time difference matches the duration)
    AND (end_time_of_last_slot + (v_slot_interval_minutes || ' minutes')::interval) = (start_time + (v_service_duration || ' minutes')::interval)
    ORDER BY schedule_date;
END;
$$;

-- 3. Update get_available_slots_for_service to match new logic and return explicit table
DROP FUNCTION IF EXISTS get_available_slots_for_service(uuid, uuid, timestamp, timestamp);

CREATE OR REPLACE FUNCTION get_available_slots_for_service(
  p_professional_id UUID,
  p_service_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
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
  v_service_duration INT;
  v_slot_interval_minutes INT := 30;
BEGIN
  SELECT duration_minutes INTO v_service_duration FROM services WHERE id = p_service_id;
  
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
      -- Optimize overlap check for the specific day range
      AND s.start_time < p_end_date + (ser.duration_minutes || ' minutes')::interval
      AND (s.start_time + (ser.duration_minutes || ' minutes')::interval) > p_start_date
  ),
  valid_slots AS (
      SELECT
          s.id,
          s.professional_id,
          s.start_time,
          s.end_time
      FROM schedules s
      WHERE s.professional_id = p_professional_id
      AND s.start_time >= p_start_date
      AND s.start_time <= p_end_date
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
END;
$$;
