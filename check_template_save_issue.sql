-- Diagnostic Query to Check Template Save Issues
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check if required columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_templates'
  AND column_name IN ('description', 'school_id', 'created_at', 'updated_at', 'class_id', 'period', 'name', 'apps', 'is_custom')
ORDER BY column_name;

-- 2. Check recent templates (last 10)
SELECT 
  id,
  name,
  description,
  period,
  class_id,
  school_id,
  created_at,
  updated_at,
  is_custom,
  jsonb_array_length(apps) as app_count
FROM public.app_templates
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if there are any templates for your school
-- Replace 'dd484b5a-10f4-42bb-b0f7-6175a650bca0' with your actual school_id
SELECT 
  COUNT(*) as total_templates,
  COUNT(DISTINCT class_id) as unique_classes,
  COUNT(DISTINCT period) as unique_periods
FROM public.app_templates
WHERE school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

-- 4. Check RLS policies on app_templates
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'app_templates';

