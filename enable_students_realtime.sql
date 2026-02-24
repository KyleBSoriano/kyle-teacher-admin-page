-- Enable Real-time Replication for students table
-- Run this in Supabase SQL Editor
-- This allows the admin page to see new students immediately when they sign up via mobile app

-- Enable replication for students table (required for real-time subscriptions)
ALTER TABLE public.students REPLICA IDENTITY FULL;

-- Verify replication is enabled
SELECT 
  c.relname as table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL'
    WHEN 'i' THEN 'INDEX'
    ELSE 'UNKNOWN'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'students';

-- Expected result: replica_identity should be 'FULL'

