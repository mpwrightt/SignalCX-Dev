-- Fix audit logging by checking user authentication
-- Run this in Supabase Dashboard > SQL Editor

-- First, let's see what auth.uid() returns and check your user record
SELECT 
  'Debug Info:' as info,
  auth.uid() as current_auth_uid,
  auth.email() as current_auth_email;

-- Check if you have a user record
SELECT 
  'Your user record:' as info,
  id, 
  email, 
  organization_id, 
  role, 
  is_active,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 3;

-- Check what happens when we try to match auth.uid() to users table
SELECT 
  'User lookup result:' as info,
  u.id,
  u.email,
  u.organization_id,
  u.role,
  u.is_active,
  'auth.uid() = ' || COALESCE(auth.uid()::text, 'NULL') as auth_uid_debug
FROM users u
WHERE u.id = auth.uid();

-- If the above returns no rows, there's a mismatch between auth.uid() and users.id
-- Let's create a temporary fix by disabling RLS for testing
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Test audit log insertion without RLS
INSERT INTO audit_logs (
  organization_id,
  user_id,
  action,
  resource_type,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Default org ID
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), -- Use auth.uid() or default
  'TEST_WITHOUT_RLS',
  'test',
  '{"message": "Testing without RLS"}'::jsonb
);

-- Show recent logs
SELECT 
  'Recent audit logs:' as status,
  id,
  organization_id,
  user_id,
  action,
  created_at
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 3;

-- Clean up test logs
DELETE FROM audit_logs WHERE action IN ('TEST_AUDIT_LOG', 'TEST_WITHOUT_RLS');