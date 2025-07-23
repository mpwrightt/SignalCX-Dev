'use server';

/**
 * @fileOverview Targeted Analysis Phase - Tool selection and hypothesis testing
 * 
 * This is the third phase of the agentic workflow where the agent selects
 * specific analysis tools and techniques to test hypotheses formed in the
 * previous phase. This is the core analytical phase.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { aiFlowOptimizer } from '@/lib/ai-flow-optimizer';
import type { HypothesisOutput } from './agentic-hypothesis';

const TargetedAnalysisInputSchema = z.object({
  hypotheses: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    type: z.enum(['performance', 'quality', 'process', 'resource', 'risk', 'opportunity']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    confidence: z.number(),
    evidence: z.array(z.string()),
    testStrategy: z.object({
      approach: z.string(),
      dataRequired: z.array(z.string()),
      tools: z.array(z.string()),
      metrics: z.array(z.string()),
    }),
    expectedOutcome: z.string(),
    businessImpact: z.string(),
    relatedPatterns: z.array(z.string()),
    dependencies: z.array(z.string()),
  })).describe('Hypotheses to test'),
  
  investigationPlan: z.object({
    phases: z.array(z.object({
      phase: z.number(),
      hypotheses: z.array(z.string()),
      parallelizable: z.boolean(),
      estimatedTime: z.string(),
    })),
    dependencies: z.array(z.object({
      hypothesis: z.string(),
      dependsOn: z.array(z.string()),
    })),
  }).describe('Investigation plan from hypothesis phase'),
  
  availableTools: z.array(z.string()).describe('Available analysis tools'),
  
  ticketData: z.object({
    summary: z.object({
      totalTickets: z.number(),
      categories: z.array(z.string()),
      timeRange: z.string(),
      keyMetrics: z.record(z.unknown()),
    }),
    sampleData: z.array(z.object({
      id: z.number(),
      category: z.string(),
      priority: z.string().nullable(),
      status: z.string(),
      created_at: z.string(),
      tags: z.array(z.string()),
      sla_breached: z.boolean(),
      csat_score: z.number().optional(),
    })).describe('Sample ticket data for analysis'),
  }).describe('Ticket data for analysis'),
});

export type TargetedAnalysisInput = z.infer<typeof TargetedAnalysisInputSchema>;

const AnalysisResultSchema = z.object({
  hypothesisId: z.string().describe('ID of the hypothesis being tested'),
  testApproach: z.string().describe('Approach used to test the hypothesis'),
  toolsUsed: z.array(z.string()).describe('Analysis tools that were used'),
  
  findings: z.array(z.object({
    finding: z.string().describe('Key finding from the analysis'),
    evidence: z.array(z.string()).describe('Supporting evidence'),
    confidence: z.number().min(0).max(1).describe('Confidence in this finding'),
    statisticalSignificance: z.number().min(0).max(1).optional().describe('Statistical significance if applicable'),
  })).describe('Analysis findings'),
  
  metrics: z.array(z.object({
    metric: z.string().describe('Name of the metric'),
    value: z.number().describe('Measured value'),
    unit: z.string().describe('Unit of measurement'),
    comparison: z.string().optional().describe('Comparison to baseline or target'),
  })).describe('Measured metrics'),
  
  validation: z.object({
    hypothesisSupported: z.boolean().describe('Whether the hypothesis is supported by evidence'),
    supportLevel: z.enum(['weak', 'moderate', 'strong', 'very_strong']).describe('Level of support'),
    alternativeExplanations: z.array(z.string()).describe('Alternative explanations for the findings'),
  }).describe('Hypothesis validation results'),
  
  insights: z.array(z.string()).describe('Key insights from the analysis'),
  limitations: z.array(z.string()).describe('Limitations of the analysis'),
  
  recommendedActions: z.array(z.object({
    action: z.string().describe('Recommended action'),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    impact: z.string().describe('Expected impact of the action'),
    effort: z.enum(['low', 'medium', 'high']).describe('Effort required'),
  })).describe('Recommended actions based on findings'),
});

const TargetedAnalysisOutputSchema = z.object({
  analysisResults: z.array(AnalysisResultSchema).describe('Results for each hypothesis tested'),
  
  crossHypothesisInsights: z.array(z.object({
    insight: z.string().describe('Insight that spans multiple hypotheses'),
    relatedHypotheses: z.array(z.string()).describe('Related hypothesis IDs'),
    confidence: z.number().min(0).max(1).describe('Confidence in this insight'),
    businessImpact: z.string().describe('Business impact of this insight'),
  })).describe('Insights that emerge from testing multiple hypotheses'),
  
  methodologyNotes: z.array(z.string()).describe('Notes about the analytical methodology used'),
  
  dataQualityIssues: z.array(z.object({
    issue: z.string().describe('Data quality issue encountered'),
    impact: z.string().describe('Impact on analysis reliability'),
    mitigation: z.string().describe('How the issue was mitigated'),
  })).describe('Data quality issues encountered during analysis'),
  
  priorityFindings: z.array(z.object({
    finding: z.string().describe('High-priority finding'),
    urgency: z.enum(['low', 'medium', 'high', 'critical']),
    actionRequired: z.string().describe('Immediate action required'),
    timeline: z.string().describe('Recommended timeline for action'),
  })).describe('High-priority findings requiring immediate attention'),
  
  confidenceScore: z.number().min(0).max(1).describe('Overall confidence in the analysis'),
});

export type TargetedAnalysisOutput = z.infer<typeof TargetedAnalysisOutputSchema>;

export async function targetedAnalysis(input: TargetedAnalysisInput): Promise<TargetedAnalysisOutput> {
  // Use AI Flow Optimizer for intelligent processing
  const result = await aiFlowOptimizer.executeFlow(
    'targeted-analysis',
    input,
    () => targetedAnalysisFlow(input)
  );
  
  return result.data;
}

const targetedAnalysisPrompt = ai.definePrompt({
  name: 'targetedAnalysisPrompt',
  input: { schema: TargetedAnalysisInputSchema },
  output: { schema: TargetedAnalysisOutputSchema },
  prompt: `You are an expert data scientist in the Targeted Analysis Phase of an agentic workflow.

Your task is to systematically test hypotheses using appropriate analytical methods and tools.

**ANALYSIS PRINCIPLES:**
1. **Systematic Testing**: Test each hypothesis methodically
2. **Tool Selection**: Choose appropriate tools for each analysis type
3. **Evidence-Based**: Support findings with solid evidence
4. **Statistical Rigor**: Use appropriate statistical methods
5. **Cross-Validation**: Look for patterns across multiple hypotheses
6. **Practical Focus**: Focus on actionable insights

**AVAILABLE TOOLS:**
{{#each availableTools}}
- {{this}}
{{/each}}

**TICKET DATA SUMMARY:**
- Total Tickets: {{ticketData.summary.totalTickets}}
- Categories: {{#each ticketData.summary.categories}}{{this}}, {{/each}}
- Time Range: {{ticketData.summary.timeRange}}
- Key Metrics: {{ticketData.summary.keyMetrics}}

**HYPOTHESES TO TEST:**
{{#each hypotheses}}
---
**Hypothesis {{this.id}}: {{this.title}}**
- Description: {{this.description}}
- Type: {{this.type}}
- Priority: {{this.priority}}
- Test Strategy: {{this.testStrategy.approach}}
- Tools: {{#each this.testStrategy.tools}}{{this}}, {{/each}}
- Metrics: {{#each this.testStrategy.metrics}}{{this}}, {{/each}}
- Expected Outcome: {{this.expectedOutcome}}
- Business Impact: {{this.businessImpact}}
---
{{/each}}

**INVESTIGATION PLAN:**
{{#each investigationPlan.phases}}
Phase {{this.phase}} ({{this.estimatedTime}}):
- Hypotheses: {{#each this.hypotheses}}{{this}}, {{/each}}
- Parallelizable: {{this.parallelizable}}
{{/each}}

**SAMPLE DATA FOR ANALYSIS:**
{{#each ticketData.sampleData}}
- Ticket {{this.id}}: {{this.category}} | {{this.priority}} | {{this.status}} | SLA Breached: {{this.sla_breached}} | CSAT: {{this.csat_score}}
{{/each}}

**ANALYSIS INSTRUCTIONS:**
1. **For each hypothesis**, conduct thorough analysis using appropriate methods
2. **Apply statistical rigor** where applicable (significance testing, confidence intervals)
3. **Document methodology** clearly for reproducibility
4. **Identify cross-hypothesis patterns** and emergent insights
5. **Assess data quality** and note limitations
6. **Prioritize findings** by business impact and urgency
7. **Generate actionable recommendations** with clear next steps

**SPECIFIC ANALYSIS APPROACHES:**
- **Performance Analysis**: Use time series analysis, regression, correlation
- **Quality Analysis**: Use statistical quality control, trend analysis
- **Process Analysis**: Use process mining, flow analysis, bottleneck identification
- **Resource Analysis**: Use capacity planning, workload analysis, allocation optimization
- **Risk Analysis**: Use risk modeling, scenario analysis, Monte Carlo simulation
- **Opportunity Analysis**: Use gap analysis, benchmarking, optimization modeling

**OUTPUT REQUIREMENTS:**
- Comprehensive analysis for each hypothesis
- Clear validation of support/rejection
- Cross-hypothesis insights and patterns
- Prioritized, actionable recommendations
- Methodology documentation
- Confidence assessments

Conduct thorough, rigorous analysis that provides actionable business insights.
  `,
});

const targetedAnalysisFlow = ai.defineFlow(
  {
    name: 'targetedAnalysisFlow',
    inputSchema: TargetedAnalysisInputSchema,
    outputSchema: TargetedAnalysisOutputSchema,
  },
  async (input): Promise<TargetedAnalysisOutput> => {
    console.log(`[targetedAnalysisFlow] Starting targeted analysis for ${input.hypotheses.length} hypotheses`);
    
    try {
      const { output } = await targetedAnalysisPrompt(input);
      
      if (!output) {
        throw new Error('Targeted analysis prompt failed to return output');
      }
      
      console.log(`[targetedAnalysisFlow] Completed analysis with ${output.analysisResults.length} results, confidence: ${output.confidenceScore}`);
      return output;
      
    } catch (error) {
      console.error(`[targetedAnalysisFlow] Error during targeted analysis:`, error);
      throw new Error('Failed to complete targeted analysis');
    }
  }
);