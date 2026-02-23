-- Add missing is_booked column to schedules table
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS is_booked BOOLEAN NOT NULL DEFAULT false;
