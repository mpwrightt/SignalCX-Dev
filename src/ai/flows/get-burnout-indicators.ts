'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { scrubPii } from '@/lib/pii-scrubber';
import type { BurnoutIndicator } from '@/lib/types';
import type { ProcessedAnalyticsData } from '@/lib/analytics-preprocessor';
import { AnalyticsPreprocessor } from '@/lib/analytics-preprocessor';
import { AnalyticsCache } from '@/lib/analytics-cache';

const BurnoutIndicatorsInputSchema = z.object({
  tickets: z.array(z.object({
    id: z.number(),
    assignee: z.string().optional(),
    subject: z.string(),
    created_at: z.string(),
    solved_at: z.string().optional(),
    status: z.string(),
    priority: z.string().nullable(),
  })).optional(),
  preprocessedData: z.any().optional(),
  targetAgents: z.array(z.string()).optional(),
});
export type BurnoutIndicatorsInput = z.infer<typeof BurnoutIndicatorsInputSchema>;

const BurnoutIndicatorSchema = z.object({
  agentName: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  indicators: z.array(z.string()),
  ticketCount: z.number(),
  avgResolutionTime: z.number(),
  lastActivity: z.string(),
});

const BurnoutIndicatorsOutputSchema = z.object({
  burnoutIndicators: z.array(BurnoutIndicatorSchema)
});
export type BurnoutIndicatorsOutput = z.infer<typeof BurnoutIndicatorsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'getBurnoutIndicatorsPrompt',
  input: { schema: BurnoutIndicatorsInputSchema },
  output: { schema: BurnoutIndicatorsOutputSchema },
  prompt: `You are an expert support operations analyst. Analyze the following tickets to identify agent burnout risk.
For each agent, provide:
1. riskLevel ('low', 'medium', 'high', 'critical')
2. indicators (list of 2-4 key burnout signals)
3. ticketCount
4. avgResolutionTime (in hours)
5. lastActivity (ISO date string)

Here are the tickets:
{{#each tickets}}
---
Ticket ID: {{this.id}}
Assignee: {{this.assignee}}
Subject: {{{this.subject}}}
Created: {{this.created_at}}
Solved: {{this.solved_at}}
Status: {{this.status}}
Priority: {{this.priority}}
---
{{/each}}
`,
});

export const getBurnoutIndicators = ai.defineFlow(
  {
    name: 'getBurnoutIndicators',
    inputSchema: BurnoutIndicatorsInputSchema,
    outputSchema: BurnoutIndicatorsOutputSchema,
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
          assignee: ticket.assignee ? scrubPii(ticket.assignee) : undefined,
          subject: scrubPii(ticket.subject),
        }));
      }
      
      if (!tickets || tickets.length === 0) {
        console.log('[getBurnoutIndicators] No tickets provided');
        return { burnoutIndicators: [] };
      }
      
      const { output } = await prompt({ tickets });
      
      if (!output || !output.burnoutIndicators) {
        console.warn('[getBurnoutIndicators] AI returned no data');
        return { burnoutIndicators: [] };
      }
      
      console.log(`[getBurnoutIndicators] Success: ${output.burnoutIndicators.length} indicators`);
      return output;
    } catch (error) {
      console.error('[getBurnoutIndicators] Error:', error);
      return { burnoutIndicators: [] };
    }
  }
); 