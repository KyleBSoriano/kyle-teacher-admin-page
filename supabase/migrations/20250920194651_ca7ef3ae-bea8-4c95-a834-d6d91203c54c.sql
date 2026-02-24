-- Add DELETE policy for attendance_records to enable real-time DELETE events
CREATE POLICY "Anyone can delete attendance records" 
ON public.attendance_records 
FOR DELETE 
USING (true);