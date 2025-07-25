-- =============================================================================
-- Row Level Security (RLS) Policies for SignalCX (Fixed Version)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_analyses ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Helper Functions for RLS (moved to public schema)
-- =============================================================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid()::uuid;
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role
    FROM public.users
    WHERE id = auth.uid()::uuid;
$$;

-- Check if user has specific role or higher
CREATE OR REPLACE FUNCTION public.has_role_or_higher(required_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT CASE
        WHEN public.get_user_role() = 'super_admin' THEN true
        WHEN public.get_user_role() = 'org_admin' AND required_role != 'super_admin' THEN true
        WHEN public.get_user_role() = 'manager' AND required_role IN ('readonly', 'agent', 'manager') THEN true
        WHEN public.get_user_role() = 'agent' AND required_role IN ('readonly', 'agent') THEN true
        WHEN public.get_user_role() = 'readonly' AND required_role = 'readonly' THEN true
        ELSE false
    END;
$$;

-- Check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT is_active
    FROM public.users
    WHERE id = auth.uid()::uuid;
$$;

-- =============================================================================
-- Organizations Policies
-- =============================================================================

-- Users can only see their own organization
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (
        auth.uid()::uuid IN (
            SELECT id FROM users WHERE organization_id = organizations.id
        )
    );

-- Only org_admin and super_admin can update organizations
CREATE POLICY "Org admins can update their organization"
    ON organizations FOR UPDATE
    USING (
        public.has_role_or_higher('org_admin'::user_role) AND
        public.get_user_organization_id() = id
    );

-- Only super_admin can insert/delete organizations
CREATE POLICY "Super admins can manage organizations"
    ON organizations FOR ALL
    USING (public.get_user_role() = 'super_admin'::user_role);

-- =============================================================================
-- Users Policies
-- =============================================================================

-- Users can view other users in their organization
CREATE POLICY "Users can view organization members"
    ON users FOR SELECT
    USING (
        public.is_user_active() AND
        organization_id = public.get_user_organization_id()
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (
        public.is_user_active() AND
        id = auth.uid()::uuid
    )
    WITH CHECK (
        public.is_user_active() AND
        id = auth.uid()::uuid AND
        -- Prevent role escalation
        (
            OLD.role = NEW.role OR
            public.has_role_or_higher('org_admin'::user_role)
        ) AND
        -- Prevent org change without proper permissions
        (
            OLD.organization_id = NEW.organization_id OR
            public.get_user_role() = 'super_admin'::user_role
        )
    );

-- Managers and above can manage users in their org
CREATE POLICY "Managers can manage organization users"
    ON users FOR ALL
    USING (
        public.is_user_active() AND
        public.has_role_or_higher('manager'::user_role) AND
        organization_id = public.get_user_organization_id()
    )
    WITH CHECK (
        public.is_user_active() AND
        public.has_role_or_higher('manager'::user_role) AND
        organization_id = public.get_user_organization_id() AND
        -- Role hierarchy checks
        (
            public.get_user_role() = 'super_admin'::user_role OR
            (public.get_user_role() = 'org_admin'::user_role AND role != 'super_admin'::user_role) OR
            (public.get_user_role() = 'manager'::user_role AND role IN ('readonly'::user_role, 'agent'::user_role))
        )
    );

-- =============================================================================
-- Tickets Policies
-- =============================================================================

-- Users can view tickets in their organization
CREATE POLICY "Users can view organization tickets"
    ON tickets FOR SELECT
    USING (
        public.is_user_active() AND
        organization_id = public.get_user_organization_id()
    );

-- Agents and above can create/update tickets
CREATE POLICY "Agents can manage tickets"
    ON tickets FOR INSERT
    WITH CHECK (
        public.is_user_active() AND
        public.has_role_or_higher('agent'::user_role) AND
        organization_id = public.get_user_organization_id()
    );

CREATE POLICY "Agents can update organization tickets"
    ON tickets FOR UPDATE
    USING (
        public.is_user_active() AND
        public.has_role_or_higher('agent'::user_role) AND
        organization_id = public.get_user_organization_id()
    )
    WITH CHECK (
        public.is_user_active() AND
        public.has_role_or_higher('agent'::user_role) AND
        organization_id = public.get_user_organization_id()
    );

-- Managers and above can delete tickets
CREATE POLICY "Managers can delete tickets"
    ON tickets FOR DELETE
    USING (
        public.is_user_active() AND
        public.has_role_or_higher('manager'::user_role) AND
        organization_id = public.get_user_organization_id()
    );

-- =============================================================================
-- Conversations Policies
-- =============================================================================

-- Users can view conversations for tickets in their org
CREATE POLICY "Users can view organization conversations"
    ON conversations FOR SELECT
    USING (
        public.is_user_active() AND
        ticket_id IN (
            SELECT id FROM tickets 
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Agents and above can create conversations
CREATE POLICY "Agents can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (
        public.is_user_active() AND
        public.has_role_or_higher('agent'::user_role) AND
        ticket_id IN (
            SELECT id FROM tickets 
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
    ON conversations FOR UPDATE
    USING (
        public.is_user_active() AND
        author_id = auth.uid()::uuid
    );

-- =============================================================================
-- Invitations Policies
-- =============================================================================

-- Users can view invitations for their organization
CREATE POLICY "Users can view organization invitations"
    ON invitations FOR SELECT
    USING (
        public.is_user_active() AND
        organization_id = public.get_user_organization_id()
    );

-- Org admins can manage invitations
CREATE POLICY "Org admins can manage invitations"
    ON invitations FOR ALL
    USING (
        public.is_user_active() AND
        public.has_role_or_higher('org_admin'::user_role) AND
        organization_id = public.get_user_organization_id()
    )
    WITH CHECK (
        public.is_user_active() AND
        public.has_role_or_higher('org_admin'::user_role) AND
        organization_id = public.get_user_organization_id()
    );

-- Allow public access for invitation acceptance (token-based)
CREATE POLICY "Public can access invitations by token"
    ON invitations FOR SELECT
    USING (token IS NOT NULL);

-- =============================================================================
-- Audit Logs Policies
-- =============================================================================

-- Managers and above can view audit logs for their org
CREATE POLICY "Managers can view organization audit logs"
    ON audit_logs FOR SELECT
    USING (
        public.is_user_active() AND
        public.has_role_or_higher('manager'::user_role) AND
        organization_id = public.get_user_organization_id()
    );

-- System can insert audit logs (service role)
CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- =============================================================================
-- Agent Performance Policies
-- =============================================================================

-- Users can view performance data for their org
CREATE POLICY "Users can view organization performance"
    ON agent_performance FOR SELECT
    USING (
        public.is_user_active() AND
        organization_id = public.get_user_organization_id()
    );

-- Managers can update performance data
CREATE POLICY "Managers can manage performance data"
    ON agent_performance FOR ALL
    USING (
        public.is_user_active() AND
        public.has_role_or_higher('manager'::user_role) AND
        organization_id = public.get_user_organization_id()
    )
    WITH CHECK (
        public.is_user_active() AND
        public.has_role_or_higher('manager'::user_role) AND
        organization_id = public.get_user_organization_id()
    );

-- =============================================================================
-- Ticket Analyses Policies
-- =============================================================================

-- Users can view analyses for tickets in their org
CREATE POLICY "Users can view organization ticket analyses"
    ON ticket_analyses FOR SELECT
    USING (
        public.is_user_active() AND
        ticket_id IN (
            SELECT id FROM tickets 
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Agents can create/update analyses
CREATE POLICY "Agents can manage ticket analyses"
    ON ticket_analyses FOR ALL
    USING (
        public.is_user_active() AND
        public.has_role_or_higher('agent'::user_role) AND
        ticket_id IN (
            SELECT id FROM tickets 
            WHERE organization_id = public.get_user_organization_id()
        )
    )
    WITH CHECK (
        public.is_user_active() AND
        public.has_role_or_higher('agent'::user_role) AND
        ticket_id IN (
            SELECT id FROM tickets 
            WHERE organization_id = public.get_user_organization_id()
        )
    );