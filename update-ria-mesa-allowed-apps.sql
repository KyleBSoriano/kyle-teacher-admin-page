-- ============================================
-- Update Ria Mesa High School Allowed Apps
-- ============================================
-- Run this in Supabase SQL Editor
-- This updates Ria Mesa High School to have the same 10 apps as the original school

-- Update allowed_apps to match the original school's 10 apps
UPDATE public.schools
SET allowed_apps = '["calendar", "canvas", "chatgpt", "docs", "drive", "find_my", "gmail", "google_news", "notion", "slack"]'::jsonb
WHERE code = '1111'
  AND name = 'Ria Mesa High School';

-- Verify the update
SELECT 
  id,
  name,
  code,
  allowed_apps,
  updated_at
FROM public.schools
WHERE code = '1111';


