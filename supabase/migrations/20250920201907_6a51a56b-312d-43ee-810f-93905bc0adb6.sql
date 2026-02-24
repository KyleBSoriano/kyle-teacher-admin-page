-- Add a new status field to track individual student attendance states
-- Update attendance_records table to support clock-out functionality
ALTER TABLE public.attendance_records 
ADD COLUMN IF NOT EXISTS period integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS student_id text,
ADD COLUMN IF NOT EXISTS clocked_out_at timestamp with time zone;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_period ON public.attendance_records(period);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class_period ON public.attendance_records(class_id, period);

-- Add function to clock out individual students
CREATE OR REPLACE FUNCTION public.clock_out_student(p_class_id text, p_student_id text, p_period integer DEFAULT 1)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  attendance_record_id uuid;
BEGIN
  -- Find the most recent attendance record for this student in this class and period
  SELECT id INTO attendance_record_id
  FROM public.attendance_records
  WHERE class_id = p_class_id 
    AND period = p_period
    AND (student_id = p_student_id OR student_name = p_student_id)
    AND status = 'present'
    AND clocked_out_at IS NULL
    AND DATE(timestamp) = CURRENT_DATE
  ORDER BY timestamp DESC
  LIMIT 1;

  IF attendance_record_id IS NOT NULL THEN
    -- Update the record to mark as clocked out
    UPDATE public.attendance_records 
    SET clocked_out_at = NOW(),
        status = 'clocked_out'
    WHERE id = attendance_record_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Student clocked out successfully',
      'record_id', attendance_record_id
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'No active attendance record found for this student'
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$function$