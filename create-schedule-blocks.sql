-- Create Schedule Blocks for Period 1 and Period 2
-- Run this in your Supabase SQL Editor
-- 
-- Creates schedule blocks for today (PST):
-- - Period 1: 1:35 AM to 1:37 AM PST
-- - Period 2: 1:39 AM to 1:41 AM PST

-- First, delete any existing Period 1 and Period 2 blocks for today
DELETE FROM schedule_blocks
WHERE schedule_date = CURRENT_DATE
  AND period IN ('Period 1', 'Period 2')
  AND school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

-- Create Period 1 block: 1:35 AM to 1:37 AM PST
INSERT INTO schedule_blocks (
  period,
  start_time,
  end_time,
  schedule_date,
  block_type,
  color,
  school_id
)
VALUES (
  'Period 1',
  '1:35 AM',
  '1:37 AM',
  CURRENT_DATE,
  'regular',
  'blue',
  'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
);

-- Create Period 2 block: 1:39 AM to 1:41 AM PST
INSERT INTO schedule_blocks (
  period,
  start_time,
  end_time,
  schedule_date,
  block_type,
  color,
  school_id
)
VALUES (
  'Period 2',
  '1:39 AM',
  '1:41 AM',
  CURRENT_DATE,
  'regular',
  'blue',
  'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
);

-- Verify the blocks were created
SELECT 
  id,
  period,
  start_time,
  end_time,
  schedule_date,
  school_id,
  created_at
FROM schedule_blocks
WHERE schedule_date = CURRENT_DATE
  AND period IN ('Period 1', 'Period 2')
  AND school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
ORDER BY period;

