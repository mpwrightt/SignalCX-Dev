'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { scrubPii } from '@/lib/pii-scrubber';

const SlaPredictionInputSchema = z.object({
  tickets: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    created_at: z.string(),
    status: z.string(),
    priority: z.string().nullable(),
  })).optional(),
  preprocessedData: z.any().optional(),
  targetAgents: z.array(z.string()).optional(),
});
export type SlaPredictionInput = z.infer<typeof SlaPredictionInputSchema>;

const SlaPredictionOutputSchema = z.object({
  probability: z.number().min(0).max(1),
  atRiskTickets: z.number(),
  recommendedActions: z.array(z.string()),
});
export type SlaPredictionOutput = z.infer<typeof SlaPredictionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'getSlaPredictionPrompt',
  input: { schema: SlaPredictionInputSchema },
  output: { schema: SlaPredictionOutputSchema },
  prompt: `You are an expert support operations analyst. Analyze the following tickets to predict SLA breach risk.
Return:
1. probability (0-1, likelihood of SLA breach)
2. atRiskTickets (number of tickets at risk)
3. recommendedActions (list of 2-3 actionable steps)

Here are the tickets:
{{#each tickets}}
---
Ticket ID: {{this.id}}
Subject: {{{this.subject}}}
Created: {{this.created_at}}
Status: {{this.status}}
Priority: {{this.priority}}
---
{{/each}}
`,
});

export const getSlaPrediction = ai.defineFlow(
  {
    name: 'getSlaPrediction',
    inputSchema: SlaPredictionInputSchema,
    outputSchema: SlaPredictionOutputSchema,
  },
  async (input) => {
    try {
      // Handle both old format (tickets) and new format (preprocessedData)
      let tickets;
      if (input.preprocessedData) {
        tickets = input.preprocessedData.scrubbedTickets;
      } else {
        // Fallback to old format and scrub PII
        tickets = (input.tickets || []).map(ticket => ({
          ...ticket,
          subject: scrubPii(ticket.subject),
        }));
      }
      
      if (!tickets || tickets.length === 0) {
        console.log('[getSlaPrediction] No tickets provided');
        return { probability: 0, atRiskTickets: 0, recommendedActions: [] };
      }
      
      const { output } = await prompt({ tickets });
      
      if (!output) {
        console.warn('[getSlaPrediction] AI returned no data');
        return { probability: 0, atRiskTickets: 0, recommendedActions: [] };
      }
      
      console.log(`[getSlaPrediction] Success: ${output.probability} probability`);
      return output;
    } catch (error) {
      console.error('[getSlaPrediction] Error:', error);
      return { probability: 0, atRiskTickets: 0, recommendedActions: [] };
    }
  }
); 