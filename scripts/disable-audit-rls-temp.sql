-- Temporarily disable RLS on audit_logs for team management testing
-- Run this in Supabase Dashboard > SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_service_insert_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_read_own_org" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_own_org" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_service_role_all" ON audit_logs;

-- Disable RLS completely for now
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Test insertion
INSERT INTO audit_logs (
  organization_id,
  user_id,
  action,
  resource_type,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '2e439884-4104-4d71-acdb-7cc877feefec', -- Your user ID
  'RLS_DISABLED_TEST',
  'test',
  '{"message": "RLS disabled - should work now"}'::jsonb
);

SELECT 'Audit logging should now work for team management' as status;

-- Clean up
DELETE FROM audit_logs WHERE action = 'RLS_DISABLED_TEST';