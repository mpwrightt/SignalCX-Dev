-- Simplified RLS policies for audit_logs - more permissive for testing
-- Run this in Supabase Dashboard > SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_service_insert_policy" ON audit_logs;

-- Simple SELECT policy - any authenticated user can read their org's audit logs
CREATE POLICY "audit_logs_read_own_org" ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.organization_id = audit_logs.organization_id
    AND users.is_active = true
  )
);

-- Simple INSERT policy - any authenticated user can insert audit logs for their org
CREATE POLICY "audit_logs_insert_own_org" ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.organization_id = audit_logs.organization_id
    AND users.is_active = true
  )
);

-- Fallback: Allow service role to do anything (for server-side operations)
CREATE POLICY "audit_logs_service_role_all" ON audit_logs
TO service_role
USING (true)
WITH CHECK (true);

-- Test insertion with current user
DO $$
DECLARE
    current_org_id UUID;
BEGIN
    -- Get current user's organization
    SELECT organization_id INTO current_org_id 
    FROM users 
    WHERE id = auth.uid() 
    AND is_active = true;
    
    IF current_org_id IS NOT NULL THEN
        -- Insert test audit log
        INSERT INTO audit_logs (
            organization_id,
            user_id, 
            action,
            resource_type,
            metadata
        ) VALUES (
            current_org_id,
            auth.uid(),
            'RLS_TEST_SUCCESS',
            'test',
            '{"message": "RLS policies working"}'::jsonb
        );
        
        RAISE NOTICE 'Test audit log inserted successfully for org: %', current_org_id;
    ELSE
        RAISE NOTICE 'No active user found for auth.uid(): %', auth.uid();
    END IF;
END $$;

-- Show recent audit logs to verify
SELECT 
    'Recent audit logs:' as status,
    id,
    action,
    user_id,
    organization_id,
    created_at
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 3;