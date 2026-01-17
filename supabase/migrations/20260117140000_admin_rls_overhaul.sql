-- Migration: 20260117140000_admin_rls_overhaul.sql

-- 1. Create helper function for admin check
-- SECURITY DEFINER ensures this function runs with the privileges of the owner (superuser/service role)
-- avoiding infinite recursion when querying the profiles table from RLS policies.
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

-- 2. Apply Admin Policies to all tables

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert all profiles" ON public.profiles;
CREATE POLICY "Admins can insert all profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles" ON public.profiles FOR DELETE TO authenticated USING (is_admin());

-- Professionals
DROP POLICY IF EXISTS "Admins full access professionals" ON public.professionals;
CREATE POLICY "Admins full access professionals" ON public.professionals FOR ALL TO authenticated USING (is_admin());

-- Clients
DROP POLICY IF EXISTS "Admins full access clients" ON public.clients;
CREATE POLICY "Admins full access clients" ON public.clients FOR ALL TO authenticated USING (is_admin());

-- Appointments
DROP POLICY IF EXISTS "Admins full access appointments" ON public.appointments;
CREATE POLICY "Admins full access appointments" ON public.appointments FOR ALL TO authenticated USING (is_admin());

-- Financial Records
DROP POLICY IF EXISTS "Admins full access financial_records" ON public.financial_records;
CREATE POLICY "Admins full access financial_records" ON public.financial_records FOR ALL TO authenticated USING (is_admin());

-- Schedules
DROP POLICY IF EXISTS "Admins full access schedules" ON public.schedules;
CREATE POLICY "Admins full access schedules" ON public.schedules FOR ALL TO authenticated USING (is_admin());

-- Services
DROP POLICY IF EXISTS "Admins full access services" ON public.services;
CREATE POLICY "Admins full access services" ON public.services FOR ALL TO authenticated USING (is_admin());

-- Packages
DROP POLICY IF EXISTS "Admins full access packages" ON public.packages;
CREATE POLICY "Admins full access packages" ON public.packages FOR ALL TO authenticated USING (is_admin());

-- Client Packages
DROP POLICY IF EXISTS "Admins full access client_packages" ON public.client_packages;
CREATE POLICY "Admins full access client_packages" ON public.client_packages FOR ALL TO authenticated USING (is_admin());

-- Client Subscriptions
DROP POLICY IF EXISTS "Admins full access client_subscriptions" ON public.client_subscriptions;
CREATE POLICY "Admins full access client_subscriptions" ON public.client_subscriptions FOR ALL TO authenticated USING (is_admin());

-- Professional Services
DROP POLICY IF EXISTS "Admins full access professional_services" ON public.professional_services;
CREATE POLICY "Admins full access professional_services" ON public.professional_services FOR ALL TO authenticated USING (is_admin());

-- Professional Availability Overrides
DROP POLICY IF EXISTS "Admins full access professional_availability_overrides" ON public.professional_availability_overrides;
CREATE POLICY "Admins full access professional_availability_overrides" ON public.professional_availability_overrides FOR ALL TO authenticated USING (is_admin());

-- Professional Recurring Availability
DROP POLICY IF EXISTS "Admins full access professional_recurring_availability" ON public.professional_recurring_availability;
CREATE POLICY "Admins full access professional_recurring_availability" ON public.professional_recurring_availability FOR ALL TO authenticated USING (is_admin());

-- Partnerships
DROP POLICY IF EXISTS "Admins full access partnerships" ON public.partnerships;
CREATE POLICY "Admins full access partnerships" ON public.partnerships FOR ALL TO authenticated USING (is_admin());

-- Partnership Discounts
DROP POLICY IF EXISTS "Admins full access partnership_discounts" ON public.partnership_discounts;
CREATE POLICY "Admins full access partnership_discounts" ON public.partnership_discounts FOR ALL TO authenticated USING (is_admin());

-- Professional Notifications
DROP POLICY IF EXISTS "Admins full access professional_notifications" ON public.professional_notifications;
CREATE POLICY "Admins full access professional_notifications" ON public.professional_notifications FOR ALL TO authenticated USING (is_admin());
