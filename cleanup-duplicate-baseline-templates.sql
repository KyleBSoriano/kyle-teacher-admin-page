-- ============================================
-- Clean Up Duplicate Baseline Templates
-- ============================================
-- Replace 'YOUR_SCHOOL_ID' with your actual school ID
-- Run this in your Supabase SQL Editor

-- Step 1: See all baseline templates (before cleanup)
SELECT 
  'BEFORE CLEANUP' as step,
  id,
  name,
  period,
  class_id,
  school_id,
  apps,
  array_length(apps::text[], 1) as app_count,
  created_at,
  updated_at
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- ⚠️ REPLACE WITH YOUR SCHOOL ID
AND period = 'baseline'
AND class_id IS NULL
ORDER BY updated_at DESC, created_at DESC;

-- Step 2: See which ones will be deleted
SELECT 
  'WILL BE DELETED' as action,
  id,
  name,
  apps,
  updated_at,
  created_at
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- ⚠️ REPLACE WITH YOUR SCHOOL ID
AND period = 'baseline'
AND class_id IS NULL
AND id NOT IN (
  SELECT id
  FROM app_templates
  WHERE school_id = 'YOUR_SCHOOL_ID'  -- ⚠️ REPLACE WITH YOUR SCHOOL ID
  AND period = 'baseline'
  AND class_id IS NULL
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1
);

-- Step 3: Delete duplicates (keeps the most recently updated one)
-- ⚠️ UNCOMMENT THE DELETE BELOW AFTER VERIFYING STEP 2
/*
DELETE FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- ⚠️ REPLACE WITH YOUR SCHOOL ID
AND period = 'baseline'
AND class_id IS NULL
AND id NOT IN (
  SELECT id
  FROM app_templates
  WHERE school_id = 'YOUR_SCHOOL_ID'  -- ⚠️ REPLACE WITH YOUR SCHOOL ID
  AND period = 'baseline'
  AND class_id IS NULL
  ORDER BY updated_at DESC, created_at DESC
  LIMIT 1
);
*/

-- Step 4: Verify cleanup (should return only 1 template)
SELECT 
  'AFTER CLEANUP' as step,
  COUNT(*) as remaining_count,
  id,
  name,
  apps,
  updated_at
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- ⚠️ REPLACE WITH YOUR SCHOOL ID
AND period = 'baseline'
AND class_id IS NULL
GROUP BY id, name, apps, updated_at;

