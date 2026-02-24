-- Check for unique constraints that might prevent multiple admins
-- Run this in Supabase SQL Editor

-- 1. Check user_roles table for unique constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition,
    CASE contype
        WHEN 'u' THEN 'UNIQUE constraint - might prevent multiple admins!'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        ELSE 'Other constraint'
    END AS constraint_type_description
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass
ORDER BY contype, conname;

-- 2. Check for unique indexes on user_roles (these can also prevent duplicates)
SELECT 
    indexname,
    indexdef,
    CASE 
        WHEN indexdef LIKE '%UNIQUE%' THEN '⚠️ UNIQUE INDEX - might prevent multiple admins!'
        ELSE 'Regular index'
    END AS index_type
FROM pg_indexes
WHERE tablename = 'user_roles'
AND schemaname = 'public';

-- 3. Check profiles table for unique constraints on email
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
ORDER BY contype, conname;

-- 4. Check for unique indexes on profiles email
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
AND schemaname = 'public'
AND indexdef LIKE '%email%';

-- 5. Test: Try to see current admins (should show multiple if they exist)
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

-- 6. Check if there's a unique constraint on (school_id, role) combination
-- This would prevent multiple admins for the same school
SELECT 
    conname,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass
AND contype = 'u'
AND pg_get_constraintdef(oid) LIKE '%school_id%'
AND pg_get_constraintdef(oid) LIKE '%role%';

