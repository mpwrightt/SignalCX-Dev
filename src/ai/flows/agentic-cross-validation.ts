'use server';

/**
 * @fileOverview Cross-Validation Phase - Multiple validation approaches
 * 
 * This is the fourth phase of the agentic workflow where the agent validates
 * findings from targeted analysis using multiple approaches to increase
 * confidence and identify potential biases or errors.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { aiFlowOptimizer } from '@/lib/ai-flow-optimizer';
import type { TargetedAnalysisOutput } from './agentic-targeted-analysis';

const CrossValidationInputSchema = z.object({
  analysisResults: z.array(z.object({
    hypothesisId: z.string(),
    testApproach: z.string(),
    toolsUsed: z.array(z.string()),
    findings: z.array(z.object({
      finding: z.string(),
      evidence: z.array(z.string()),
      confidence: z.number(),
      statisticalSignificance: z.number().optional(),
    })),
    metrics: z.array(z.object({
      metric: z.string(),
      value: z.number(),
      unit: z.string(),
      comparison: z.string().optional(),
    })),
    validation: z.object({
      hypothesisSupported: z.boolean(),
      supportLevel: z.enum(['weak', 'moderate', 'strong', 'very_strong']),
      alternativeExplanations: z.array(z.string()),
    }),
    insights: z.array(z.string()),
    limitations: z.array(z.string()),
    recommendedActions: z.array(z.object({
      action: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      impact: z.string(),
      effort: z.enum(['low', 'medium', 'high']),
    })),
  })).describe('Results from targeted analysis phase'),
  
  crossHypothesisInsights: z.array(z.object({
    insight: z.string(),
    relatedHypotheses: z.array(z.string()),
    confidence: z.number(),
    businessImpact: z.string(),
  })).describe('Cross-hypothesis insights from targeted analysis'),
  
  priorityFindings: z.array(z.object({
    finding: z.string(),
    urgency: z.enum(['low', 'medium', 'high', 'critical']),
    actionRequired: z.string(),
    timeline: z.string(),
  })).describe('High-priority findings from targeted analysis'),
  
  validationMethods: z.array(z.string()).describe('Available validation methods'),
  
  historicalData: z.object({
    patterns: z.array(z.string()).describe('Historical patterns for comparison'),
    benchmarks: z.array(z.object({
      metric: z.string(),
      value: z.number(),
      source: z.string(),
    })).describe('Historical benchmarks'),
  }).optional().describe('Historical data for validation'),
});

export type CrossValidationInput = z.infer<typeof CrossValidationInputSchema>;

const ValidationResultSchema = z.object({
  originalFinding: z.string().describe('Original finding being validated'),
  validationMethod: z.string().describe('Method used for validation'),
  
  validationOutcome: z.enum(['confirmed', 'partially_confirmed', 'refuted', 'inconclusive']).describe('Validation outcome'),
  
  confidence: z.object({
    original: z.number().describe('Original confidence level'),
    validated: z.number().describe('Confidence after validation'),
    change: z.number().describe('Change in confidence'),
    reason: z.string().describe('Reason for confidence change'),
  }).describe('Confidence assessment'),
  
  evidence: z.array(z.object({
    type: z.string().describe('Type of evidence'),
    description: z.string().describe('Evidence description'),
    strength: z.enum(['weak', 'moderate', 'strong']).describe('Evidence strength'),
  })).describe('Validation evidence'),
  
  biasAssessment: z.object({
    potentialBiases: z.array(z.string()).describe('Potential biases identified'),
    mitigation: z.array(z.string()).describe('Bias mitigation strategies'),
    residualRisk: z.enum(['low', 'medium', 'high']).describe('Remaining bias risk'),
  }).describe('Bias assessment and mitigation'),
  
  alternativeExplanations: z.array(z.object({
    explanation: z.string().describe('Alternative explanation'),
    plausibility: z.enum(['low', 'medium', 'high']).describe('Plausibility of alternative'),
    testable: z.boolean().describe('Whether this alternative is testable'),
  })).describe('Alternative explanations considered'),
  
  recommendations: z.array(z.string()).describe('Recommendations based on validation'),
});

const CrossValidationOutputSchema = z.object({
  validationResults: z.array(ValidationResultSchema).describe('Validation results for each finding'),
  
  consensusFindings: z.array(z.object({
    finding: z.string().describe('Finding confirmed by multiple validation methods'),
    confidence: z.number().min(0).max(1).describe('Consensus confidence level'),
    supportingMethods: z.array(z.string()).describe('Validation methods that support this finding'),
    businessImplication: z.string().describe('Business implication of this finding'),
  })).describe('Findings confirmed by multiple validation approaches'),
  
  conflictingFindings: z.array(z.object({
    originalFinding: z.string().describe('Original finding'),
    conflictingEvidence: z.string().describe('Evidence that conflicts with the finding'),
    resolution: z.string().describe('How the conflict was resolved'),
    finalAssessment: z.string().describe('Final assessment of the finding'),
  })).describe('Findings with conflicting validation results'),
  
  reliabilityAssessment: z.object({
    overallReliability: z.number().min(0).max(1).describe('Overall reliability of the analysis'),
    methodologyStrength: z.enum(['weak', 'moderate', 'strong', 'very_strong']).describe('Strength of methodology'),
    dataQuality: z.enum(['poor', 'fair', 'good', 'excellent']).describe('Overall data quality'),
    biasRisk: z.enum(['low', 'medium', 'high', 'critical']).describe('Overall bias risk'),
    limitations: z.array(z.string()).describe('Key limitations of the analysis'),
  }).describe('Assessment of analysis reliability'),
  
  validationGaps: z.array(z.object({
    gap: z.string().describe('Validation gap identified'),
    impact: z.enum(['low', 'medium', 'high', 'critical']).describe('Impact of this gap'),
    recommendation: z.string().describe('Recommendation to address the gap'),
  })).describe('Gaps in validation coverage'),
  
  strengthenedRecommendations: z.array(z.object({
    recommendation: z.string().describe('Strengthened recommendation'),
    confidence: z.number().min(0).max(1).describe('Confidence in recommendation'),
    validationSupport: z.array(z.string()).describe('Validation methods that support this recommendation'),
    riskAssessment: z.string().describe('Risk assessment for this recommendation'),
  })).describe('Recommendations strengthened by validation'),
  
  confidenceScore: z.number().min(0).max(1).describe('Overall confidence in validated findings'),
});

export type CrossValidationOutput = z.infer<typeof CrossValidationOutputSchema>;

export async function crossValidation(input: CrossValidationInput): Promise<CrossValidationOutput> {
  // Use AI Flow Optimizer for intelligent processing
  const result = await aiFlowOptimizer.executeFlow(
    'cross-validation',
    input,
    () => crossValidationFlow(input)
  );
  
  return result.data;
}

const crossValidationPrompt = ai.definePrompt({
  name: 'crossValidationPrompt',
  input: { schema: CrossValidationInputSchema },
  output: { schema: CrossValidationOutputSchema },
  prompt: `You are an expert analyst in the Cross-Validation Phase of an agentic workflow.

Your task is to validate findings from targeted analysis using multiple approaches to increase confidence and identify potential biases or errors.

**VALIDATION PRINCIPLES:**
1. **Multiple Methods**: Use diverse validation approaches
2. **Bias Detection**: Actively look for potential biases
3. **Alternative Explanations**: Consider alternative interpretations
4. **Triangulation**: Use multiple evidence sources
5. **Skeptical Inquiry**: Question assumptions and findings
6. **Transparency**: Document limitations and uncertainties

**AVAILABLE VALIDATION METHODS:**
{{#each validationMethods}}
- {{this}}
{{/each}}

**HISTORICAL CONTEXT:**
{{#if historicalData}}
Historical Patterns:
{{#each historicalData.patterns}}
- {{this}}
{{/each}}

Benchmarks:
{{#each historicalData.benchmarks}}
- {{this.metric}}: {{this.value}} ({{this.source}})
{{/each}}
{{/if}}

**ANALYSIS RESULTS TO VALIDATE:**
{{#each analysisResults}}
---
**Hypothesis {{this.hypothesisId}} Results:**
- Approach: {{this.testApproach}}
- Tools: {{#each this.toolsUsed}}{{this}}, {{/each}}
- Hypothesis Supported: {{this.validation.hypothesisSupported}}
- Support Level: {{this.validation.supportLevel}}

**Findings:**
{{#each this.findings}}
- {{this.finding}} (Confidence: {{this.confidence}})
  Evidence: {{#each this.evidence}}{{this}}, {{/each}}
{{/each}}

**Metrics:**
{{#each this.metrics}}
- {{this.metric}}: {{this.value}} {{this.unit}}
{{/each}}

**Insights:**
{{#each this.insights}}
- {{this}}
{{/each}}

**Limitations:**
{{#each this.limitations}}
- {{this}}
{{/each}}
---
{{/each}}

**CROSS-HYPOTHESIS INSIGHTS:**
{{#each crossHypothesisInsights}}
- {{this.insight}} (Confidence: {{this.confidence}})
  Related Hypotheses: {{#each this.relatedHypotheses}}{{this}}, {{/each}}
  Business Impact: {{this.businessImpact}}
{{/each}}

**PRIORITY FINDINGS:**
{{#each priorityFindings}}
- {{this.finding}} (Urgency: {{this.urgency}})
  Action Required: {{this.actionRequired}}
  Timeline: {{this.timeline}}
{{/each}}

**VALIDATION INSTRUCTIONS:**
1. **For each key finding**, apply multiple validation methods
2. **Assess potential biases** in methodology, data, or interpretation
3. **Test alternative explanations** for observed patterns
4. **Triangulate evidence** from multiple sources and methods
5. **Identify conflicts** between different validation approaches
6. **Assess reliability** of the overall analysis
7. **Strengthen recommendations** based on validation results

**SPECIFIC VALIDATION APPROACHES:**
- **Triangulation**: Cross-reference findings with multiple data sources
- **Replication**: Attempt to replicate findings with different methods
- **Sensitivity Analysis**: Test how findings change with different assumptions
- **Historical Comparison**: Compare findings with historical patterns
- **Peer Review**: Apply expert judgment to assess findings
- **Statistical Validation**: Use bootstrapping, cross-validation, significance testing
- **Bias Testing**: Systematically test for common analytical biases

**BIAS TYPES TO CHECK:**
- Selection bias in data sampling
- Confirmation bias in interpretation
- Survivorship bias in success metrics
- Temporal bias in trend analysis
- Attribution bias in causal claims
- Anchoring bias in benchmarking

**OUTPUT REQUIREMENTS:**
- Comprehensive validation of each key finding
- Clear assessment of confidence changes
- Identification of consensus vs. conflicting findings
- Bias assessment and mitigation strategies
- Strengthened recommendations with validation support
- Transparent documentation of limitations

Conduct thorough, skeptical validation that strengthens the reliability of the analysis.
  `,
});

const crossValidationFlow = ai.defineFlow(
  {
    name: 'crossValidationFlow',
    inputSchema: CrossValidationInputSchema,
    outputSchema: CrossValidationOutputSchema,
  },
  async (input): Promise<CrossValidationOutput> => {
    console.log(`[crossValidationFlow] Starting cross-validation for ${input.analysisResults.length} analysis results`);
    
    try {
      const { output } = await crossValidationPrompt(input);
      
      if (!output) {
        throw new Error('Cross-validation prompt failed to return output');
      }
      
      console.log(`[crossValidationFlow] Completed validation with ${output.validationResults.length} results, confidence: ${output.confidenceScore}`);
      return output;
      
    } catch (error) {
      console.error(`[crossValidationFlow] Error during cross-validation:`, error);
      throw new Error('Failed to complete cross-validation');
    }
  }
);