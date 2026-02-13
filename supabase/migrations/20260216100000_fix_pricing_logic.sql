-- Migration to fix pricing logic for packages and subscriptions
-- Ensures effective_price is 0 for package/subscription sessions
-- Updates financial records for data consistency

-- 1. Update v_appointments_with_details view
CREATE OR REPLACE VIEW v_appointments_with_details AS
SELECT
  a.id,
  a.status,
  a.created_at,
  a.notes,
  a.discount_amount,
  a.client_id,
  c.name as client_name,
  c.email as client_email,
  a.professional_id,
  p.name as professional_name,
  a.service_id,
  s.name as service_name,
  s.price,
  s.duration_minutes,
  s.max_attendees,
  s.value_type,
  a.schedule_id,
  sch.start_time,
  sch.end_time,
  a.client_package_id,
  CASE
    WHEN a.client_package_id IS NOT NULL THEN 0
    WHEN s.value_type = 'monthly' THEN 0
    ELSE GREATEST(0, s.price - COALESCE(a.discount_amount, 0))
  END as effective_price
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN professionals p ON a.professional_id = p.id
JOIN services s ON a.service_id = s.id
JOIN schedules sch ON a.schedule_id = sch.id;

-- 2. Update complete_appointment function to correctly handle package/subscription pricing
CREATE OR REPLACE FUNCTION complete_appointment(p_appointment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment RECORD;
  v_service_price NUMERIC;
  v_service_value_type TEXT;
  v_client_partnership_id UUID;
  v_discount_percentage NUMERIC;
  v_final_price NUMERIC;
  v_financial_record_id UUID;
BEGIN
  -- Step 1: Fetch appointment and service details
  SELECT a.*, s.price as service_price, s.value_type
  INTO v_appointment
  FROM public.appointments a
  JOIN public.services s ON a.service_id = s.id
  WHERE a.id = p_appointment_id;

  v_service_price := v_appointment.service_price;
  v_service_value_type := v_appointment.value_type;

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

  -- Step 4: Logic to determine final price
  v_final_price := v_service_price;

  -- CHECK FOR PACKAGE OR SUBSCRIPTION
  IF v_appointment.client_package_id IS NOT NULL THEN
    v_final_price := 0;
  ELSIF v_service_value_type = 'monthly' THEN
    v_final_price := 0;
  ELSE
    -- Standard calculation for single sessions
    -- Check if the client has a partnership to apply discounts
    SELECT partnership_id INTO v_client_partnership_id
    FROM public.clients
    WHERE id = v_appointment.client_id;

    IF v_client_partnership_id IS NOT NULL THEN
      -- Find the best matching discount (specific service > generic)
      SELECT discount_percentage INTO v_discount_percentage
      FROM public.partnership_discounts
      WHERE partnership_id = v_client_partnership_id
        AND (service_id = v_appointment.service_id OR service_id IS NULL)
      ORDER BY service_id IS NOT NULL DESC
      LIMIT 1;

      -- Apply discount if found
      IF FOUND AND v_discount_percentage IS NOT NULL THEN
        v_final_price := v_service_price * (1 - (v_discount_percentage / 100.0));
      END IF;
    END IF;

    -- Apply manual discount if present (ensure non-negative)
    IF v_appointment.discount_amount IS NOT NULL THEN
        v_final_price := GREATEST(0, v_final_price - v_appointment.discount_amount);
    END IF;
  END IF;

  -- Step 5: If a financial record does not exist, create one
  IF v_financial_record_id IS NULL THEN
    INSERT INTO public.financial_records (
      client_id, 
      professional_id, 
      appointment_id, 
      client_package_id,
      amount, 
      description, 
      payment_method, 
      payment_date
    )
    VALUES (
      v_appointment.client_id, 
      v_appointment.professional_id, 
      p_appointment_id, 
      v_appointment.client_package_id,
      v_final_price, 
      CASE
        WHEN v_appointment.client_package_id IS NOT NULL THEN 'Serviço realizado (Pacote)'
        WHEN v_service_value_type = 'monthly' THEN 'Serviço realizado (Assinatura)'
        ELSE 'Pagamento por serviço realizado'
      END,
      CASE
        WHEN v_appointment.client_package_id IS NOT NULL THEN 'Crédito/Pacote'
        WHEN v_service_value_type = 'monthly' THEN 'Assinatura'
        ELSE 'Pendente'
      END,
      NOW()
    );
  ELSE
    -- If the record exists, update the amount to ensure correctness (fixing historical errors)
    -- and update payment date if null
    UPDATE public.financial_records
    SET 
      amount = v_final_price,
      payment_date = COALESCE(payment_date, NOW())
    WHERE id = v_financial_record_id;
  END IF;

END;
$$;

-- 3. Fix historical data
-- Set amount to 0 for all financial records linked to appointments that are part of a package
UPDATE public.financial_records
SET amount = 0
WHERE appointment_id IN (
    SELECT id FROM public.appointments WHERE client_package_id IS NOT NULL
);

-- Set amount to 0 for all financial records linked to appointments that are monthly subscriptions
UPDATE public.financial_records
SET amount = 0
WHERE appointment_id IN (
    SELECT a.id 
    FROM public.appointments a 
    JOIN public.services s ON a.service_id = s.id 
    WHERE s.value_type = 'monthly'
);

-- 4. Update the trigger function for discount changes to respect packages/subscriptions
CREATE OR REPLACE FUNCTION sync_appointment_financials()
RETURNS TRIGGER AS $$
DECLARE
  v_service_price NUMERIC;
  v_value_type TEXT;
  v_final_amount NUMERIC;
BEGIN
  -- Check if this is a package or subscription appointment
  IF NEW.client_package_id IS NOT NULL THEN
    v_final_amount := 0;
  ELSE
    SELECT price, value_type INTO v_service_price, v_value_type FROM services WHERE id = NEW.service_id;
    
    IF v_value_type = 'monthly' THEN
       v_final_amount := 0;
    ELSE
       -- Calculate final amount (price - discount), ensuring not negative
       v_final_amount := GREATEST(0, v_service_price - COALESCE(NEW.discount_amount, 0));
    END IF;
  END IF;
  
  -- Update financial record if exists
  UPDATE financial_records 
  SET amount = v_final_amount
  WHERE appointment_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

