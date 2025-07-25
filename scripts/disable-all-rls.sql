-- Disable RLS for all tables in single-company deployment
-- Run this in Supabase Dashboard > SQL Editor

-- First, let's see what tables currently have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  'Disabling RLS...' as action
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Disable RLS on all your application tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies to clean up
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    -- Drop all policies on public schema tables
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_still_enabled,
  CASE 
    WHEN rowsecurity = false THEN '✅ RLS Disabled'
    ELSE '❌ Still Enabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'organizations', 'invitations', 'audit_logs', 'agent_performance', 'conversations', 'ticket_analyses', 'tickets')
ORDER BY tablename;

-- Test that everything works
INSERT INTO audit_logs (
  organization_id,
  user_id,
  action,
  resource_type,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '2e439884-4104-4d71-acdb-7cc877feefec',
  'RLS_DISABLED_SUCCESS',
  'test',
  '{"message": "All RLS disabled - database operations simplified!"}'::jsonb
);

SELECT 'RLS disabled successfully! Database operations are now simplified.' as result;

-- Clean up test
DELETE FROM audit_logs WHERE action = 'RLS_DISABLED_SUCCESS';