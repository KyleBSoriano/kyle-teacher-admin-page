-- ============================================
-- Clean Up Duplicate Baseline Templates (FIXED)
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

-- Step 2: See which one will be KEPT (most recent)
SELECT 
  'WILL BE KEPT' as action,
  id,
  name,
  apps,
  updated_at,
  created_at
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- ⚠️ REPLACE WITH YOUR SCHOOL ID
AND period = 'baseline'
AND class_id IS NULL
ORDER BY updated_at DESC, created_at DESC
LIMIT 1;

-- Step 3: See which ones will be DELETED (all except most recent)
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

-- Step 4: DELETE duplicates (keeps the most recently updated one)
-- ⚠️ UNCOMMENT THE DELETE BELOW AFTER VERIFYING STEP 3
-- This will delete all baseline templates EXCEPT the most recent one
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

-- Step 5: Verify cleanup (should return only 1 template)
SELECT 
  'AFTER CLEANUP' as step,
  id,
  name,
  apps,
  updated_at,
  created_at
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- ⚠️ REPLACE WITH YOUR SCHOOL ID
AND period = 'baseline'
AND class_id IS NULL
ORDER BY updated_at DESC;

-- Step 6: Final count check (should be 1)
SELECT 
  'FINAL COUNT' as step,
  COUNT(*) as template_count,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Only one baseline template (correct)'
    WHEN COUNT(*) = 0 THEN '❌ No baseline template found'
    ELSE '⚠️ Multiple baseline templates still exist (' || COUNT(*) || ')'
  END as status
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- ⚠️ REPLACE WITH YOUR SCHOOL ID
AND period = 'baseline'
AND class_id IS NULL;

