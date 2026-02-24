-- Cleanup Unused Columns and Tables
-- Run this in Supabase SQL Editor
-- WARNING: Review carefully before running - these operations cannot be easily undone

-- ============================================
-- 1. REMOVE UNUSED COLUMNS FROM CLASSES TABLE
-- ============================================
-- These columns are in the types but never used in actual queries

-- ALTER TABLE public.classes DROP COLUMN IF EXISTS description;
-- ALTER TABLE public.classes DROP COLUMN IF EXISTS room_number;

-- ============================================
-- 2. REMOVE UNUSED COLUMNS FROM SCHOOLS TABLE
-- ============================================
-- These columns exist but are never queried or updated

-- ALTER TABLE public.schools DROP COLUMN IF EXISTS address;
-- ALTER TABLE public.schools DROP COLUMN IF EXISTS district;

-- ============================================
-- 3. REMOVE UNUSED TABLE (VERIFY FIRST!)
-- ============================================
-- student_emails table has no code references in the web admin
-- BUT: Check if your mobile app uses this before deleting!

-- First, check if there's any data:
-- SELECT COUNT(*) FROM public.student_emails;

-- If empty and confirmed unused, you can drop it:
-- DROP TABLE IF EXISTS public.student_emails CASCADE;

-- ============================================
-- 4. VERIFY WHAT WILL BE REMOVED (SAFE QUERY)
-- ============================================
-- Run this first to see what exists before removing:

SELECT 
  'classes.description' as column_to_remove,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'description'
  ) as exists_in_db
UNION ALL
SELECT 
  'classes.room_number',
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'room_number'
  )
UNION ALL
SELECT 
  'schools.address',
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'address'
  )
UNION ALL
SELECT 
  'schools.district',
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'district'
  )
UNION ALL
SELECT 
  'student_emails table',
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'student_emails'
  );

-- ============================================
-- 5. CHECK FOR DATA IN UNUSED COLUMNS
-- ============================================
-- Before removing, check if there's any data:

-- SELECT COUNT(*) as classes_with_description 
-- FROM public.classes 
-- WHERE description IS NOT NULL AND description != '';

-- SELECT COUNT(*) as classes_with_room_number 
-- FROM public.classes 
-- WHERE room_number IS NOT NULL AND room_number != '';

-- SELECT COUNT(*) as schools_with_address 
-- FROM public.schools 
-- WHERE address IS NOT NULL AND address != '';

-- SELECT COUNT(*) as schools_with_district 
-- FROM public.schools 
-- WHERE district IS NOT NULL AND district != '';

