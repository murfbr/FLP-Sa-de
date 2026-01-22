-- Migration: 20260213100000_enable_rls_subscription_plans.sql
-- Description: Enables RLS on subscription_plans table and sets up access policies for admins and authenticated users.

-- 1. Enable Row Level Security on the table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 2. Policy for SELECT (Read Access)
-- Requirement: Allow authenticated clients and admins to view available subscription plans.
DROP POLICY IF EXISTS "Authenticated users can view subscription_plans" ON public.subscription_plans;

CREATE POLICY "Authenticated users can view subscription_plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (true);

-- 3. Policy for INSERT (Create Access)
-- Requirement: Restrict creation of plans to admins only.
DROP POLICY IF EXISTS "Admins can insert subscription_plans" ON public.subscription_plans;

CREATE POLICY "Admins can insert subscription_plans"
ON public.subscription_plans
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- 4. Policy for UPDATE (Edit Access)
-- Requirement: Restrict updating of plans to admins only.
DROP POLICY IF EXISTS "Admins can update subscription_plans" ON public.subscription_plans;

CREATE POLICY "Admins can update subscription_plans"
ON public.subscription_plans
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- 5. Policy for DELETE (Remove Access)
-- Requirement: Restrict deletion of plans to admins only.
DROP POLICY IF EXISTS "Admins can delete subscription_plans" ON public.subscription_plans;

CREATE POLICY "Admins can delete subscription_plans"
ON public.subscription_plans
FOR DELETE
TO authenticated
USING (public.is_admin());
