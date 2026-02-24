-- Add RLS policy to allow updates on attendance_records for realtime functionality
CREATE POLICY "Anyone can update attendance records" ON public.attendance_records 
FOR UPDATE 
USING (true) 
WITH CHECK (true);