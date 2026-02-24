-- Complete Fix for app_templates Table Schema
-- Run this in Supabase SQL Editor
-- This ensures ALL required columns exist, including 'name'

-- ============================================
-- 1. VERIFY AND ADD ALL REQUIRED COLUMNS
-- ============================================

-- Add name column if it doesn't exist (REQUIRED - PRIMARY COLUMN)
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Make name NOT NULL if it's nullable and has no default
-- First, set a default for any NULL values
UPDATE public.app_templates 
SET name = 'Untitled Template' 
WHERE name IS NULL;

-- Then add NOT NULL constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_templates' 
    AND column_name = 'name' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.app_templates 
    ALTER COLUMN name SET NOT NULL;
  END IF;
END $$;

-- Add description column if it doesn't exist
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add school_id column if it doesn't exist
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

-- Add apps column if it doesn't exist (should be JSONB)
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS apps JSONB DEFAULT '[]'::jsonb;

-- Add period column if it doesn't exist
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS period TEXT;

-- Add class_id column if it doesn't exist
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS class_id TEXT;

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

-- Ensure NOT NULL constraints
ALTER TABLE public.app_templates 
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- ============================================
-- 2. VERIFY ALL COLUMNS EXIST
-- ============================================

SELECT 
  'app_templates' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'app_templates'
ORDER BY column_name;

-- ============================================
-- 3. REFRESH SCHEMA CACHE
-- ============================================
-- IMPORTANT: After running this script:
-- 1. Wait 10-30 seconds for Supabase to refresh the schema cache
-- 2. If errors persist, go to Supabase Dashboard → Settings → API → 
--    Click "Regenerate types" or refresh the schema
-- 3. The cache should refresh automatically, but sometimes needs a manual trigger

-- ============================================
-- 4. CHECK RECENT TEMPLATES
-- ============================================

SELECT 
  id,
  name,
  description,
  period,
  class_id,
  school_id,
  created_at,
  apps
FROM public.app_templates
ORDER BY created_at DESC
LIMIT 5;

