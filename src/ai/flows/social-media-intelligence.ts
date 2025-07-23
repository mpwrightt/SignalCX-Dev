
'use server';

/**
 * @fileOverview Defines a Genkit flow that acts as a social media analyst.
 *
 * - socialMediaIntelligence - Searches the web based on a query and returns a structured analysis of public sentiment, key themes, and representative mentions.
 * - SocialMediaIntelligenceInput - The input type for the function.
 * - SocialMediaIntelligenceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { searchTheWeb } from '@/ai/tools/web-search';

const SocialMediaIntelligenceInputSchema = z.object({
  question: z.string().describe('The user\'s question or topic to analyze on social media.'),
});
export type SocialMediaIntelligenceInput = z.infer<typeof SocialMediaIntelligenceInputSchema>;

const SocialMediaIntelligenceOutputSchema = z.object({
  summary: z.string().describe("A comprehensive, executive-level summary of the public sentiment and key discussion points found on the web."),
  sentimentBreakdown: z.array(z.object({
    name: z.enum(['Positive', 'Neutral', 'Negative', 'Mixed']).describe("The sentiment category."),
    value: z.number().describe("The number of posts/articles reflecting this sentiment.")
  })).describe("A breakdown of public sentiment found across the web."),
  topThemes: z.array(z.object({
    name: z.string().describe("A key theme or topic of discussion (e.g., 'Shipping Delays', 'Card Condition')."),
    value: z.number().describe("The number of posts/articles related to this theme.")
  })).describe("The top 5 most discussed themes or topics found on the web."),
  keyMentions: z.array(z.object({
    source: z.string().describe("The source of the mention (e.g., Reddit, Twitter, Blog)."),
    author: z.string().describe("The author of the post or article (e.g., 'u/username', '@handle')."),
    snippet: z.string().describe("A representative quote or snippet from the post."),
    sentiment: z.enum(['Positive', 'Neutral', 'Negative', 'Mixed']),
    link: z.string().url().describe("A direct link to the source post or article.")
  })).describe("A list of 3-5 key individual mentions or posts that are representative of the overall sentiment and themes.")
});
export type SocialMediaIntelligenceOutput = z.infer<typeof SocialMediaIntelligenceOutputSchema>;


export async function socialMediaIntelligence(input: SocialMediaIntelligenceInput): Promise<SocialMediaIntelligenceOutput> {
  return socialMediaIntelligenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'socialMediaIntelligencePrompt',
  input: {schema: z.object({
    ...SocialMediaIntelligenceInputSchema.shape,
    currentDate: z.string().describe("The current date, for context."),
  })},
  output: {schema: SocialMediaIntelligenceOutputSchema},
  tools: [searchTheWeb],
  prompt: `You are an expert market research and public relations analyst for TCGplayer, a marketplace for trading card games.
Your task is to conduct a **deep research** investigation into public sentiment on the web regarding a specific topic.
The current date is {{currentDate}}, so pay close attention to the recency of information when the user asks about current trends.

**Your process must be as follows:**
1.  **Formulate a Search Plan:** Based on the user's query, devise 3-5 different, more specific search queries to uncover a wide range of opinions. For example, if the query is "our new feature", your plan might be to search for "TCGplayer new feature reviews", "problems with TCGplayer feature reddit", and "new TCGplayer feature twitter".
2.  **Execute Searches:** Use the 'searchTheWeb' tool to execute each of the search queries you devised. This tool is sorted by date and will return the most recent results first.
3.  **Synthesize Results:** After gathering all the information, synthesize it into a single, structured analysis, prioritizing the most recent and relevant findings.

**IMPORTANT:** If the 'searchTheWeb' tool returns no results for any of your queries, you MUST still return a valid JSON object with a summary indicating that no information was found and empty arrays for the other fields. Do not return null.

Based on the combined search results, you must generate a structured analysis containing:
1.  **Summary:** A concise, executive-level summary of the overall sentiment, key issues, and any potential PR risks or opportunities. If no information is found, this summary should state that.
2.  **Sentiment Breakdown:** Quantify the sentiment from all search results into Positive, Neutral, Negative, and Mixed categories.
3.  **Top Themes:** Identify the top 5 most common themes or topics of discussion in the search results.
4.  **Key Mentions:** Extract 3-5 specific, representative posts or articles from across all searches, including their source, author, a snippet, their sentiment, and a link.

Here is the user's question/topic to analyze:
"{{{question}}}"
`,
});

const socialMediaIntelligenceFlow = ai.defineFlow(
  {
    name: 'socialMediaIntelligenceFlow',
    inputSchema: SocialMediaIntelligenceInputSchema,
    outputSchema: SocialMediaIntelligenceOutputSchema,
  },
  async (input) => {
    const promptInput = {
      ...input,
      currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    const {output} = await prompt(promptInput);
    
    if (!output) {
      return {
        summary: "The AI could not find sufficient information on the web to generate an analysis for this topic. Please try a different query.",
        sentimentBreakdown: [],
        topThemes: [],
        keyMentions: [],
      };
    }

    return output;
  }
);
