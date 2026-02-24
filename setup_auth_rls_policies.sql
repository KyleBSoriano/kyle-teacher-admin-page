-- =====================================================
-- RLS Policies for Authentication System
-- =====================================================
-- This SQL file sets up Row Level Security policies
-- required for the authentication system to work properly.
-- Run this in your Supabase SQL Editor.
-- =====================================================

-- =====================================================
-- 1. SCHOOLS TABLE - Public read access for code validation
-- =====================================================

-- Enable RLS on schools table (if not already enabled)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public to read schools for code validation" ON public.schools;

-- Create policy: Allow anyone (including unauthenticated users) to read schools
-- This is needed for school code validation during sign-up
CREATE POLICY "Allow public to read schools for code validation" 
ON public.schools 
FOR SELECT 
USING (true);

-- =====================================================
-- 2. PROFILES TABLE - Authenticated user access
-- =====================================================
-- NOTE: The profiles.id should match auth.users.id for the
-- RLS policies to work correctly. When creating a profile
-- during sign-up, use the auth user's ID as the profile ID.
-- =====================================================

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public to insert profiles during sign-up" ON public.profiles;

-- Policy: Authenticated users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy: Authenticated users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Policy: Allow public to insert profiles during sign-up
-- This allows new users to create their profile during sign-up
CREATE POLICY "Allow public to insert profiles during sign-up" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- 3. USER_ROLES TABLE - Authenticated user access
-- =====================================================

-- Enable RLS on user_roles table (if not already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow public to insert user roles during sign-up" ON public.user_roles;

-- Policy: Authenticated users can view their own role
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Allow public to insert user roles during sign-up
-- This allows new users to create their role during sign-up
CREATE POLICY "Allow public to insert user roles during sign-up" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- Verification Queries (Optional - run to verify policies)
-- =====================================================

-- Check if RLS is enabled on all tables
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('schools', 'profiles', 'user_roles');

-- Check existing policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('schools', 'profiles', 'user_roles')
-- ORDER BY tablename, policyname;

