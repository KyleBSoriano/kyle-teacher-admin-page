-- ============================================
-- Fix RLS Policies for enrollments Table
-- ============================================
-- This allows authenticated teachers/admins to view enrollments for their school

-- Step 1: Enable RLS (if not already enabled)
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view enrollments for their school" ON public.enrollments;
DROP POLICY IF EXISTS "Users can create enrollments for their school" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update enrollments for their school" ON public.enrollments;
DROP POLICY IF EXISTS "Users can delete enrollments for their school" ON public.enrollments;

-- Step 3: Create RLS Policies

-- Policy: Allow authenticated users to view enrollments where the class is in their school
CREATE POLICY "Users can view enrollments for their school"
  ON public.enrollments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.classes c ON c.id = enrollments.class_id
      WHERE ur.user_id::text = auth.uid()::text
      AND c.school_id = ur.school_id
    )
  );

-- Policy: Allow authenticated users to create enrollments for classes in their school
CREATE POLICY "Users can create enrollments for their school"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.classes c ON c.id = enrollments.class_id
      WHERE ur.user_id::text = auth.uid()::text
      AND c.school_id = ur.school_id
    )
  );

-- Policy: Allow authenticated users to update enrollments for classes in their school
CREATE POLICY "Users can update enrollments for their school"
  ON public.enrollments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.classes c ON c.id = enrollments.class_id
      WHERE ur.user_id::text = auth.uid()::text
      AND c.school_id = ur.school_id
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.classes c ON c.id = enrollments.class_id
      WHERE ur.user_id::text = auth.uid()::text
      AND c.school_id = ur.school_id
    )
  );

-- Policy: Allow authenticated users to delete enrollments for classes in their school
CREATE POLICY "Users can delete enrollments for their school"
  ON public.enrollments
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.classes c ON c.id = enrollments.class_id
      WHERE ur.user_id::text = auth.uid()::text
      AND c.school_id = ur.school_id
    )
  );

-- Step 4: Verify policies were created
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
  AND tablename = 'enrollments'
ORDER BY policyname;

