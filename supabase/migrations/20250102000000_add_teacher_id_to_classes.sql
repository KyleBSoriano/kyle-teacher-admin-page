-- Add teacher_id column to classes table to associate classes with teachers
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);

-- Update RLS policies to filter by teacher_id
-- Drop existing policies that only check school_id
DROP POLICY IF EXISTS "Users can view classes in their school" ON public.classes;
DROP POLICY IF EXISTS "Users can create classes in their school" ON public.classes;
DROP POLICY IF EXISTS "Users can update classes in their school" ON public.classes;
DROP POLICY IF EXISTS "Users can delete classes in their school" ON public.classes;

-- Create new policies that check both school_id and teacher_id
-- For teachers: only their own classes
CREATE POLICY "Teachers can view their own classes" 
ON public.classes 
FOR SELECT 
USING (
  (
    teacher_id = auth.uid()::uuid
    OR teacher_id IS NULL  -- Allow viewing classes without teacher_id (backward compatibility)
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role = 'teacher'
    AND classes.school_id = ur.school_id
  )
);

CREATE POLICY "Teachers can create their own classes" 
ON public.classes 
FOR INSERT 
WITH CHECK (
  teacher_id = auth.uid()::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role = 'teacher'
    AND classes.school_id = ur.school_id
  )
);

CREATE POLICY "Teachers can update their own classes" 
ON public.classes 
FOR UPDATE 
USING (
  (
    teacher_id = auth.uid()::uuid
    OR teacher_id IS NULL  -- Allow updating classes without teacher_id (backward compatibility)
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role = 'teacher'
    AND classes.school_id = ur.school_id
  )
);

CREATE POLICY "Teachers can delete their own classes" 
ON public.classes 
FOR DELETE 
USING (
  (
    teacher_id = auth.uid()::uuid
    OR teacher_id IS NULL  -- Allow deleting classes without teacher_id (backward compatibility)
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role = 'teacher'
    AND classes.school_id = ur.school_id
  )
);

-- For admins: allow viewing all classes in their school
CREATE POLICY "Admins can view all classes in their school" 
ON public.classes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role = 'admin'
    AND classes.school_id = ur.school_id
  )
);

CREATE POLICY "Admins can create classes in their school" 
ON public.classes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role = 'admin'
    AND classes.school_id = ur.school_id
  )
);

CREATE POLICY "Admins can update classes in their school" 
ON public.classes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role = 'admin'
    AND classes.school_id = ur.school_id
  )
);

CREATE POLICY "Admins can delete classes in their school" 
ON public.classes 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role = 'admin'
    AND classes.school_id = ur.school_id
  )
);

