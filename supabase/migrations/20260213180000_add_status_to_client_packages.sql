ALTER TABLE public.client_packages ADD COLUMN status text NOT NULL DEFAULT 'active';
ALTER TABLE public.client_packages ADD CONSTRAINT client_packages_status_check CHECK (status IN ('active', 'cancelled', 'completed'));
