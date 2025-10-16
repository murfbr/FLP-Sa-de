-- Drop existing foreign key constraints to redefine them
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;
ALTER TABLE public.client_packages DROP CONSTRAINT IF EXISTS client_packages_client_id_fkey;
ALTER TABLE public.financial_records DROP CONSTRAINT IF EXISTS financial_records_client_id_fkey;

-- Add new foreign key constraints with ON DELETE CASCADE
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_client_id_fkey
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.client_packages
ADD CONSTRAINT client_packages_client_id_fkey
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.financial_records
ADD CONSTRAINT financial_records_client_id_fkey
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
