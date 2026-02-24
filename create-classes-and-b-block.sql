-- ============================================
-- Create Classes and B Block Schedule
-- ============================================
-- This script:
-- 1. Creates/updates the two classes from the JSON data
-- 2. Creates B block schedule blocks for today
--    - Period 1: 11:08 AM to 11:09 AM
--    - Period 2: 11:11 AM to 11:13 AM

-- ============================================
-- STEP 1: Create/Update Classes
-- ============================================

-- Class 1: Math - Period 1
INSERT INTO classes (
  id,
  school_id,
  code,
  period,
  subject,
  start_time,
  end_time,
  active_template_id,
  teacher_id
)
VALUES (
  '030d9cdb-00f5-4dfd-8054-252fa7a6871b',
  'dd484b5a-10f4-42bb-b0f7-6175a650bca0',
  '473616',
  'Period 1',
  'math',
  NULL,  -- start_time from JSON is null
  NULL,  -- end_time from JSON is null
  '8cebfdb3-0722-46da-8cbf-5002feb81598',  -- active_template_id
  '41d7bb79-103c-4a51-8a86-b270deb2fc80'   -- teacher_id
)
ON CONFLICT (id) DO UPDATE
SET
  code = EXCLUDED.code,
  period = EXCLUDED.period,
  subject = EXCLUDED.subject,
  active_template_id = EXCLUDED.active_template_id,
  teacher_id = EXCLUDED.teacher_id;

-- Class 2: Science - Period 2
INSERT INTO classes (
  id,
  school_id,
  code,
  period,
  subject,
  start_time,
  end_time,
  active_template_id,
  teacher_id
)
VALUES (
  'e537a2a2-3e99-4a2e-b691-b8b851d471a5',
  'dd484b5a-10f4-42bb-b0f7-6175a650bca0',
  '141929',
  'Period 2',
  'science',
  NULL,  -- start_time from JSON is null
  NULL,  -- end_time from JSON is null
  'd40d0683-ae51-488c-a603-0ac40bef6ee6',  -- active_template_id
  '41d7bb79-103c-4a51-8a86-b270deb2fc80'   -- teacher_id
)
ON CONFLICT (id) DO UPDATE
SET
  code = EXCLUDED.code,
  period = EXCLUDED.period,
  subject = EXCLUDED.subject,
  active_template_id = EXCLUDED.active_template_id,
  teacher_id = EXCLUDED.teacher_id;

-- ============================================
-- STEP 2: Create B Block Schedule Blocks
-- ============================================
-- B Block times:
-- - Period 1: 11:08 AM to 11:09 AM
-- - Period 2: 11:11 AM to 11:13 AM

-- First, delete any existing Period 1 and Period 2 blocks for today
DELETE FROM schedule_blocks
WHERE schedule_date = CURRENT_DATE
  AND period IN ('Period 1', 'Period 2')
  AND school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

-- Create Period 1 block: 11:08 AM to 11:09 AM
INSERT INTO schedule_blocks (
  period,
  start_time,
  end_time,
  schedule_date,
  block_type,
  color,
  school_id,
  description
)
VALUES (
  'Period 1',
  '11:08 AM',
  '11:09 AM',
  CURRENT_DATE,
  'regular',
  'blue',
  'dd484b5a-10f4-42bb-b0f7-6175a650bca0',
  'B Block - Period 1'
);

-- Create Period 2 block: 11:11 AM to 11:13 AM
INSERT INTO schedule_blocks (
  period,
  start_time,
  end_time,
  schedule_date,
  block_type,
  color,
  school_id,
  description
)
VALUES (
  'Period 2',
  '11:11 AM',
  '11:13 AM',
  CURRENT_DATE,
  'regular',
  'blue',
  'dd484b5a-10f4-42bb-b0f7-6175a650bca0',
  'B Block - Period 2'
);

-- ============================================
-- STEP 3: Verify Everything Was Created
-- ============================================

-- Verify classes
SELECT 
  'CLASSES' as type,
  id,
  period,
  subject,
  code,
  active_template_id,
  teacher_id,
  school_id
FROM classes
WHERE id IN (
  '030d9cdb-00f5-4dfd-8054-252fa7a6871b',
  'e537a2a2-3e99-4a2e-b691-b8b851d471a5'
)
ORDER BY period;

-- Verify schedule blocks
SELECT 
  'SCHEDULE BLOCKS' as type,
  id,
  period,
  start_time,
  end_time,
  schedule_date,
  block_type,
  description,
  school_id
FROM schedule_blocks
WHERE schedule_date = CURRENT_DATE
  AND period IN ('Period 1', 'Period 2')
  AND school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
ORDER BY start_time;

