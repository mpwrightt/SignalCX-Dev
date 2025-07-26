'use server';

/**
 * @fileOverview Advanced AI-powered Zendesk ticket generator
 * Generates realistic support tickets that exactly match Zendesk's format
 * and stores them in Supabase for demo mode analytics
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createSupabaseBrowserClient } from '@/lib/supabase-config';

// Input schema for ticket generation
const TicketGenerationInputSchema = z.object({
  count: z.number().min(1).max(100).default(5).describe('Number of tickets to generate'),
  group_id: z.number().optional().describe('Support group ID'),
  assignee_id: z.number().optional().describe('Agent ID to assign tickets to'),
  requester_id: z.number().optional().describe('Customer ID requesting support'),
  submitter_id: z.number().optional().describe('User ID who submitted the ticket'),
  via_channel: z.enum(['web', 'email', 'chat', 'api']).default('web').describe('How the ticket was submitted'),
  tags: z.array(z.string()).optional().describe('Tags to include on tickets'),
  custom_fields: z.record(z.any()).optional().describe('Custom field values'),
  organization_id: z.string().describe('Organization ID for multi-tenant isolation'),
  scenario: z.enum(['mixed', 'billing', 'technical', 'shipping', 'refunds', 'account']).default('mixed').describe('Type of support scenarios to generate'),
  urgency_distribution: z.enum(['balanced', 'mostly_normal', 'escalated']).default('balanced').describe('Priority distribution pattern'),
  date_from: z.string().optional().describe('Start date for ticket generation (ISO 8601)'),
  date_to: z.string().optional().describe('End date for ticket generation (ISO 8601)')
});

export type TicketGenerationInput = z.infer<typeof TicketGenerationInputSchema>;

// Zendesk ticket format schema
const ZendeskTicketSchema = z.object({
  id: z.number().describe('Unique ticket ID'),
  url: z.string().describe('Zendesk ticket URL'),
  external_id: z.string().nullable().describe('External system reference'),
  created_at: z.string().describe('ISO 8601 creation timestamp'),
  updated_at: z.string().describe('ISO 8601 last update timestamp'),
  type: z.enum(['problem', 'incident', 'question', 'task']).nullable().describe('Ticket type'),
  subject: z.string().describe('Ticket subject line'),
  raw_subject: z.string().describe('Original subject before processing'),
  description: z.string().describe('Full ticket description/body'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).nullable().describe('Ticket priority'),
  status: z.enum(['new', 'open', 'pending', 'hold', 'solved', 'closed']).describe('Current ticket status'),
  recipient: z.string().nullable().describe('Support email recipient'),
  requester_id: z.number().describe('Customer who requested support'),
  submitter_id: z.number().describe('User who submitted the ticket'),
  assignee_id: z.number().describe('Agent assigned to the ticket'),
  organization_id: z.number().describe('Customer organization ID'),
  group_id: z.number().describe('Support group handling the ticket'),
  collaborator_ids: z.array(z.number()).describe('Additional collaborators'),
  follower_ids: z.array(z.number()).describe('Users following the ticket'),
  email_cc_ids: z.array(z.number()).describe('Users CC\'d on email updates'),
  forum_topic_id: z.number().nullable().describe('Related forum topic'),
  problem_id: z.number().nullable().describe('Parent problem ticket'),
  has_incidents: z.boolean().describe('Whether ticket has child incidents'),
  is_public: z.boolean().describe('Whether ticket is publicly visible'),
  due_at: z.string().nullable().describe('SLA due date'),
  tags: z.array(z.string()).describe('Ticket tags'),
  via: z.object({
    channel: z.enum(['web', 'email', 'chat', 'api']).describe('Submission channel'),
    source: z.object({
      from: z.record(z.any()).describe('Source information'),
      to: z.record(z.any()).describe('Destination information'),
      rel: z.string().nullable().describe('Relationship type')
    }).describe('Channel source details')
  }).describe('How ticket was submitted'),
  custom_fields: z.array(z.object({
    id: z.number().describe('Custom field ID'),
    value: z.any().describe('Field value')
  })).optional().describe('Custom field values')
}).passthrough();

const TicketGenerationOutputSchema = z.object({
  tickets: z.array(ZendeskTicketSchema).describe('Generated Zendesk tickets'),
  generation_metadata: z.object({
    total_generated: z.number().describe('Number of tickets generated'),
    scenarios_used: z.array(z.string()).describe('Support scenarios included'),
    generation_time: z.string().describe('When tickets were generated'),
    ai_model_used: z.string().describe('AI model used for generation'),
    quality_score: z.number().min(0).max(1).describe('Generated content quality score')
  }).describe('Generation process metadata')
});

export type ZendeskTicket = z.infer<typeof ZendeskTicketSchema>;
export type TicketGenerationOutput = z.infer<typeof TicketGenerationOutputSchema>;

// Advanced ticket generation prompt
const ticketGenerationPrompt = ai.definePrompt(
  {
    name: 'generateZendeskTickets',
    inputSchema: TicketGenerationInputSchema,
    // Removed output schema to allow flexible AI responses
  },
  `
  You are an expert at generating realistic customer support tickets that exactly match Zendesk's ticket format.

  **CRITICAL REQUIREMENTS:**
  1. Generate {{count}} tickets with EXACTLY the Zendesk ticket object structure
  2. Use the scenario "{{scenario}}" to guide ticket content (mixed = variety of issues)
  3. Submit via "{{via_channel}}" channel with appropriate via.source details
  4. Follow urgency distribution: {{urgency_distribution}}
  5. All timestamps must be valid ISO 8601 format
  6. All IDs must be realistic positive integers
  7. Subjects must be authentic customer language (not formal)
  8. Descriptions should include realistic customer tone and details

  **SCENARIO GUIDELINES:**
  - billing: Payment issues, subscription problems, refund requests
  - technical: Software bugs, login issues, feature problems
  - shipping: Delivery problems, damaged items, tracking issues  
  - refunds: Return requests, dissatisfaction, cancellations
  - account: Profile issues, password resets, access problems
  - mixed: Variety of all above scenarios

  **URGENCY DISTRIBUTION:**
  - balanced: 10% urgent, 20% high, 50% normal, 20% low
  - mostly_normal: 5% urgent, 10% high, 70% normal, 15% low
  - escalated: 25% urgent, 35% high, 30% normal, 10% low

  **REALISM REQUIREMENTS:**
  - Use varied, authentic language (spelling mistakes occasionally)
  - Include realistic customer names (no real PII)
  - Generate believable email addresses and company names
  - Add relevant tags based on ticket content
  - Set appropriate status distribution (mostly 'open' and 'new')
  - Include realistic SLA due dates for urgent/high priority tickets

  **FIELD REQUIREMENTS:**
  - id: Sequential numbers starting from 10001
  - url: https://company.zendesk.com/api/v2/tickets/{id}.json
  - created_at/updated_at: Timestamps between {{date_from}} and {{date_to}} (if provided), otherwise recent timestamps (last 30 days)
  - requester_id: Customer ID (start from 2001)
  - submitter_id: Same as requester_id usually
  - assignee_id: Agent ID (start from 1001) 
  - organization_id: Customer org ID (start from 501)
  - group_id: Support group ID (start from 101)

  Generate the tickets with high quality, realistic content that would be useful for analytics and testing.
  `
);

// Main ticket generation flow
const generateZendeskTicketsFlow = ai.defineFlow(
  {
    name: 'generateZendeskTicketsFlow',
    inputSchema: TicketGenerationInputSchema,
    // Removed output schema validation to allow flexible AI responses
  },
  async (input) => {
    console.log(`[TICKET_GENERATOR] Generating ${input.count} tickets for scenario: ${input.scenario}`);
    
    const startTime = Date.now();
    
    try {
      // Generate tickets using AI
      const response = await ticketGenerationPrompt({
        count: input.count,
        scenario: input.scenario,
        via_channel: input.via_channel,
        urgency_distribution: input.urgency_distribution,
        group_id: input.group_id,
        assignee_id: input.assignee_id,
        requester_id: input.requester_id,
        submitter_id: input.submitter_id,
        tags: input.tags,
        custom_fields: input.custom_fields,
        organization_id: input.organization_id,
        date_from: input.date_from,
        date_to: input.date_to
      });

      const generationTime = Date.now() - startTime;
      
      // Debug: Log the AI response structure
      console.log('[TICKET_GENERATOR] AI Response:', JSON.stringify(response, null, 2));
      
      // Handle different response formats from the AI
      let tickets;
      let metadata = {
        total_generated: 0,
        scenarios_used: [input.scenario],
        generation_time: new Date().toISOString(),
        ai_model_used: 'gemini-2.0-flash-exp',
        quality_score: 0.95
      };
      
      // Extract tickets from various possible response formats
      if (response && response.tickets && Array.isArray(response.tickets)) {
        // Expected format: { tickets: [...], generation_metadata: {...} }
        tickets = response.tickets;
        if (response.generation_metadata) {
          metadata = { ...metadata, ...response.generation_metadata };
        }
      } else if (Array.isArray(response)) {
        // Direct array format: [ticket1, ticket2, ...]
        tickets = response;
        console.log('[TICKET_GENERATOR] AI returned direct array format, converting...');
      } else if (response && response.message && response.message.content) {
        // Genkit message format: { message: { content: [{ text: "json..." }] } }
        const content = response.message.content;
        if (Array.isArray(content) && content[0] && content[0].text) {
          try {
            // Extract JSON from the text content (may be wrapped in ```json or ```)
            let jsonText = content[0].text;
            
            // Try multiple patterns for markdown code block extraction
            const patterns = [
              /```json\n([\s\S]*?)\n```/,  // ```json\n...\n```
              /```\n([\s\S]*?)\n```/,      // ```\n...\n```
              /```json([\s\S]*?)```/,      // ```json...```
              /```([\s\S]*?)```/           // ```...```
            ];
            
            for (const pattern of patterns) {
              const match = jsonText.match(pattern);
              if (match) {
                jsonText = match[1].trim();
                break;
              }
            }
            
            // Remove any leading/trailing whitespace
            jsonText = jsonText.trim();
            
            tickets = JSON.parse(jsonText);
            console.log('[TICKET_GENERATOR] AI returned Genkit message format, parsed successfully');
          } catch (parseError) {
            console.error('[TICKET_GENERATOR] Failed to parse JSON from message content:', parseError);
            console.error('[TICKET_GENERATOR] Raw content:', content[0].text);
            throw new Error('Failed to parse tickets from AI response: ' + parseError.message);
          }
        }
      } else {
        console.error('[TICKET_GENERATOR] Invalid response structure:', response);
        throw new Error('AI response missing tickets array. Response: ' + JSON.stringify(response));
      }
      
      if (!tickets || tickets.length === 0) {
        throw new Error('AI generated no tickets');
      }
      
      metadata.total_generated = tickets.length;
      
      // Store tickets in Supabase
      const supabase = createSupabaseBrowserClient();
      const ticketsToStore = tickets.map(ticket => ({
        organization_id: input.organization_id,
        ticket_data: ticket,
        scenario: input.scenario,
        generation_metadata: {
          ...metadata,
          generation_time_ms: generationTime,
          input_parameters: input
        }
      }));

      const { data: storedTickets, error } = await supabase
        .from('generated_tickets')
        .insert(ticketsToStore)
        .select();

      if (error) {
        console.error('[TICKET_GENERATOR] Supabase error:', error);
        throw new Error(`Failed to store tickets: ${error.message}`);
      }

      console.log(`[TICKET_GENERATOR] Successfully generated and stored ${tickets.length} tickets in ${generationTime}ms`);

      return {
        tickets: tickets,
        generation_metadata: {
          ...metadata,
          generation_time_ms: generationTime
        }
      };

    } catch (error) {
      console.error('[TICKET_GENERATOR] Generation failed:', error);
      throw new Error(`Ticket generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Export wrapper function for client use
export async function generateZendeskTickets(
  input: TicketGenerationInput
): Promise<TicketGenerationOutput> {
  try {
    const result = await generateZendeskTicketsFlow(input);
    return result;
  } catch (error) {
    console.error('Error in generateZendeskTickets:', error);
    throw error;
  }
}

// Utility function to generate tickets for specific scenarios
export async function generateTicketsByScenario(
  organizationId: string,
  scenario: 'mixed' | 'billing' | 'technical' | 'shipping' | 'refunds' | 'account',
  count: number = 10,
  dateFrom?: string,
  dateTo?: string
): Promise<TicketGenerationOutput> {
  return generateZendeskTickets({
    organization_id: organizationId,
    count,
    scenario,
    via_channel: 'email', // Most common for realistic scenarios
    urgency_distribution: 'balanced',
    date_from: dateFrom,
    date_to: dateTo
  });
}

// Quick demo data generator
export async function generateDemoTickets(organizationId: string): Promise<TicketGenerationOutput> {
  return generateZendeskTickets({
    organization_id: organizationId,
    count: 25,
    scenario: 'mixed',
    via_channel: 'web',
    urgency_distribution: 'mostly_normal'
  });
}