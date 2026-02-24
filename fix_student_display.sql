-- ============================================
-- Fix: Student Not Showing Up on Website
-- ============================================
-- This script checks and fixes common issues

-- Step 1: Verify student is in correct school
SELECT 
  'STEP 1: Student School Check' as step,
  s.id,
  s.name,
  s.school_id as student_school_id,
  'dd484b5a-10f4-42bb-b0f7-6175a650bca0' as expected_school_id,
  CASE 
    WHEN s.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0' THEN '✅ Correct school'
    ELSE '❌ WRONG SCHOOL - Fix below'
  END as status
FROM students s
WHERE s.id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3';

-- Step 2: Fix student school_id if wrong (UNCOMMENT TO RUN)
-- UPDATE students 
-- SET school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
-- WHERE id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
--   AND school_id != 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

-- Step 3: Verify enrollment exists
SELECT 
  'STEP 2: Enrollment Check' as step,
  e.class_id,
  e.student_id,
  CASE 
    WHEN e.class_id IS NOT NULL THEN '✅ Enrollment exists'
    ELSE '❌ No enrollment'
  END as status
FROM enrollments e
WHERE e.student_id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
  AND e.class_id = '9608a350-bca6-4303-b84a-064100c90bd0';

-- Step 4: Check what the website would see
-- The website loads students filtered by school_id, then checks enrollments
SELECT 
  'STEP 3: What Website Sees' as step,
  s.id as student_id,
  s.name as student_name,
  s.school_id,
  CASE 
    WHEN s.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0' THEN '✅ Will be loaded'
    ELSE '❌ Will be FILTERED OUT (wrong school)'
  END as will_be_loaded,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM enrollments e 
      WHERE e.student_id = s.id 
      AND e.class_id = '9608a350-bca6-4303-b84a-064100c90bd0'
    ) THEN '✅ Has enrollment'
    ELSE '❌ No enrollment'
  END as has_enrollment,
  CASE 
    WHEN s.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
      AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.student_id = s.id 
        AND e.class_id = '9608a350-bca6-4303-b84a-064100c90bd0'
      )
    THEN '✅ WILL SHOW UP'
    ELSE '❌ Will NOT show up'
  END as will_show_on_website
FROM students s
WHERE s.id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3';

-- Step 5: Count total students that should show up for this class
SELECT 
  'STEP 4: Total Students for Class' as step,
  COUNT(DISTINCT s.id) as total_students_in_class,
  COUNT(CASE WHEN s.id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3' THEN 1 END) as target_student_count
FROM students s
INNER JOIN enrollments e ON e.student_id = s.id
WHERE e.class_id = '9608a350-bca6-4303-b84a-064100c90bd0'
  AND s.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

