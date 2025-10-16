-- Add a unique constraint to the schedules table to prevent duplicate slots
-- for the same professional at the same start time. This makes the generation
-- process idempotent, meaning it can be run multiple times without creating
-- duplicate entries.
ALTER TABLE public.schedules
ADD CONSTRAINT schedules_professional_id_start_time_key UNIQUE (professional_id, start_time);
