-- ============================================
-- Create Hueneme High School
-- ============================================
-- Run this in Supabase SQL Editor

-- Step 1: Create the school
INSERT INTO public.schools (
  name,
  code,
  allowed_apps,
  created_at,
  updated_at
) VALUES (
  'Hueneme High School',
  '1286',
  -- 3 allowed apps: gmail, canvas, and chatgpt (chat)
  '["gmail", "canvas", "chatgpt"]'::jsonb,
  NOW(),
  NOW()
)
RETURNING id, name, code, allowed_apps;

-- ============================================
-- Step 2: Verify the school was created
-- ============================================
SELECT 
  id,
  name,
  code,
  allowed_apps,
  created_at
FROM public.schools
WHERE code = '1286';

-- ============================================
-- Step 3: Check available apps in app_catalog
-- ============================================
-- Run this to see all available apps you can use:
SELECT 
  key,
  display_name,
  ios_bundle_id
FROM app_catalog
ORDER BY display_name;

-- ============================================
-- Step 4: Update allowed_apps if needed
-- ============================================
-- If you need to change the allowed apps later, run:
-- UPDATE public.schools
-- SET allowed_apps = '["gmail", "canvas", "chatgpt"]'::jsonb
-- WHERE code = '1286';

