-- ============================================
-- Update Rio Mesa High School Allowed Apps to 3 Apps Only
-- ============================================
-- Run this in Supabase SQL Editor
-- This updates Rio Mesa (code 1111) to have only 3 apps: Canvas, Chat (ChatGPT), and Gmail

-- Update allowed_apps to only contain the 3 verification apps
UPDATE public.schools
SET allowed_apps = '["canvas", "chatgpt", "gmail"]'::jsonb,
    updated_at = NOW()
WHERE code = '1111'
  AND (name = 'Rio Mesa High School' OR name = 'Ria Mesa High School');

-- Verify the update
SELECT 
  id,
  name,
  code,
  allowed_apps,
  updated_at
FROM public.schools
WHERE code = '1111';

