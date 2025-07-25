#!/usr/bin/env node

/**
 * Set up the default organization for proper team management
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

async function setupDefaultOrganization() {
  console.log('🏢 Setting up default organization...\n');

  try {
    const defaultOrgId = '00000000-0000-0000-0000-000000000001';

    // 1. Check if default organization exists
    console.log('1. Checking for default organization...');
    const { data: existingOrg, error: getOrgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', defaultOrgId)
      .single();

    if (getOrgError && getOrgError.code !== 'PGRST116') {
      console.error('❌ Error checking organization:', getOrgError.message);
      return;
    }

    if (existingOrg) {
      console.log('   ✅ Default organization already exists:');
      console.log(`      Name: ${existingOrg.name}`);
      console.log(`      Plan: ${existingOrg.plan}`);
      console.log(`      Active: ${existingOrg.is_active}`);
    } else {
      // 2. Create default organization
      console.log('   📝 Creating default organization...');
      const { data: newOrg, error: createOrgError } = await supabase
        .from('organizations')
        .insert({
          id: defaultOrgId,
          name: 'Default Organization',
          domain: null,
          logo: null,
          plan: 'enterprise',
          max_users: 1000,
          current_users: 1,
          is_active: true,
          owner_id: '2e439884-4104-4d71-acdb-7cc877feefec', // Your user ID
          settings: {
            features: {
              team_management: true,
              analytics: true,
              ai_features: true
            }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createOrgError) {
        console.error('❌ Error creating organization:', createOrgError.message);
        return;
      }

      console.log('   ✅ Created default organization:');
      console.log(`      ID: ${newOrg.id}`);
      console.log(`      Name: ${newOrg.name}`);
      console.log(`      Plan: ${newOrg.plan}`);
    }

    // 3. Verify user is properly linked to organization
    console.log('\n2. Verifying user organization link...');
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'mpwright@ebay.com')
      .single();

    if (getUserError) {
      console.error('❌ Error getting user:', getUserError.message);
      return;
    }

    if (user.organization_id !== defaultOrgId) {
      console.log('   📝 Updating user organization link...');
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ organization_id: defaultOrgId })
        .eq('id', user.id);

      if (updateUserError) {
        console.error('❌ Error updating user:', updateUserError.message);
        return;
      }
      console.log('   ✅ User organization link updated');
    } else {
      console.log('   ✅ User already linked to default organization');
    }

    console.log('\n✨ Organization setup completed!');
    console.log('📋 Your setup:');
    console.log(`   User: ${user.email} (${user.role})`);
    console.log(`   Organization: Default Organization (${defaultOrgId})`);
    console.log(`   Permissions: Full org_admin access`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

setupDefaultOrganization();