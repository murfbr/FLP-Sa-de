-- Migration: Fix recursion in admin check and RLS policies
-- Description: 
-- 1. Populates 'admins' table based on 'profiles.role'.
-- 2. Updates 'is_admin' function to query 'admins' table directly, avoiding recursion with 'profiles'.
-- 3. Implements non-recursive RLS policies for 'profiles'.
-- 4. Reviews and updates CRUD policies for critical tables.

-- 1. Sync existing admins from profiles to admins table
-- We assume user_id is unique in admins table (as it should be one entry per admin)
INSERT INTO public.admins (user_id)
SELECT id FROM public.profiles WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- 2. Create trigger to keep admins table in sync with profiles.role
-- This ensures future role updates are reflected in the admins table
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.admins (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.admins WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_admin_role_trigger ON public.profiles;
CREATE TRIGGER sync_admin_role_trigger
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_admin_role();

-- 3. Update is_admin function to use admins table
-- This breaks the dependency on profiles table RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Update is_admin_simple as well for consistency
CREATE OR REPLACE FUNCTION public.is_admin_simple(p_user uuid DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = p_user
  );
END;
$$;

-- 4. Fix Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Simple, direct check for own profile (Non-recursive)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Admin access using the new non-recursive is_admin()
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert all profiles" ON public.profiles;
CREATE POLICY "Admins can insert all profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (is_admin());

-- 5. Admins Table RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Allow admins to view the admins table (Self-referential but safe via SECURITY DEFINER in is_admin)
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins" 
ON public.admins 
FOR SELECT 
TO authenticated 
USING (is_admin());

-- 6. Update Critical Tables Policies (Appointments, Clients, Services, Partnerships, Professionals)

-- === Appointments ===
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Admin: ALL
DROP POLICY IF EXISTS "Admins full access appointments" ON public.appointments;
CREATE POLICY "Admins full access appointments" 
ON public.appointments 
FOR ALL 
TO authenticated 
USING (is_admin());

-- Professionals: SELECT & UPDATE (Own appointments)
DROP POLICY IF EXISTS "Professionals view own appointments" ON public.appointments;
CREATE POLICY "Professionals view own appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id)
);

DROP POLICY IF EXISTS "Professionals update own appointments" ON public.appointments;
CREATE POLICY "Professionals update own appointments" 
ON public.appointments 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id)
);

-- Clients: SELECT (Own appointments)
DROP POLICY IF EXISTS "Clients view own appointments" ON public.appointments;
CREATE POLICY "Clients view own appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated 
USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);


-- === Clients ===
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Admin: ALL
DROP POLICY IF EXISTS "Admins full access clients" ON public.clients;
CREATE POLICY "Admins full access clients" 
ON public.clients 
FOR ALL 
TO authenticated 
USING (is_admin());

-- Professionals: SELECT (All clients)
DROP POLICY IF EXISTS "Professionals view clients" ON public.clients;
CREATE POLICY "Professionals view clients" 
ON public.clients 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM professionals WHERE user_id = auth.uid())
);

-- Clients: SELECT (Own record)
DROP POLICY IF EXISTS "Clients view own record" ON public.clients;
CREATE POLICY "Clients view own record" 
ON public.clients 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());


-- === Services ===
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Admin: ALL
DROP POLICY IF EXISTS "Admins full access services" ON public.services;
CREATE POLICY "Admins full access services" 
ON public.services 
FOR ALL 
TO authenticated 
USING (is_admin());

-- Everyone: SELECT
DROP POLICY IF EXISTS "Everyone can view services" ON public.services;
CREATE POLICY "Everyone can view services" 
ON public.services 
FOR SELECT 
TO authenticated 
USING (true);


-- === Partnerships ===
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- Admin: ALL
DROP POLICY IF EXISTS "Admins full access partnerships" ON public.partnerships;
CREATE POLICY "Admins full access partnerships" 
ON public.partnerships 
FOR ALL 
TO authenticated 
USING (is_admin());

-- Everyone: SELECT
DROP POLICY IF EXISTS "Everyone can view partnerships" ON public.partnerships;
CREATE POLICY "Everyone can view partnerships" 
ON public.partnerships 
FOR SELECT 
TO authenticated 
USING (true);


-- === Professionals ===
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Admin: ALL
DROP POLICY IF EXISTS "Admins full access professionals" ON public.professionals;
CREATE POLICY "Admins full access professionals" 
ON public.professionals 
FOR ALL 
TO authenticated 
USING (is_admin());

-- Everyone: SELECT
DROP POLICY IF EXISTS "Everyone can view professionals" ON public.professionals;
CREATE POLICY "Everyone can view professionals" 
ON public.professionals 
FOR SELECT 
TO authenticated 
USING (true);

-- Professional: UPDATE (Own record)
DROP POLICY IF EXISTS "Professionals update own record" ON public.professionals;
CREATE POLICY "Professionals update own record" 
ON public.professionals 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

