-- RLS Policies for audit_logs table
-- This script creates proper Row Level Security policies for the audit_logs table

-- First, ensure RLS is enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;

-- Policy 1: SELECT - Users can read audit logs from their organization
-- Only managers and above can read audit logs (based on RBAC permissions)
CREATE POLICY "audit_logs_select_policy" ON audit_logs
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid() 
    AND is_active = true
    AND role IN ('manager', 'org_admin', 'super_admin')
  )
);

-- Policy 2: INSERT - Allow inserting audit logs for the user's organization
-- Any authenticated user can create audit logs for their organization
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
FOR INSERT
WITH CHECK (
  -- Check that the organization_id matches the user's organization
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid() 
    AND is_active = true
  )
  -- Allow inserting with any user_id within the same organization or null
  AND (
    user_id IS NULL 
    OR user_id IN (
      SELECT id 
      FROM users 
      WHERE organization_id = audit_logs.organization_id
      AND is_active = true
    )
  )
);

-- Alternative INSERT policy for service role (if needed for server-side operations)
-- This allows service role to insert audit logs for any organization
CREATE POLICY "audit_logs_service_insert_policy" ON audit_logs
FOR INSERT
WITH CHECK (
  -- Allow service role to insert any audit log
  current_setting('role') = 'service_role'
  OR
  -- Regular user policy (same as above)
  (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() 
      AND is_active = true
    )
    AND (
      user_id IS NULL 
      OR user_id IN (
        SELECT id 
        FROM users 
        WHERE organization_id = audit_logs.organization_id
        AND is_active = true
      )
    )
  )
);

-- Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;
GRANT SELECT ON audit_logs TO service_role;
GRANT INSERT ON audit_logs TO service_role;

-- Test the policies (optional - remove in production)
-- These are test queries to verify the policies work correctly
-- SELECT 'RLS policies created successfully for audit_logs table' as status;