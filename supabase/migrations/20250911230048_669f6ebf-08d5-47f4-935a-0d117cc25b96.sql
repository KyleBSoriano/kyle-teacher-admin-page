-- Create table to store emails from QR code confirmations
CREATE TABLE public.student_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  class_id text,
  student_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_emails ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anyone to insert emails (for anonymous QR code users)
CREATE POLICY "Anyone can insert emails" 
ON public.student_emails 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users to view emails
CREATE POLICY "Authenticated users can view emails" 
ON public.student_emails 
FOR SELECT 
USING (true);

-- Create function to save email from attendance confirmation
CREATE OR REPLACE FUNCTION public.save_student_email(
  p_email text,
  p_class_id text DEFAULT NULL,
  p_student_name text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Insert email record
  INSERT INTO public.student_emails (email, class_id, student_name)
  VALUES (p_email, p_class_id, p_student_name);
  
  -- Return success response
  result := json_build_object(
    'success', true,
    'message', 'Email saved successfully'
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