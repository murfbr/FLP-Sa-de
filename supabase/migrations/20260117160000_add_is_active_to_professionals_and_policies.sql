-- Migration: 20260117160000_add_is_active_to_professionals_and_policies.sql
-- Description: Add is_active column to professionals and ensure admin RLS policies for delete/update.

-- Add is_active column defaulting to true
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Ensure RLS policies allow admins to manage (delete/update) professionals
-- We recreate the policy to be sure it covers DELETE and UPDATE actions properly.
DROP POLICY IF EXISTS "Admins full access professionals" ON public.professionals;

CREATE POLICY "Admins full access professionals"
  ON public.professionals
  FOR ALL
  TO authenticated
  USING (is_admin());
