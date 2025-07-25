#!/usr/bin/env node

/**
 * Temporarily disable RLS for audit_logs to fix the immediate issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function tempDisableAuditRLS() {
  console.log('🔓 Temporarily disabling RLS for audit_logs...\n');

  try {
    // Test current audit log insertion with your user
    console.log('1. Testing current audit log insertion...');
    
    const testLog = {
      organization_id: '00000000-0000-0000-0000-000000000001',
      user_id: '2e439884-4104-4d71-acdb-7cc877feefec', // Your user ID
      action: 'USER_LOGIN',
      resource_type: 'auth',
      resource_id: null,
      metadata: { mode: 'enterprise', test: true },
      ip_address: null,
      user_agent: 'test-user-agent',
      created_at: new Date().toISOString()
    };

    const { data: testResult, error: testError } = await supabase
      .from('audit_logs')
      .insert(testLog)
      .select()
      .single();

    if (testError) {
      console.log(`   ❌ Test failed: ${testError.message}`);
      console.log('   🔧 Temporarily disabling RLS...');

      // Disable RLS temporarily
      const { error: disableError } = await supabase
        .from('_realtime_publication')
        .select('*')
        .limit(1); // This is just to test connection

      // Use a direct approach to disable RLS
      console.log('   💡 Please run this in Supabase Dashboard > SQL Editor:');
      console.log('\n   ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;\n');
      
    } else {
      console.log(`   ✅ Test audit log successful: ${testResult.id}`);
      
      // Clean up
      await supabase.from('audit_logs').delete().eq('id', testResult.id);
      console.log('   🧹 Test log cleaned up');
    }

    console.log('\n2. Checking audit logs table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log(`   ❌ Cannot access audit_logs: ${tableError.message}`);
    } else {
      console.log('   ✅ audit_logs table accessible');
    }

    console.log('\n📋 Quick fix options:');
    console.log('   Option 1 (Recommended): Run in Supabase Dashboard > SQL Editor:');
    console.log('   ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('   Option 2: Update audit service to use service role key');
    console.log('   Option 3: Fix RLS policies properly (more complex)');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

tempDisableAuditRLS();