-- Fix RLS Policies for app_templates Table
-- Run this in Supabase SQL Editor
-- This ensures authenticated teachers/admins can create, view, update, and delete templates

-- ============================================
-- 1. DROP EXISTING POLICIES (if they exist)
-- ============================================

DROP POLICY IF EXISTS "Anyone can view app templates" ON public.app_templates;
DROP POLICY IF EXISTS "Anyone can create app templates" ON public.app_templates;
DROP POLICY IF EXISTS "Anyone can update app templates" ON public.app_templates;
DROP POLICY IF EXISTS "Anyone can delete app templates" ON public.app_templates;
DROP POLICY IF EXISTS "Users can view templates for their school" ON public.app_templates;
DROP POLICY IF EXISTS "Users can create templates for their school" ON public.app_templates;
DROP POLICY IF EXISTS "Users can update templates for their school" ON public.app_templates;
DROP POLICY IF EXISTS "Users can delete templates for their school" ON public.app_templates;

-- ============================================
-- 2. CREATE PROPER RLS POLICIES
-- ============================================

-- Policy: Allow authenticated users to view templates
CREATE POLICY "Authenticated users can view templates"
  ON public.app_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Allow authenticated users to create templates
CREATE POLICY "Authenticated users can create templates"
  ON public.app_templates
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Allow authenticated users to update templates
CREATE POLICY "Authenticated users can update templates"
  ON public.app_templates
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Allow authenticated users to delete templates
CREATE POLICY "Authenticated users can delete templates"
  ON public.app_templates
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. VERIFY POLICIES WERE CREATED
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
  AND tablename = 'app_templates'
ORDER BY policyname;
