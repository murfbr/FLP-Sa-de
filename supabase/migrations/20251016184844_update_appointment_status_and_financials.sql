-- 1. Create ENUM type for appointment status for better data integrity
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- 2. Alter the appointments table to use the new ENUM type
-- This is done in a non-destructive way to preserve existing data.
ALTER TABLE public.appointments
ADD COLUMN status_enum public.appointment_status;

-- 3. Copy data from the old column to the new one, handling potential string values
UPDATE public.appointments
SET status_enum = CASE
    WHEN lower(status) = 'completed' THEN 'completed'::public.appointment_status
    WHEN lower(status) = 'cancelled' THEN 'cancelled'::public.appointment_status
    WHEN lower(status) = 'confirmed' THEN 'confirmed'::public.appointment_status
    ELSE 'scheduled'::public.appointment_status
END;

-- 4. Drop the old text column
ALTER TABLE public.appointments DROP COLUMN status;

-- 5. Rename the new column to 'status' and set it as NOT NULL with a default
ALTER TABLE public.appointments RENAME COLUMN status_enum TO status;
ALTER TABLE public.appointments ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'scheduled';


-- 6. Create a function to handle appointment completion and financial record creation
CREATE OR REPLACE FUNCTION complete_appointment(p_appointment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment RECORD;
  v_service_price NUMERIC;
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_financial_record_id UUID;
BEGIN
  -- Step 1: Fetch appointment details to ensure it exists
  SELECT * INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento com ID % não encontrado.', p_appointment_id;
  END IF;

  -- Step 2: Update appointment status to 'completed'
  UPDATE public.appointments
  SET status = 'completed'
  WHERE id = p_appointment_id;

  -- Step 3: Check if a financial record for this appointment already exists
  SELECT id INTO v_financial_record_id
  FROM public.financial_records
  WHERE appointment_id = p_appointment_id;

  -- Step 4: If a financial record does not exist, create one
  IF v_financial_record_id IS NULL THEN
    -- Get the base price of the service
    SELECT price INTO v_service_price
    FROM public.services
    WHERE id = v_appointment.service_id;

    -- Check if the client has a partnership to apply discounts
    SELECT partnership_id INTO v_client_partnership_id
    FROM public.clients
    WHERE id = v_appointment.client_id;

    v_final_price := v_service_price;

    IF v_client_partnership_id IS NOT NULL THEN
      -- Find the best matching discount (specific service > generic)
      SELECT discount_percentage INTO v_discount_percentage
      FROM public.partnership_discounts
      WHERE partnership_id = v_client_partnership_id
        AND (service_id = v_appointment.service_id OR service_id IS NULL)
      ORDER BY service_id IS NOT NULL DESC -- true comes first, so specific is prioritized
      LIMIT 1;

      -- Apply discount if found
      IF FOUND AND v_discount_percentage IS NOT NULL THEN
        v_final_price := v_service_price * (1 - (v_discount_percentage / 100.0));
      END IF;
    END IF;

    -- Create the financial record with the final price
    INSERT INTO public.financial_records (client_id, professional_id, appointment_id, amount, description, payment_method, payment_date)
    VALUES (v_appointment.client_id, v_appointment.professional_id, p_appointment_id, v_final_price, 'Pagamento por serviço realizado', 'Pendente', NOW());
  ELSE
    -- Optional: If the record exists, we can update it, for example, to set the payment date if it was null.
    UPDATE public.financial_records
    SET payment_date = NOW()
    WHERE id = v_financial_record_id AND payment_date IS NULL;
  END IF;

END;
$$;
