-- Drop the existing function to replace it
DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, uuid);

-- Recreate the function with duration-aware logic
CREATE OR REPLACE FUNCTION book_appointment(
  p_schedule_id UUID, -- This is the ID of the FIRST slot for the appointment
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
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_slots_to_book UUID[];
  v_booked_slot_count INT;
BEGIN
  -- 1. Get service details
  SELECT duration_minutes, price INTO v_service_duration, v_service_price
  FROM public.services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;

  -- 2. Get the start time and professional ID from the initial schedule slot
  SELECT start_time, professional_id INTO v_start_time, v_professional_id
  FROM public.schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário de início inválido.';
  END IF;

  -- 3. Calculate the appointment end time
  v_end_time := v_start_time + (v_service_duration * interval '1 minute');

  -- 4. Identify all schedule slots required for this appointment
  SELECT array_agg(id) INTO v_slots_to_book
  FROM public.schedules
  WHERE professional_id = v_professional_id
    AND start_time >= v_start_time
    AND start_time < v_end_time;

  -- 5. Check if any of the required slots are already booked
  SELECT count(*) INTO v_booked_slot_count
  FROM public.schedules
  WHERE id = ANY(v_slots_to_book) AND is_booked = TRUE;

  IF v_booked_slot_count > 0 THEN
    RAISE EXCEPTION 'Um ou mais horários necessários para este serviço já estão reservados.';
  END IF;

  -- 6. Mark all required slots as booked
  UPDATE public.schedules
  SET is_booked = TRUE
  WHERE id = ANY(v_slots_to_book);

  -- 7. Calculate final price with potential discount
  SELECT partnership_id INTO v_client_partnership_id
  FROM public.clients
  WHERE id = p_client_id;

  v_final_price := v_service_price;

  IF v_client_partnership_id IS NOT NULL THEN
    SELECT discount_percentage INTO v_discount_percentage
    FROM public.partnership_discounts
    WHERE partnership_id = v_client_partnership_id AND (service_id = p_service_id OR service_id IS NULL)
    ORDER BY service_id IS NOT NULL DESC -- Prioritize specific discount over generic
    LIMIT 1;

    IF FOUND AND v_discount_percentage IS NOT NULL THEN
      v_final_price := v_service_price * (1 - (v_discount_percentage / 100.0));
    END IF;
  END IF;

  -- 8. Create the appointment, linking it to the first schedule slot
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id)
  RETURNING id INTO v_appointment_id;

  -- 9. Create a financial record for the appointment
  INSERT INTO public.financial_records (client_id, professional_id, appointment_id, amount, description, payment_method)
  VALUES (p_client_id, v_professional_id, v_appointment_id, v_final_price, 'Pagamento por agendamento de serviço', 'Pendente');

  RETURN v_appointment_id;
END;
$$;
