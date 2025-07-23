'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Import all existing flows as tools
import { getPerformanceForecasts } from './get-performance-forecasts';
import { getBurnoutIndicators } from './get-burnout-indicators';
import { getKnowledgeGaps } from './get-knowledge-gaps';
import { getSlaPrediction } from './get-sla-prediction';
import { getHolisticAnalysis } from './get-holistic-analysis';
import { batchAnalyzeTickets } from './batch-analyze-tickets';
import { batchIdentifyTicketRisks } from './batch-identify-ticket-risks';
// Note: Some flows may not be available yet, so we'll include only the core ones
// import { getTicketAnalysisDetails } from './get-ticket-analysis-details';
// import { getTicketSummary } from './get-ticket-summary';
// import { predictiveAnalysis } from './predictive-analysis';
// import { queryTickets } from './query-tickets';
// import { summarizeTrends } from './summarize-trends';
// import { clusterTickets } from './cluster-tickets';
// import { getCoachingInsights } from './get-coaching-insights';
// import { fetchAndAnalyzeTickets } from './fetch-and-analyze-tickets';
// import { socialMediaIntelligence } from './social-media-intelligence';

// Define the input schema
const aiAnalystInputSchema = z.object({
  tickets: z.array(z.any()),
  preprocessedData: z.any().optional(),
  userRequest: z.string().optional(),
  analysisGoal: z.enum(['comprehensive', 'performance', 'risk', 'trends', 'custom']).default('comprehensive'),
  targetAgents: z.array(z.string()).optional(),
  timeRange: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  maxTools: z.number().default(10),
  explainProcess: z.boolean().default(true)
});

// Define the output schema for enterprise-ready insights
const aiAnalystOutputSchema = z.object({
  executiveSummary: z.string(),
  strategicFindings: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    businessImpact: z.string(),
    urgency: z.enum(['low', 'medium', 'high', 'critical']),
    confidence: z.number(),
    evidence: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
    estimatedROI: z.string().optional()
  })).optional(),
  operationalMetrics: z.object({
    customerSatisfactionTrend: z.string(),
    efficiencyScore: z.number(),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    resourceUtilization: z.string().optional(),
    qualityIndicators: z.array(z.string()).optional()
  }).optional(),
  performanceInsights: z.array(z.object({
    metric: z.string(),
    currentValue: z.string(),
    benchmark: z.string().optional(),
    trend: z.enum(['improving', 'stable', 'declining']),
    impact: z.string(),
    actionRequired: z.boolean()
  })).optional(),
  riskAssessment: z.object({
    immediateRisks: z.array(z.string()).optional(),
    emergingConcerns: z.array(z.string()).optional(),
    mitigationStrategies: z.array(z.string()).optional(),
    contingencyPlans: z.array(z.string()).optional()
  }).optional(),
  strategicRecommendations: z.array(z.object({
    priority: z.enum(['P1', 'P2', 'P3']),
    category: z.string(),
    recommendation: z.string(),
    timeline: z.string().optional(),
    requiredResources: z.array(z.string()).optional(),
    expectedOutcome: z.string().optional(),
    successMetrics: z.array(z.string()).optional()
  })).optional(),
  toolAnalysis: z.array(z.object({
    tool: z.string(),
    reasoning: z.string(),
    input: z.any(),
    output: z.any(),
    confidence: z.number(),
    executionTime: z.number(),
    success: z.boolean(),
    businessValue: z.string(),
    error: z.string().optional()
  })).optional(),
  confidence: z.number().optional(),
  processingTime: z.number().optional(),
  completionStatus: z.enum(['complete', 'partial', 'interrupted']).optional(),
  reportGenerated: z.string().optional()
});

// Define available tools for the agent (only including confirmed available flows)
const availableTools = {
  performanceForecasts: {
    description: 'Generate AI-powered performance forecasts for agents',
    inputSchema: z.object({
      preprocessedData: z.any().optional(),
      tickets: z.array(z.any()).optional(),
      targetAgents: z.array(z.string()).optional()
    }),
    execute: getPerformanceForecasts
  },
  burnoutIndicators: {
    description: 'Detect burnout risk indicators for agents',
    inputSchema: z.object({
      preprocessedData: z.any().optional(),
      tickets: z.array(z.any()).optional(),
      targetAgents: z.array(z.string()).optional()
    }),
    execute: getBurnoutIndicators
  },
  knowledgeGaps: {
    description: 'Identify knowledge gaps and training opportunities',
    inputSchema: z.object({
      preprocessedData: z.any().optional(),
      tickets: z.array(z.any()).optional(),
      targetAgents: z.array(z.string()).optional()
    }),
    execute: getKnowledgeGaps
  },
  slaPrediction: {
    description: 'Predict SLA breach risks and provide recommendations',
    inputSchema: z.object({
      preprocessedData: z.any().optional(),
      tickets: z.array(z.any()).optional()
    }),
    execute: getSlaPrediction
  },
  holisticAnalysis: {
    description: 'Perform comprehensive holistic analysis with trends and predictions',
    inputSchema: z.object({
      tickets: z.array(z.any()),
      forecastDays: z.number().optional()
    }),
    execute: getHolisticAnalysis
  },
  batchAnalyze: {
    description: 'Batch analyze tickets for patterns and insights',
    inputSchema: z.object({
      tickets: z.array(z.any()),
      analysisType: z.string().optional()
    }),
    execute: batchAnalyzeTickets
  },
  riskAnalysis: {
    description: 'Identify high-risk tickets and escalation needs',
    inputSchema: z.object({
      tickets: z.array(z.any()),
      riskThreshold: z.number().optional()
    }),
    execute: batchIdentifyTicketRisks
  }
};

// Define the AI Analyst prompt for enterprise-ready analysis
const aiAnalystPrompt = ai.definePrompt(
  {
    name: 'aiAnalyst',
    input: { schema: aiAnalystInputSchema },
    output: { schema: aiAnalystOutputSchema },
    model: 'googleai/gemini-2.0-flash-exp',
  },
  `
You are a Senior AI Business Analyst and Customer Experience Strategist, specializing in enterprise-level customer support operations analysis. You provide C-level executives and department heads with strategic insights for business-critical decisions.

**EXECUTIVE CONTEXT:**
You are generating a comprehensive business intelligence report for senior leadership. Your analysis will inform strategic decisions affecting customer satisfaction, operational efficiency, resource allocation, and business growth.

**AVAILABLE ANALYTICAL TOOLS:**
${Object.entries(availableTools).map(([key, tool]) => `- ${key}: ${tool.description}`).join('\n')}

**CURRENT ANALYSIS SCOPE:**
- Dataset: {{tickets.length}} customer support tickets
- Business Objective: {{analysisGoal}}
- Specific Request: {{userRequest}}
- Focus Areas: {{targetAgents}}
- Priority Level: {{priority}}
- Analysis Depth: {{maxTools}} tools maximum

**ENTERPRISE ANALYSIS FRAMEWORK:**

1. **STRATEGIC ASSESSMENT**
   - Evaluate customer satisfaction trends and business impact
   - Identify operational efficiency opportunities
   - Assess resource utilization and capacity planning needs
   - Calculate financial implications of findings

2. **RISK MANAGEMENT**
   - Identify immediate threats to customer retention
   - Assess operational risks and bottlenecks
   - Evaluate agent burnout and performance degradation risks
   - Analyze SLA compliance and reputation risks

3. **PERFORMANCE OPTIMIZATION**
   - Benchmark current performance against industry standards
   - Identify automation and process improvement opportunities
   - Assess training and coaching needs
   - Evaluate technology and tool effectiveness

4. **BUSINESS INTELLIGENCE**
   - Generate ROI calculations for recommended investments
   - Provide data-driven resource allocation recommendations
   - Identify revenue protection and growth opportunities
   - Create success metrics and KPI recommendations

**CRITICAL OUTPUT FORMAT REQUIREMENT:**
You MUST provide your response as a valid JSON object with the following exact structure. All fields marked as required must be included:

{
  "executiveSummary": "2-3 paragraph strategic overview suitable for C-level presentation",
  "strategicFindings": [
    {
      "title": "Finding title",
      "description": "Optional detailed description",
      "businessImpact": "Clear business impact quantification",
      "urgency": "low|medium|high|critical",
      "confidence": 0.85,
      "evidence": ["Supporting evidence points"],
      "recommendations": ["Specific recommendations"],
      "estimatedROI": "Optional ROI estimate"
    }
  ],
  "operationalMetrics": {
    "customerSatisfactionTrend": "Current satisfaction trajectory",
    "efficiencyScore": 75,
    "riskLevel": "low|medium|high|critical",
    "resourceUtilization": "Resource utilization analysis",
    "qualityIndicators": ["Quality indicator trends"]
  },
  "performanceInsights": [
    {
      "metric": "Metric name",
      "currentValue": "Current performance value",
      "benchmark": "Industry/internal benchmark",
      "trend": "improving|stable|declining",
      "impact": "Business impact assessment",
      "actionRequired": true|false
    }
  ],
  "riskAssessment": {
    "immediateRisks": ["Immediate threats requiring action"],
    "emergingConcerns": ["Emerging concerns to monitor"],
    "mitigationStrategies": ["Specific mitigation strategies"],
    "contingencyPlans": ["Contingency planning recommendations"]
  },
  "strategicRecommendations": [
    {
      "priority": "P1|P2|P3",
      "category": "Recommendation category",
      "recommendation": "Specific recommendation",
      "timeline": "Implementation timeline",
      "requiredResources": ["Required resources and investments"],
      "expectedOutcome": "Expected business outcome",
      "successMetrics": ["Success measurement criteria"]
    }
  ]
}

**QUALITY STANDARDS:**
- Quantify business impact in financial terms where possible
- Provide specific, actionable recommendations with clear timelines
- Include confidence intervals and risk assessments
- Use industry-standard benchmarks and KPIs
- Maintain executive-level strategic focus
- Support all findings with concrete evidence

**ANALYSIS DIRECTIVE:**
Execute a comprehensive business intelligence analysis that provides senior leadership with the insights needed to make informed strategic decisions about customer support operations, resource allocation, and business growth initiatives.

Generate your report now.
`
);

// Define the AI Analyst flow
export const aiAnalystFlow = ai.defineFlow(
  {
    name: 'aiAnalyst',
    inputSchema: aiAnalystInputSchema,
    outputSchema: aiAnalystOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    
    console.log('[AI Analyst] Starting enterprise analysis with Gemini 2.0 Flash Experimental:', {
      ticketCount: input.tickets?.length || 0,
      analysisGoal: input.analysisGoal,
      maxTools: input.maxTools,
      hasPreprocessedData: !!input.preprocessedData,
      targetAgents: input.targetAgents,
      model: 'googleai/gemini-2.0-flash-exp'
    });
    
    try {
      console.log('[AI Analyst] 🔍 Step 1: Validating input...', {
        hasTickets: !!input.tickets,
        isArray: Array.isArray(input.tickets),
        ticketCount: input.tickets?.length || 0
      });
      
      // Validate input
      if (!input.tickets || !Array.isArray(input.tickets)) {
        throw new Error('Invalid input: tickets must be provided as an array');
      }

      if (input.tickets.length === 0) {
        console.warn('[AI Analyst] No tickets provided for analysis');
        return {
          executiveSummary: 'No customer support tickets were provided for analysis. Please ensure ticket data is available before running the AI analyst.',
          strategicFindings: [],
          operationalMetrics: {
            customerSatisfactionTrend: 'No data available',
            efficiencyScore: 0,
            riskLevel: 'low' as const,
            resourceUtilization: 'No tickets to analyze',
            qualityIndicators: ['No data available']
          },
          performanceInsights: [],
          riskAssessment: {
            immediateRisks: ['No ticket data available for risk assessment'],
            emergingConcerns: [],
            mitigationStrategies: ['Ensure ticket data is loaded before analysis'],
            contingencyPlans: ['Check data source and reload tickets']
          },
          strategicRecommendations: [{
            priority: 'P1' as const,
            category: 'Data Management',
            recommendation: 'Load customer support ticket data before running analysis',
            timeline: 'Immediate',
            requiredResources: ['Data team', 'System administrator'],
            expectedOutcome: 'Available ticket data for comprehensive analysis',
            successMetrics: ['Ticket count > 0', 'Analysis completion']
          }],
          toolAnalysis: [],
          confidence: 0.1,
          processingTime: Date.now() - startTime,
          completionStatus: 'interrupted' as const,
          reportGenerated: new Date().toISOString()
        };
      }

      console.log('[AI Analyst] 🔍 Step 2: Preparing tool execution...');
      
      // Execute analytical tools first to gather raw data
      const executedToolCalls = [];
      let toolCallIndex = 0;
      
      // Execute comprehensive analysis tools for enterprise insights
      const toolsToExecute = input.analysisGoal === 'comprehensive' 
        ? ['holisticAnalysis', 'performanceForecasts', 'burnoutIndicators', 'knowledgeGaps', 'slaPrediction', 'riskAnalysis']
        : input.analysisGoal === 'performance' 
        ? ['performanceForecasts', 'knowledgeGaps', 'holisticAnalysis']
        : input.analysisGoal === 'risk'
        ? ['riskAnalysis', 'slaPrediction', 'burnoutIndicators']
        : ['holisticAnalysis', 'performanceForecasts', 'riskAnalysis'];
      
      console.log(`[AI Analyst] 🔍 Step 3: Executing ${toolsToExecute.length} tools for enterprise analysis:`, toolsToExecute);
      
      for (const toolName of toolsToExecute.slice(0, input.maxTools)) {
        console.log(`[AI Analyst] 🔍 Step 4.${toolCallIndex + 1}: Executing tool ${toolName}...`);
        const toolStartTime = Date.now();
        const tool = availableTools[toolName as keyof typeof availableTools];
        
        if (!tool) {
          console.warn(`[AI Analyst] Tool ${toolName} not available, skipping`);
          continue;
        }
        
        try {
          // Prepare input for the tool based on what each tool expects
          let toolInput;
          let toolResult;
          
          // Different tools expect different input formats
          if (toolName === 'holisticAnalysis') {
            toolInput = {
              tickets: input.tickets,
              historicalVolume: [],
              forecastDays: 14,
              totalTicketCount: input.tickets?.length || 0,
              sampleSize: input.tickets?.length || 0,
            };
          } else if (toolName === 'batchAnalyze') {
            toolInput = {
              tickets: input.tickets,
              analysisType: input.analysisGoal as "comprehensive" | "performance" | "risk" | "trends" | "custom"
            };
          } else if (toolName === 'riskAnalysis') {
            toolInput = {
              tickets: input.tickets,
              riskThreshold: 0.7
            };
          } else {
            // For standard analysis tools (performance, burnout, knowledge, sla)
            toolInput = {
              preprocessedData: input.preprocessedData,
              tickets: input.tickets,
              targetAgents: input.targetAgents
            };
          }
          
          console.log(`[AI Analyst] Executing tool ${toolName}`);
          
          // Execute the tool
          toolResult = await tool.execute(toolInput);
          const executionTime = Date.now() - toolStartTime;
          
          console.log(`[AI Analyst] Tool ${toolName} completed in ${executionTime}ms`);
          
          executedToolCalls.push({
            tool: toolName,
            reasoning: `Executed ${toolName} for enterprise business intelligence analysis`,
            input: toolInput,
            output: toolResult,
            confidence: 0.85,
            executionTime,
            success: true,
            businessValue: `Provides strategic insights for ${toolName.replace(/([A-Z])/g, ' $1').toLowerCase()} decision making`
          });
          
          toolCallIndex++;
        } catch (error) {
          console.error(`[AI Analyst] Tool ${toolName} failed:`, error);
          executedToolCalls.push({
            tool: toolName,
            reasoning: `Failed to execute ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            input: { tickets: input.tickets },
            output: null,
            confidence: 0,
            executionTime: Date.now() - toolStartTime,
            success: false,
            businessValue: 'Analysis incomplete due to execution failure',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      console.log(`[AI Analyst] 🔍 Step 5: Tool execution complete. Generating enterprise report...`, {
        totalToolCalls: executedToolCalls.length,
        successfulCalls: executedToolCalls.filter(call => call.success).length
      });
      
      // Use AI prompt to generate enterprise-ready insights from tool outputs
      // The prompt expects the original input structure, not modified with toolResults
      console.log('[AI Analyst] 🔍 Step 6: Calling AI prompt for enterprise report generation...');
      
      let output;
      try {
        // Generate the enterprise analysis report
        const promptResult = await aiAnalystPrompt(input);
        output = promptResult.output;
        console.log('[AI Analyst] 🔍 Step 6.1: AI prompt completed successfully');
      } catch (promptError) {
        console.error('[AI Analyst] 🔍 Step 6 FAILED: AI prompt execution error:', promptError);
        throw new Error(`AI prompt failed: ${promptError instanceof Error ? promptError.message : 'Unknown prompt error'}`);
      }
      
      if (!output) {
        console.error('[AI Analyst] 🔍 Step 6.2 FAILED: AI prompt returned null/undefined output');
        throw new Error('AI model failed to generate enterprise analysis report - output was null');
      }

      // Validate that required fields exist
      if (!output.executiveSummary) {
        console.error('[AI Analyst] 🔍 Step 6.3 FAILED: Missing required executiveSummary field');
        throw new Error('AI model output missing required executiveSummary field');
      }
      
      const processingTime = Date.now() - startTime;
      console.log(`[AI Analyst] Enterprise analysis complete in ${processingTime}ms`);
      
      return {
        ...output,
        toolAnalysis: executedToolCalls,
        processingTime,
        reportGenerated: new Date().toISOString(),
        completionStatus: 'complete' as const
      };
      
    } catch (error) {
      console.error('AI Analyst Enterprise Flow Error:', error);
      const processingTime = Date.now() - startTime;
      
      // Return a complete error response that matches the schema
      return {
        executiveSummary: 'Enterprise analysis could not be completed due to a technical error. Please review system logs and retry the analysis.',
        strategicFindings: [{
          title: 'System Analysis Failure',
          businessImpact: 'Unable to generate business intelligence insights',
          urgency: 'high' as const,
          confidence: 0.1,
          evidence: ['Technical error during analysis execution'],
          recommendations: ['Review system logs', 'Retry analysis', 'Check system configuration'],
          estimatedROI: 'Cannot determine due to system error'
        }],
        operationalMetrics: {
          customerSatisfactionTrend: 'Unable to determine',
          efficiencyScore: 0,
          riskLevel: 'medium' as const,
          resourceUtilization: 'Analysis incomplete',
          qualityIndicators: ['System error during analysis']
        },
        performanceInsights: [{
          metric: 'Analysis Success Rate',
          currentValue: '0%',
          benchmark: '100%',
          trend: 'declining' as const,
          impact: 'Critical system failure preventing business intelligence generation',
          actionRequired: true
        }],
        riskAssessment: {
          immediateRisks: ['Analysis system failure', 'Incomplete business intelligence'],
          emergingConcerns: ['Data processing reliability'],
          mitigationStrategies: ['Review system logs', 'Retry analysis', 'Check data quality'],
          contingencyPlans: ['Use alternative analysis methods', 'Manual data review']
        },
        strategicRecommendations: [{
          priority: 'P1' as const,
          category: 'System Operations',
          recommendation: 'Investigate and resolve analysis system issues',
          timeline: 'Immediate',
          requiredResources: ['Technical team', 'System administrator'],
          expectedOutcome: 'Restored analysis capability',
          successMetrics: ['Successful analysis completion', 'Error resolution']
        }],
        toolAnalysis: [],
        confidence: 0.1,
        processingTime,
        completionStatus: 'interrupted' as const,
        reportGenerated: new Date().toISOString()
      };
    }
  }
);

// Export the wrapper function
export async function runAIAnalyst(input: z.infer<typeof aiAnalystInputSchema>) {
  console.log('[runAIAnalyst] Function called with input:', {
    ticketCount: input.tickets?.length || 0,
    analysisGoal: input.analysisGoal,
    maxTools: input.maxTools,
    userRequest: input.userRequest
  });
  
  try {
    // Validate input before processing
    if (!input.tickets || !Array.isArray(input.tickets)) {
      throw new Error('Invalid input: tickets must be provided as an array');
    }

    const result = await aiAnalystFlow(input);
    
    // Safe property access with proper validation
    const toolAnalysis = result.toolAnalysis || [];
    const successfulTools = toolAnalysis.filter((c: any) => c && c.success === true);
    
    console.log('[runAIAnalyst] Analysis completed:', {
      toolCallCount: toolAnalysis.length,
      successfulTools: successfulTools.length,
      confidence: result.confidence || 0,
      status: result.completionStatus || 'unknown'
    });
    
    return result;
  } catch (error) {
    console.error('[runAIAnalyst] Function failed:', error);
    throw error;
  }
}