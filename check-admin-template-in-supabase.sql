-- ============================================
-- STEP 1: Check if app_templates table exists
-- ============================================
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'app_templates';

-- ============================================
-- STEP 2: Check all columns in app_templates table
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'app_templates'
ORDER BY ordinal_position;

-- ============================================
-- STEP 3: Check ALL templates in the database
-- ============================================
SELECT 
  id,
  name,
  apps,
  period,
  class_id,
  school_id,
  created_at,
  updated_at,
  description
FROM app_templates
ORDER BY updated_at DESC;

-- ============================================
-- STEP 4: Check baseline templates specifically
-- (This is what the code is looking for)
-- ============================================
SELECT 
  id,
  name,
  apps,
  period,
  class_id,
  school_id,
  created_at,
  updated_at,
  description
FROM app_templates
WHERE period = 'baseline'
  AND class_id IS NULL
ORDER BY updated_at DESC;

-- ============================================
-- STEP 5: Check templates for YOUR school
-- Replace 'YOUR_SCHOOL_ID' with your actual school_id
-- ============================================
-- First, find your school_id:
SELECT id, name FROM schools;

-- Then check templates for your school:
-- SELECT 
--   id,
--   name,
--   apps,
--   period,
--   class_id,
--   school_id,
--   created_at,
--   updated_at
-- FROM app_templates
-- WHERE school_id = 'YOUR_SCHOOL_ID'
-- ORDER BY updated_at DESC;

-- ============================================
-- STEP 6: Check the EXACT query the code uses
-- (baseline + class_id IS NULL + your school_id)
-- ============================================
-- Replace 'YOUR_SCHOOL_ID' with your actual school_id from STEP 5
-- SELECT 
--   id,
--   name,
--   apps,
--   period,
--   class_id,
--   school_id,
--   created_at,
--   updated_at
-- FROM app_templates
-- WHERE school_id = 'YOUR_SCHOOL_ID'
--   AND period = 'baseline'
--   AND class_id IS NULL
-- ORDER BY updated_at DESC
-- LIMIT 1;


