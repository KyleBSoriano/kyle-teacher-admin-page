// Find template with Notion and check its configuration
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const SCHOOL_ID = 'dd484b5a-10f4-42bb-b0f7-6175a650bca0';

async function findNotionTemplate() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 FINDING TEMPLATE WITH NOTION');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Get ALL templates (no filters first)
  const { data: allTemplates, error } = await supabase
    .from("app_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!allTemplates || allTemplates.length === 0) {
    console.log('❌ No templates found in entire database!');
    return;
  }

  console.log(`📋 Found ${allTemplates.length} total template(s) in database:\n`);

  // Find templates with Notion
  const templatesWithNotion = allTemplates.filter(t => {
    if (!t.apps || !Array.isArray(t.apps)) return false;
    return t.apps.some(app => 
      app.toLowerCase().includes('notion') || 
      app === 'notion'
    );
  });

  if (templatesWithNotion.length === 0) {
    console.log('❌ No templates found with Notion!');
    console.log('');
    console.log('All templates:');
    allTemplates.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name || 'Unnamed'} - Apps: ${JSON.stringify(t.apps)}`);
    });
    return;
  }

  console.log(`✅ Found ${templatesWithNotion.length} template(s) with Notion:\n`);

  templatesWithNotion.forEach((template, index) => {
    const isBaseline = template.period === 'baseline' && !template.class_id;
    const isCorrectSchool = template.school_id === SCHOOL_ID;
    
    console.log(`${index + 1}. ${template.name || 'Unnamed Template'}`);
    console.log(`   ID: ${template.id}`);
    console.log(`   School ID: ${template.school_id} ${isCorrectSchool ? '✅' : '❌ (different school)'}`);
    console.log(`   Period: ${template.period || 'null'} ${isBaseline ? '✅ (BASELINE)' : '❌ (should be "baseline")'}`);
    console.log(`   Class ID: ${template.class_id || 'null'} ${isBaseline ? '✅ (correct)' : template.class_id ? '❌ (should be null)' : ''}`);
    console.log(`   Apps: ${JSON.stringify(template.apps)}`);
    console.log('');

    if (isBaseline && isCorrectSchool) {
      console.log('   ✅ THIS IS YOUR BASELINE TEMPLATE!');
      console.log('   It should be used between periods.');
    } else {
      console.log('   ⚠️  ISSUES FOUND:');
      if (!isCorrectSchool) {
        console.log('      - Wrong school_id (should match your school)');
      }
      if (template.period !== 'baseline') {
        console.log(`      - Period is "${template.period}" but should be "baseline"`);
      }
      if (template.class_id) {
        console.log(`      - Has class_id "${template.class_id}" but should be null`);
      }
      console.log('');
      console.log('   🔧 TO FIX:');
      console.log('      Run this SQL in Supabase SQL Editor:');
      console.log(`      UPDATE app_templates`);
      console.log(`      SET period = 'baseline', class_id = NULL`);
      console.log(`      WHERE id = '${template.id}';`);
    }
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('💡 HOW TO VERIFY IT WORKS:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('1. Make sure template has: period="baseline", class_id=null');
  console.log('2. Make sure you\'re clocked in');
  console.log('3. Check current time is between periods (not during a period)');
  console.log('4. Check current time is within admin day (8 AM - 3 PM PST)');
  console.log('5. Call get-current-restrictions - should return baseline apps');
  console.log('═══════════════════════════════════════════════════════');
}

findNotionTemplate().catch(console.error);

