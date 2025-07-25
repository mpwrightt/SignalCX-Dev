#!/usr/bin/env node

/**
 * Diagnose Google OAuth configuration issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Diagnosing Google OAuth Configuration...\n');

console.log('1. Environment Variables:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}`);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function diagnoseOAuth() {
  try {
    console.log('\n2. Testing Supabase Connection...');
    
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });

    if (healthError) {
      console.log(`   ❌ Connection failed: ${healthError.message}`);
      return;
    } else {
      console.log('   ✅ Supabase connection successful');
    }

    console.log('\n3. Checking Auth Configuration...');
    
    // List all users to verify we can access auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log(`   ❌ Auth access failed: ${authError.message}`);
      console.log('   💡 Make sure you\'re using the service role key, not anon key');
      return;
    }

    console.log(`   ✅ Found ${authUsers.users.length} auth users`);
    
    if (authUsers.users.length > 0) {
      console.log('   Auth users:');
      authUsers.users.forEach((user, index) => {
        console.log(`     ${index + 1}. ${user.email || 'No email'} (${user.id})`);
        console.log(`        Provider: ${user.app_metadata?.provider || 'Unknown'}`);
        console.log(`        Verified: ${user.email_confirmed_at ? '✅' : '❌'}`);
      });
    }

    console.log('\n4. OAuth Provider Settings Check:');
    console.log('   💡 You need to configure the following in your Supabase dashboard:');
    console.log('   📍 Go to: https://app.supabase.com/project/[your-project]/auth/providers');
    console.log('   📍 Enable Google OAuth provider');
    console.log('   📍 Set Site URL to: http://localhost:9002');
    console.log('   📍 Add Redirect URL: http://localhost:9002/auth/callback');
    console.log('   📍 Or for all localhost: http://localhost:*/**');

    console.log('\n5. Current Redirect URLs that should be configured:');
    console.log('   - http://localhost:9002');
    console.log('   - http://localhost:9002/auth/callback');
    console.log('   - http://localhost:9002/**');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

diagnoseOAuth();