-- ============================================
-- Create Schedule Blocks for Student Testing
-- Student ID: 8eb19d74-77bd-43cc-b460-45a0a04b6275
-- Period 1: 6:48-6:50 AM UTC
-- Period 2: 6:52-6:54 AM UTC
-- ============================================

-- Step 1: Get student's school_id
SELECT 
  'STUDENT INFO' as step,
  id,
  name,
  email,
  school_id
FROM public.students
WHERE id = '8eb19d74-77bd-43cc-b460-45a0a04b6275';

-- Step 2: Delete existing schedule blocks for today (if any)
-- Replace 'YOUR_SCHOOL_ID' with the school_id from Step 1
-- First, let's find the school_id
DO $$
DECLARE
  v_school_id UUID;
BEGIN
  SELECT school_id INTO v_school_id
  FROM public.students
  WHERE id = '8eb19d74-77bd-43cc-b460-45a0a04b6275';
  
  IF v_school_id IS NOT NULL THEN
    -- Delete existing schedule blocks for today
    DELETE FROM public.schedule_blocks
    WHERE school_id = v_school_id
    AND schedule_date = CURRENT_DATE;
    
    RAISE NOTICE 'Deleted existing schedule blocks for school_id: %', v_school_id;
  ELSE
    RAISE NOTICE 'Student not found or school_id is NULL';
  END IF;
END $$;

-- Step 3: Get school_id and create schedule blocks
-- This will use the school_id from the student
DO $$
DECLARE
  v_school_id UUID;
BEGIN
  -- Get student's school_id
  SELECT school_id INTO v_school_id
  FROM public.students
  WHERE id = '8eb19d74-77bd-43cc-b460-45a0a04b6275';
  
  IF v_school_id IS NOT NULL THEN
    -- Insert Period 1 schedule block (6:48-6:50 AM UTC)
    INSERT INTO public.schedule_blocks (
      id,
      school_id,
      period,
      start_time,
      end_time,
      schedule_date,
      block_type,
      description,
      color
    ) VALUES (
      gen_random_uuid(),
      v_school_id,
      'Period 1',
      '06:48',
      '06:50',
      CURRENT_DATE,
      'regular',
      'Math Class',
      'blue'
    );
    
    -- Insert Period 2 schedule block (6:52-6:54 AM UTC)
    INSERT INTO public.schedule_blocks (
      id,
      school_id,
      period,
      start_time,
      end_time,
      schedule_date,
      block_type,
      description,
      color
    ) VALUES (
      gen_random_uuid(),
      v_school_id,
      'Period 2',
      '06:52',
      '06:54',
      CURRENT_DATE,
      'regular',
      'Science Class',
      'green'
    );
    
    RAISE NOTICE 'Created schedule blocks for school_id: %', v_school_id;
  ELSE
    RAISE NOTICE 'ERROR: Student not found or school_id is NULL';
  END IF;
END $$;

-- Step 4: Update classes to link to these schedule blocks (optional)
-- This ensures the classes are associated with the correct periods
UPDATE public.classes
SET active_template_id = (
  SELECT id FROM public.app_templates 
  WHERE period = 'Period 1' 
  AND school_id = (SELECT school_id FROM public.students WHERE id = '8eb19d74-77bd-43cc-b460-45a0a04b6275')
  LIMIT 1
)
WHERE id = '9608a350-bca6-4303-b84a-064100c90bd0'
AND period = 'Period 1';

UPDATE public.classes
SET active_template_id = (
  SELECT id FROM public.app_templates 
  WHERE period = 'Period 2' 
  AND school_id = (SELECT school_id FROM public.students WHERE id = '8eb19d74-77bd-43cc-b460-45a0a04b6275')
  LIMIT 1
)
WHERE id = '48d5c0e5-f27d-42a6-9b17-ac4167732c46'
AND period = 'Period 2';

-- Step 5: Verify the schedule blocks were created
SELECT 
  'VERIFICATION' as step,
  sb.id,
  sb.school_id,
  sb.period,
  sb.start_time,
  sb.end_time,
  sb.schedule_date,
  s.name as student_name,
  s.id as student_id
FROM public.schedule_blocks sb
INNER JOIN public.students s ON s.school_id = sb.school_id
WHERE s.id = '8eb19d74-77bd-43cc-b460-45a0a04b6275'
AND sb.schedule_date = CURRENT_DATE
ORDER BY sb.start_time;

-- Step 6: Show current UTC time for reference
SELECT 
  'CURRENT TIME' as info,
  NOW() AT TIME ZONE 'UTC' AS current_utc_time,
  CURRENT_DATE as today_date;

