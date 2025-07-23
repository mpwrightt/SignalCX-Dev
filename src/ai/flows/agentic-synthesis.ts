'use server';

/**
 * @fileOverview Synthesis Phase - Coherent insights combination
 * 
 * This is the fifth phase of the agentic workflow where the agent synthesizes
 * validated findings into coherent insights and identifies emergent patterns
 * that span multiple analyses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { aiFlowOptimizer } from '@/lib/ai-flow-optimizer';
import type { CrossValidationOutput } from './agentic-cross-validation';

const SynthesisInputSchema = z.object({
  validationResults: z.array(z.object({
    originalFinding: z.string(),
    validationMethod: z.string(),
    validationOutcome: z.enum(['confirmed', 'partially_confirmed', 'refuted', 'inconclusive']),
    confidence: z.object({
      original: z.number(),
      validated: z.number(),
      change: z.number(),
      reason: z.string(),
    }),
    evidence: z.array(z.object({
      type: z.string(),
      description: z.string(),
      strength: z.enum(['weak', 'moderate', 'strong']),
    })),
    biasAssessment: z.object({
      potentialBiases: z.array(z.string()),
      mitigation: z.array(z.string()),
      residualRisk: z.enum(['low', 'medium', 'high']),
    }),
    alternativeExplanations: z.array(z.object({
      explanation: z.string(),
      plausibility: z.enum(['low', 'medium', 'high']),
      testable: z.boolean(),
    })),
    recommendations: z.array(z.string()),
  })).describe('Results from cross-validation phase'),
  
  consensusFindings: z.array(z.object({
    finding: z.string(),
    confidence: z.number(),
    supportingMethods: z.array(z.string()),
    businessImplication: z.string(),
  })).describe('Findings confirmed by multiple validation methods'),
  
  conflictingFindings: z.array(z.object({
    originalFinding: z.string(),
    conflictingEvidence: z.string(),
    resolution: z.string(),
    finalAssessment: z.string(),
  })).describe('Findings with conflicting validation results'),
  
  reliabilityAssessment: z.object({
    overallReliability: z.number(),
    methodologyStrength: z.enum(['weak', 'moderate', 'strong', 'very_strong']),
    dataQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
    biasRisk: z.enum(['low', 'medium', 'high', 'critical']),
    limitations: z.array(z.string()),
  }).describe('Assessment of analysis reliability'),
  
  strengthenedRecommendations: z.array(z.object({
    recommendation: z.string(),
    confidence: z.number(),
    validationSupport: z.array(z.string()),
    riskAssessment: z.string(),
  })).describe('Recommendations strengthened by validation'),
  
  businessContext: z.object({
    objectives: z.array(z.string()).describe('Current business objectives'),
    constraints: z.array(z.string()).describe('Current constraints'),
    stakeholders: z.array(z.string()).describe('Key stakeholders'),
    timeline: z.string().describe('Timeline for implementation'),
  }).optional().describe('Business context for synthesis'),
});

export type SynthesisInput = z.infer<typeof SynthesisInputSchema>;

const SynthesizedInsightSchema = z.object({
  id: z.string().describe('Unique identifier for this insight'),
  title: z.string().describe('Clear, executive-level title'),
  description: z.string().describe('Comprehensive description of the insight'),
  
  category: z.enum(['strategic', 'operational', 'tactical', 'risk', 'opportunity']).describe('Category of insight'),
  
  supportingFindings: z.array(z.string()).describe('Validated findings that support this insight'),
  
  businessImpact: z.object({
    description: z.string().describe('Business impact description'),
    magnitude: z.enum(['low', 'medium', 'high', 'critical']).describe('Impact magnitude'),
    timeframe: z.enum(['immediate', 'short_term', 'medium_term', 'long_term']).describe('Impact timeframe'),
    quantification: z.string().optional().describe('Quantified impact if possible'),
  }).describe('Business impact assessment'),
  
  confidence: z.number().min(0).max(1).describe('Confidence in this insight'),
  
  dependencies: z.array(z.string()).describe('Dependencies on other insights or factors'),
  
  risks: z.array(z.object({
    risk: z.string().describe('Risk description'),
    probability: z.enum(['low', 'medium', 'high']).describe('Risk probability'),
    impact: z.enum(['low', 'medium', 'high', 'critical']).describe('Risk impact'),
    mitigation: z.string().describe('Risk mitigation strategy'),
  })).describe('Associated risks'),
  
  opportunities: z.array(z.object({
    opportunity: z.string().describe('Opportunity description'),
    potential: z.enum(['low', 'medium', 'high']).describe('Opportunity potential'),
    requirements: z.array(z.string()).describe('Requirements to capture opportunity'),
  })).describe('Associated opportunities'),
});

const SynthesisOutputSchema = z.object({
  synthesizedInsights: z.array(SynthesizedInsightSchema).describe('Synthesized insights from all analyses'),
  
  emergentPatterns: z.array(z.object({
    pattern: z.string().describe('Emergent pattern discovered'),
    description: z.string().describe('Detailed description of the pattern'),
    significance: z.enum(['low', 'medium', 'high', 'critical']).describe('Significance of the pattern'),
    implications: z.array(z.string()).describe('Implications of this pattern'),
    contributingFactors: z.array(z.string()).describe('Factors contributing to this pattern'),
  })).describe('Emergent patterns identified during synthesis'),
  
  rootCauseAnalysis: z.array(z.object({
    issue: z.string().describe('Issue identified'),
    rootCauses: z.array(z.object({
      cause: z.string().describe('Root cause description'),
      confidence: z.number().min(0).max(1).describe('Confidence in this root cause'),
      evidence: z.array(z.string()).describe('Evidence supporting this root cause'),
    })).describe('Identified root causes'),
    systemicFactors: z.array(z.string()).describe('Systemic factors contributing to the issue'),
  })).describe('Root cause analysis of key issues'),
  
  strategicImplications: z.object({
    shortTerm: z.array(z.string()).describe('Short-term strategic implications'),
    mediumTerm: z.array(z.string()).describe('Medium-term strategic implications'),
    longTerm: z.array(z.string()).describe('Long-term strategic implications'),
    competitiveAdvantage: z.array(z.string()).describe('Potential competitive advantages'),
    threats: z.array(z.string()).describe('Strategic threats identified'),
  }).describe('Strategic implications of the synthesized insights'),
  
  systemicRecommendations: z.array(z.object({
    recommendation: z.string().describe('Systemic recommendation'),
    rationale: z.string().describe('Rationale for the recommendation'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Recommendation priority'),
    effort: z.enum(['low', 'medium', 'high']).describe('Implementation effort'),
    impact: z.enum(['low', 'medium', 'high', 'critical']).describe('Expected impact'),
    dependencies: z.array(z.string()).describe('Dependencies for implementation'),
    timeline: z.string().describe('Recommended implementation timeline'),
    riskMitigation: z.array(z.string()).describe('Risk mitigation strategies'),
  })).describe('Systemic recommendations addressing root causes'),
  
  narrativeInsight: z.string().describe('Executive narrative summarizing the key story emerging from the analysis'),
  
  confidenceScore: z.number().min(0).max(1).describe('Overall confidence in the synthesized insights'),
});

export type SynthesisOutput = z.infer<typeof SynthesisOutputSchema>;

export async function synthesisPhase(input: SynthesisInput): Promise<SynthesisOutput> {
  // Use AI Flow Optimizer for intelligent processing
  const result = await aiFlowOptimizer.executeFlow(
    'synthesis',
    input,
    () => synthesisFlow(input)
  );
  
  return result.data;
}

const synthesisPrompt = ai.definePrompt({
  name: 'synthesisPrompt',
  input: { schema: SynthesisInputSchema },
  output: { schema: SynthesisOutputSchema },
  prompt: `You are an expert strategic analyst in the Synthesis Phase of an agentic workflow.

Your task is to synthesize validated findings into coherent insights and identify emergent patterns that create a comprehensive understanding of the situation.

**SYNTHESIS PRINCIPLES:**
1. **Holistic View**: Look beyond individual findings to see the bigger picture
2. **Pattern Recognition**: Identify emergent patterns across multiple analyses
3. **Root Cause Analysis**: Identify underlying systemic causes
4. **Strategic Thinking**: Consider broader strategic implications
5. **Narrative Construction**: Build a coherent story from the findings
6. **Actionable Insights**: Generate insights that enable decision-making

**RELIABILITY ASSESSMENT:**
- Overall Reliability: {{reliabilityAssessment.overallReliability}}
- Methodology Strength: {{reliabilityAssessment.methodologyStrength}}
- Data Quality: {{reliabilityAssessment.dataQuality}}
- Bias Risk: {{reliabilityAssessment.biasRisk}}
- Key Limitations: {{#each reliabilityAssessment.limitations}}{{this}}, {{/each}}

**CONSENSUS FINDINGS (High Confidence):**
{{#each consensusFindings}}
- {{this.finding}} (Confidence: {{this.confidence}})
  Supporting Methods: {{#each this.supportingMethods}}{{this}}, {{/each}}
  Business Implication: {{this.businessImplication}}
{{/each}}

**CONFLICTING FINDINGS (Require Careful Interpretation):**
{{#each conflictingFindings}}
- Original: {{this.originalFinding}}
  Conflict: {{this.conflictingEvidence}}
  Resolution: {{this.resolution}}
  Final Assessment: {{this.finalAssessment}}
{{/each}}

**STRENGTHENED RECOMMENDATIONS:**
{{#each strengthenedRecommendations}}
- {{this.recommendation}} (Confidence: {{this.confidence}})
  Validation Support: {{#each this.validationSupport}}{{this}}, {{/each}}
  Risk Assessment: {{this.riskAssessment}}
{{/each}}

**VALIDATION RESULTS SUMMARY:**
{{#each validationResults}}
- Finding: {{this.originalFinding}}
  Validation Outcome: {{this.validationOutcome}}
  Confidence Change: {{this.confidence.change}} ({{this.confidence.reason}})
  Bias Risk: {{this.biasAssessment.residualRisk}}
{{/each}}

**BUSINESS CONTEXT:**
{{#if businessContext}}
- Objectives: {{#each businessContext.objectives}}{{this}}, {{/each}}
- Constraints: {{#each businessContext.constraints}}{{this}}, {{/each}}
- Stakeholders: {{#each businessContext.stakeholders}}{{this}}, {{/each}}
- Timeline: {{businessContext.timeline}}
{{/if}}

**SYNTHESIS INSTRUCTIONS:**
1. **Synthesize Insights**: Combine validated findings into higher-level insights
2. **Identify Patterns**: Look for emergent patterns across multiple findings
3. **Root Cause Analysis**: Identify underlying systemic causes of issues
4. **Strategic Implications**: Consider short, medium, and long-term implications
5. **Systemic Recommendations**: Generate recommendations addressing root causes
6. **Narrative Construction**: Build an executive narrative explaining the key story
7. **Confidence Assessment**: Provide honest assessment of confidence levels

**SYNTHESIS FOCUS AREAS:**
- **Operational Excellence**: Patterns in performance and quality
- **Process Optimization**: Systemic inefficiencies and improvement opportunities
- **Resource Allocation**: Patterns in resource utilization and capacity
- **Risk Management**: Systemic risks and mitigation strategies
- **Strategic Positioning**: Competitive advantages and market opportunities
- **Organizational Development**: Capability gaps and development needs

**PATTERN TYPES TO LOOK FOR:**
- Causal relationships between findings
- Reinforcing feedback loops
- Systemic bottlenecks
- Emerging trends
- Unintended consequences
- Hidden dependencies
- Leverage points for change

**OUTPUT REQUIREMENTS:**
- 3-5 high-level synthesized insights
- Clear identification of emergent patterns
- Root cause analysis of key issues
- Strategic implications across time horizons
- Systemic recommendations with implementation guidance
- Executive narrative that tells the complete story
- Transparent confidence assessment

Create a comprehensive synthesis that transforms individual findings into strategic understanding.
  `,
});

const synthesisFlow = ai.defineFlow(
  {
    name: 'synthesisFlow',
    inputSchema: SynthesisInputSchema,
    outputSchema: SynthesisOutputSchema,
  },
  async (input): Promise<SynthesisOutput> => {
    console.log(`[synthesisFlow] Starting synthesis of ${input.validationResults.length} validation results`);
    
    try {
      const { output } = await synthesisPrompt(input);
      
      if (!output) {
        throw new Error('Synthesis prompt failed to return output');
      }
      
      console.log(`[synthesisFlow] Completed synthesis with ${output.synthesizedInsights.length} insights, confidence: ${output.confidenceScore}`);
      return output;
      
    } catch (error) {
      console.error(`[synthesisFlow] Error during synthesis:`, error);
      throw new Error('Failed to complete synthesis');
    }
  }
);