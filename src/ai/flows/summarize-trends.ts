
'use server';

/**
 * @fileOverview A Genkit flow to generate a high-level summary of support trends.
 *
 * - summarizeTrends - Analyzes aggregated ticket data to produce a concise summary.
 * - SummarizeTrendsInput - The input type for the summarizeTrends function.
 * - SummarizeTrendsOutput - The return type for the summarizeTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTrendsInputSchema = z.object({
  timePeriod: z.string().describe("The time period the data covers (e.g., 'last 30 days')."),
  totalTickets: z.number().describe("The total number of tickets in the period."),
  sentimentCounts: z.object({
    Positive: z.number(),
    Neutral: z.number(),
    Negative: z.number(),
  }).describe("The breakdown of tickets by sentiment."),
  topCategories: z.array(z.object({
    name: z.string(),
    value: z.number(),
  })).describe("The top 5 most frequent ticket categories and their counts."),
});
export type SummarizeTrendsInput = z.infer<typeof SummarizeTrendsInputSchema>;

const SummarizeTrendsOutputSchema = z.object({
    summary: z.string().describe("A one-paragraph summary of the key support trends observed in the data. Be concise and insightful, as if you were a support manager reporting to an executive. Highlight any notable patterns, such as a spike in a particular category or a shift in sentiment."),
});
export type SummarizeTrendsOutput = z.infer<typeof SummarizeTrendsOutputSchema>;

export async function summarizeTrends(input: SummarizeTrendsInput): Promise<SummarizeTrendsOutput> {
  return summarizeTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTrendsPrompt',
  input: {schema: SummarizeTrendsInputSchema},
  output: {schema: SummarizeTrendsOutputSchema},
  prompt: `You are an expert support operations analyst.
  
  Analyze the following aggregated ticket data for the {{timePeriod}}.
  
  - Total Tickets: {{totalTickets}}
  - Sentiment: {{sentimentCounts.Positive}} Positive, {{sentimentCounts.Neutral}} Neutral, {{sentimentCounts.Negative}} Negative
  - Top Categories:
  {{#each topCategories}}
    - {{this.name}}: {{this.value}} tickets
  {{/each}}
  
  Based on this data, generate a concise, one-paragraph summary of the key trends. Focus on actionable insights a manager could use.`,
});


const summarizeTrendsFlow = ai.defineFlow(
  {
    name: 'summarizeTrendsFlow',
    inputSchema: SummarizeTrendsInputSchema,
    outputSchema: SummarizeTrendsOutputSchema,
  },
  async (input) => {
    if (input.totalTickets < 10) {
        return { summary: "Not enough data to generate a trend summary." };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
