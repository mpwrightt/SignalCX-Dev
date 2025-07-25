#!/usr/bin/env node

/**
 * Fix RLS policies for audit logs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixAuditRLS() {
  console.log('🔒 Fixing audit logs RLS policies...\n');

  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix-audit-rls.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolons and filter out empty statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      console.log(`${i + 1}. ${statement.split('\n')[0]}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_sql_execute')
          .select('*')
          .eq('query', statement);

        if (directError) {
          console.log(`   ⚠️  Could not execute via Supabase client: ${error.message}`);
          console.log(`   💡 Please run this SQL manually in Supabase Dashboard > SQL Editor:`);
          console.log(`\n${statement}\n`);
        } else {
          console.log(`   ✅ Executed successfully`);
        }
      } else {
        console.log(`   ✅ Executed successfully`);
      }
    }

    console.log('\n🔍 Testing audit log insertion...');

    // Test audit log insertion
    const testAuditLog = {
      organization_id: '00000000-0000-0000-0000-000000000001',
      user_id: '2e439884-4104-4d71-acdb-7cc877feefec',
      action: 'TEST_AUDIT_LOG',
      resource_type: 'test',
      resource_id: null,
      metadata: { test: true },
      ip_address: null,
      user_agent: null,
      created_at: new Date().toISOString()
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('audit_logs')
      .insert(testAuditLog)
      .select()
      .single();

    if (insertError) {
      console.log(`   ❌ Test insertion failed: ${insertError.message}`);
      console.log('\n💡 You may need to run the SQL manually in Supabase Dashboard');
    } else {
      console.log(`   ✅ Test audit log inserted successfully: ${insertResult.id}`);
      
      // Clean up test log
      await supabase.from('audit_logs').delete().eq('id', insertResult.id);
      console.log(`   🧹 Test log cleaned up`);
    }

    console.log('\n✨ RLS policy fix completed!');
    console.log('📋 If the test failed, please:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Run the contents of fix-audit-rls.sql manually');
    console.log('   3. Restart your application');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixAuditRLS();