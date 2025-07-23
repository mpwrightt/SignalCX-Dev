'use server';

/**
 * @fileOverview This file defines a Genkit flow for querying ticket data with natural language.
 *
 * - queryTickets - Answers natural language questions about ticket trends.
 * - QueryTicketsInput - The input type for the function.
 * - QueryTicketsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { scrubPii } from '@/lib/pii-scrubber';

const QueryTicketsInputSchema = z.object({
  tickets: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    description: z.string(),
    sentiment: z.string().optional(),
    category: z.string().optional(),
    status: z.string(),
    assignee: z.string().optional(),
    requester: z.string(),
    created_at: z.string(),
  })).describe('An array of tickets to be analyzed.'),
  question: z.string().describe('The natural language question to be answered.'),
});
export type QueryTicketsInput = z.infer<typeof QueryTicketsInputSchema>;

const FoundTicketSchema = z.object({
  id: z.number().describe("The ID of the found ticket."),
  subject: z.string().describe("The subject of the found ticket."),
});

const QueryTicketsOutputSchema = z.object({
  answer: z.string().describe("A direct, textual answer to the user's question which summarizes the findings. This should NOT contain the list of tickets itself, as that goes in the 'foundTickets' field."),
  foundTickets: z.array(FoundTicketSchema).optional().describe("An array of tickets that directly match the user's query, if any were found."),
});
export type QueryTicketsOutput = z.infer<typeof QueryTicketsOutputSchema>;

export async function queryTickets(input: QueryTicketsInput): Promise<QueryTicketsOutput> {
  return queryTicketsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'queryTicketsPrompt',
  input: {schema: QueryTicketsInputSchema},
  output: {schema: QueryTicketsOutputSchema},
  prompt: `You are an expert support data analyst.
Your task is to answer a direct question about a provided set of support tickets.

You must always provide a textual answer that summarizes your findings in the 'answer' field.
If the user's question can be answered with a specific list of tickets (e.g., "show me all tickets for user X", "find tickets about billing"), you MUST ALSO populate the 'foundTickets' array with the IDs and subjects of the matching tickets. If no specific tickets match, return an empty 'foundTickets' array.

Here is the user's question:
"{{{question}}}"

Analyze the following tickets to formulate your answer.
---
{{#each tickets}}
Ticket ID: {{this.id}}
Subject: {{{this.subject}}}
Description: {{{this.description}}}
Sentiment: {{this.sentiment}}
Category: {{this.category}}
Status: {{this.status}}
Assignee: {{this.assignee}}
Requester: {{this.requester}}
Created At: {{this.created_at}}
---
{{/each}}
  `,
});

const queryTicketsFlow = ai.defineFlow(
  {
    name: 'queryTicketsFlow',
    inputSchema: QueryTicketsInputSchema,
    outputSchema: QueryTicketsOutputSchema,
  },
  async (input) => {
    if (input.tickets.length === 0) {
      return { answer: "There are no tickets in the current view to analyze. Please select a view with tickets to ask a question." };
    }

    // Scrub PII before sending to the model
    const scrubbedTickets = input.tickets.map(ticket => ({
      ...ticket,
      subject: scrubPii(ticket.subject),
      description: scrubPii(ticket.description),
      requester: scrubPii(ticket.requester),
    }));

    const {output} = await prompt({ ...input, tickets: scrubbedTickets });
    return output!;
  }
);
