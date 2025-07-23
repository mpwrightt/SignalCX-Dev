'use server';

/**
 * @fileOverview Generates a one-sentence summary for a single Zendesk ticket.
 *
 * - getTicketSummary - A function that generates a one-sentence summary.
 * - GetTicketSummaryInput - The input type for the function.
 * - GetTicketSummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { scrubPii } from '@/lib/pii-scrubber';

const GetTicketSummaryInputSchema = z.object({
  subject: z.string().describe('The subject of the Zendesk ticket.'),
  conversation: z.array(z.object({
    sender: z.enum(['customer', 'agent']),
    message: z.string(),
  })).describe('The full conversation history of the ticket.'),
});
export type GetTicketSummaryInput = z.infer<typeof GetTicketSummaryInputSchema>;

const GetTicketSummaryOutputSchema = z.object({
  summary: z.string().describe('A 2-3 sentence summary of the entire ticket thread, including the current status and next steps.'),
});
export type GetTicketSummaryOutput = z.infer<typeof GetTicketSummaryOutputSchema>;

export async function getTicketSummary(input: GetTicketSummaryInput): Promise<GetTicketSummaryOutput> {
  return getTicketSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTicketSummaryPrompt',
  input: {schema: GetTicketSummaryInputSchema},
  output: {schema: GetTicketSummaryOutputSchema},
  prompt: `Generate a concise, 2-3 sentence summary of the following ticket thread.
  
The summary MUST answer:
1. What was the customer's original problem?
2. What has been done so far?
3. What is the current status or next action required?

Here is the ticket thread:
---
Subject: {{{subject}}}

Conversation History:
{{#each conversation}}
{{this.sender}}: {{{this.message}}}
---
{{/each}}
  `,
});

const getTicketSummaryFlow = ai.defineFlow(
  {
    name: 'getTicketSummaryFlow',
    inputSchema: GetTicketSummaryInputSchema,
    outputSchema: GetTicketSummaryOutputSchema,
  },
  async (input) => {
    // Scrub PII from subject and conversation before sending to the model
    const scrubbedInput = {
      subject: scrubPii(input.subject),
      conversation: input.conversation.map(message => ({
        ...message,
        message: scrubPii(message.message),
      })),
    };

    const {output} = await prompt(scrubbedInput);
    return output!;
  }
);
