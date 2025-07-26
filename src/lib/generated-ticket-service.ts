/**
 * Generated Ticket Service
 * Manages AI-generated Zendesk tickets for demo mode analytics
 */

import { createSupabaseBrowserClient } from './supabase-config';
import type { ZendeskTicket, TicketGenerationInput, TicketGenerationOutput } from '@/ai/flows/generate-zendesk-tickets';

export interface StoredTicket {
  id: string;
  organization_id: string;
  ticket_data: ZendeskTicket;
  scenario: 'mixed' | 'billing' | 'technical' | 'shipping' | 'refunds' | 'account';
  generation_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TicketAnalytics {
  totalTickets: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byScenario: Record<string, number>;
  byChannel: Record<string, number>;
  averageResponseTime: number;
  recentTickets: StoredTicket[];
}

export class GeneratedTicketService {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get all generated tickets for an organization
   */
  async getTickets(
    organizationId: string,
    options: {
      limit?: number;
      scenario?: string;
      status?: string;
      priority?: string;
      sortBy?: 'created_at' | 'ticket_created_at';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<StoredTicket[]> {
    try {
      let query = this.supabase
        .from('generated_tickets')
        .select('*')
        .eq('organization_id', organizationId);

      // Apply filters
      if (options.scenario) {
        query = query.eq('scenario', options.scenario);
      }

      if (options.status) {
        query = query.eq('ticket_data->>status', options.status);
      }

      if (options.priority) {
        query = query.eq('ticket_data->>priority', options.priority);
      }

      // Apply sorting
      const sortColumn = options.sortBy === 'ticket_created_at' 
        ? 'ticket_data->>created_at' 
        : 'created_at';
      
      query = query.order(sortColumn, { 
        ascending: options.sortOrder === 'asc' 
      });

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching generated tickets:', error);
        throw new Error(`Failed to fetch tickets: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTickets:', error);
      throw error;
    }
  }

  /**
   * Get a single ticket by ID
   */
  async getTicketById(ticketId: string): Promise<StoredTicket | null> {
    try {
      const { data, error } = await this.supabase
        .from('generated_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch ticket: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getTicketById:', error);
      throw error;
    }
  }

  /**
   * Get ticket analytics for an organization
   */
  async getTicketAnalytics(organizationId: string): Promise<TicketAnalytics> {
    try {
      // Get all tickets for analytics
      const tickets = await this.getTickets(organizationId);
      
      const analytics: TicketAnalytics = {
        totalTickets: tickets.length,
        byStatus: {},
        byPriority: {},
        byScenario: {},
        byChannel: {},
        averageResponseTime: 0,
        recentTickets: tickets.slice(0, 10) // Last 10 tickets
      };

      // Calculate distributions
      tickets.forEach(ticket => {
        const ticketData = ticket.ticket_data;
        
        // Count by status
        const status = ticketData.status || 'unknown';
        analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;
        
        // Count by priority
        const priority = ticketData.priority || 'normal';
        analytics.byPriority[priority] = (analytics.byPriority[priority] || 0) + 1;
        
        // Count by scenario
        analytics.byScenario[ticket.scenario] = (analytics.byScenario[ticket.scenario] || 0) + 1;
        
        // Count by channel
        const channel = ticketData.via?.channel || 'unknown';
        analytics.byChannel[channel] = (analytics.byChannel[channel] || 0) + 1;
      });

      // Calculate average response time (mock calculation)
      const resolvedTickets = tickets.filter(t => 
        ['solved', 'closed'].includes(t.ticket_data.status)
      );
      
      if (resolvedTickets.length > 0) {
        const totalResponseTime = resolvedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.ticket_data.created_at);
          const updated = new Date(ticket.ticket_data.updated_at);
          return sum + (updated.getTime() - created.getTime());
        }, 0);
        
        analytics.averageResponseTime = totalResponseTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
      }

      return analytics;
    } catch (error) {
      console.error('Error in getTicketAnalytics:', error);
      throw error;
    }
  }

  /**
   * Delete all generated tickets for an organization
   */
  async clearTickets(organizationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('generated_tickets')
        .delete()
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(`Failed to clear tickets: ${error.message}`);
      }

      console.log(`[TICKET_SERVICE] Cleared all generated tickets for org: ${organizationId}`);
    } catch (error) {
      console.error('Error in clearTickets:', error);
      throw error;
    }
  }

  /**
   * Delete tickets by scenario
   */
  async clearTicketsByScenario(
    organizationId: string, 
    scenario: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('generated_tickets')
        .delete()
        .eq('organization_id', organizationId)
        .eq('scenario', scenario);

      if (error) {
        throw new Error(`Failed to clear ${scenario} tickets: ${error.message}`);
      }

      console.log(`[TICKET_SERVICE] Cleared ${scenario} tickets for org: ${organizationId}`);
    } catch (error) {
      console.error('Error in clearTicketsByScenario:', error);
      throw error;
    }
  }

  /**
   * Get tickets formatted for existing analytics system
   * Converts Zendesk format to the app's Ticket type
   */
  async getTicketsForAnalytics(organizationId: string): Promise<any[]> {
    try {
      const storedTickets = await this.getTickets(organizationId, { limit: 1000 });
      
      return storedTickets.map(stored => {
        const zendesk = stored.ticket_data;
        
        // Convert Zendesk format to app's Ticket format
        return {
          id: zendesk.id,
          subject: zendesk.subject,
          requester: `user_${zendesk.requester_id}@example.com`,
          assignee: zendesk.assignee_id ? `agent_${zendesk.assignee_id}` : undefined,
          description: zendesk.description,
          created_at: zendesk.created_at,
          first_response_at: zendesk.status !== 'new' ? zendesk.updated_at : undefined,
          solved_at: ['solved', 'closed'].includes(zendesk.status) ? zendesk.updated_at : undefined,
          status: zendesk.status,
          priority: zendesk.priority,
          tags: zendesk.tags || [],
          view: stored.scenario,
          category: this.mapScenarioToCategory(stored.scenario),
          conversation: this.generateConversation(zendesk),
          sla_breached: this.calculateSLABreach(zendesk),
          csat_score: this.generateCSATScore(zendesk),
          organizationId
        };
      });
    } catch (error) {
      console.error('Error in getTicketsForAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get generation statistics
   */
  async getGenerationStats(organizationId: string): Promise<{
    totalGenerated: number;
    lastGenerated: string | null;
    scenarioBreakdown: Record<string, number>;
    qualityScores: number[];
  }> {
    try {
      const tickets = await this.getTickets(organizationId);
      
      const stats = {
        totalGenerated: tickets.length,
        lastGenerated: tickets.length > 0 ? tickets[0].created_at : null,
        scenarioBreakdown: {} as Record<string, number>,
        qualityScores: [] as number[]
      };

      tickets.forEach(ticket => {
        // Count scenarios
        stats.scenarioBreakdown[ticket.scenario] = 
          (stats.scenarioBreakdown[ticket.scenario] || 0) + 1;
        
        // Collect quality scores
        const qualityScore = ticket.generation_metadata?.quality_score;
        if (typeof qualityScore === 'number') {
          stats.qualityScores.push(qualityScore);
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getGenerationStats:', error);
      throw error;
    }
  }

  // Private helper methods
  private mapScenarioToCategory(scenario: string): string {
    const mapping: Record<string, string> = {
      'billing': 'Billing',
      'technical': 'Technical Issue',
      'shipping': 'Shipping',
      'refunds': 'Refund Request',
      'account': 'Account Access',
      'mixed': 'General Support'
    };
    return mapping[scenario] || 'Other';
  }

  private generateConversation(ticket: ZendeskTicket): Array<{
    sender: 'customer' | 'agent';
    message: string;
    timestamp: string;
  }> {
    const conversation = [
      {
        sender: 'customer' as const,
        message: ticket.description,
        timestamp: ticket.created_at
      }
    ];

    // Add agent response for non-new tickets
    if (ticket.status !== 'new') {
      conversation.push({
        sender: 'agent' as const,
        message: this.generateAgentResponse(ticket),
        timestamp: ticket.updated_at
      });
    }

    return conversation;
  }

  private generateAgentResponse(ticket: ZendeskTicket): string {
    const responses = [
      "Thank you for contacting us. I'm looking into your issue now.",
      "I understand your concern. Let me help you resolve this.",
      "Thanks for reaching out. I'm reviewing your account details.",
      "I apologize for the inconvenience. I'm working on a solution.",
      "Thank you for providing those details. I'm investigating this issue."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private calculateSLABreach(ticket: ZendeskTicket): boolean {
    if (!ticket.due_at) return false;
    
    const dueDate = new Date(ticket.due_at);
    const now = new Date();
    
    return now > dueDate && !['solved', 'closed'].includes(ticket.status);
  }

  private generateCSATScore(ticket: ZendeskTicket): number | undefined {
    // Only solved/closed tickets have CSAT scores
    if (!['solved', 'closed'].includes(ticket.status)) {
      return undefined;
    }
    
    // Generate realistic CSAT distribution (1-5 scale)
    const rand = Math.random();
    if (rand < 0.4) return 5; // 40% excellent
    if (rand < 0.65) return 4; // 25% good
    if (rand < 0.8) return 3;  // 15% neutral
    if (rand < 0.9) return 2;  // 10% poor
    return 1; // 10% terrible
  }
}

// Export singleton instance
export const generatedTicketService = new GeneratedTicketService();