'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate performance forecasts for agents.
 *
 * - getPerformanceForecasts - A function that analyzes agent performance and predicts future metrics.
 * - GetPerformanceForecastsInput - The input type for the getPerformanceForecasts function.
 * - GetPerformanceForecastsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ProcessedAnalyticsData } from '@/lib/analytics-preprocessor';
import { AnalyticsPreprocessor } from '@/lib/analytics-preprocessor';
import { AnalyticsCache } from '@/lib/advanced-analytics-cache';

const AnalyzedTicketForForecastSchema = z.object({
  id: z.number(),
  subject: z.string(),
  requester: z.string(),
  assignee: z.string().optional(),
  description: z.string(),
  category: z.string(),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']).optional(),
  csat_score: z.number().optional(),
  created_at: z.string(),
  first_response_at: z.string().optional(),
  solved_at: z.string().optional(),
  status: z.enum(['new', 'open', 'pending', 'on-hold', 'solved', 'closed']),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).nullable(),
  tags: z.array(z.string()),
  view: z.string(),
  conversation: z.array(z.object({
    sender: z.enum(['customer', 'agent']),
    message: z.string(),
    timestamp: z.string(),
  })),
  sla_breached: z.boolean(),
  organizationId: z.string().optional(),
});

const GetPerformanceForecastsInputSchema = z.object({
  tickets: z.array(AnalyzedTicketForForecastSchema).optional(),
  preprocessedData: z.any().optional(),
  targetAgents: z.array(z.string()).optional(),
});

export type GetPerformanceForecastsInput = z.infer<typeof GetPerformanceForecastsInputSchema>;

const PerformanceForecastSchema = z.object({
  agentId: z.string().describe("The agent ID for the forecast."),
  agentName: z.string().describe("The agent name for the forecast."),
  predictedTicketsNextWeek: z.number().describe("Predicted number of tickets the agent will handle next week."),
  predictedCsatNextWeek: z.number().min(1).max(5).describe("Predicted CSAT score (1-5) for next week."),
  confidence: z.number().min(0).max(1).describe("Confidence level (0-1) in the prediction."),
  riskFactors: z.array(z.string()).describe("Factors that could impact performance."),
  recommendations: z.array(z.string()).describe("Actionable recommendations for the agent."),
});

const GetPerformanceForecastsOutputSchema = z.object({
  forecasts: z.array(PerformanceForecastSchema),
});

export type GetPerformanceForecastsOutput = z.infer<typeof GetPerformanceForecastsOutputSchema>;

export async function getPerformanceForecasts(input: GetPerformanceForecastsInput): Promise<GetPerformanceForecastsOutput> {
  return getPerformanceForecastsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPerformanceForecastsPrompt',
  input: {schema: z.object({ 
    agentData: z.array(z.object({
      agentId: z.string(),
      agentName: z.string(),
      tickets: z.array(z.object({
        id: z.number(),
        category: z.string(),
        sentiment: z.string(),
        csat_score: z.number().optional(),
        created_at: z.string(),
        solved_at: z.string().optional(),
        status: z.string(),
        priority: z.string().nullable(),
      }))
    }))
  })},
  output: {schema: GetPerformanceForecastsOutputSchema},
  prompt: `You are an expert data analyst specializing in support team performance forecasting.
Analyze the provided agent performance data to predict their performance for the next week.

For each agent, provide:
1. Predicted ticket volume for next week (based on historical patterns)
2. Predicted CSAT score (1-5 scale)
3. Confidence level in the prediction (0-1)
4. Risk factors that could impact performance
5. Specific, actionable recommendations

Consider factors like:
- Historical ticket volume trends
- CSAT score patterns
- Category distribution
- Resolution times
- Current performance trajectory

Here is the agent data to analyze:
{{#each agentData}}
---
Agent: {{this.agentName}} ({{this.agentId}})
Total Tickets: {{this.tickets.length}}
Recent Tickets:
{{#each this.tickets}}
  - ID: {{this.id}}, Category: {{this.category}}, Sentiment: {{this.sentiment}}, CSAT: {{#if this.csat_score}}{{this.csat_score}}/5{{else}}N/A{{/if}}, Status: {{this.status}}, Priority: {{this.priority}}
{{/each}}
---
{{/each}}`,
});

const getPerformanceForecastsFlow = ai.defineFlow(
  {
    name: 'getPerformanceForecastsFlow',
    inputSchema: GetPerformanceForecastsInputSchema,
    outputSchema: GetPerformanceForecastsOutputSchema,
  },
  async (input) => {
    try {
      // Use preprocessed data if available, otherwise process tickets
      let preprocessedData: ProcessedAnalyticsData;
      if (input.preprocessedData) {
        preprocessedData = input.preprocessedData;
      } else if (input.tickets) {
        preprocessedData = AnalyticsPreprocessor.preprocess(input.tickets || []);
      } else {
        console.log('[getPerformanceForecastsFlow] No tickets or preprocessed data provided. Returning empty array.');
        return { forecasts: [] };
      }

      // Generate ticket hash for caching
      const ticketHash = `${preprocessedData.ticketStats.totalTickets}-${preprocessedData.ticketStats.totalAgents}`;
      
      // Determine which agents to process
      const agentsToProcess = input.targetAgents || Array.from(preprocessedData.agentMap.keys());
      
      if (agentsToProcess.length === 0) {
        console.log('[getPerformanceForecastsFlow] No agents found. Returning empty array.');
        return { forecasts: [] };
      }

      const forecasts = [];
      
      // Process agents in batches to avoid API rate limits
      const batchSize = 5;
      for (let i = 0; i < agentsToProcess.length; i += batchSize) {
        const batch = agentsToProcess.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (agentName) => {
          // Check cache first
          const cached = AnalyticsCache.getCachedAgentAnalysis(agentName, 'performance', ticketHash);
          if (cached) {
            console.log(`[getPerformanceForecastsFlow] Using cached forecast for ${agentName}`);
            return cached;
          }

          // Get agent's tickets
          const agentTickets = AnalyticsPreprocessor.getRecentAgentTickets(preprocessedData, agentName, 20);
          
          if (agentTickets.length === 0) {
            console.log(`[getPerformanceForecastsFlow] No tickets found for agent ${agentName}`);
            return null;
          }
          
          console.log(`[getPerformanceForecastsFlow] Processing ${agentTickets.length} tickets for agent ${agentName}`);

          // Prepare data for AI analysis
          const agentData = [{
            agentId: agentName,
            agentName: agentName,
            tickets: agentTickets.map(ticket => ({
              id: ticket.id,
              category: ticket.category,
              sentiment: (ticket as any).sentiment || 'Neutral',
              csat_score: ticket.csat_score,
              created_at: ticket.created_at,
              solved_at: ticket.solved_at,
              status: ticket.status,
              priority: ticket.priority,
            }))
          }];

          const { output } = await prompt({ agentData });
          
          if (!output || !output.forecasts || output.forecasts.length === 0) {
            console.warn(`[getPerformanceForecastsFlow] AI model returned no forecast for ${agentName}`);
            return null;
          }

          const forecast = output.forecasts[0];
          console.log(`[getPerformanceForecastsFlow] Successfully generated forecast for ${agentName}`);
          
          // Cache the result
          AnalyticsCache.setCachedAgentAnalysis(agentName, 'performance', forecast, ticketHash);
          
          return forecast;
        });

        const batchResults = await Promise.all(batchPromises);
        forecasts.push(...batchResults.filter(f => f !== null));
      }

      console.log(`[getPerformanceForecastsFlow] Successfully generated forecasts for ${forecasts.length} agents.`);
      return { forecasts };
    } catch (error) {
      console.error("[getPerformanceForecastsFlow] An unexpected error occurred:", error);
      return { forecasts: [] };
    }
  }
); 