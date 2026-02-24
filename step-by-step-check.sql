-- ============================================
-- STEP 1: See ALL templates in your database
-- ============================================
SELECT 
  id,
  name,
  apps,
  period,
  class_id,
  school_id,
  created_at,
  updated_at
FROM app_templates
ORDER BY updated_at DESC;

-- ============================================
-- STEP 2: See what your school_id is
-- ============================================
SELECT id, name FROM schools;

-- ============================================
-- STEP 3: See baseline templates (what the code looks for)
-- Replace 'YOUR_SCHOOL_ID_HERE' with the id from STEP 2
-- ============================================
-- Example: WHERE school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
SELECT 
  id,
  name,
  apps,
  period,
  class_id,
  school_id,
  created_at,
  updated_at
FROM app_templates
WHERE school_id = 'YOUR_SCHOOL_ID_HERE'
  AND period = 'baseline'
  AND class_id IS NULL
ORDER BY updated_at DESC;


