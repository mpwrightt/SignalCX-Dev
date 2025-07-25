#!/usr/bin/env node

/**
 * Fix authentication issues after user deletion from Supabase
 * This script will clean up orphaned user records and restore access
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixAuthIssue() {
  console.log('🔧 Starting authentication fix...\n');

  try {
    // 1. List all users in auth
    console.log('1. Checking Supabase Auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }

    console.log(`   Found ${authUsers.users.length} users in Auth:`);
    authUsers.users.forEach(user => {
      console.log(`   - ${user.email} (${user.id})`);
    });

    // 2. List all users in users table
    console.log('\n2. Checking users table...');
    const { data: tableUsers, error: tableError } = await supabase
      .from('users')
      .select('id, email, display_name, role, is_active');

    if (tableError) {
      console.error('❌ Error fetching table users:', tableError.message);
      return;
    }

    console.log(`   Found ${tableUsers.length} users in table:`);
    tableUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.id}) - ${user.role} - ${user.is_active ? 'Active' : 'Inactive'}`);
    });

    // 3. Check for orphaned records
    console.log('\n3. Checking for orphaned records...');
    const authUserIds = new Set(authUsers.users.map(u => u.id));
    const orphanedUsers = tableUsers.filter(u => !authUserIds.has(u.id));

    if (orphanedUsers.length > 0) {
      console.log(`   Found ${orphanedUsers.length} orphaned users in table:`);
      orphanedUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });

      // Clean up orphaned users
      console.log('\n4. Cleaning up orphaned users...');
      for (const user of orphanedUsers) {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);

        if (error) {
          console.error(`   ❌ Failed to delete ${user.email}:`, error.message);
        } else {
          console.log(`   ✅ Deleted orphaned user: ${user.email}`);
        }
      }
    } else {
      console.log('   ✅ No orphaned users found');
    }

    // 4. Check bootstrap admin setup
    const bootstrapEmail = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL;
    if (bootstrapEmail) {
      console.log(`\n5. Checking bootstrap admin: ${bootstrapEmail}`);
      
      const authUser = authUsers.users.find(u => u.email === bootstrapEmail);
      const tableUser = tableUsers.find(u => u.email === bootstrapEmail);

      if (authUser && !tableUser) {
        console.log('   ℹ️  Bootstrap admin exists in Auth but not in table - will be created on next login');
      } else if (authUser && tableUser) {
        console.log('   ✅ Bootstrap admin properly configured');
      } else if (!authUser) {
        console.log('   ⚠️  Bootstrap admin not found in Auth - needs to sign up first');
      }
    }

    console.log('\n✨ Auth fix completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Clear your browser cache/cookies');
    console.log('   2. Try logging in again with Google OAuth');
    console.log('   3. If you\'re the bootstrap admin, you should get org_admin role automatically');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixAuthIssue();