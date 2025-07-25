-- Diagnose audit logging RLS issues
-- Run this in Supabase Dashboard > SQL Editor to identify the problem

-- 1. Check current user authentication
SELECT 
  'Current auth.uid():', 
  auth.uid() as current_user_id,
  'Current role:', 
  current_setting('role', true) as current_role;

-- 2. Check your user record
SELECT 
  'Your user record:' as info,
  id, 
  email, 
  organization_id, 
  role, 
  is_active 
FROM users 
WHERE id = auth.uid();

-- 3. Test audit log insertion directly
INSERT INTO audit_logs (
  organization_id,
  user_id,
  action,
  resource_type,
  metadata
) VALUES (
  (SELECT organization_id FROM users WHERE id = auth.uid()),
  auth.uid(),
  'TEST_AUDIT_LOG',
  'test',
  '{"test": true}'::jsonb
);

-- 4. Check if the audit log was inserted
SELECT 
  'Recent audit logs:' as info,
  id,
  organization_id,
  user_id,
  action,
  resource_type,
  created_at
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check RLS policies
SELECT 
  'Current RLS policies:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'audit_logs';

-- Clean up test log
DELETE FROM audit_logs WHERE action = 'TEST_AUDIT_LOG';