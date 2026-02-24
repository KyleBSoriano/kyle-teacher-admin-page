-- Debug Template Display Issues
-- Run this in Supabase SQL Editor to see what templates exist and why they might not be displaying

-- 1. Check all templates in your database
SELECT 
  id,
  name,
  period,
  class_id,
  school_id,
  apps,
  created_at,
  updated_at,
  is_custom
FROM public.app_templates
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check what period values exist
SELECT DISTINCT period, COUNT(*) as count
FROM public.app_templates
GROUP BY period
ORDER BY period;

-- 3. Check templates for a specific school (replace with your school_id)
-- Replace 'dd484b5a-10f4-42bb-b0f7-6175a650bca0' with your actual school_id
SELECT 
  id,
  name,
  period,
  class_id,
  school_id,
  CASE 
    WHEN class_id IS NULL THEN 'NULL class_id'
    ELSE 'Has class_id'
  END as class_id_status
FROM public.app_templates
WHERE school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
ORDER BY created_at DESC;

-- 4. Check if class_id matches any classes
SELECT 
  t.id as template_id,
  t.name as template_name,
  t.period,
  t.class_id,
  c.id as class_exists,
  c.period as class_period,
  c.subject as class_subject
FROM public.app_templates t
LEFT JOIN public.classes c ON t.class_id = c.id::text OR t.class_id = c.id
WHERE t.school_id = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0'
ORDER BY t.created_at DESC;

-- 5. Check the data types
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'app_templates'
  AND column_name IN ('class_id', 'period', 'school_id')
ORDER BY column_name;

