'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { scrubPii } from '@/lib/pii-scrubber';

const HighRiskTicketInputSchema = z.object({
  id: z.number(),
  subject: z.string(),
  description: z.string(),
  created_at: z.string(),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']).optional(),
  category: z.string(),
  priority: z.string().nullable(),
  status: z.string(),
});
export type HighRiskTicketInput = z.infer<typeof HighRiskTicketInputSchema>;

const HighRiskTicketAnalysisOutputSchema = z.object({
  predictedScore: z.number().min(1).max(5),
  riskFactors: z.string(),
  deEscalationStrategy: z.string(),
});
export type HighRiskTicketAnalysisOutput = z.infer<typeof HighRiskTicketAnalysisOutputSchema>;

const prompt = ai.definePrompt({
  name: 'getHighRiskTicketAnalysisPrompt',
  input: { schema: HighRiskTicketInputSchema },
  output: { schema: HighRiskTicketAnalysisOutputSchema },
  prompt: `Analyze the following support ticket for risk of low CSAT (customer satisfaction) score. 
Your output MUST include:
1. predictedScore: The predicted CSAT score (1-5) if no action is taken.
2. riskFactors: A brief explanation of why this ticket is considered high-risk.
3. deEscalationStrategy: A specific, actionable strategy to de-escalate the situation.

Here is the ticket for analysis:
---
Ticket ID: {{id}}
Subject: {{{subject}}}
Description: {{{description}}}
Created: {{created_at}}
Sentiment: {{sentiment}}
Category: {{category}}
Priority: {{priority}}
Status: {{status}}
---
`,
});

export const getHighRiskTicketAnalysis = ai.defineFlow(
  {
    name: 'getHighRiskTicketAnalysis',
    inputSchema: HighRiskTicketInputSchema,
    outputSchema: HighRiskTicketAnalysisOutputSchema,
  },
  async (input) => {
    // Scrub PII from subject and description
    const scrubbedInput = {
      ...input,
      subject: scrubPii(input.subject),
      description: scrubPii(input.description),
    };
    const { output } = await prompt(scrubbedInput);
    return output!;
  }
); 