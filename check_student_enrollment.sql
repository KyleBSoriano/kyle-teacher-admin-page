-- ============================================
-- Check Why Student Doesn't Show Up in Class
-- ============================================
-- Run this to diagnose why student isn't appearing on teacher website

-- Step 1: Verify enrollment exists
SELECT 
  'ENROLLMENT CHECK' as check_type,
  e.class_id,
  e.student_id,
  s.name as student_name,
  s.school_id as student_school_id,
  c.subject as class_subject,
  c.period as class_period,
  c.school_id as class_school_id,
  CASE 
    WHEN e.class_id IS NOT NULL THEN '✅ Enrollment exists'
    ELSE '❌ No enrollment found'
  END as status,
  CASE 
    WHEN s.school_id = c.school_id THEN '✅ Same school'
    ELSE '❌ DIFFERENT SCHOOLS - This is the problem!'
  END as school_match
FROM enrollments e
LEFT JOIN students s ON s.id = e.student_id
LEFT JOIN classes c ON c.id = e.class_id
WHERE e.student_id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
  AND e.class_id = '9608a350-bca6-4303-b84a-064100c90bd0';

-- Step 2: Check if student is in the students table for the school
SELECT 
  'STUDENT IN SCHOOL CHECK' as check_type,
  s.id,
  s.name,
  s.email,
  s.school_id,
  c.school_id as class_school_id,
  CASE 
    WHEN s.school_id = c.school_id THEN '✅ Student is in same school as class'
    ELSE '❌ Student is in DIFFERENT school - This is the problem!'
  END as status
FROM students s
CROSS JOIN classes c
WHERE s.id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
  AND c.id = '9608a350-bca6-4303-b84a-064100c90bd0';

-- Step 3: Check what enrollments the website would load
-- (The website loads ALL enrollments, then filters by class_id)
SELECT 
  'ENROLLMENTS FOR CLASS' as check_type,
  COUNT(*) as total_enrollments,
  COUNT(CASE WHEN e.student_id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3' THEN 1 END) as target_student_enrollments
FROM enrollments e
WHERE e.class_id = '9608a350-bca6-4303-b84a-064100c90bd0';

-- Step 4: Check if student would be in the students list
SELECT 
  'STUDENT IN STUDENTS LIST' as check_type,
  s.id,
  s.name,
  s.school_id,
  CASE 
    WHEN s.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0' THEN '✅ Student is in your school'
    ELSE '❌ Student is NOT in your school - This is the problem!'
  END as status
FROM students s
WHERE s.id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3';

-- Step 5: Complete diagnostic
SELECT 
  'COMPLETE DIAGNOSTIC' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM enrollments 
      WHERE student_id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
      AND class_id = '9608a350-bca6-4303-b84a-064100c90bd0'
    ) THEN '✅ Enrollment exists'
    ELSE '❌ Enrollment missing'
  END as enrollment_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM students 
      WHERE id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
      AND school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
    ) THEN '✅ Student in your school'
    ELSE '❌ Student NOT in your school'
  END as student_in_school,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM classes 
      WHERE id = '9608a350-bca6-4303-b84a-064100c90bd0'
      AND school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
    ) THEN '✅ Class in your school'
    ELSE '❌ Class NOT in your school'
  END as class_in_school;

