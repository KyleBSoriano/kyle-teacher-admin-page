-- Comprehensive fix for class creation issues
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. FIX CLASSES TABLE - Add missing 'subject' column
-- ============================================
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT '';

-- ============================================
-- 2. VERIFY CLASS_APPS TABLE EXISTS
-- ============================================
-- Check if class_apps table exists, if not create it
CREATE TABLE IF NOT EXISTS public.class_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  app_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(class_id, app_id)
);

-- Fix existing class_apps table if class_id is TEXT instead of UUID
DO $$
BEGIN
  -- Check if class_id column exists and is TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'class_apps' 
    AND column_name = 'class_id'
    AND data_type = 'text'
  ) THEN
    -- Drop existing foreign key constraint if it exists
    ALTER TABLE public.class_apps DROP CONSTRAINT IF EXISTS class_apps_class_id_fkey;
    
    -- Delete any rows with invalid UUIDs (non-UUID format)
    DELETE FROM public.class_apps 
    WHERE class_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Change column type to UUID
    ALTER TABLE public.class_apps 
    ALTER COLUMN class_id TYPE UUID USING class_id::UUID;
  END IF;
END $$;

-- Clean up orphaned rows (class_apps referencing non-existent classes)
-- This must happen AFTER type conversion but BEFORE adding the foreign key constraint
-- Delete any rows where class_id doesn't exist in classes table
DELETE FROM public.class_apps ca
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes c 
  WHERE c.id = ca.class_id
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'class_apps_class_id_fkey'
    AND table_schema = 'public'
    AND table_name = 'class_apps'
  ) THEN
    ALTER TABLE public.class_apps
    ADD CONSTRAINT class_apps_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 3. VERIFY REQUIRED COLUMNS IN CLASSES TABLE
-- ============================================
-- Ensure all required columns exist with correct types
DO $$
BEGIN
  -- Ensure period is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'period'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.classes ALTER COLUMN period SET NOT NULL;
  END IF;

  -- Ensure subject is NOT NULL (we just added it, but double-check)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'subject'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.classes ALTER COLUMN subject SET NOT NULL;
  END IF;
END $$;

-- ============================================
-- 4. VERIFY INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_class_apps_class_id ON public.class_apps(class_id);
CREATE INDEX IF NOT EXISTS idx_class_apps_app_id ON public.class_apps(app_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_period ON public.classes(period);

-- ============================================
-- 5. VERIFY RLS POLICIES (if RLS is enabled)
-- ============================================

-- Enable RLS on classes if not already enabled
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for classes table
DO $$
BEGIN
  -- Allow authenticated users to view classes in their school
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'classes' 
    AND policyname = 'Users can view classes in their school'
  ) THEN
    CREATE POLICY "Users can view classes in their school" 
    ON public.classes 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id::text = auth.uid()::text
        AND classes.school_id = ur.school_id
      )
    );
  END IF;

  -- Allow authenticated users to insert classes in their school
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'classes' 
    AND policyname = 'Users can create classes in their school'
  ) THEN
    CREATE POLICY "Users can create classes in their school" 
    ON public.classes 
    FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id::text = auth.uid()::text
        AND classes.school_id = ur.school_id
      )
    );
  END IF;

  -- Allow authenticated users to update classes in their school
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'classes' 
    AND policyname = 'Users can update classes in their school'
  ) THEN
    CREATE POLICY "Users can update classes in their school" 
    ON public.classes 
    FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id::text = auth.uid()::text
        AND classes.school_id = ur.school_id
      )
    );
  END IF;

  -- Allow authenticated users to delete classes in their school
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'classes' 
    AND policyname = 'Users can delete classes in their school'
  ) THEN
    CREATE POLICY "Users can delete classes in their school" 
    ON public.classes 
    FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id::text = auth.uid()::text
        AND classes.school_id = ur.school_id
      )
    );
  END IF;
END $$;

-- Enable RLS on class_apps if not already enabled
ALTER TABLE public.class_apps ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Allow all operations on class_apps (adjust based on your security needs)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'class_apps' 
    AND policyname = 'Allow all operations on class_apps'
  ) THEN
    CREATE POLICY "Allow all operations on class_apps" 
    ON public.class_apps 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- 6. VERIFICATION QUERY - Check everything
-- ============================================
SELECT 
  '✅ Classes table columns:' as check_type,
  string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'classes'
UNION ALL
SELECT 
  '✅ Class_apps table columns:' as check_type,
  string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'class_apps';

-- ============================================
-- 7. IMPORTANT NOTES
-- ============================================
-- After running this script:
-- 1. If you still see "subject column not found" error, refresh your Supabase schema cache:
--    - Go to Supabase Dashboard > Settings > API
--    - Click "Reload schema" or wait a few minutes for auto-refresh
-- 2. Make sure user_roles table has RLS policies that allow reading
--    (The classes RLS policies need to read from user_roles to check school_id)

