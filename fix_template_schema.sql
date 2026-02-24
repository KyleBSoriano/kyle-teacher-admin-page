-- Fix Template and Attendance Schema Issues
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. FIX APP_TEMPLATES TABLE - Add missing columns
-- ============================================

-- Add ALL missing columns that the code expects

-- Add description column if it doesn't exist (REQUIRED - code tries to insert this)
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add school_id column if it doesn't exist (REQUIRED - code tries to insert this)
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

-- Add is_custom column if it doesn't exist (REQUIRED - code tries to insert this)
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT true;

-- Add created_at column if it doesn't exist
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;

-- Update existing rows to have timestamps if they're NULL
UPDATE public.app_templates 
SET created_at = now() 
WHERE created_at IS NULL;

UPDATE public.app_templates 
SET updated_at = now() 
WHERE updated_at IS NULL;

-- Ensure NOT NULL constraint (in case columns existed but were nullable)
ALTER TABLE public.app_templates 
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- ============================================
-- 2. FIX ATTENDANCE_RECORDS TABLE - Add missing period column
-- ============================================

-- Add period column if it doesn't exist
ALTER TABLE public.attendance_records 
ADD COLUMN IF NOT EXISTS period INTEGER;

-- Set default period for existing records (if needed)
-- UPDATE public.attendance_records 
-- SET period = 1 
-- WHERE period IS NULL;

-- ============================================
-- 3. VERIFY COLUMNS EXIST
-- ============================================

-- Check app_templates columns
SELECT 
  'app_templates' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'app_templates'
  AND column_name IN ('description', 'school_id', 'is_custom', 'created_at', 'updated_at', 'name', 'apps', 'period', 'class_id')
ORDER BY column_name;

-- Check attendance_records columns
SELECT 
  'attendance_records' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'attendance_records'
  AND column_name = 'period';

