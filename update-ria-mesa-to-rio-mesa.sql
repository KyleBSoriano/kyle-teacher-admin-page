-- ============================================
-- Update School Name from Ria Mesa to Rio Mesa
-- ============================================
-- Run this in Supabase SQL Editor
-- This updates Ria Mesa High School name to Rio Mesa High School

-- Update the school name from "Ria Mesa High School" to "Rio Mesa High School"
UPDATE public.schools
SET name = 'Rio Mesa High School',
    updated_at = NOW()
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

