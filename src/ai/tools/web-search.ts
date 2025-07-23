
'use server';

/**
 * @fileOverview A web search tool for Genkit that uses the Google Custom Search API.
 * This tool allows the AI to perform live web searches to gather external context.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const isSearchConfigured = GOOGLE_SEARCH_API_KEY && GOOGLE_SEARCH_ENGINE_ID;

export const searchTheWeb = ai.defineTool(
  {
    name: 'searchTheWeb',
    description: 'Searches the web, social media, and news articles for a given query, sorted by date. Use this to find the most recent external context for internal support trends.',
    inputSchema: z.object({ query: z.string().describe('The search query.') }),
    outputSchema: z.object({
        results: z.array(z.object({
            title: z.string(),
            link: z.string().url(),
            snippet: z.string(),
        }))
    }),
  },
  async ({query}) => {
    if (!isSearchConfigured) {
        console.warn(`[Web Search Tool] Search is not configured. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID in your .env file. Returning empty results.`);
        return { results: [] };
    }
    
    // Append the site exclusion to the user's query
    const finalQuery = `${query} -site:tcgplayer.com`;
    // Added &sort=date to prioritize recent results
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(finalQuery)}&sort=date`;
    
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Web Search Tool] Google Search API request failed: ${response.status} ${errorBody}`);
            return { results: [] };
        }
        
        const data = await response.json();
        const items = data.items || [];
        
        const results = items.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
        }));

        console.log(`[Web Search Tool] Found ${results.length} results for query: "${finalQuery}"`);
        return { results };

    } catch (error) {
        console.error(`[Web Search Tool] An error occurred during the fetch call:`, error);
        return { results: [] };
    }
  }
);
