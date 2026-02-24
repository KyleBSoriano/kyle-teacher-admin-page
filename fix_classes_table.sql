-- Fix classes table - add missing columns if they don't exist
-- Run this in Supabase SQL Editor

-- Add subject column if it doesn't exist
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add description column if it doesn't exist
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add room_number column if it doesn't exist
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS room_number TEXT;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'classes'
ORDER BY ordinal_position;

