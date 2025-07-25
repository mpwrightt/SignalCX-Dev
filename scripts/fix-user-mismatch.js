#!/usr/bin/env node

/**
 * Fix user ID mismatch between Supabase Auth and users table
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

async function fixUserMismatch() {
  console.log('🔧 Fixing user ID mismatch...\n');

  try {
    // 1. Get all auth users
    console.log('1. Fetching auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }

    console.log(`   Found ${authUsers.users.length} auth users:`);
    authUsers.users.forEach(user => {
      console.log(`   - ${user.email} (${user.id}) - Provider: ${user.app_metadata?.provider || 'Unknown'}`);
    });

    // 2. Get all users table records
    console.log('\n2. Fetching users table...');
    const { data: tableUsers, error: tableError } = await supabase
      .from('users')
      .select('*');

    if (tableError) {
      console.error('❌ Error fetching table users:', tableError.message);
      return;
    }

    console.log(`   Found ${tableUsers.length} table users:`);
    tableUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.id}) - Role: ${user.role}`);
    });

    // 3. Find your auth user
    const yourAuthUser = authUsers.users.find(u => u.email === 'mpwright@ebay.com');
    if (!yourAuthUser) {
      console.error('❌ Your auth user not found!');
      return;
    }

    console.log(`\n3. Your auth user: ${yourAuthUser.email} (${yourAuthUser.id})`);

    // 4. Clean up table users with your email
    console.log('\n4. Cleaning up mismatched users...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', 'mpwright@ebay.com');

    if (deleteError) {
      console.error('❌ Error deleting mismatched users:', deleteError.message);
      return;
    }

    console.log('   ✅ Cleaned up old user records');

    // 5. Create new user record with correct auth ID
    console.log('\n5. Creating new user record...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: yourAuthUser.id, // Use the correct auth ID
        email: yourAuthUser.email,
        display_name: yourAuthUser.user_metadata?.full_name || 'Matthew Wright',
        photo_url: yourAuthUser.user_metadata?.avatar_url || '',
        role: 'org_admin', // Bootstrap admin role
        organization_id: '00000000-0000-0000-0000-000000000001', // Default org
        is_active: true,
        email_verified: !!yourAuthUser.email_confirmed_at,
        firebase_uid: null,
        invited_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      return;
    }

    console.log('   ✅ Created new user record:');
    console.log(`      ID: ${newUser.id}`);
    console.log(`      Email: ${newUser.email}`);
    console.log(`      Role: ${newUser.role}`);
    console.log(`      Active: ${newUser.is_active}`);

    console.log('\n✨ User mismatch fixed!');
    console.log('📋 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Clear browser cache and sign in again');
    console.log('   3. You should now have full org_admin access');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixUserMismatch();