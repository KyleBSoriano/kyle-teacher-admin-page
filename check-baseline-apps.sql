-- ============================================
-- Check what apps are in your baseline template
-- Replace 'YOUR_SCHOOL_ID' with your actual school_id
-- ============================================

-- First, find your school_id:
SELECT id, name FROM schools;

-- Then check your baseline template:
SELECT 
  id,
  name,
  apps,                    -- This is the JSONB field with the apps array
  period,
  class_id,
  school_id,
  updated_at,
  created_at,
  -- Show apps in a readable format
  CASE 
    WHEN apps IS NULL THEN 'NULL'
    WHEN apps::text = '[]' THEN 'EMPTY ARRAY []'
    WHEN jsonb_array_length(apps) = 0 THEN 'EMPTY ARRAY (length 0)'
    ELSE apps::text
  END as apps_display
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID'  -- Replace with your school_id
  AND period = 'baseline'
  AND class_id IS NULL
ORDER BY updated_at DESC
LIMIT 1;

-- ============================================
-- Alternative: Check ALL baseline templates
-- ============================================
SELECT 
  id,
  name,
  apps,
  jsonb_array_length(COALESCE(apps, '[]'::jsonb)) as apps_count,
  period,
  class_id,
  school_id,
  updated_at
FROM app_templates
WHERE period = 'baseline'
  AND class_id IS NULL
ORDER BY updated_at DESC;


