-- ============================================
-- Check Admin Template Storage
-- ============================================
-- Run this to see how your admin template is stored in the database
-- Replace 'YOUR_SCHOOL_ID' with your actual school ID

-- Step 1: Check if baseline template exists
SELECT 
  'BASELINE TEMPLATE CHECK' as check_type,
  id,
  name,
  period,
  class_id,
  school_id,
  apps,
  array_length(apps::text[], 1) as app_count,
  CASE 
    WHEN period != 'baseline' THEN '❌ Period is "' || period || '" (should be "baseline")'
    WHEN class_id IS NOT NULL THEN '❌ class_id is set (should be null)'
    WHEN apps IS NULL THEN '❌ apps is NULL'
    WHEN array_length(apps::text[], 1) IS NULL THEN '❌ apps array is empty'
    WHEN array_length(apps::text[], 1) = 0 THEN '❌ apps array has 0 items'
    ELSE '✅ Template looks correct'
  END as status,
  created_at,
  updated_at
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- Replace with your school ID
AND period = 'baseline'
AND class_id IS NULL;

-- Step 2: Check for duplicate baseline templates
SELECT 
  'DUPLICATE CHECK' as check_type,
  COUNT(*) as template_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No baseline template found'
    WHEN COUNT(*) = 1 THEN '✅ Only one baseline template (correct)'
    ELSE '⚠️ Multiple baseline templates found (' || COUNT(*) || ') - should only have one'
  END as status
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- Replace with your school ID
AND period = 'baseline'
AND class_id IS NULL;

-- Step 3: Check all templates (to see if there are any with wrong period/class_id)
SELECT 
  'ALL TEMPLATES CHECK' as check_type,
  id,
  name,
  period,
  class_id,
  CASE 
    WHEN period = 'baseline' AND class_id IS NULL THEN '✅ Admin template (correct)'
    WHEN period = 'baseline' AND class_id IS NOT NULL THEN '⚠️ Baseline period but has class_id'
    WHEN period != 'baseline' AND class_id IS NULL THEN '⚠️ Wrong period but no class_id'
    ELSE '✅ Class template (correct)'
  END as template_type,
  array_length(apps::text[], 1) as app_count
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- Replace with your school ID
ORDER BY period, class_id;

-- Step 4: Check apps array format
SELECT 
  'APPS ARRAY CHECK' as check_type,
  id,
  name,
  apps,
  jsonb_typeof(apps::jsonb) as apps_type,
  jsonb_array_length(apps::jsonb) as app_count,
  apps::jsonb->0 as first_app,
  CASE 
    WHEN apps IS NULL THEN '❌ apps is NULL'
    WHEN jsonb_typeof(apps::jsonb) != 'array' THEN '❌ apps is not an array (type: ' || jsonb_typeof(apps::jsonb) || ')'
    WHEN jsonb_array_length(apps::jsonb) IS NULL THEN '❌ apps array is empty'
    WHEN jsonb_array_length(apps::jsonb) = 0 THEN '❌ apps array has 0 items'
    ELSE '✅ apps array looks correct'
  END as status
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- Replace with your school ID
AND period = 'baseline'
AND class_id IS NULL;

-- Step 5: Simulate edge function query (exactly how it reads the template)
SELECT 
  'EDGE FUNCTION SIMULATION' as check_type,
  apps,
  name,
  CASE 
    WHEN apps IS NULL THEN '❌ Edge function will fail - apps is NULL'
    WHEN jsonb_array_length(apps::jsonb) IS NULL THEN '❌ Edge function will fail - apps array is empty'
    WHEN jsonb_array_length(apps::jsonb) = 0 THEN '⚠️ Edge function will return empty restrictions (0 apps)'
    ELSE '✅ Edge function will return ' || jsonb_array_length(apps::jsonb) || ' apps'
  END as status
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- Replace with your school ID
AND period = 'baseline'
AND class_id IS NULL
LIMIT 1;

