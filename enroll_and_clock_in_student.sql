-- ============================================
-- Enroll Student and Clock In
-- ============================================
-- This script enrolls a student in a class and marks them as clocked in
-- so that restrictions will apply immediately

-- Step 0: Ensure clocked_out_at column exists (if migration wasn't run)
ALTER TABLE "public"."attendance_records" 
ADD COLUMN IF NOT EXISTS "clocked_out_at" TIMESTAMP WITH TIME ZONE;

-- Step 1: Enroll student in class
INSERT INTO "public"."enrollments" ("class_id", "student_id")
VALUES (
  '9608a350-bca6-4303-b84a-064100c90bd0',  -- Class ID (math class)
  '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'   -- Student ID (random perp)
)
ON CONFLICT DO NOTHING;  -- Prevents error if already enrolled

-- Step 2: Mark student as clocked in (create attendance record)
-- Note: clocked_out_at is optional (will be NULL by default if column exists)
INSERT INTO "public"."attendance_records" (
  "student_id",
  "class_id",
  "status",
  "timestamp",
  "period"
)
VALUES (
  '16440aa1-4e1c-4ef6-983a-4308c1df8eb3',  -- Student ID
  '9608a350-bca6-4303-b84a-064100c90bd0',  -- Class ID
  'in',                                     -- Status: 'in' is the valid enum value for clocked in
  NOW(),                                    -- Current timestamp
  1                                         -- Period 1 (matches class period "Period 1")
);

-- Step 3: Verify everything is set up correctly
SELECT 
  s.name as student_name,
  s.email as student_email,
  c.subject as class_subject,
  c.period as class_period,
  c.code as class_code,
  t.name as active_template,
  t.apps as template_apps,
  ar.status as clock_status,
  ar.timestamp as clocked_in_at,
  ar.clocked_out_at,
  CASE WHEN e.class_id IS NOT NULL THEN 'Enrolled' ELSE 'Not Enrolled' END as enrollment_status
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN classes c ON c.id = e.class_id
LEFT JOIN app_templates t ON t.id = c.active_template_id
LEFT JOIN attendance_records ar ON ar.student_id = s.id 
  AND ar.class_id = c.id 
  AND ar.status = 'in'  -- Only 'in' is valid for the enum (not 'present')
  AND ar.clocked_out_at IS NULL  -- Student is still clocked in
  AND DATE(ar.timestamp) = CURRENT_DATE
WHERE e.student_id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
  AND e.class_id = '9608a350-bca6-4303-b84a-064100c90bd0';

-- Expected Result:
-- You should see:
-- - student_name: "random perp"
-- - class_subject: "math"
-- - class_period: "Period 1"
-- - active_template: Template name (if one is active)
-- - template_apps: Array of app keys
-- - clock_status: "in"
-- - clocked_in_at: Current timestamp
-- - clocked_out_at: NULL

