-- Update student name from "random perp" to "Kyle Soriano"
-- Student ID: 16440aa1-4e1c-4ef6-983a-4308c1df8eb3
-- School ID: dd484b5a-10f4-42bb-b0f7-6175a650bca0

-- Update the student name (simple version - updates by ID only)
UPDATE public.students
SET 
  name = 'Kyle Soriano'
WHERE 
  id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
  AND school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

-- Verify the update
SELECT 
  id,
  name,
  email,
  school_id,
  device_id
FROM public.students
WHERE 
  id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
  AND school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

-- Note: attendance_records table uses student_id (UUID) to reference students,
-- so updating the student's name in the students table will automatically
-- reflect in attendance records when they are displayed (via JOIN with students table)

-- Verify attendance records for this student
SELECT 
  id,
  student_id,
  status,
  timestamp,
  clocked_out_at
FROM public.attendance_records
WHERE 
  student_id = '16440aa1-4e1c-4ef6-983a-4308c1df8eb3'
ORDER BY timestamp DESC
LIMIT 5;

