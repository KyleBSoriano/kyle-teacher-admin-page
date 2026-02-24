-- Check ALL data directly (bypasses RLS)
-- Run this in Supabase SQL Editor to see what's actually in the database

-- 1. Check ALL teachers (no RLS filtering)
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

-- 2. Check ALL classes (no RLS filtering)
SELECT 
    c.id,
    c.subject,
    c.period,
    c.code,
    c.teacher_id,
    c.school_id,
    c.active_template_id,
    c.created_at,
    c.updated_at,
    p.email as teacher_email,
    p.first_name as teacher_first_name,
    p.last_name as teacher_last_name
FROM classes c
LEFT JOIN profiles p ON p.id = c.teacher_id
WHERE c.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
ORDER BY c.period, c.subject;

-- 3. Check ALL app templates (no RLS filtering)
SELECT 
    t.id,
    t.name,
    t.description,
    t.period,
    t.class_id,
    t.school_id,
    t.apps,
    t.created_at,
    t.updated_at,
    c.subject as class_subject,
    c.period as class_period
FROM app_templates t
LEFT JOIN classes c ON c.id = t.class_id
WHERE t.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
ORDER BY t.created_at;

-- 4. Check if there are classes in other schools (to see if data exists)
SELECT 
    COUNT(*) as total_classes,
    COUNT(DISTINCT school_id) as schools_with_classes
FROM classes;

-- 5. Check if there are templates in other schools
SELECT 
    COUNT(*) as total_templates,
    COUNT(DISTINCT school_id) as schools_with_templates
FROM app_templates;

