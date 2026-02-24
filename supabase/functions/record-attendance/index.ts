import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AttendanceRequest {
  classId: string;
  studentName?: string;
  email?: string;
  timestamp?: string; // QR code timestamp for validation
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { classId, studentName, email, timestamp }: AttendanceRequest = await req.json();

    // Validate required fields
    if (!classId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Class ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // QR code validation removed - no expiration for now
    console.log('QR code accepted without timestamp validation');

    console.log(`Recording attendance for class ${classId}, student: ${studentName || 'Anonymous'}`);

    // Call the database function to record attendance
    const { data: attendanceData, error: attendanceError } = await supabase.rpc('add_anonymous_attendance', {
      p_class_id: classId,
      p_student_name: studentName || `Student ${Date.now()}`
    });

    if (attendanceError) {
      console.error('Database error:', attendanceError);
      return new Response(
        JSON.stringify({ success: false, error: attendanceError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let emailData = null;
    // Save email if provided
    if (email && email.trim()) {
      console.log(`Saving email: ${email} for class ${classId}`);
      
      const { data: emailResult, error: emailError } = await supabase.rpc('save_student_email', {
        p_email: email.trim(),
        p_class_id: classId,
        p_student_name: studentName || `Student ${Date.now()}`
      });

      if (emailError) {
        console.error('Email save error:', emailError);
        // Don't fail the whole request if email save fails
      } else {
        emailData = emailResult;
        console.log('Email saved successfully:', emailData);
      }
    }

    console.log('Attendance recorded successfully:', attendanceData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendance recorded successfully',
        data: attendanceData,
        emailSaved: emailData ? true : false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in record-attendance function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});