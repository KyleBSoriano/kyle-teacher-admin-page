-- Enable REPLICA IDENTITY FULL for attendance_records table to support real-time updates
ALTER TABLE public.attendance_records REPLICA IDENTITY FULL;