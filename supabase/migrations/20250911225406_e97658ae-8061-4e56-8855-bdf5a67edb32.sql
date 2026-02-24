-- Create a public attendance function that doesn't require authentication
CREATE OR REPLACE FUNCTION public.add_anonymous_attendance(
  p_class_id text,
  p_student_name text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Insert attendance record
  INSERT INTO public.attendance_records (class_id, student_name, status)
  VALUES (p_class_id, p_student_name, 'present');
  
  -- Return success response
  result := json_build_object(
    'success', true,
    'message', 'Attendance recorded successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;