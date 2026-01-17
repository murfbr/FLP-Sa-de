-- Migration: 20260117150000_fix_auth_rls_policies.sql
-- Description: Fix RLS policies to prevent infinite loops and ensure proper access for login/profile fetching.

-- 1. Secure helper function for admin check
-- We use SECURITY DEFINER to bypass RLS recursion when checking the profile within RLS policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Profiles Table Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile (Critical for login)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Allow admins to insert/update/delete profiles (Maintenance)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert all profiles" ON public.profiles;
CREATE POLICY "Admins can insert all profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles" ON public.profiles FOR DELETE TO authenticated USING (is_admin());


-- 3. Professionals Table Policies
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Allow professionals to read their own record (Critical for professional dashboard)
DROP POLICY IF EXISTS "Professionals can read own record" ON public.professionals;
CREATE POLICY "Professionals can read own record"
  ON public.professionals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to read all professional records
DROP POLICY IF EXISTS "Admins can read all professionals" ON public.professionals;
CREATE POLICY "Admins can read all professionals"
  ON public.professionals
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Allow admins to manage professionals
DROP POLICY IF EXISTS "Admins full access professionals" ON public.professionals;
CREATE POLICY "Admins full access professionals" 
  ON public.professionals 
  FOR ALL 
  TO authenticated 
  USING (is_admin());

-- 4. Grant explicit permissions to authenticated role just in case
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.professionals TO authenticated;
