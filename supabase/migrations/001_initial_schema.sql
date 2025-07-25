-- =============================================================================
-- SignalCX Database Schema - Initial Migration
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('readonly', 'agent', 'manager', 'org_admin', 'super_admin');
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE ticket_status AS ENUM ('new', 'open', 'pending', 'hold', 'solved', 'closed');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE organization_plan AS ENUM ('free', 'pro', 'enterprise');

-- =============================================================================
-- Core Tables
-- =============================================================================

-- Organizations table (multi-tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT,
    logo TEXT,
    plan organization_plan DEFAULT 'free',
    max_users INTEGER DEFAULT 5,
    current_users INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    owner_id UUID,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT organizations_name_check CHECK (length(name) >= 1),
    CONSTRAINT organizations_max_users_check CHECK (max_users > 0)
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    role user_role DEFAULT 'readonly',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    firebase_uid TEXT, -- For Firebase auth compatibility
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    
    UNIQUE(email, organization_id),
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL, -- Zendesk ID or generated ID
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority ticket_priority DEFAULT 'normal',
    status ticket_status DEFAULT 'new',
    assignee_id UUID REFERENCES users(id),
    requester_email TEXT NOT NULL,
    requester_name TEXT,
    view TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    sla_breached BOOLEAN DEFAULT false,
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    first_response_at TIMESTAMPTZ,
    solved_at TIMESTAMPTZ,
    
    UNIQUE(external_id, organization_id),
    CONSTRAINT tickets_subject_check CHECK (length(subject) >= 1)
);

-- Conversations table (ticket messages/comments)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    author_email TEXT,
    author_name TEXT,
    body TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    sender_type TEXT CHECK (sender_type IN ('customer', 'agent', 'system')),
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT conversations_body_check CHECK (length(body) >= 1)
);

-- User invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role user_role NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES users(id),
    status invitation_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT invitations_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT invitations_expires_check CHECK (expires_at > created_at)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT audit_logs_action_check CHECK (length(action) >= 1),
    CONSTRAINT audit_logs_resource_type_check CHECK (length(resource_type) >= 1)
);

-- =============================================================================
-- Analytics and Performance Tables
-- =============================================================================

-- Agent performance metrics
CREATE TABLE agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    tickets_solved INTEGER DEFAULT 0,
    hours_worked DECIMAL(5,2) DEFAULT 0,
    tickets_per_hour DECIMAL(5,2) DEFAULT 0,
    avg_csat DECIMAL(3,2),
    avg_resolution_time_hours DECIMAL(8,2),
    tier TEXT CHECK (tier IN ('Tier 1', 'Tier 2', 'Tier 3')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agent_id, week_start),
    CONSTRAINT agent_performance_metrics_check CHECK (
        tickets_solved >= 0 AND 
        hours_worked >= 0 AND 
        tickets_per_hour >= 0
    )
);

-- Ticket analysis cache
CREATE TABLE ticket_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sentiment TEXT CHECK (sentiment IN ('Positive', 'Neutral', 'Negative')),
    category TEXT,
    summary TEXT,
    analysis_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(ticket_id)
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Organizations
CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_active ON organizations(is_active);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Tickets
CREATE INDEX idx_tickets_organization ON tickets(organization_id);
CREATE INDEX idx_tickets_external_id ON tickets(external_id);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_requester ON tickets(requester_email);
CREATE INDEX idx_tickets_tags ON tickets USING GIN(tags);

-- Conversations
CREATE INDEX idx_conversations_ticket ON conversations(ticket_id);
CREATE INDEX idx_conversations_author ON conversations(author_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Invitations
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_organization ON invitations(organization_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);

-- Audit logs
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Agent performance
CREATE INDEX idx_agent_performance_agent ON agent_performance(agent_id);
CREATE INDEX idx_agent_performance_week ON agent_performance(week_start);
CREATE INDEX idx_agent_performance_org ON agent_performance(organization_id);

-- Ticket analyses
CREATE INDEX idx_ticket_analyses_ticket ON ticket_analyses(ticket_id);
CREATE INDEX idx_ticket_analyses_sentiment ON ticket_analyses(sentiment);
CREATE INDEX idx_ticket_analyses_category ON ticket_analyses(category);

-- =============================================================================
-- Full Text Search
-- =============================================================================

-- Add full text search to tickets
ALTER TABLE tickets ADD COLUMN search_vector tsvector;

CREATE INDEX idx_tickets_search ON tickets USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_ticket_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.subject, '')), 'A') ||
                        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
                        setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
CREATE TRIGGER update_tickets_search_vector
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_ticket_search_vector();

-- =============================================================================
-- Triggers for Auto-timestamps
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at columns
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_performance_updated_at BEFORE UPDATE ON agent_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_analyses_updated_at BEFORE UPDATE ON ticket_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Update organization user count function
-- =============================================================================

CREATE OR REPLACE FUNCTION update_organization_user_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE organizations 
        SET current_users = (
            SELECT COUNT(*) 
            FROM users 
            WHERE organization_id = NEW.organization_id AND is_active = true
        )
        WHERE id = NEW.organization_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update count for both old and new organizations if org changed
        IF OLD.organization_id != NEW.organization_id THEN
            UPDATE organizations 
            SET current_users = (
                SELECT COUNT(*) 
                FROM users 
                WHERE organization_id = OLD.organization_id AND is_active = true
            )
            WHERE id = OLD.organization_id;
        END IF;
        
        UPDATE organizations 
        SET current_users = (
            SELECT COUNT(*) 
            FROM users 
            WHERE organization_id = NEW.organization_id AND is_active = true
        )
        WHERE id = NEW.organization_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE organizations 
        SET current_users = (
            SELECT COUNT(*) 
            FROM users 
            WHERE organization_id = OLD.organization_id AND is_active = true
        )
        WHERE id = OLD.organization_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_org_user_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION update_organization_user_count();