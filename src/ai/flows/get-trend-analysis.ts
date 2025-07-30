

import { defineFlow, definePrompt } from '@genkit-ai/ai';
import { z } from 'zod';

export const getTrendAnalysis = defineFlow(
  {
    name: 'getTrendAnalysis',
    inputSchema: z.object({
      historicalData: z.array(z.object({
        date: z.string(),
        value: z.number(),
      })),
    }),
    outputSchema: z.object({
      trend: z.number(),
    }),
  },
  async (input) => {
    const prompt = definePrompt(
      {
        name: 'trendAnalysisPrompt',
        inputSchema: z.object({
          historicalData: z.array(z.object({
            date: z.string(),
            value: z.number(),
          })),
        }),
        outputSchema: z.object({
          trend: z.number(),
        }),
      },
      async (input) => {
        return {
          prompt: `Analyze the trend of the following historical data and return the percentage change from the beginning to the end of the period. The data is sorted by date in ascending order.\n\n${JSON.stringify(input.historicalData, null, 2)}`,
        };
      }
    );

    const llmResponse = await prompt.generate({ input });
    return llmResponse.output();
  }
);

