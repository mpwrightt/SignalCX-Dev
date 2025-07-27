'use server';

/**
 * @fileOverview Advanced AI-powered Zendesk ticket generator
 * Generates realistic support tickets that exactly match Zendesk's format
 * and stores them in Supabase for demo mode analytics
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createSupabaseBrowserClient } from '@/lib/supabase-config';

// Retry function with exponential backoff for API failures
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  chunkNumber?: number
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isRateLimitOrNetwork = error.message.includes('fetch failed') || 
                                   error.message.includes('rate limit') ||
                                   error.message.includes('quota') ||
                                   error.message.includes('429');
      
      if (attempt === maxRetries || !isRateLimitOrNetwork) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`[TICKET_GENERATOR] ${chunkNumber ? `Chunk ${chunkNumber}` : 'Request'} failed (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`);
      console.log(`[TICKET_GENERATOR] Error: ${error.message}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// JSON parsing with error recovery for malformed AI responses
function parseJSONWithRecovery(jsonText: string, chunkNumber: number): any[] {
  try {
    // Try standard JSON parsing first
    return JSON.parse(jsonText);
  } catch (error) {
    console.warn(`[TICKET_GENERATOR] JSON parsing failed for chunk ${chunkNumber}, attempting recovery...`);
    console.log(`[TICKET_GENERATOR] Original JSON (first 500 chars):`, jsonText.substring(0, 500));
    
    try {
      // Common fixes for malformed JSON
      let fixedJson = jsonText;
      
      // Fix trailing commas before closing brackets
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix missing commas between objects (common AI error)
      fixedJson = fixedJson.replace(/}\s*{/g, '},{');
      
      // Fix incomplete JSON arrays (truncated responses)
      if (!fixedJson.trim().endsWith(']') && !fixedJson.trim().endsWith('}')) {
        // If it looks like an array, try to close it
        if (fixedJson.trim().startsWith('[')) {
          // Find the last complete object
          const lastBraceIndex = fixedJson.lastIndexOf('}');
          if (lastBraceIndex > 0) {
            fixedJson = fixedJson.substring(0, lastBraceIndex + 1) + ']';
            console.log(`[TICKET_GENERATOR] Attempted to close truncated array`);
          }
        }
      }
      
      console.log(`[TICKET_GENERATOR] Attempting to parse fixed JSON (first 500 chars):`, fixedJson.substring(0, 500));
      const result = JSON.parse(fixedJson);
      console.log(`[TICKET_GENERATOR] JSON recovery successful for chunk ${chunkNumber}`);
      return result;
      
    } catch (recoveryError) {
      console.error(`[TICKET_GENERATOR] JSON recovery failed for chunk ${chunkNumber}:`, recoveryError);
      console.error(`[TICKET_GENERATOR] Full malformed JSON:`, jsonText);
      throw new Error(`Unable to parse JSON from AI response in chunk ${chunkNumber}. Original error: ${error.message}`);
    }
  }
}

// Input schema for ticket generation
const TicketGenerationInputSchema = z.object({
  count: z.number().min(1).max(200).default(5).describe('Number of tickets to generate'),
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
  date_to: z.string().optional().describe('End date for ticket generation (ISO 8601)'),
  starting_id: z.number().optional().describe('Starting ticket ID to avoid duplicates')
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
  - id: Sequential numbers starting from {{starting_id}} (if provided, otherwise 10001)
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
      // Get the highest existing ticket ID to avoid duplicates
      const supabase = createSupabaseBrowserClient();
      const { data: existingTickets } = await supabase
        .from('generated_tickets')
        .select('ticket_data')
        .eq('organization_id', input.organization_id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      let startingId = 10001;
      if (existingTickets && existingTickets.length > 0) {
        const lastTicket = existingTickets[0];
        const lastId = lastTicket.ticket_data?.id || 10000;
        startingId = lastId + 1;
        console.log(`[TICKET_GENERATOR] Starting from ID ${startingId} (last ID was ${lastId})`);
      }
      
      // Use chunked generation for reliability with larger batches
      const CHUNK_SIZE = 8; // Generate max 8 tickets per AI call to avoid token limits
      const chunks = Math.ceil(input.count / CHUNK_SIZE);
      const allTickets: any[] = [];
      let currentStartingId = startingId;
      
      console.log(`[TICKET_GENERATOR] Using chunked generation: ${chunks} chunks of max ${CHUNK_SIZE} tickets each`);
      
      for (let i = 0; i < chunks; i++) {
        const remainingTickets = input.count - (i * CHUNK_SIZE);
        const chunkSize = Math.min(CHUNK_SIZE, remainingTickets);
        
        console.log(`[TICKET_GENERATOR] Generating chunk ${i + 1}/${chunks}: ${chunkSize} tickets starting from ID ${currentStartingId}`);
        
        // Generate tickets using AI with retry logic
        const response = await retryWithBackoff(
          () => ticketGenerationPrompt({
            count: chunkSize,
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
            date_to: input.date_to,
            starting_id: currentStartingId
          }),
          3, // maxRetries
          2000, // baseDelay (2 seconds)
          i + 1 // chunkNumber for logging
        );

        // Process this chunk's response
        let chunkTickets;
        
        // Debug: Log the full response structure for troubleshooting
        console.log(`[TICKET_GENERATOR] Chunk ${i + 1} response type:`, typeof response);
        console.log(`[TICKET_GENERATOR] Chunk ${i + 1} response keys:`, response ? Object.keys(response) : 'null');
        console.log(`[TICKET_GENERATOR] Chunk ${i + 1} full response:`, JSON.stringify(response, null, 2));
        
        // Handle different response formats from the AI
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            chunkTickets = response;
            console.log('[TICKET_GENERATOR] AI returned array format');
          } else if (response.tickets && Array.isArray(response.tickets)) {
            chunkTickets = response.tickets;
            console.log('[TICKET_GENERATOR] AI returned object with tickets array');
          } else if (response.message && response.message.content && Array.isArray(response.message.content)) {
            // Handle Genkit message format: { message: { content: [{ text: "json..." }] } }
            try {
              const content = response.message.content;
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
              
              // Attempt to parse JSON with error recovery
              chunkTickets = parseJSONWithRecovery(jsonText, i + 1);
              console.log('[TICKET_GENERATOR] AI returned Genkit message format, parsed successfully');
            } catch (parseError) {
              console.error('[TICKET_GENERATOR] Failed to parse JSON from message content:', parseError);
              console.error('[TICKET_GENERATOR] Raw content:', response.message.content[0].text);
              throw new Error(`Failed to parse tickets from chunk ${i + 1}: ${parseError.message}`);
            }
          } else if (response.content && Array.isArray(response.content)) {
            // Handle alternative content format
            try {
              const content = response.content;
              let jsonText = content[0].text;
              
              // Clean up the JSON string
              if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\s*/, '').replace(/\s*```$/, '');
              } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\s*/, '').replace(/\s*```$/, '');
              }
              
              jsonText = jsonText.trim();
              chunkTickets = parseJSONWithRecovery(jsonText, i + 1);
              console.log('[TICKET_GENERATOR] AI returned content array format, parsed successfully');
            } catch (parseError) {
              console.error('[TICKET_GENERATOR] Failed to parse JSON from content array:', parseError);
              console.error('[TICKET_GENERATOR] Raw content:', response.content[0].text);
              throw new Error(`Failed to parse tickets from chunk ${i + 1}: ${parseError.message}`);
            }
          } else {
            console.error('[TICKET_GENERATOR] Unrecognized response structure for chunk', i + 1);
            console.error('[TICKET_GENERATOR] Response:', response);
            throw new Error(`AI response missing tickets array in chunk ${i + 1}. Response keys: ${Object.keys(response || {}).join(', ')}`);
          }
        } else {
          console.error('[TICKET_GENERATOR] Invalid response structure:', response);
          throw new Error(`AI response missing tickets array in chunk ${i + 1}. Response: ${JSON.stringify(response)}`);
        }
        
        if (!chunkTickets || chunkTickets.length === 0) {
          throw new Error(`AI generated no tickets in chunk ${i + 1}`);
        }
        
        console.log(`[TICKET_GENERATOR] Chunk ${i + 1} generated ${chunkTickets.length} tickets`);
        allTickets.push(...chunkTickets);
        
        // Update starting ID for next chunk
        const highestIdInChunk = Math.max(...chunkTickets.map(t => t.id || 0));
        currentStartingId = highestIdInChunk + 1;
        
        // Add a small delay between chunks to avoid rate limiting (except for the last chunk)
        if (i < chunks - 1) {
          const delayMs = 1000 + Math.random() * 500; // 1-1.5 second delay
          console.log(`[TICKET_GENERATOR] Waiting ${Math.round(delayMs)}ms before next chunk to avoid rate limiting...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      
      const generationTime = Date.now() - startTime;
      console.log(`[TICKET_GENERATOR] All chunks completed. Total tickets generated: ${allTickets.length}`);
      
      // Check for duplicates against existing database tickets
      console.log(`[TICKET_GENERATOR] Checking for duplicate ticket IDs in database...`);
      const generatedIds = allTickets.map(t => t.id).filter(id => id != null);
      let ticketsToProcess = allTickets;
      
      if (generatedIds.length > 0) {
        const { data: existingTicketsWithIds } = await supabase
          .from('generated_tickets')
          .select('ticket_data')
          .eq('organization_id', input.organization_id)
          .in('ticket_data->>id', generatedIds.map(String)); // PostgreSQL JSONB query
        
        const existingIds = new Set(
          (existingTicketsWithIds || [])
            .map(t => t.ticket_data?.id)
            .filter(id => id != null)
        );
        
        console.log(`[TICKET_GENERATOR] Found ${existingIds.size} existing ticket IDs that would be duplicates`);
        
        // Filter out duplicates
        const uniqueTickets = allTickets.filter(ticket => {
          const isDuplicate = existingIds.has(ticket.id);
          if (isDuplicate) {
            console.log(`[TICKET_GENERATOR] Filtering out duplicate ticket ID: ${ticket.id}`);
          }
          return !isDuplicate;
        });
        
        console.log(`[TICKET_GENERATOR] After duplicate filtering: ${uniqueTickets.length} unique tickets`);
        
        if (uniqueTickets.length === 0) {
          console.warn(`[TICKET_GENERATOR] All generated tickets were duplicates! This suggests the AI is not following the starting_id parameter correctly.`);
          throw new Error(`All ${allTickets.length} generated tickets were duplicates of existing tickets. Try clearing existing tickets or check AI generation logic.`);
        }
        
        ticketsToProcess = uniqueTickets;
      } else {
        console.warn(`[TICKET_GENERATOR] No valid ticket IDs found in generated tickets`);
      }
      
      // Final validation: ensure tickets have required fields
      const tickets = ticketsToProcess.filter(ticket => {
        const isValid = ticket && ticket.id && ticket.subject;
        if (!isValid) {
          console.warn(`[TICKET_GENERATOR] Filtering out invalid ticket:`, ticket);
        }
        return isValid;
      });
      
      console.log(`[TICKET_GENERATOR] Final ticket count after validation: ${tickets.length}`);
      let metadata = {
        total_generated: 0,
        scenarios_used: [input.scenario],
        generation_time: new Date().toISOString(),
        ai_model_used: 'gemini-2.0-flash-exp',
        quality_score: 0.95
      };
      
      metadata.total_generated = tickets.length;
      
      // Store tickets in Supabase (reuse the supabase client from above)
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