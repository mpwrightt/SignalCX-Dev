-- Migration: Add generated_tickets table for storing AI-generated Zendesk tickets
-- This table stores synthetic tickets generated for demo mode analytics

-- Create generated_tickets table
CREATE TABLE IF NOT EXISTS generated_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  ticket_data JSONB NOT NULL,
  scenario TEXT NOT NULL CHECK (scenario IN ('mixed', 'billing', 'technical', 'shipping', 'refunds', 'account')),
  generation_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_tickets_organization_id ON generated_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_generated_tickets_scenario ON generated_tickets(scenario);
CREATE INDEX IF NOT EXISTS idx_generated_tickets_created_at ON generated_tickets(created_at);

-- Add GIN index for JSONB ticket_data queries
CREATE INDEX IF NOT EXISTS idx_generated_tickets_ticket_data_gin ON generated_tickets USING GIN (ticket_data);

-- Add partial index for active tickets (not solved/closed)
CREATE INDEX IF NOT EXISTS idx_generated_tickets_active 
ON generated_tickets(organization_id, created_at) 
WHERE (ticket_data->>'status') NOT IN ('solved', 'closed');

-- Add index for priority queries
CREATE INDEX IF NOT EXISTS idx_generated_tickets_priority 
ON generated_tickets(organization_id, (ticket_data->>'priority'));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_generated_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generated_tickets_updated_at_trigger
  BEFORE UPDATE ON generated_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_tickets_updated_at();

-- Add comments for documentation
COMMENT ON TABLE generated_tickets IS 'AI-generated synthetic Zendesk tickets for demo mode analytics';
COMMENT ON COLUMN generated_tickets.ticket_data IS 'Complete Zendesk ticket object in JSON format';
COMMENT ON COLUMN generated_tickets.scenario IS 'Support scenario used for generation (billing, technical, etc.)';
COMMENT ON COLUMN generated_tickets.generation_metadata IS 'Metadata about the generation process (AI model, quality score, etc.)';

-- Create a view for easy ticket querying
CREATE OR REPLACE VIEW ticket_analytics_view AS
SELECT 
  gt.id,
  gt.organization_id,
  gt.scenario,
  gt.created_at as generated_at,
  (gt.ticket_data->>'id')::INTEGER as ticket_id,
  gt.ticket_data->>'subject' as subject,
  gt.ticket_data->>'status' as status,
  gt.ticket_data->>'priority' as priority,
  gt.ticket_data->>'type' as ticket_type,
  (gt.ticket_data->>'requester_id')::INTEGER as requester_id,
  (gt.ticket_data->>'assignee_id')::INTEGER as assignee_id,
  (gt.ticket_data->>'group_id')::INTEGER as group_id,
  gt.ticket_data->>'created_at' as ticket_created_at,
  gt.ticket_data->>'updated_at' as ticket_updated_at,
  gt.ticket_data->'tags' as tags,
  gt.ticket_data->'via'->>'channel' as via_channel,
  LENGTH(gt.ticket_data->>'description') as description_length,
  gt.generation_metadata
FROM generated_tickets gt;

COMMENT ON VIEW ticket_analytics_view IS 'Flattened view of generated tickets for analytics queries';

-- Sample query examples (commented out)
/*
-- Get all tickets by priority
SELECT priority, COUNT(*) 
FROM ticket_analytics_view 
WHERE organization_id = 'org-123'
GROUP BY priority;

-- Get tickets by scenario and status
SELECT scenario, status, COUNT(*)
FROM ticket_analytics_view 
WHERE organization_id = 'org-123'
GROUP BY scenario, status
ORDER BY scenario, status;

-- Get recent high priority tickets
SELECT ticket_id, subject, priority, ticket_created_at
FROM ticket_analytics_view 
WHERE organization_id = 'org-123'
  AND priority IN ('high', 'urgent')
  AND ticket_created_at >= NOW() - INTERVAL '7 days'
ORDER BY ticket_created_at DESC;
*/