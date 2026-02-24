-- ============================================
-- Debug: Why Are Restrictions Not Applying?
-- ============================================
-- Run this to check all conditions for restrictions

-- Step 1: Check if student is enrolled
SELECT 
  'ENROLLMENT CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM enrollments 
      WHERE student_id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
      AND class_id = '9608a350-bca6-4303-b84a-064100c90bd0'
    ) THEN '✅ Student is enrolled'
    ELSE '❌ Student is NOT enrolled'
  END as status;

-- Step 2: Check if student is clocked in
SELECT 
  'CLOCK-IN CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM attendance_records 
      WHERE student_id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
      AND class_id = '9608a350-bca6-4303-b84a-064100c90bd0'
      AND status = 'in'
      AND (clocked_out_at IS NULL OR clocked_out_at IS NULL)
      AND DATE(timestamp) = CURRENT_DATE
    ) THEN '✅ Student is clocked in'
    ELSE '❌ Student is NOT clocked in'
  END as status;

-- Step 3: Check if class has active_template_id
SELECT 
  'ACTIVE TEMPLATE CHECK' as check_type,
  c.subject as class_subject,
  c.period as class_period,
  c.active_template_id,
  CASE 
    WHEN c.active_template_id IS NOT NULL THEN '✅ Class has active template'
    ELSE '❌ Class has NO active template'
  END as status
FROM classes c
WHERE c.id = '9608a350-bca6-4303-b84a-064100c90bd0';

-- Step 4: Check if template exists and has apps
SELECT 
  'TEMPLATE APPS CHECK' as check_type,
  t.id as template_id,
  t.name as template_name,
  t.apps as template_apps,
  CASE 
    WHEN t.apps IS NULL OR array_length(t.apps::text[], 1) IS NULL THEN '❌ Template has NO apps'
    WHEN array_length(t.apps::text[], 1) = 0 THEN '❌ Template has EMPTY apps array'
    ELSE '✅ Template has ' || array_length(t.apps::text[], 1) || ' apps'
  END as status
FROM classes c
LEFT JOIN app_templates t ON t.id = c.active_template_id
WHERE c.id = '9608a350-bca6-4303-b84a-064100c90bd0';

-- Step 5: Check class timing (for demo class, should have no start_time/end_time)
SELECT 
  'CLASS TIMING CHECK' as check_type,
  c.period as class_period,
  c.start_time,
  c.end_time,
  CASE 
    WHEN c.start_time IS NULL AND c.end_time IS NULL THEN '✅ Demo class (no time restrictions)'
    WHEN c.period ILIKE '%demo%' OR c.period IS NULL THEN '✅ Demo class (period indicates demo)'
    ELSE '⚠️ Class has time restrictions - may not be "in class time"'
  END as status
FROM classes c
WHERE c.id = '9608a350-bca6-4303-b84a-064100c90bd0';

-- Step 6: Complete status check (all conditions)
SELECT 
  s.name as student_name,
  c.subject as class_subject,
  c.code as class_code,
  CASE WHEN e.class_id IS NOT NULL THEN '✅' ELSE '❌' END as enrolled,
  CASE WHEN ar.status = 'in' THEN '✅' ELSE '❌' END as clocked_in,
  CASE WHEN c.active_template_id IS NOT NULL THEN '✅' ELSE '❌' END as has_active_template,
  CASE WHEN t.apps IS NOT NULL AND array_length(t.apps::text[], 1) > 0 THEN '✅' ELSE '❌' END as template_has_apps,
  t.name as template_name,
  t.apps as template_apps,
  CASE 
    WHEN c.start_time IS NULL AND c.end_time IS NULL THEN '✅ Demo (always active)'
    ELSE '⚠️ Has time restrictions'
  END as timing_status
FROM students s
CROSS JOIN classes c
LEFT JOIN enrollments e ON e.student_id = s.id AND e.class_id = c.id
LEFT JOIN attendance_records ar ON ar.student_id = s.id 
  AND ar.class_id = c.id 
  AND ar.status = 'in'
  AND (ar.clocked_out_at IS NULL OR ar.clocked_out_at IS NULL)
  AND DATE(ar.timestamp) = CURRENT_DATE
LEFT JOIN app_templates t ON t.id = c.active_template_id
WHERE s.id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
  AND c.id = '9608a350-bca6-4303-b84a-064100c90bd0';

