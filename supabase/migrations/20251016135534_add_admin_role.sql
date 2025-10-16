-- Add 'admin' value to the existing user_role ENUM type.
-- This is a non-destructive operation and will allow us to assign admin roles.
ALTER TYPE public.user_role ADD VALUE 'admin';
