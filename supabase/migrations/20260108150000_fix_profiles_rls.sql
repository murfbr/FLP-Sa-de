-- Enable RLS on profiles to ensure security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
-- This is critical for the AuthProvider to fetch the user's role
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- Policy to allow users to insert their own profile
-- Needed if the profile is created client-side upon registration
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = id );

-- Policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( auth.uid() = id );

-- Ensure authenticated users have usage permission on the schema (standard)
GRANT USAGE ON SCHEMA public TO authenticated;
