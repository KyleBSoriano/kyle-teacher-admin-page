-- Check for constraints that might prevent multiple admins
-- Run this in Supabase SQL Editor to see what's blocking admin creation

-- 1. Check user_roles table structure and constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass
ORDER BY contype, conname;

-- 2. Check for unique indexes on user_roles
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_roles'
AND schemaname = 'public';

-- 3. Check current admins in your school
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.school_id,
    p.email,
    p.first_name,
    p.last_name
FROM user_roles ur
LEFT JOIN profiles p ON p.id = ur.user_id
WHERE ur.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
AND ur.role = 'admin'
ORDER BY ur.created_at;

-- 4. Check RLS policies on user_roles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_roles'
AND schemaname = 'public';

-- 5. Check RLS policies on profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- 6. Test if we can see what would block an insert
-- (This simulates what the edge function does)
-- Note: This will fail if RLS blocks it, but shows the error

