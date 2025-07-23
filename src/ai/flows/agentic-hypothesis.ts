'use server';

/**
 * @fileOverview Hypothesis Formation Phase - Key issues/opportunities identification
 * 
 * This is the second phase of the agentic workflow where the agent forms
 * hypotheses about key issues and opportunities based on discovery insights.
 * These hypotheses guide the targeted analysis phase.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { aiFlowOptimizer } from '@/lib/ai-flow-optimizer';
import type { DiscoveryOutput } from './agentic-discovery';

const HypothesisInputSchema = z.object({
  discoveryResults: z.object({
    dataQuality: z.object({
      completeness: z.number(),
      consistency: z.number(),
      issues: z.array(z.string()),
    }),
    distributions: z.array(z.object({
      dimension: z.string(),
      distribution: z.array(z.object({
        value: z.string(),
        count: z.number(),
        percentage: z.number(),
      })),
      insights: z.array(z.string()),
    })),
    patterns: z.array(z.object({
      pattern: z.string(),
      confidence: z.number(),
      evidence: z.array(z.string()),
      impact: z.enum(['low', 'medium', 'high', 'critical']),
      ticketIds: z.array(z.number()),
    })),
    keyMetrics: z.object({
      totalTickets: z.number(),
      avgResolutionTime: z.number().optional(),
      slaBreachRate: z.number(),
      avgCsatScore: z.number().optional(),
      topCategories: z.array(z.string()),
      topAgents: z.array(z.string()),
    }),
    anomalies: z.array(z.object({
      type: z.string(),
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      affectedTickets: z.array(z.number()),
    })),
    recommendations: z.array(z.string()),
    confidenceScore: z.number(),
  }).describe('Results from the discovery phase'),
  
  businessContext: z.object({
    priorities: z.array(z.string()).describe('Current business priorities'),
    constraints: z.array(z.string()).describe('Current constraints or limitations'),
    goals: z.array(z.string()).describe('Business goals and objectives'),
  }).optional().describe('Business context to guide hypothesis formation'),
});

export type HypothesisInput = z.infer<typeof HypothesisInputSchema>;

const HypothesisSchema = z.object({
  id: z.string().describe('Unique identifier for this hypothesis'),
  title: z.string().describe('Clear, concise title for the hypothesis'),
  description: z.string().describe('Detailed description of the hypothesis'),
  type: z.enum(['performance', 'quality', 'process', 'resource', 'risk', 'opportunity']).describe('Type of hypothesis'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Priority level for investigation'),
  confidence: z.number().min(0).max(1).describe('Confidence in this hypothesis (0-1)'),
  
  evidence: z.array(z.string()).describe('Supporting evidence from discovery phase'),
  
  testStrategy: z.object({
    approach: z.string().describe('How to test this hypothesis'),
    dataRequired: z.array(z.string()).describe('What data is needed to test this'),
    tools: z.array(z.string()).describe('Which analysis tools to use'),
    metrics: z.array(z.string()).describe('Key metrics to measure'),
  }).describe('Strategy for testing this hypothesis'),
  
  expectedOutcome: z.string().describe('Expected outcome if hypothesis is correct'),
  businessImpact: z.string().describe('Potential business impact if hypothesis is validated'),
  
  relatedPatterns: z.array(z.string()).describe('Related patterns from discovery phase'),
  dependencies: z.array(z.string()).describe('Dependencies on other hypotheses'),
});

const HypothesisOutputSchema = z.object({
  hypotheses: z.array(HypothesisSchema).describe('Generated hypotheses for testing'),
  
  priorityMatrix: z.array(z.object({
    hypothesisId: z.string(),
    impactScore: z.number().min(0).max(10),
    effortScore: z.number().min(0).max(10),
    riskScore: z.number().min(0).max(10),
    recommendedOrder: z.number(),
  })).describe('Priority matrix for hypothesis testing order'),
  
  investigationPlan: z.object({
    phases: z.array(z.object({
      phase: z.number(),
      hypotheses: z.array(z.string()).describe('Hypothesis IDs to test in this phase'),
      parallelizable: z.boolean().describe('Can these hypotheses be tested in parallel'),
      estimatedTime: z.string().describe('Estimated time for this phase'),
    })),
    dependencies: z.array(z.object({
      hypothesis: z.string(),
      dependsOn: z.array(z.string()),
    })),
  }).describe('Structured plan for investigating hypotheses'),
  
  riskAssessment: z.array(z.object({
    risk: z.string().describe('Potential risk in the investigation'),
    impact: z.enum(['low', 'medium', 'high', 'critical']),
    mitigation: z.string().describe('How to mitigate this risk'),
  })).describe('Risk assessment for the investigation plan'),
  
  successCriteria: z.array(z.string()).describe('Criteria for successful hypothesis validation'),
  
  confidenceScore: z.number().min(0).max(1).describe('Overall confidence in hypothesis formation'),
});

export type HypothesisOutput = z.infer<typeof HypothesisOutputSchema>;

export async function hypothesisFormation(input: HypothesisInput): Promise<HypothesisOutput> {
  // Use AI Flow Optimizer for intelligent processing
  const result = await aiFlowOptimizer.executeFlow(
    'hypothesis',
    input,
    () => hypothesisFlow(input)
  );
  
  return result.data;
}

const hypothesisPrompt = ai.definePrompt({
  name: 'hypothesisPrompt',
  input: { schema: HypothesisInputSchema },
  output: { schema: HypothesisOutputSchema },
  prompt: `You are an expert analyst in the Hypothesis Formation Phase of an agentic workflow.

Your task is to analyze discovery results and form testable hypotheses about key issues and opportunities.

**HYPOTHESIS FORMATION PRINCIPLES:**
1. **Evidence-Based**: Ground hypotheses in discovery findings
2. **Testable**: Each hypothesis must be testable with available data
3. **Actionable**: Focus on hypotheses that can lead to actionable insights
4. **Prioritized**: Rank hypotheses by impact and feasibility
5. **Comprehensive**: Cover performance, quality, process, and risk aspects

**DISCOVERY RESULTS ANALYSIS:**

**Data Quality Assessment:**
- Completeness: {{discoveryResults.dataQuality.completeness}}
- Consistency: {{discoveryResults.dataQuality.consistency}}
- Issues: {{#each discoveryResults.dataQuality.issues}}{{this}}, {{/each}}

**Key Patterns Discovered:**
{{#each discoveryResults.patterns}}
- Pattern: {{this.pattern}}
  - Confidence: {{this.confidence}}
  - Impact: {{this.impact}}
  - Evidence: {{#each this.evidence}}{{this}}, {{/each}}
{{/each}}

**Data Distributions:**
{{#each discoveryResults.distributions}}
- {{this.dimension}}: {{#each this.insights}}{{this}}, {{/each}}
{{/each}}

**Key Metrics:**
- Total Tickets: {{discoveryResults.keyMetrics.totalTickets}}
- SLA Breach Rate: {{discoveryResults.keyMetrics.slaBreachRate}}
- Avg CSAT Score: {{discoveryResults.keyMetrics.avgCsatScore}}
- Top Categories: {{#each discoveryResults.keyMetrics.topCategories}}{{this}}, {{/each}}

**Anomalies Detected:**
{{#each discoveryResults.anomalies}}
- {{this.type}}: {{this.description}} (Severity: {{this.severity}})
{{/each}}

**Business Context:**
{{#if businessContext}}
- Priorities: {{#each businessContext.priorities}}{{this}}, {{/each}}
- Constraints: {{#each businessContext.constraints}}{{this}}, {{/each}}
- Goals: {{#each businessContext.goals}}{{this}}, {{/each}}
{{/if}}

**HYPOTHESIS GENERATION INSTRUCTIONS:**
1. Generate 5-8 high-quality hypotheses covering different aspects
2. Ensure each hypothesis is specific, measurable, and testable
3. Create a strategic investigation plan with proper sequencing
4. Consider both immediate issues and long-term opportunities
5. Account for resource constraints and business priorities
6. Include risk assessment and mitigation strategies

**FOCUS AREAS:**
- Performance bottlenecks and optimization opportunities
- Quality issues and improvement potential
- Process inefficiencies and automation opportunities
- Resource allocation and capacity planning
- Risk factors and mitigation strategies
- Customer experience improvement opportunities

Generate comprehensive hypotheses that will guide effective targeted analysis.
  `,
});

const hypothesisFlow = ai.defineFlow(
  {
    name: 'hypothesisFlow',
    inputSchema: HypothesisInputSchema,
    outputSchema: HypothesisOutputSchema,
  },
  async (input): Promise<HypothesisOutput> => {
    console.log(`[hypothesisFlow] Starting hypothesis formation based on discovery results`);
    
    try {
      const { output } = await hypothesisPrompt(input);
      
      if (!output) {
        throw new Error('Hypothesis prompt failed to return output');
      }
      
      console.log(`[hypothesisFlow] Generated ${output.hypotheses.length} hypotheses with confidence: ${output.confidenceScore}`);
      return output;
      
    } catch (error) {
      console.error(`[hypothesisFlow] Error during hypothesis formation:`, error);
      throw new Error('Failed to complete hypothesis formation');
    }
  }
);