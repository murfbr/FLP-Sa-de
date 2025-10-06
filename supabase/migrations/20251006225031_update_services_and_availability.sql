-- Create ENUM type for service value
CREATE TYPE public.service_value_type AS ENUM ('session', 'monthly');

-- Add value_type column to services table
ALTER TABLE public.services
ADD COLUMN value_type public.service_value_type NOT NULL DEFAULT 'session';

-- Add service_ids column to professional_recurring_availability table
ALTER TABLE public.professional_recurring_availability
ADD COLUMN service_ids UUID[] NULL;

-- Add service_ids column to professional_availability_overrides table
ALTER TABLE public.professional_availability_overrides
ADD COLUMN service_ids UUID[] NULL;

-- Add a comment to explain the logic for service_ids
COMMENT ON COLUMN public.professional_recurring_availability.service_ids IS 'Array of service UUIDs offered during this slot. If NULL or empty, all professional''s services are considered available.';
COMMENT ON COLUMN public.professional_availability_overrides.service_ids IS 'Array of service UUIDs offered during this override. If NULL or empty, it inherits from recurring or offers all services if it''s a new availability slot.';
