-- Migration to ensure cascading deletion for professional records
-- This allows deleting a professional and automatically cleaning up all associated data

-- 1. Update professional_services
ALTER TABLE public.professional_services
DROP CONSTRAINT IF EXISTS professional_services_professional_id_fkey;

ALTER TABLE public.professional_services
ADD CONSTRAINT professional_services_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;

-- 2. Update schedules
ALTER TABLE public.schedules
DROP CONSTRAINT IF EXISTS schedules_professional_id_fkey;

ALTER TABLE public.schedules
ADD CONSTRAINT schedules_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;

-- 3. Update professional_recurring_availability
ALTER TABLE public.professional_recurring_availability
DROP CONSTRAINT IF EXISTS professional_recurring_availability_professional_id_fkey;

ALTER TABLE public.professional_recurring_availability
ADD CONSTRAINT professional_recurring_availability_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;

-- 4. Update professional_availability_overrides
ALTER TABLE public.professional_availability_overrides
DROP CONSTRAINT IF EXISTS professional_availability_overrides_professional_id_fkey;

ALTER TABLE public.professional_availability_overrides
ADD CONSTRAINT professional_availability_overrides_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;

-- 5. Update professional_notifications
ALTER TABLE public.professional_notifications
DROP CONSTRAINT IF EXISTS professional_notifications_professional_id_fkey;

ALTER TABLE public.professional_notifications
ADD CONSTRAINT professional_notifications_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;

-- 6. Update appointments
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_professional_id_fkey;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;

-- 7. Update financial_records
ALTER TABLE public.financial_records
DROP CONSTRAINT IF EXISTS financial_records_professional_id_fkey;

ALTER TABLE public.financial_records
ADD CONSTRAINT financial_records_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;
