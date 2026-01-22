-- Add discount_amount to appointments if it doesn't exist
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Function to sync financial records when appointment discount is updated
CREATE OR REPLACE FUNCTION sync_appointment_financials()
RETURNS TRIGGER AS $$
DECLARE
  v_service_price NUMERIC;
  v_final_amount NUMERIC;
BEGIN
  -- Get service price
  SELECT price INTO v_service_price FROM services WHERE id = NEW.service_id;
  
  -- Calculate final amount (price - discount), ensuring not negative
  v_final_amount := GREATEST(0, v_service_price - COALESCE(NEW.discount_amount, 0));
  
  -- Update financial record if exists and not using a package
  -- If client_package_id is set, typically the record is 0 or handled differently, 
  -- but we ensure consistency here for non-package records or if logic changes.
  UPDATE financial_records 
  SET amount = v_final_amount
  WHERE appointment_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update financials on discount change
DROP TRIGGER IF EXISTS update_financials_on_appointment_change ON appointments;
CREATE TRIGGER update_financials_on_appointment_change
AFTER UPDATE OF discount_amount ON appointments
FOR EACH ROW
EXECUTE FUNCTION sync_appointment_financials();
