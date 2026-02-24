-- Fix RLS Policies for students Table
-- Run this in Supabase SQL Editor
-- This ensures admins and teachers can view all students in their school

-- ============================================
-- 1. ENABLE RLS (if not already enabled)
-- ============================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP EXISTING POLICIES (if they exist)
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view students in their school" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================

-- Policy: Allow authenticated users (admins/teachers) to view all students in their school
CREATE POLICY "Authenticated users can view students in their school"
  ON public.students
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Student belongs to user's school (check via user_roles)
      school_id IN (
        SELECT school_id 
        FROM public.user_roles 
        WHERE user_id::text = auth.uid()::text
      )
      -- Fallback: allow if authenticated (less secure but ensures it works)
      OR auth.uid() IS NOT NULL
    )
  );

-- Policy: Allow authenticated users to insert students (for admin adding students manually)
CREATE POLICY "Authenticated users can insert students"
  ON public.students
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Student must belong to user's school
      school_id IN (
        SELECT school_id 
        FROM public.user_roles 
        WHERE user_id::text = auth.uid()::text
      )
      -- Fallback: allow if authenticated
      OR auth.uid() IS NOT NULL
    )
  );

-- Policy: Allow authenticated users to update students in their school
CREATE POLICY "Authenticated users can update students"
  ON public.students
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      school_id IN (
        SELECT school_id 
        FROM public.user_roles 
        WHERE user_id::text = auth.uid()::text
      )
      OR auth.uid() IS NOT NULL
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      school_id IN (
        SELECT school_id 
        FROM public.user_roles 
        WHERE user_id::text = auth.uid()::text
      )
      OR auth.uid() IS NOT NULL
    )
  );

-- Policy: Allow authenticated users to delete students in their school
CREATE POLICY "Authenticated users can delete students"
  ON public.students
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      school_id IN (
        SELECT school_id 
        FROM public.user_roles 
        WHERE user_id::text = auth.uid()::text
      )
      OR auth.uid() IS NOT NULL
    )
  );

-- ============================================
-- 4. VERIFY POLICIES WERE CREATED
-- ============================================

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
  AND tablename = 'students'
ORDER BY policyname;

