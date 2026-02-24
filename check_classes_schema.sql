-- Check what columns actually exist in the classes table
-- Run this in Supabase SQL Editor to see your actual schema

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'classes'
ORDER BY ordinal_position;

