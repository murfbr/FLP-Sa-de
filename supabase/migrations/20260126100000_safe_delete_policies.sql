-- Migration: 20260126100000_safe_delete_policies.sql
-- Description: Prevent cascade deletion of sensitive historical data (appointments, financial records) by changing FK constraints to RESTRICT.

-- Update appointments: Prevent deletion of professional if appointments exist
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_professional_id_fkey;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE RESTRICT;

-- Update financial_records: Prevent deletion of professional if financial records exist
ALTER TABLE public.financial_records
DROP CONSTRAINT IF EXISTS financial_records_professional_id_fkey;

ALTER TABLE public.financial_records
ADD CONSTRAINT financial_records_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE RESTRICT;

-- Update schedules: Prevent deletion of professional if schedules exist (which appointments depend on)
ALTER TABLE public.schedules
DROP CONSTRAINT IF EXISTS schedules_professional_id_fkey;

ALTER TABLE public.schedules
ADD CONSTRAINT schedules_professional_id_fkey
FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE RESTRICT;
