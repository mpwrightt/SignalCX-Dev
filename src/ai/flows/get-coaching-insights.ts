
'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate coaching insights for managers.
 *
 * - getCoachingInsights - A function that analyzes agent performance and generates coaching points.
 * - GetCoachingInsightsInput - The input type for the getCoachingInsights function.
 * - GetCoachingInsightsOutput - The return type for the getCoachingInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzedTicketForCoachingSchema = z.object({
  id: z.number(),
  assignee: z.string().optional(),
  category: z.string(),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']).optional(),
  csat_score: z.number().optional(),
  created_at: z.string(),
  solved_at: z.string().optional(),
  conversation: z.array(z.object({
      sender: z.enum(['customer', 'agent']),
  })),
  status: z.string(),
});

const GetCoachingInsightsInputSchema = z.object({
  tickets: z.array(AnalyzedTicketForCoachingSchema),
});

export type GetCoachingInsightsInput = z.infer<typeof GetCoachingInsightsInputSchema>;

const CoachingInsightSchema = z.object({
  agentName: z.string().describe("The ANONYMOUS ID of the agent the insight is for (e.g., 'Agent_1')."),
  insightType: z.enum(['Positive', 'Opportunity']).describe("The type of insight: 'Positive' for praise, 'Opportunity' for coaching."),
  category: z.string().describe("The ticket category this insight relates to (e.g., 'Billing', 'Shipping')."),
  description: z.string().describe("A detailed, actionable description of the coaching insight or point of praise. Be specific and provide context."),
  exampleTicketIds: z.array(z.number()).describe("An array of 1-2 example ticket IDs that illustrate this insight."),
});

const GetCoachingInsightsOutputSchema = z.object({
    insights: z.array(CoachingInsightSchema),
});

export type GetCoachingInsightsOutput = z.infer<typeof GetCoachingInsightsOutputSchema>;


export async function getCoachingInsights(input: GetCoachingInsightsInput): Promise<GetCoachingInsightsOutput> {
  return getCoachingInsightsFlow(input);
}

const PromptTicketSchema = z.object({
    id: z.number(),
    assignee: z.string().optional().describe("An anonymous ID for the agent (e.g., 'Agent_1')."),
    category: z.string(),
    sentiment: z.enum(['Positive', 'Neutral', 'Negative']).optional(),
    csat_score: z.number().optional(),
    firstContactResolution: z.string().describe("Whether the ticket was resolved on the first contact ('Yes' or 'No')."),
});

const prompt = ai.definePrompt({
  name: 'getCoachingInsightsPrompt',
  input: {schema: z.object({ tickets: z.array(PromptTicketSchema)})},
  output: {schema: GetCoachingInsightsOutputSchema},
  prompt: `You are an expert support manager with a talent for data-driven coaching.
Analyze the provided ticket data to identify actionable coaching insights for each agent. For each agent, identify one key area of praise ('Positive') and one key area for improvement ('Opportunity').

For each insight, you must provide:
1.  The agent's ANONYMOUS ID.
2.  The insight type ('Positive' or 'Opportunity').
3.  The relevant ticket category.
4.  A specific, actionable description. For praise, explain what they did well. For opportunities, explain the issue and suggest a clear path for improvement.
5.  1-2 concrete example ticket IDs that demonstrate the point.

Here is the data. Each ticket includes its category, sentiment, CSAT score, and resolution time.
{{#each tickets}}
---
Ticket ID: {{this.id}}
Agent ID: {{this.assignee}}
Category: {{this.category}}
Sentiment: {{this.sentiment}}
CSAT: {{#if this.csat_score}}{{this.csat_score}}/5{{else}}N/A{{/if}}
First Contact Resolution: {{this.firstContactResolution}}
---
{{/each}}`,
});

const COACHING_BATCH_SIZE = 50;
const COACHING_ANALYSIS_TICKET_LIMIT = 200;

const getCoachingInsightsFlow = ai.defineFlow(
  {
    name: 'getCoachingInsightsFlow',
    inputSchema: GetCoachingInsightsInputSchema,
    outputSchema: GetCoachingInsightsOutputSchema,
  },
  async (input) => {
    try {
      const agentsWithTickets = input.tickets.filter(t => t.assignee);
      
      const sampledTickets = agentsWithTickets
        .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, COACHING_ANALYSIS_TICKET_LIMIT);

      if (sampledTickets.length < 5) {
        console.log('[getCoachingInsightsFlow] Not enough tickets with assignees in the sample to generate insights. Returning empty array.');
        return { insights: [] }; // Not enough data
      }

      // --- PII Pseudonymization Logic ---
      const agentNameToId = new Map<string, string>();
      const agentIdToName = new Map<string, string>();
      let agentCounter = 1;
      console.log('[getCoachingInsightsFlow] Starting PII pseudonymization.');

      const ticketsForPrompt = sampledTickets.map(ticket => {
        let agentId = agentNameToId.get(ticket.assignee!);
        if (!agentId) {
          agentId = `Agent_${agentCounter++}`;
          agentNameToId.set(ticket.assignee!, agentId);
          agentIdToName.set(agentId, ticket.assignee!);
        }

        // Improved FCR Logic
        const agentReplies = ticket.conversation.filter(c => c.sender === 'agent');
        const isFCR = (ticket.status === 'solved' || ticket.status === 'closed') && agentReplies.length === 1;

        return {
          id: ticket.id,
          assignee: agentId, // Anonymized
          category: ticket.category,
          sentiment: ticket.sentiment,
          csat_score: ticket.csat_score,
          firstContactResolution: isFCR ? 'Yes' : 'No',
        };
      });
      console.log(`[getCoachingInsightsFlow] Anonymized ${ticketsForPrompt.length} tickets for the prompt.`);

      // --- BATCHING LOGIC ---
      console.log(`[getCoachingInsightsFlow] Starting batched analysis for ${ticketsForPrompt.length} tickets in batches of ${COACHING_BATCH_SIZE}.`);
      
      const batchPromises = [];
      for (let i = 0; i < ticketsForPrompt.length; i += COACHING_BATCH_SIZE) {
        const batch = ticketsForPrompt.slice(i, i + COACHING_BATCH_SIZE);
        batchPromises.push(prompt({ tickets: batch }));
      }
      
      const batchResults = await Promise.all(batchPromises);
      console.log(`[getCoachingInsightsFlow] All ${batchResults.length} coaching batches complete.`);
      
      // Combine results from all batches
      const combinedInsights = batchResults.flatMap(result => result.output?.insights || []);

      if (!combinedInsights || combinedInsights.length === 0) {
          console.warn('[getCoachingInsightsFlow] AI model returned no insights from any batch.');
          return { insights: [] };
      }

      // --- De-anonymize Results ---
      console.log(`[getCoachingInsightsFlow] De-anonymizing ${combinedInsights.length} insights.`);
      const deAnonymizedInsights = combinedInsights.map(insight => ({
        ...insight,
        agentName: agentIdToName.get(insight.agentName) || `Unknown Agent (${insight.agentName})`,
      }));
      
      console.log('[getCoachingInsightsFlow] Successfully generated coaching insights from batched analysis.');
      return { insights: deAnonymizedInsights };
    } catch (error) {
      console.error("[getCoachingInsightsFlow] An unexpected error occurred during batched analysis:", error);
      // Return a valid, empty response to prevent the entire 'full analysis' from crashing.
      return { insights: [] };
    }
  }
);
