-- Check RLS policies that might be blocking admin creation
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on user_roles
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_roles';

-- 2. Check all RLS policies on user_roles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,  -- SELECT, INSERT, UPDATE, DELETE, or ALL
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'user_roles'
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 3. Check if RLS is enabled on profiles
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- 4. Check all RLS policies on profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'profiles'
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 5. Check for unique constraint on email in profiles
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND pg_get_constraintdef(oid) LIKE '%email%'
ORDER BY contype, conname;

-- 6. Check for unique index on email in profiles
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
AND schemaname = 'public'
AND (indexdef LIKE '%email%' OR indexdef LIKE '%UNIQUE%')
ORDER BY indexname;

-- 7. Test: Check if we can see existing admins (to verify SELECT works)
SELECT 
    COUNT(*) AS total_admins,
    COUNT(DISTINCT school_id) AS schools_with_admins
FROM user_roles
WHERE role = 'admin';

-- 8. Check current admins in your school
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.school_id,
    p.email,
    p.first_name,
    p.last_name,
    ur.created_at
FROM user_roles ur
LEFT JOIN profiles p ON p.id = ur.user_id
WHERE ur.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
AND ur.role = 'admin'
ORDER BY ur.created_at;

