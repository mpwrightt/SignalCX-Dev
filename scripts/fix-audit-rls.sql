-- Fix RLS policies for audit_logs table
-- This allows users to insert audit logs for their own organization

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert audit logs for their organization" ON audit_logs;
DROP POLICY IF EXISTS "Users can read audit logs for their organization" ON audit_logs;

-- Create policy for inserting audit logs
-- Users can insert audit logs for their own organization
CREATE POLICY "Users can insert audit logs for their organization" ON audit_logs
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.organization_id = audit_logs.organization_id
    AND users.is_active = true
  )
);

-- Create policy for reading audit logs
-- Users can read audit logs for their own organization (manager+ only)
CREATE POLICY "Users can read audit logs for their organization" ON audit_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.organization_id = audit_logs.organization_id
    AND users.is_active = true
    AND users.role IN ('manager', 'org_admin', 'super_admin')
  )
);

-- Make sure RLS is enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;