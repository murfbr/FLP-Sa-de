-- Migration to fix recurring appointment booking and unify booking logic
-- Replaces previous versions of book_appointment with a comprehensive one

-- Drop previous function signatures to avoid ambiguity
DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, uuid, uuid, boolean);

CREATE OR REPLACE FUNCTION public.book_appointment(
  p_schedule_id UUID,
  p_client_id UUID,
  p_service_id UUID,
  p_client_package_id UUID DEFAULT NULL,
  p_is_recurring BOOLEAN DEFAULT FALSE
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
  v_service_value_type TEXT;
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_conflict_count INT;
  v_subscription_count INT;
  v_package_sessions INT;
BEGIN
  -- 1. Get service details
  SELECT duration_minutes, price, value_type INTO v_service_duration, v_service_price, v_service_value_type
  FROM public.services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;

  -- 2. Get schedule details (start_time and professional_id)
  -- This ensures professional_id is retrieved from the schedule itself
  SELECT start_time, professional_id INTO v_start_time, v_professional_id
  FROM public.schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário inválido.';
  END IF;

  IF v_professional_id IS NULL THEN
     RAISE EXCEPTION 'Erro de integridade: Agendamento sem profissional associado.';
  END IF;

  -- 3. Calculate end time
  v_end_time := v_start_time + (v_service_duration || ' minutes')::interval;

  -- 4. Check for conflicts with existing appointments (ignoring cancelled ones)
  -- We use dynamic overlap check instead of relying on a flag on schedule table
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

  -- 5. Determine Price and Validation based on Service Type
  IF v_service_value_type = 'monthly' THEN
    -- Check for active subscription
    SELECT count(*) INTO v_subscription_count
    FROM public.client_subscriptions
    WHERE client_id = p_client_id
      AND service_id = p_service_id
      AND status = 'active'
      AND (end_date IS NULL OR end_date > NOW());

    IF v_subscription_count = 0 THEN
      RAISE EXCEPTION 'Cliente não possui assinatura ativa para este serviço mensal.';
    END IF;

    v_final_price := 0; -- Subscription covers the cost

  ELSE -- 'session'
    IF p_client_package_id IS NOT NULL THEN
      -- Validate and use package
      SELECT sessions_remaining INTO v_package_sessions
      FROM public.client_packages
      WHERE id = p_client_package_id
        AND client_id = p_client_id
        FOR UPDATE; -- Lock row

      IF NOT FOUND OR v_package_sessions <= 0 THEN
        RAISE EXCEPTION 'Pacote inválido ou sem sessões disponíveis.';
      END IF;

      -- Decrement session
      UPDATE public.client_packages
      SET sessions_remaining = sessions_remaining - 1
      WHERE id = p_client_package_id;

      v_final_price := 0; -- Paid via package
    ELSE
      -- Standard single session payment calculation
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
    END IF;
  END IF;

  -- 6. Insert Appointment
  INSERT INTO public.appointments (
    schedule_id, 
    client_id, 
    service_id, 
    professional_id, 
    client_package_id, 
    is_recurring
  ) VALUES (
    p_schedule_id, 
    p_client_id, 
    p_service_id, 
    v_professional_id, 
    p_client_package_id, 
    p_is_recurring
  )
  RETURNING id INTO v_appointment_id;

  -- 7. Insert Financial Record
  INSERT INTO public.financial_records (
    client_id, 
    professional_id, 
    appointment_id, 
    client_package_id, 
    amount, 
    description, 
    payment_method
  ) VALUES (
    p_client_id, 
    v_professional_id, 
    v_appointment_id, 
    p_client_package_id, 
    v_final_price, 
    CASE 
      WHEN v_service_value_type = 'monthly' THEN 'Agendamento via Assinatura Mensal'
      WHEN p_client_package_id IS NOT NULL THEN 'Agendamento via Pacote'
      ELSE 'Pagamento por agendamento avulso'
    END,
    CASE 
      WHEN v_service_value_type = 'monthly' OR p_client_package_id IS NOT NULL THEN 'Crédito/Assinatura'
      ELSE 'Pendente'
    END
  );

  RETURN v_appointment_id;
END;
$$;
