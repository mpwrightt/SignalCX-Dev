'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { scrubPii } from '@/lib/pii-scrubber';
import type { KnowledgeGap } from '@/lib/types';

const KnowledgeGapsInputSchema = z.object({
  tickets: z.array(z.object({
    id: z.number(),
    assignee: z.string().optional(),
    subject: z.string(),
    category: z.string(),
    created_at: z.string(),
    solved_at: z.string().optional(),
    status: z.string(),
    priority: z.string().nullable(),
  })).optional(),
  preprocessedData: z.any().optional(),
  targetAgents: z.array(z.string()).optional(),
});
export type KnowledgeGapsInput = z.infer<typeof KnowledgeGapsInputSchema>;

const KnowledgeGapSchema = z.object({
  agentName: z.string(),
  topic: z.string(),
  affectedTickets: z.number(),
  agents: z.array(z.string()),
  impact: z.enum(['low', 'medium', 'high']),
  priority: z.enum(['low', 'medium', 'high']),
  frequency: z.number().optional(),
  recommendedTraining: z.array(z.string()).optional(),
});

const KnowledgeGapsOutputSchema = z.object({
  knowledgeGaps: z.array(KnowledgeGapSchema)
});
export type KnowledgeGapsOutput = z.infer<typeof KnowledgeGapsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'getKnowledgeGapsPrompt',
  input: { schema: KnowledgeGapsInputSchema },
  output: { schema: KnowledgeGapsOutputSchema },
  prompt: `You are an expert support operations analyst. Analyze the following tickets to identify agent knowledge gaps and training needs.
For each agent, provide:
1. topic (knowledge gap)
2. affectedTickets (number)
3. agents (list of agent names)
4. impact ('low', 'medium', 'high')
5. priority ('low', 'medium', 'high')
6. frequency (optional)
7. recommendedTraining (optional, list)

Here are the tickets:
{{#each tickets}}
---
Ticket ID: {{this.id}}
Assignee: {{this.assignee}}
Subject: {{{this.subject}}}
Category: {{this.category}}
Created: {{this.created_at}}
Solved: {{this.solved_at}}
Status: {{this.status}}
Priority: {{this.priority}}
---
{{/each}}
`,
});

export const getKnowledgeGaps = ai.defineFlow(
  {
    name: 'getKnowledgeGaps',
    inputSchema: KnowledgeGapsInputSchema,
    outputSchema: KnowledgeGapsOutputSchema,
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
        console.log('[getKnowledgeGaps] No tickets provided');
        return { knowledgeGaps: [] };
      }
      
      const { output } = await prompt({ tickets });
      
      if (!output || !output.knowledgeGaps) {
        console.warn('[getKnowledgeGaps] AI returned no data');
        return { knowledgeGaps: [] };
      }
      
      console.log(`[getKnowledgeGaps] Success: ${output.knowledgeGaps.length} gaps`);
      return output;
    } catch (error) {
      console.error('[getKnowledgeGaps] Error:', error);
      return { knowledgeGaps: [] };
    }
  }
); 