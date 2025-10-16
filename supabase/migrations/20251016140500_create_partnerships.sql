-- 1. Create partnerships table
CREATE TABLE public.partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create partnership_discounts table
CREATE TABLE public.partnership_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE, -- NULL means it applies to all services
  discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(partnership_id, service_id) -- A partnership can only have one discount rule per service (or one generic rule)
);

COMMENT ON COLUMN public.partnership_discounts.service_id IS 'If NULL, the discount applies to all services that do not have a specific discount.';

-- 3. Add partnership_id to clients table
ALTER TABLE public.clients
ADD COLUMN partnership_id UUID REFERENCES public.partnerships(id) ON DELETE SET NULL;

CREATE INDEX ON public.clients (partnership_id);

-- 4. Update book_appointment function to handle discounts
DROP FUNCTION IF EXISTS public.book_appointment(uuid, uuid, uuid);

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
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
BEGIN
  -- Check if the slot is available and get professional_id
  SELECT professional_id INTO v_professional_id
  FROM public.schedules
  WHERE id = p_schedule_id AND is_booked = FALSE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário não disponível ou inexistente.';
  END IF;

  -- Get service price
  SELECT price INTO v_service_price
  FROM public.services
  WHERE id = p_service_id;

  -- Check for client partnership and apply discount
  SELECT partnership_id INTO v_client_partnership_id
  FROM public.clients
  WHERE id = p_client_id;

  v_final_price := v_service_price;

  IF v_client_partnership_id IS NOT NULL THEN
    -- Try to find a service-specific discount first
    SELECT discount_percentage INTO v_discount_percentage
    FROM public.partnership_discounts
    WHERE partnership_id = v_client_partnership_id AND service_id = p_service_id;

    -- If not found, try to find a generic discount
    IF NOT FOUND THEN
      SELECT discount_percentage INTO v_discount_percentage
      FROM public.partnership_discounts
      WHERE partnership_id = v_client_partnership_id AND service_id IS NULL;
    END IF;

    -- Apply discount if found
    IF FOUND AND v_discount_percentage IS NOT NULL THEN
      v_final_price := v_service_price * (1 - (v_discount_percentage / 100.0));
    END IF;
  END IF;

  -- Mark the schedule as booked
  UPDATE public.schedules
  SET is_booked = TRUE
  WHERE id = p_schedule_id;

  -- Create the appointment
  INSERT INTO public.appointments (schedule_id, client_id, service_id, professional_id)
  VALUES (p_schedule_id, p_client_id, p_service_id, v_professional_id)
  RETURNING id INTO v_appointment_id;

  -- Create a financial record for the appointment with the final price
  INSERT INTO public.financial_records (client_id, professional_id, appointment_id, amount, description, payment_method)
  VALUES (p_client_id, v_professional_id, v_appointment_id, v_final_price, 'Pagamento por agendamento de serviço', 'Pendente');

  RETURN v_appointment_id;
END;
$$;
