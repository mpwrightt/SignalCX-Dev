
'use server';

/**
 * @fileOverview Batch-analyzes Zendesk tickets for sentiment and category.
 * This flow is optimized to be called from the client-side.
 *
 * - batchAnalyzeTickets - A function that handles the ticket analysis process.
 * - BatchAnalyzeTicketsInput - The input type for the function.
 * - BatchAnalyzeTicketsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { scrubPii } from '@/lib/pii-scrubber';
import { aiFlowOptimizer } from '@/lib/ai-flow-optimizer';

const BatchAnalyzeTicketsInputSchema = z.object({
  tickets: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    description: z.string(),
  })).describe('An array of tickets to be analyzed.'),
});
export type BatchAnalyzeTicketsInput = z.infer<typeof BatchAnalyzeTicketsInputSchema>;

const AnalysisResultSchema = z.object({
  id: z.number().describe('The ID of the ticket that was analyzed.'),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']).optional().describe('The sentiment of the ticket description.'),
  category: z.string().describe('The category of the issue (e.g., Login, Billing, Shipping, Technical Issue, Sales, Feature Request, Feedback).'),
});

const BatchAnalyzeTicketsOutputSchema = z.object({
  results: z.array(AnalysisResultSchema).describe('An array of analysis results for each ticket.'),
});

export type BatchAnalyzeTicketsOutput = z.infer<typeof BatchAnalyzeTicketsOutputSchema>;

export async function batchAnalyzeTickets(input: BatchAnalyzeTicketsInput): Promise<BatchAnalyzeTicketsOutput> {
  // Use AI Flow Optimizer for intelligent batching and caching
  const result = await aiFlowOptimizer.executeFlow(
    'batch-analyze',
    input,
    () => batchAnalyzeTicketsFlow(input)
  );
  
  return result.data;
}

const prompt = ai.definePrompt({
    name: 'batchAnalyzeTicketsPrompt',
    input: { schema: BatchAnalyzeTicketsInputSchema },
    output: { schema: BatchAnalyzeTicketsOutputSchema },
    prompt: `Analyze the following support tickets for sentiment and category.
    Your response must be a valid JSON object containing a 'results' array.
    For each ticket, determine the sentiment (Positive, Neutral, Negative) and a relevant category.
    Analyze them based on their subject and the provided description snippet.
    
    Here are the tickets:
    ---
    {{#each tickets}}
    Ticket ID: {{this.id}}
    Subject: {{{this.subject}}}
    Description Snippet: {{{this.description}}}
    ---
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

const batchAnalyzeTicketsFlow = ai.defineFlow(
  {
    name: 'batchAnalyzeTicketsFlow',
    inputSchema: BatchAnalyzeTicketsInputSchema,
    outputSchema: BatchAnalyzeTicketsOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    console.log(`[batchAnalyzeTicketsFlow] Starting analysis of ${input.tickets.length} tickets`);
    
    try {
        const scrubbedTickets = input.tickets.map(ticket => ({
            id: ticket.id,
            subject: scrubPii(ticket.subject),
            // Truncate description to the first 500 characters for performance.
            description: scrubPii(ticket.description.substring(0, 500)),
        }));

        // If we have 200 or fewer tickets, process them in a single batch
        if (scrubbedTickets.length <= 200) {
          console.log(`[batchAnalyzeTicketsFlow] Processing ${scrubbedTickets.length} tickets in single batch`);
          const {output} = await prompt({ tickets: scrubbedTickets });
          
          if (!output) {
            throw new Error('AI model returned null or empty output.');
          }

          const processingTime = Date.now() - startTime;
          console.log(`[batchAnalyzeTicketsFlow] Single batch completed in ${processingTime}ms`);
          return output;
        }

        // For larger datasets, split into chunks and process in parallel
        const CHUNK_SIZE = 200;
        const chunks = chunkArray(scrubbedTickets, CHUNK_SIZE);
        console.log(`[batchAnalyzeTicketsFlow] Processing ${scrubbedTickets.length} tickets in ${chunks.length} parallel chunks of ~${CHUNK_SIZE} tickets each`);

        // Process all chunks in parallel
        const chunkPromises = chunks.map(async (chunk, index) => {
          const chunkStartTime = Date.now();
          console.log(`[batchAnalyzeTicketsFlow] Starting chunk ${index + 1}/${chunks.length} with ${chunk.length} tickets`);
          
          try {
            const {output} = await prompt({ tickets: chunk });
            
            if (!output || !output.results) {
              throw new Error(`Chunk ${index + 1} returned null or invalid output`);
            }

            const chunkTime = Date.now() - chunkStartTime;
            console.log(`[batchAnalyzeTicketsFlow] Chunk ${index + 1}/${chunks.length} completed in ${chunkTime}ms with ${output.results.length} results`);
            
            return output.results;
          } catch (error) {
            console.error(`[batchAnalyzeTicketsFlow] Chunk ${index + 1} failed:`, error);
            // Return empty results for failed chunk instead of throwing
            return [];
          }
        });

        // Wait for all chunks to complete
        const chunkResults = await Promise.all(chunkPromises);
        
        // Combine all results
        const combinedResults = chunkResults.flat();
        const processingTime = Date.now() - startTime;
        
        console.log(`[batchAnalyzeTicketsFlow] All chunks completed in ${processingTime}ms. Combined ${combinedResults.length} results from ${chunks.length} chunks`);
        
        // Validate that we got results for all tickets
        const inputIds = new Set(scrubbedTickets.map(t => t.id));
        const outputIds = new Set(combinedResults.map(r => r.id));
        const missingIds = Array.from(inputIds).filter(id => !outputIds.has(id));
        
        if (missingIds.length > 0) {
          console.warn(`[batchAnalyzeTicketsFlow] Missing results for ${missingIds.length} tickets:`, missingIds.slice(0, 10));
        }
        
        return {
          results: combinedResults
        };

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`[batchAnalyzeTicketsFlow] Failed after ${processingTime}ms:`, error);
        throw new Error('Failed to analyze tickets due to a server error.');
    }
  }
);
