#!/usr/bin/env node

/**
 * Debug user permissions
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

// Import the getRolePermissions function
const ROLE_PERMISSIONS = {
  super_admin: [
    'users.read', 'users.write', 'users.delete',
    'tickets.read', 'tickets.write', 'tickets.delete',
    'analytics.read', 'analytics.write',
    'ai.read', 'ai.write',
    'settings.read', 'settings.write',
    'audit.read',
    'org.read', 'org.write'
  ],
  org_admin: [
    'users.read', 'users.write', 'users.delete',
    'tickets.read', 'tickets.write',
    'analytics.read', 'analytics.write',
    'ai.read', 'ai.write',
    'settings.read', 'settings.write',
    'audit.read',
    'org.read'
  ],
  manager: [
    'users.read',
    'tickets.read', 'tickets.write',
    'analytics.read', 'analytics.write',
    'ai.read', 'ai.write',
    'settings.read'
  ],
  agent: [
    'tickets.read', 'tickets.write',
    'analytics.read',
    'ai.read'
  ],
  readonly: [
    'tickets.read',
    'analytics.read'
  ]
};

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

async function debugUserPermissions() {
  console.log('🔍 Debugging user permissions...\n');

  try {
    // Get your user from the database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'mpwright@ebay.com')
      .single();

    if (error) {
      console.error('❌ Error fetching user:', error.message);
      return;
    }

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log('👤 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   Organization: ${user.organization_id}`);

    console.log('\n🔑 Expected Permissions for org_admin:');
    const expectedPermissions = getRolePermissions('org_admin');
    expectedPermissions.forEach(perm => {
      console.log(`   ✅ ${perm}`);
    });

    console.log('\n🔍 Key Permission Checks:');
    console.log(`   users.read: ${expectedPermissions.includes('users.read') ? '✅' : '❌'}`);
    console.log(`   users.write: ${expectedPermissions.includes('users.write') ? '✅' : '❌'}`);
    console.log(`   users.delete: ${expectedPermissions.includes('users.delete') ? '✅' : '❌'}`);

    console.log('\n📊 Analysis:');
    if (user.role === 'org_admin' && user.is_active && expectedPermissions.includes('users.read')) {
      console.log('   ✅ User SHOULD have access to team management');
      console.log('   🔧 Issue likely in the frontend permission checking');
    } else {
      console.log('   ❌ User should NOT have access based on current role/status');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

debugUserPermissions();