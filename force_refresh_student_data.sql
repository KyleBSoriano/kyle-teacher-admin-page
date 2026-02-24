-- ============================================
-- Force Refresh: Verify Data is Correct
-- ============================================
-- Run this to verify everything is set up correctly
-- Then refresh your browser page (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)

-- Complete verification query
SELECT 
  'VERIFICATION' as check_type,
  s.id as student_id,
  s.name as student_name,
  s.school_id as student_school_id,
  c.id as class_id,
  c.subject as class_subject,
  c.period as class_period,
  c.school_id as class_school_id,
  CASE 
    WHEN s.school_id = c.school_id THEN '✅ Same school'
    ELSE '❌ Different schools'
  END as school_match,
  CASE 
    WHEN e.class_id IS NOT NULL THEN '✅ Enrolled'
    ELSE '❌ Not enrolled'
  END as enrollment_status,
  CASE 
    WHEN ar.status = 'in' THEN '✅ Clocked in'
    ELSE '❌ Not clocked in'
  END as clock_status,
  CASE 
    WHEN s.school_id = c.school_id 
      AND e.class_id IS NOT NULL
    THEN '✅ WILL SHOW ON WEBSITE (after refresh)'
    ELSE '❌ Will NOT show - fix issues above'
  END as will_show_on_website
FROM students s
CROSS JOIN classes c
LEFT JOIN enrollments e ON e.student_id = s.id AND e.class_id = c.id
LEFT JOIN attendance_records ar ON ar.student_id = s.id 
  AND ar.class_id = c.id 
  AND ar.status = 'in'
  AND DATE(ar.timestamp) = CURRENT_DATE
WHERE s.id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
  AND c.id = '9608a350-bca6-4303-b84a-064100c90bd0';

-- Count how many students should show up for this class
SELECT 
  'STUDENT COUNT FOR CLASS' as info,
  COUNT(DISTINCT s.id) as total_enrolled_students,
  STRING_AGG(s.name, ', ') as student_names
FROM students s
INNER JOIN enrollments e ON e.student_id = s.id
WHERE e.class_id = '9608a350-bca6-4303-b84a-064100c90bd0'
  AND s.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

