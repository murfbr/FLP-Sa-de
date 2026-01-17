-- Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Re-create policies to ensure no stale or incorrect policies exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- Policy: Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Policy: Allow users to insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on professionals
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Re-create policies for professionals table
DROP POLICY IF EXISTS "Professionals can view own record" ON public.professionals;
DROP POLICY IF EXISTS "Users can view own professional record" ON public.professionals;

-- Policy: Allow users to find their linked professional record
CREATE POLICY "Users can view own professional record"
ON public.professionals
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
