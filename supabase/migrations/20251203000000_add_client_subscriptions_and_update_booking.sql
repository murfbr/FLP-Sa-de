-- Create subscription_status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- Create client_subscriptions table
CREATE TABLE public.client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status public.subscription_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX ON public.client_subscriptions (client_id);
CREATE INDEX ON public.client_subscriptions (service_id);
CREATE INDEX ON public.client_subscriptions (status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for client_subscriptions
CREATE TRIGGER update_client_subscriptions_updated_at
    BEFORE UPDATE ON public.client_subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- Drop previous book_appointment function to update it
DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, uuid);

-- Recreate book_appointment with new logic for subscriptions and packages
CREATE OR REPLACE FUNCTION public.book_appointment(
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
  v_service_value_type TEXT;
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_slots_to_book UUID[];
  v_booked_slot_count INT;
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

  -- 6. Determine Price and Validation based on Service Type
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

  -- 7. Mark all required slots as booked
  UPDATE public.schedules
  SET is_booked = TRUE
  WHERE id = ANY(v_slots_to_book);

  -- 8. Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id, client_package_id)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id, p_client_package_id)
  RETURNING id INTO v_appointment_id;

  -- 9. Create a financial record
  INSERT INTO public.financial_records (client_id, professional_id, appointment_id, client_package_id, amount, description, payment_method)
  VALUES (
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
