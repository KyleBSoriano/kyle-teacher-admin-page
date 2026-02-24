// Debug script to test admin account creation and check for issues
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function debugAdminCreation() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 DEBUGGING ADMIN ACCOUNT CREATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Check if teacher-admin-signup function exists
  console.log('1. Checking if teacher-admin-signup edge function is accessible...');
  try {
    const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/teacher-admin-signup`, {
      method: 'OPTIONS',
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
      }
    });
    console.log(`   Function accessible: ${testResponse.ok ? '✅ YES' : '❌ NO'}`);
  } catch (error) {
    console.log(`   ❌ Function not accessible: ${error.message}`);
    console.log('   💡 The edge function may not be deployed yet!');
  }

  console.log('');
  console.log('2. Checking existing admins in your school...');
  
  // Get your school ID
  const SCHOOL_ID = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';
  
  // Check existing user_roles for admins
  const { data: existingAdmins, error: adminErr } = await supabase
    .from('user_roles')
    .select('user_id, role, school_id')
    .eq('school_id', SCHOOL_ID)
    .eq('role', 'admin');

  if (adminErr) {
    console.log(`   ❌ Error checking admins: ${adminErr.message}`);
  } else {
    console.log(`   ✅ Found ${existingAdmins?.length || 0} existing admin(s) in your school`);
    if (existingAdmins && existingAdmins.length > 0) {
      existingAdmins.forEach((admin, i) => {
        console.log(`      ${i + 1}. User ID: ${admin.user_id}`);
      });
    }
  }

  console.log('');
  console.log('3. Checking profiles table structure...');
  // Try to query profiles to see what columns exist
  const { data: sampleProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (profileErr) {
    console.log(`   ❌ Error querying profiles: ${profileErr.message}`);
    console.log(`   💡 This might indicate RLS policy issues`);
  } else if (sampleProfile) {
    console.log(`   ✅ Profiles table accessible`);
    console.log(`   Columns found: ${Object.keys(sampleProfile).join(', ')}`);
    const hasSchoolId = 'school_id' in sampleProfile;
    console.log(`   Has school_id column: ${hasSchoolId ? '✅ YES' : '❌ NO'}`);
  } else {
    console.log(`   ⚠️  No profiles found, but table is accessible`);
  }

  console.log('');
  console.log('4. Checking user_roles table structure...');
  const { data: sampleRole, error: roleErr } = await supabase
    .from('user_roles')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (roleErr) {
    console.log(`   ❌ Error querying user_roles: ${roleErr.message}`);
    console.log(`   💡 This might indicate RLS policy issues`);
  } else if (sampleRole) {
    console.log(`   ✅ user_roles table accessible`);
    console.log(`   Columns found: ${Object.keys(sampleRole).join(', ')}`);
  } else {
    console.log(`   ⚠️  No user_roles found, but table is accessible`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('💡 COMMON ISSUES & SOLUTIONS:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('1. Edge Function Not Deployed:');
  console.log('   → Go to Supabase Dashboard → Edge Functions');
  console.log('   → Check if "teacher-admin-signup" exists');
  console.log('   → If not, deploy it from supabase/functions/teacher-admin-signup/index.ts');
  console.log('');
  console.log('2. RLS Policies Blocking:');
  console.log('   → The edge function uses SERVICE_ROLE_KEY which should bypass RLS');
  console.log('   → But if policies are too restrictive, it might still fail');
  console.log('   → Run setup_auth_rls_policies.sql to fix');
  console.log('');
  console.log('3. Profiles Table Schema Mismatch:');
  console.log('   → Check if profiles table has school_id column');
  console.log('   → The edge function expects: id, email, first_name, last_name, school_id, school_name');
  console.log('');
  console.log('4. User Already Exists:');
  console.log('   → If email already exists in auth.users, creation will fail');
  console.log('   → Try with a different email');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
}

debugAdminCreation().catch(console.error);

