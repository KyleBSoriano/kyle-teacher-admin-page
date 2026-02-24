-- Check teacher accounts, classes, and templates
-- Run this in Supabase SQL Editor

-- 1. Check all teachers in your school
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.school_id,
    ur.created_at,
    p.email,
    p.first_name,
    p.last_name
FROM user_roles ur
LEFT JOIN profiles p ON p.id = ur.user_id
WHERE ur.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
AND ur.role = 'teacher'
ORDER BY ur.created_at;

-- 2. Check all classes in your school (including teacher classes)
SELECT 
    c.id,
    c.subject,
    c.period,
    c.code,
    c.teacher_id,
    c.school_id,
    c.active_template_id,
    c.created_at,
    p.email as teacher_email,
    p.first_name as teacher_first_name,
    p.last_name as teacher_last_name
FROM classes c
LEFT JOIN profiles p ON p.id = c.teacher_id
WHERE c.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
ORDER BY c.period, c.subject;

-- 3. Check all app templates (including teacher templates)
SELECT 
    t.id,
    t.name,
    t.description,
    t.period,
    t.class_id,
    t.school_id,
    t.apps,
    t.created_at,
    c.subject as class_subject,
    c.period as class_period,
    p.email as teacher_email
FROM app_templates t
LEFT JOIN classes c ON c.id = t.class_id
LEFT JOIN profiles p ON p.id = c.teacher_id
WHERE t.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
ORDER BY t.created_at;

-- 4. Check RLS policies on classes table
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
WHERE tablename = 'classes'
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 5. Check if there are any classes without teacher_id (should be visible to all)
SELECT 
    COUNT(*) as classes_without_teacher,
    COUNT(*) FILTER (WHERE teacher_id IS NULL) as null_teacher_id,
    COUNT(*) FILTER (WHERE teacher_id IS NOT NULL) as with_teacher_id
FROM classes
WHERE school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

