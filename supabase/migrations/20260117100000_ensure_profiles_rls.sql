-- Migration to ensure RLS is enabled and policies allow users to access their own profiles

-- 1. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (and ensure we have the correct ones)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles; -- Cleanup potential old naming
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles; -- Cleanup potential old naming

-- 3. Create Policy for SELECT
-- Allows authenticated users to view rows where the ID matches their Auth ID
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 4. Create Policy for UPDATE
-- Allows authenticated users to update rows where the ID matches their Auth ID
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 5. Create Policy for INSERT
-- Allows authenticated users to insert a row if the ID matches their Auth ID
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 6. Ensure Service Role (Admin) bypass is maintained implicitly (Supabase default)
-- No action needed, service_role bypasses RLS by default.
