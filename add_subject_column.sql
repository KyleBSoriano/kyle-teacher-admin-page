-- Add the missing 'subject' column to classes table
-- Run this in Supabase SQL Editor

-- Add subject column (required for classes)
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT '';

-- If you have existing classes without subjects, you may want to update them:
-- UPDATE public.classes SET subject = 'Unnamed' WHERE subject = '' OR subject IS NULL;

-- Verify it was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'classes'
  AND column_name = 'subject';

