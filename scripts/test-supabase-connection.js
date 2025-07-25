#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');

console.log('Environment:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${anonKey ? anonKey.substring(0, 20) + '...' : 'Missing'}`);
console.log(`Service Key: ${serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'Missing'}`);

async function testConnection() {
  try {
    console.log('\n1. Testing with Anon Key...');
    const anonClient = createClient(supabaseUrl, anonKey);
    
    const { data, error } = await anonClient
      .from('users')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${error.details}`);
    } else {
      console.log('   ✅ Anon connection successful');
    }

    console.log('\n2. Testing Google OAuth URL generation...');
    const { data: oauthData, error: oauthError } = await anonClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:9002',
      }
    });

    if (oauthError) {
      console.log(`   OAuth Error: ${oauthError.message}`);
    } else {
      console.log('   ✅ OAuth URL generation successful');
      console.log(`   URL: ${oauthData.url}`);
    }

  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
}

testConnection();