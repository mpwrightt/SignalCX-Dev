'use server';

/**
 * @fileOverview This file defines a Genkit flow to perform predictive analysis on ticket data in batches.
 * This flow is designed to be called by other flows and focuses on per-ticket analysis.
 *
 * - batchIdentifyTicketRisks - Identifies at-risk tickets, potential SLA breaches, and documentation opportunities.
 * - BatchIdentifyTicketRisksInput - The input type for the function.
 * - BatchIdentifyTicketRisksOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { scrubPii } from '@/lib/pii-scrubber';
import { aiFlowOptimizer } from '@/lib/ai-flow-optimizer';

const AtRiskTicketSchema = z.object({
  ticketId: z.number().describe("The ID of the at-risk ticket."),
  subject: z.string().describe("The subject of the at-risk ticket."),
  reason: z.string().describe("A brief explanation for why this ticket is considered high-risk."),
  predictedCsat: z.number().min(1).max(5).describe("The predicted CSAT score (1-5) if no action is taken."),
  deEscalationStrategy: z.string().describe("A specific, actionable strategy to de-escalate the situation."),
});

const PredictedSlaBreachSchema = z.object({
  ticketId: z.number().describe("The ID of the ticket at risk of breaching SLA."),
  subject: z.string().describe("The subject of the ticket."),
  predictedBreachTime: z.string().describe("A human-readable prediction of when the breach will occur (e.g., 'in <2 hours', 'in 8 hours')."),
  reason: z.string().describe("The reason why this ticket is at risk of breaching its SLA."),
});

const DocumentationOpportunitySchema = z.object({
  topic: z.string().describe("The topic for the suggested documentation or macro (e.g., 'How to Reset 2FA')."),
  justification: z.string().describe("A brief explanation of why this documentation is needed, based on ticket data."),
  relatedTicketCount: z.number().describe("The number of tickets found related to this topic."),
  exampleTickets: z.array(z.string()).describe("A list of 2-3 example ticket subjects that support this opportunity."),
});

const BatchIdentifyTicketRisksInputSchema = z.object({
  tickets: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    description: z.string(),
    created_at: z.string(),
    sentiment: z.enum(['Positive', 'Neutral', 'Negative']).optional(),
    category: z.string(),
    priority: z.string().nullable(),
    status: z.string(),
  })),
});
export type BatchIdentifyTicketRisksInput = z.infer<typeof BatchIdentifyTicketRisksInputSchema>;

const BatchIdentifyTicketRisksOutputSchema = z.object({
  atRiskTickets: z.array(AtRiskTicketSchema).describe("A list of currently open tickets with a high risk of low CSAT."),
  predictedSlaBreaches: z.array(PredictedSlaBreachSchema).describe("A list of currently open tickets predicted to breach their SLA."),
  documentationOpportunities: z.array(DocumentationOpportunitySchema).describe("A list of 2-3 opportunities for new documentation or macros based on this batch."),
});
export type BatchIdentifyTicketRisksOutput = z.infer<typeof BatchIdentifyTicketRisksOutputSchema>;

export async function batchIdentifyTicketRisks(input: BatchIdentifyTicketRisksInput): Promise<BatchIdentifyTicketRisksOutput> {
  // Use AI Flow Optimizer with intelligent batching and ensemble support
  try {
    const result = await aiFlowOptimizer.executeFlow(
      'batch-risks',
      input,
      () => batchIdentifyTicketRisksFlow(input)
    );
    
    return result.data;
  } catch (error) {
    console.error('[batchIdentifyTicketRisks] Flow failed, returning empty results:', error);
    // Return empty results instead of throwing to prevent cascading failures
    return {
      atRiskTickets: [],
      predictedSlaBreaches: [],
      documentationOpportunities: [],
    };
  }
}

const prompt = ai.definePrompt({
  name: 'batchIdentifyTicketRisksPrompt',
  input: {schema: BatchIdentifyTicketRisksInputSchema},
  output: {schema: BatchIdentifyTicketRisksOutputSchema},
  prompt: `Analyze tickets for critical risks only. Return minimal, focused results.

  CRITICAL ONLY:
  1. At-Risk: Only tickets with CSAT risk 1-2 (very low)
  2. SLA: Only tickets breaching within 4 hours
  3. Docs: Only problems affecting 5+ tickets

  Current: {{currentDate}}
  
  {{#each tickets}}
  {{this.id}}:{{{this.subject}}} | {{this.sentiment}} | {{this.category}} | {{this.priority}}
  {{/each}}
  `,
});

// Helper function to chunk array into smaller pieces
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

const batchIdentifyTicketRisksFlow = ai.defineFlow(
  {
    name: 'batchIdentifyTicketRisksFlow',
    inputSchema: BatchIdentifyTicketRisksInputSchema,
    outputSchema: BatchIdentifyTicketRisksOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    const ticketIdsInBatch = input.tickets.map(t => t.id).join(', ');
    console.log(`[batchIdentifyTicketRisksFlow] Starting risk analysis for ${input.tickets.length} tickets`);
    
    try {
        // Scrub PII from ticket subjects before sending to the model
        const scrubbedTickets = input.tickets.map(ticket => ({
          ...ticket,
          subject: scrubPii(ticket.subject),
          // NOTE: Description is intentionally omitted to reduce token load and prevent timeouts.
          description: '', 
        }));

        // If we have 150 or fewer tickets, process them in a single batch
        if (scrubbedTickets.length <= 150) {
          console.log(`[batchIdentifyTicketRisksFlow] Processing ${scrubbedTickets.length} tickets in single batch`);
          
          const promptInput = {
            ...input,
            tickets: scrubbedTickets,
            currentDate: new Date().toDateString(),
          };

          const {output} = await prompt(promptInput);
          
          if (!output) {
            console.warn(`[batchIdentifyTicketRisksFlow] AI model returned null or empty output. Returning empty object.`);
            return {
              atRiskTickets: [],
              predictedSlaBreaches: [],
              documentationOpportunities: [],
            };
          }
          
          const processingTime = Date.now() - startTime;
          console.log(`[batchIdentifyTicketRisksFlow] Single batch completed in ${processingTime}ms. Found ${output.atRiskTickets.length} at-risk tickets, ${output.predictedSlaBreaches.length} SLA breaches, and ${output.documentationOpportunities.length} doc opportunities.`);
          return output;
        }

        // For larger datasets, split into chunks and process in parallel
        const CHUNK_SIZE = 150; // Smaller chunks for risk analysis since it's more complex
        const chunks = chunkArray(scrubbedTickets, CHUNK_SIZE);
        console.log(`[batchIdentifyTicketRisksFlow] Processing ${scrubbedTickets.length} tickets in ${chunks.length} parallel chunks of ~${CHUNK_SIZE} tickets each`);

        // Process all chunks in parallel
        const chunkPromises = chunks.map(async (chunk, index) => {
          const chunkStartTime = Date.now();
          console.log(`[batchIdentifyTicketRisksFlow] Starting risk analysis chunk ${index + 1}/${chunks.length} with ${chunk.length} tickets`);
          
          try {
            const promptInput = {
              tickets: chunk,
              currentDate: new Date().toDateString(),
            };

            const {output} = await prompt(promptInput);
            
            if (!output) {
              console.warn(`[batchIdentifyTicketRisksFlow] Chunk ${index + 1} returned null output`);
              return {
                atRiskTickets: [],
                predictedSlaBreaches: [],
                documentationOpportunities: [],
              };
            }

            const chunkTime = Date.now() - chunkStartTime;
            console.log(`[batchIdentifyTicketRisksFlow] Risk chunk ${index + 1}/${chunks.length} completed in ${chunkTime}ms with ${output.atRiskTickets.length} at-risk, ${output.predictedSlaBreaches.length} SLA breaches, ${output.documentationOpportunities.length} doc opportunities`);
            
            return output;
          } catch (error) {
            console.error(`[batchIdentifyTicketRisksFlow] Risk chunk ${index + 1} failed:`, error);
            // Return empty results for failed chunk instead of throwing
            return {
              atRiskTickets: [],
              predictedSlaBreaches: [],
              documentationOpportunities: [],
            };
          }
        });

        // Wait for all chunks to complete
        const chunkResults = await Promise.all(chunkPromises);
        
        // Combine all results
        const combinedAtRiskTickets = chunkResults.flatMap(result => result.atRiskTickets);
        const combinedSlaBreaches = chunkResults.flatMap(result => result.predictedSlaBreaches);
        const combinedDocOpportunities = chunkResults.flatMap(result => result.documentationOpportunities);
        
        const processingTime = Date.now() - startTime;
        console.log(`[batchIdentifyTicketRisksFlow] All risk chunks completed in ${processingTime}ms. Combined ${combinedAtRiskTickets.length} at-risk tickets, ${combinedSlaBreaches.length} SLA breaches, and ${combinedDocOpportunities.length} doc opportunities from ${chunks.length} chunks`);
        
        return {
          atRiskTickets: combinedAtRiskTickets,
          predictedSlaBreaches: combinedSlaBreaches,
          documentationOpportunities: combinedDocOpportunities,
        };

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`[batchIdentifyTicketRisksFlow] Failed after ${processingTime}ms:`, error);
        // Return a valid, empty response to prevent the entire 'full analysis' from crashing.
        return {
            atRiskTickets: [],
            predictedSlaBreaches: [],
            documentationOpportunities: [],
        };
    }
  }
);
