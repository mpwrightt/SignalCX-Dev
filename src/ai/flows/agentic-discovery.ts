'use server';

/**
 * @fileOverview Discovery Phase - Pattern analysis and understanding
 * 
 * This is the first phase of the agentic workflow where the agent analyzes
 * ticket data to understand patterns, distributions, and surface-level insights.
 * It forms the foundation for subsequent analysis phases.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { scrubPii } from '@/lib/pii-scrubber';
import { aiFlowOptimizer } from '@/lib/ai-flow-optimizer';
import type { Ticket } from '@/lib/types';

const DiscoveryInputSchema = z.object({
  tickets: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    description: z.string(),
    category: z.string(),
    priority: z.string().nullable(),
    status: z.string(),
    created_at: z.string(),
    assignee: z.string().optional(),
    tags: z.array(z.string()),
    sla_breached: z.boolean(),
    csat_score: z.number().optional(),
  })).describe('Complete ticket dataset for analysis'),
  sampleSize: z.number().optional().describe('Number of tickets to sample for deep analysis'),
  totalTicketCount: z.number().describe('Total number of tickets in the system'),
});

export type DiscoveryInput = z.infer<typeof DiscoveryInputSchema>;

const PatternInsightSchema = z.object({
  pattern: z.string().describe('The discovered pattern or trend'),
  confidence: z.number().min(0).max(1).describe('Confidence in this pattern (0-1)'),
  evidence: z.array(z.string()).describe('Supporting evidence for this pattern'),
  impact: z.enum(['low', 'medium', 'high', 'critical']).describe('Potential impact level'),
  ticketIds: z.array(z.number()).describe('Example ticket IDs that demonstrate this pattern'),
});

const DataDistributionSchema = z.object({
  dimension: z.string().describe('The data dimension (e.g., "category", "priority", "agent")'),
  distribution: z.array(z.object({
    value: z.string(),
    count: z.number(),
    percentage: z.number(),
  })).describe('Distribution of values for this dimension'),
  insights: z.array(z.string()).describe('Key insights about this distribution'),
});

const DiscoveryOutputSchema = z.object({
  dataQuality: z.object({
    completeness: z.number().min(0).max(1).describe('Data completeness score (0-1)'),
    consistency: z.number().min(0).max(1).describe('Data consistency score (0-1)'),
    issues: z.array(z.string()).describe('Data quality issues identified'),
  }).describe('Assessment of data quality'),
  
  distributions: z.array(DataDistributionSchema).describe('Key data distributions'),
  
  patterns: z.array(PatternInsightSchema).describe('Discovered patterns and trends'),
  
  keyMetrics: z.object({
    totalTickets: z.number(),
    avgResolutionTime: z.number().optional(),
    slaBreachRate: z.number(),
    avgCsatScore: z.number().optional(),
    topCategories: z.array(z.string()),
    topAgents: z.array(z.string()),
  }).describe('Key performance metrics'),
  
  anomalies: z.array(z.object({
    type: z.string().describe('Type of anomaly'),
    description: z.string().describe('Detailed description'),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    affectedTickets: z.array(z.number()).describe('Tickets affected by this anomaly'),
  })).describe('Anomalies detected in the data'),
  
  recommendations: z.array(z.string()).describe('Initial recommendations for further analysis'),
  
  confidenceScore: z.number().min(0).max(1).describe('Overall confidence in discovery findings'),
});

export type DiscoveryOutput = z.infer<typeof DiscoveryOutputSchema>;

export async function discoveryPhase(input: DiscoveryInput): Promise<DiscoveryOutput> {
  // Use AI Flow Optimizer for intelligent processing
  const result = await aiFlowOptimizer.executeFlow(
    'discovery',
    input,
    () => discoveryFlow(input)
  );
  
  return result.data;
}

const discoveryPrompt = ai.definePrompt({
  name: 'discoveryPrompt',
  input: { schema: DiscoveryInputSchema },
  output: { schema: DiscoveryOutputSchema },
  prompt: `You are an expert data analyst performing the Discovery Phase of an agentic workflow.
  
  Your task is to analyze ticket data and discover patterns, distributions, and insights that will guide subsequent analysis phases.
  
  **ANALYSIS INSTRUCTIONS:**
  1. **Data Quality Assessment**: Evaluate completeness, consistency, and identify issues
  2. **Distribution Analysis**: Analyze key dimensions (categories, priorities, agents, status, time patterns)
  3. **Pattern Discovery**: Identify trends, correlations, and recurring themes
  4. **Anomaly Detection**: Find unusual patterns or outliers
  5. **Metric Calculation**: Calculate key performance indicators
  6. **Recommendation Generation**: Suggest areas for deeper investigation
  
  **FOCUS AREAS:**
  - Volume patterns over time
  - Category and priority distributions
  - Agent performance patterns
  - SLA breach patterns
  - Customer satisfaction trends
  - Tag analysis and keyword patterns
  - Response time patterns
  
  **DATA CONTEXT:**
  - Total tickets in system: {{totalTicketCount}}
  - Tickets provided for analysis: {{tickets.length}}
  - Sample size for deep analysis: {{sampleSize}}
  
  **TICKET DATA:**
  {{#each tickets}}
  ---
  ID: {{this.id}}
  Subject: {{{this.subject}}}
  Description: {{{this.description}}}
  Category: {{this.category}}
  Priority: {{this.priority}}
  Status: {{this.status}}
  Created: {{this.created_at}}
  Assignee: {{this.assignee}}
  Tags: {{this.tags}}
  SLA Breached: {{this.sla_breached}}
  CSAT Score: {{this.csat_score}}
  ---
  {{/each}}
  
  **IMPORTANT**: Be thorough but efficient. Focus on patterns that will be most valuable for subsequent analysis phases.
  `,
});

const discoveryFlow = ai.defineFlow(
  {
    name: 'discoveryFlow',
    inputSchema: DiscoveryInputSchema,
    outputSchema: DiscoveryOutputSchema,
  },
  async (input): Promise<DiscoveryOutput> => {
    console.log(`[discoveryFlow] Starting discovery phase with ${input.tickets.length} tickets`);
    
    try {
      // Scrub PII from tickets
      const scrubbedTickets = input.tickets.map(ticket => ({
        ...ticket,
        subject: scrubPii(ticket.subject),
        description: scrubPii(ticket.description.substring(0, 500)), // Truncate for performance
      }));
      
      // Sample tickets if needed for performance
      const sampleSize = input.sampleSize || Math.min(500, input.tickets.length);
      const sampledTickets = sampleSize < scrubbedTickets.length 
        ? scrubbedTickets.slice(0, sampleSize)
        : scrubbedTickets;
      
      const promptInput = {
        ...input,
        tickets: sampledTickets,
        sampleSize,
      };
      
      const { output } = await discoveryPrompt(promptInput);
      
      if (!output) {
        throw new Error('Discovery prompt failed to return output');
      }
      
      console.log(`[discoveryFlow] Discovery phase completed with confidence: ${output.confidenceScore}`);
      return output;
      
    } catch (error) {
      console.error(`[discoveryFlow] Error during discovery phase:`, error);
      throw new Error('Failed to complete discovery phase');
    }
  }
);