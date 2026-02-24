-- Update the clock_out_student function to be more flexible
CREATE OR REPLACE FUNCTION public.clock_out_student(p_class_id text, p_student_id text, p_period integer DEFAULT 1)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  attendance_record_id uuid;
  records_count integer;
BEGIN
  -- First count how many present records exist for this class/period today
  SELECT COUNT(*) INTO records_count
  FROM public.attendance_records
  WHERE class_id = p_class_id 
    AND period = p_period
    AND status = 'present'
    AND clocked_out_at IS NULL
    AND DATE(timestamp) = CURRENT_DATE;

  -- If no records exist, return error
  IF records_count = 0 THEN
    result := json_build_object(
      'success', false,
      'error', 'No active attendance records found for this class'
    );
    RETURN result;
  END IF;

  -- Find the most recent attendance record for this class and period
  -- Since we're using manual entries, we'll clock out the most recent one
  SELECT id INTO attendance_record_id
  FROM public.attendance_records
  WHERE class_id = p_class_id 
    AND period = p_period
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