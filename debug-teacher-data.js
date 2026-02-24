// Debug script to check teacher accounts, classes, and templates
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkTeacherData() {
  const schoolId = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';
  
  console.log('🔍 Checking teacher accounts, classes, and templates...\n');
  
  // 1. Check all teachers
  console.log('1️⃣ TEACHER ACCOUNTS:');
  const { data: teachers, error: teachersError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'teacher');
  
  if (teachersError) {
    console.log('❌ Error:', teachersError.message);
  } else {
    console.log(`✅ Found ${teachers?.length || 0} teacher(s):`);
    
    // Get profiles separately
    for (const teacher of teachers || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', teacher.user_id)
        .single();
      
      console.log(`   - ${profile?.first_name || 'N/A'} ${profile?.last_name || ''} (${profile?.email || 'No email'})`);
      console.log(`     User ID: ${teacher.user_id}`);
      console.log(`     Created: ${teacher.created_at}`);
    }
  }
  
  // 2. Check all classes
  console.log('\n2️⃣ CLASSES:');
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('*')
    .eq('school_id', schoolId)
    .order('period', { ascending: true });
  
  if (classesError) {
    console.log('❌ Error:', classesError.message);
    console.log('   Details:', classesError.details);
    console.log('   Hint:', classesError.hint);
  } else {
    console.log(`✅ Found ${classes?.length || 0} class(es):`);
    
    for (const cls of classes || []) {
      console.log(`   - ${cls.subject} - ${cls.period}`);
      console.log(`     Class ID: ${cls.id}`);
      console.log(`     Teacher ID: ${cls.teacher_id || 'None (admin class)'}`);
      
      if (cls.teacher_id) {
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cls.teacher_id)
          .single();
        
        if (teacherProfile) {
          console.log(`     Teacher: ${teacherProfile.first_name} ${teacherProfile.last_name} (${teacherProfile.email})`);
        }
      }
      
      console.log(`     Active Template ID: ${cls.active_template_id || 'None'}`);
      console.log(`     Created: ${cls.created_at}`);
    }
  }
  
  // 3. Check all app templates
  console.log('\n3️⃣ APP TEMPLATES:');
  const { data: templates, error: templatesError } = await supabase
    .from('app_templates')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: true });
  
  if (templatesError) {
    console.log('❌ Error:', templatesError.message);
  } else {
    console.log(`✅ Found ${templates?.length || 0} template(s):`);
    
    for (const template of templates || []) {
      console.log(`   - "${template.name}" (${template.period || 'baseline'})`);
      console.log(`     Template ID: ${template.id}`);
      console.log(`     Class ID: ${template.class_id || 'None (baseline)'}`);
      
      if (template.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('*')
          .eq('id', template.class_id)
          .single();
        
        if (classData) {
          console.log(`     For Class: ${classData.subject} - ${classData.period}`);
        }
      }
      
      console.log(`     Apps: ${(template.apps || []).length} apps`);
      console.log(`     Created: ${template.created_at}`);
    }
  }
  
  // 4. Check RLS policies
  console.log('\n4️⃣ RLS POLICY CHECK:');
  console.log('   Note: RLS policies should allow admins to see all classes in their school.');
  console.log('   If classes are missing, it might be an RLS policy issue.');
}

checkTeacherData().catch(console.error);

