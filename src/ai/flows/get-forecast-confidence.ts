

import { defineFlow, definePrompt } from '@genkit-ai/ai';
import { z } from 'zod';

export const getForecastConfidence = defineFlow(
  {
    name: 'getForecastConfidence',
    inputSchema: z.object({
      historicalAccuracy: z.number(),
      dataVolume: z.number(),
      modelStability: z.number(),
    }),
    outputSchema: z.object({
      confidenceScore: z.number(),
      confidenceBreakdown: z.object({
        historicalAccuracy: z.number(),
        dataVolume: z.number(),
        modelStability: z.number(),
      }),
    }),
  },
  async (input) => {
    const prompt = definePrompt(
      {
        name: 'forecastConfidencePrompt',
        inputSchema: z.object({
          historicalAccuracy: z.number(),
          dataVolume: z.number(),
          modelStability: z.number(),
        }),
        outputSchema: z.object({
          confidenceScore: z.number(),
          confidenceBreakdown: z.object({
            historicalAccuracy: z.number(),
            dataVolume: z.number(),
            modelStability: z.number(),
          }),
        }),
      },
      async (input) => {
        return {
          prompt: `Analyze the following factors and return a confidence score and a breakdown of the factors. The confidence score should be a number between 0 and 100. The breakdown should be an object with the same factors as the input.\n\nHistorical Accuracy: ${input.historicalAccuracy}\nData Volume: ${input.dataVolume}\nModel Stability: ${input.modelStability}`,
        };
      }
    );

    const llmResponse = await prompt.generate({ input });
    return llmResponse.output();
  }
);

