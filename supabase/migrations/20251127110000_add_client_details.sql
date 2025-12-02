  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS general_assessment JSONB;
  