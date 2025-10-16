ALTER TABLE public.clients
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.clients.is_active IS 'Indicates if the client account is active or not.';
