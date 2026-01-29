-- Add client_subscription_id to financial_records to link payments to specific subscriptions
ALTER TABLE financial_records ADD COLUMN IF NOT EXISTS client_subscription_id UUID REFERENCES client_subscriptions(id);

-- Create time_tracking table for employee work hours
CREATE TABLE IF NOT EXISTS time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIME NOT NULL,
  clock_out TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_tracking_professional_date ON time_tracking(professional_id, date);
CREATE INDEX IF NOT EXISTS idx_financial_records_subscription ON financial_records(client_subscription_id);
