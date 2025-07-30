import { NextRequest, NextResponse } from 'next/server';
import { DynamicTool } from 'langchain/tools';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { getModelForAgent, PerformanceTracker } from '@/lib/ai-models';
import { logMultiAgentEvent, logDataAccessEvent, logSecurityEvent } from '@/lib/audit-service';
import { detectPII } from '@/lib/pii-scrubber';
import type { AuthenticatedUser } from '@/lib/types';
// Import Genkit flows
import { getPerformanceForecasts } from '@/ai/flows/get-performance-forecasts';
import { getSlaPrediction } from '@/ai/flows/get-sla-prediction';
import { getBurnoutIndicators } from '@/ai/flows/get-burnout-indicators';
import { getKnowledgeGaps } from '@/ai/flows/get-knowledge-gaps';
import { getHolisticAnalysis } from '@/ai/flows/get-holistic-analysis';
import { batchAnalyzeTickets } from '@/ai/flows/batch-analyze-tickets';
import { batchIdentifyTicketRisks } from '@/ai/flows/batch-identify-ticket-risks';
import { clusterTickets } from '@/ai/flows/cluster-tickets';
import { summarizeTrends } from '@/ai/flows/summarize-trends';
import { getCoachingInsights } from '@/ai/flows/get-coaching-insights';
import { socialMediaIntelligence } from '@/ai/flows/social-media-intelligence';
import { aiAnalystFlow } from '@/ai/flows/ai-analyst-mode';
import { queryTickets } from '@/ai/flows/query-tickets';
import { hypothesisFormation } from '@/ai/flows/agentic-hypothesis';
import { targetedAnalysis } from '@/ai/flows/agentic-targeted-analysis';
import { synthesisPhase } from '@/ai/flows/agentic-synthesis';
import { discoveryPhase } from '@/ai/flows/agentic-discovery';

function makeTool(name: string, description: string, flow: (input: any) => Promise<any>) {
  return new DynamicTool({
    name,
    description,
    func: async (input: string) => JSON.stringify(await flow(JSON.parse(input))),
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const correlationId = `multi_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let user: AuthenticatedUser | null = null;
  
  try {
    const body = await req.json();
    const { tickets, userRequest, analysisGoal, user: requestUser, ...rest } = body;
    user = requestUser;

    // Validate request and check for potential security issues
    if (!tickets || !Array.isArray(tickets)) {
      await logSecurityEvent(
        user,
        'SUSPICIOUS_ACTIVITY_DETECTED',
        {
          threatLevel: 'medium',
          violationType: 'invalid_request_format',
          resourceAttempted: '/api/multi-agent',
          additionalContext: { error: 'Invalid or missing tickets array' }
        },
        correlationId
      );
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    // Check for PII in the request data
    const requestText = JSON.stringify({ userRequest, analysisGoal, tickets: tickets.slice(0, 5) }); // Sample check
    const piiDetection = detectPII(requestText);
    
    // Log data access event for bulk ticket processing
    await logDataAccessEvent(
      user,
      'TICKETS_BULK_ACCESSED',
      {
        recordCount: tickets.length,
        accessPattern: 'batch',
        containsSensitiveData: piiDetection.hasPII,
        dataFields: ['subject', 'description', 'conversation', 'assignee', 'requester'],
        queryParameters: { userRequest, analysisGoal }
      },
      correlationId
    );

    // Log multi-agent processing start
    await logMultiAgentEvent(
      user,
      'MULTI_AGENT_PROCESSING_STARTED',
      {
        agentTypes: ['discovery', 'performance', 'risk', 'coaching', 'sentiment', 'synthesis'],
        ticketCount: tickets.length,
        modelsUsed: {
          discovery: 'gemini-2.0-flash',
          performance: 'gemini-2.0-flash',
          risk: 'gemini-2.0-flash',
          coaching: 'claude-3.5-sonnet',
          sentiment: 'gemini-2.0-flash',
          synthesis: 'gpt-4o'
        }
      },
      correlationId
    );

    // 1. Discovery Agent - Optimized for fast pattern scanning
    const discoveryTools = [
      makeTool('Discovery', 'Scan all tickets for patterns, anomalies, and distributions', discoveryPhase),
      makeTool('Cluster Tickets', 'Cluster tickets by topic or issue', clusterTickets),
      makeTool('Summarize Trends', 'Summarize key trends in the data', summarizeTrends),
    ];
    const discoveryModel = getModelForAgent('discovery');
    const discoveryAgent = await initializeAgentExecutorWithOptions(discoveryTools, discoveryModel, {
      agentType: 'chat-zero-shot-react-description',
      verbose: true,
    });
    const discoveryInput = {
      input: 'You are a Discovery Analyst. Scan all tickets for patterns, clusters, and anomalies. Use your tools to map the landscape of the data.\n' + (userRequest || `Analyze these tickets for ${analysisGoal || 'comprehensive analysis'}.`),
      tickets: tickets || [],
      ...rest,
    };
    // Execute Discovery Agent with performance tracking
    const discoveryStartTime = PerformanceTracker.startTimer('discovery', 'gemini-1.5-flash');
    let discoveryResult;
    try {
      discoveryResult = await discoveryAgent.call(discoveryInput);
      PerformanceTracker.recordMetric('discovery', 'gemini-1.5-flash', discoveryStartTime, true);
    } catch (error) {
      PerformanceTracker.recordMetric('discovery', 'gemini-1.5-flash', discoveryStartTime, false, error instanceof Error ? error.message : String(error));
      throw error;
    }

    // 2. Performance, Risk, Coaching, and Sentiment Agents (in parallel)
    const performanceTools = [
      makeTool('Performance Forecasts', 'Generate AI-powered performance forecasts for agents', getPerformanceForecasts),
      makeTool('Holistic Analysis', 'Perform comprehensive holistic analysis with trends and predictions', getHolisticAnalysis),
    ];
    const sentimentTools = [
      makeTool('Batch Analyze', 'Batch analyze tickets for sentiment and category classification', batchAnalyzeTickets),
    ];
    const riskTools = [
      makeTool('SLA Prediction', 'Predict SLA breach risks and provide recommendations', getSlaPrediction),
      makeTool('Risk Analysis', 'Identify high-risk tickets and escalation needs', batchIdentifyTicketRisks),
      makeTool('Burnout Indicators', 'Detect burnout risk indicators for agents', getBurnoutIndicators),
    ];
    const coachingTools = [
      makeTool('Coaching Insights', 'Generate actionable coaching insights', getCoachingInsights),
      makeTool('Knowledge Gaps', 'Identify knowledge gaps and training opportunities', getKnowledgeGaps),
    ];
    // Optimized models for each analysis type
    const performanceModel = getModelForAgent('performance'); // Gemini 1.5 Pro for complex forecasting
    const riskModel = getModelForAgent('risk'); // Gemini 2.0 Flash for nuanced risk assessment  
    const coachingModel = getModelForAgent('coaching'); // Claude 3.5 Sonnet for human insights
    const sentimentModel = getModelForAgent('sentiment'); // Gemini 2.0 Flash for sentiment analysis
    const performanceAgent = await initializeAgentExecutorWithOptions(performanceTools, performanceModel, {
      agentType: 'chat-zero-shot-react-description', verbose: true,
    });
    const riskAgent = await initializeAgentExecutorWithOptions(riskTools, riskModel, {
      agentType: 'chat-zero-shot-react-description', verbose: true,
    });
    const coachingAgent = await initializeAgentExecutorWithOptions(coachingTools, coachingModel, {
      agentType: 'chat-zero-shot-react-description', verbose: true,
    });
    const sentimentAgent = await initializeAgentExecutorWithOptions(sentimentTools, sentimentModel, {
      agentType: 'chat-zero-shot-react-description', verbose: true,
    });
    const agentInput = {
      input: userRequest || `Analyze these tickets for ${analysisGoal || 'comprehensive analysis'}.`,
      tickets: tickets || [],
      ...rest,
    };
    // Execute parallel agents with performance tracking
    const performanceStartTime = PerformanceTracker.startTimer('performance', 'gemini-2.0-flash');
    const riskStartTime = PerformanceTracker.startTimer('risk', 'gemini-2.0-flash');
    const coachingStartTime = PerformanceTracker.startTimer('coaching', 'claude-3.5-sonnet');
    const sentimentStartTime = PerformanceTracker.startTimer('sentiment', 'gemini-2.0-flash');
    
    const half = Math.ceil(tickets.length / 2);
    const firstHalf = tickets.slice(0, half);
    const secondHalf = tickets.slice(half);

    const [performanceResult, riskResult, coachingResult, sentimentResult] = await Promise.allSettled([
      performanceAgent.call({ ...agentInput, tickets: firstHalf, input: 'You are a Performance Analyst. Focus on forecasting, benchmarking, and identifying improvement opportunities.\n' + agentInput.input }),
      riskAgent.call({ ...agentInput, tickets: secondHalf, input: 'You are a Risk Analyst. Identify SLA risks, compliance issues, and burnout.\n' + agentInput.input }),
      coachingAgent.call({ ...agentInput, tickets: firstHalf, input: 'You are a Coaching Analyst. Generate actionable coaching and quality insights.\n' + agentInput.input }),
      sentimentAgent.call({ ...agentInput, tickets: secondHalf, input: 'You are a Sentiment Analyst. Analyze ticket sentiment and categorize issues.\n' + agentInput.input }),
    ]);
    
    // Record metrics for parallel agents
    PerformanceTracker.recordMetric('performance', 'gemini-2.0-flash', performanceStartTime, performanceResult.status === 'fulfilled');
    PerformanceTracker.recordMetric('risk', 'gemini-2.0-flash', riskStartTime, riskResult.status === 'fulfilled');
    PerformanceTracker.recordMetric('coaching', 'claude-3.5-sonnet', coachingStartTime, coachingResult.status === 'fulfilled');
    PerformanceTracker.recordMetric('sentiment', 'gemini-2.0-flash', sentimentStartTime, sentimentResult.status === 'fulfilled');
    
    // Extract results (fallback to error messages if failed)
    const finalPerformanceResult = performanceResult.status === 'fulfilled' ? performanceResult.value : { error: performanceResult.reason };
    const finalRiskResult = riskResult.status === 'fulfilled' ? riskResult.value : { error: riskResult.reason };
    const finalCoachingResult = coachingResult.status === 'fulfilled' ? coachingResult.value : { error: coachingResult.reason };
    const finalSentimentResult = sentimentResult.status === 'fulfilled' ? sentimentResult.value : { error: sentimentResult.reason };

    // 3. Synthesis Agent
    const synthesisTools = [
      makeTool('Synthesis', 'Combine findings from all other agents into a strategic, executive-level report', synthesisPhase),
    ];
    const synthesisModel = getModelForAgent('synthesis'); // GPT-4o for synthesis
    const synthesisAgent = await initializeAgentExecutorWithOptions(synthesisTools, synthesisModel, {
      agentType: 'chat-zero-shot-react-description', verbose: true,
    });
    const synthesisInput = {
      input: 'You are a Synthesis Analyst. Combine all findings into a strategic, executive-level report.\n' + (userRequest || `Analyze these tickets for ${analysisGoal || 'comprehensive analysis'}.`),
      discoveryResult,
      performanceResult,
      riskResult,
      coachingResult,
      sentimentResult,
      tickets: tickets || [],
      ...rest,
    };
    // Execute Synthesis Agent with performance tracking
    const synthesisStartTime = PerformanceTracker.startTimer('synthesis', 'gpt-4o');
    let synthesisResult;
    try {
      synthesisResult = await synthesisAgent.call({
        ...synthesisInput,
        performanceResult: finalPerformanceResult,
        riskResult: finalRiskResult,
        coachingResult: finalCoachingResult,
        sentimentResult: finalSentimentResult,
      });
      PerformanceTracker.recordMetric('synthesis', 'gpt-4o', synthesisStartTime, true);
    } catch (error) {
      PerformanceTracker.recordMetric('synthesis', 'gpt-4o', synthesisStartTime, false, error instanceof Error ? error.message : String(error));
      throw error;
    }

    // 4. Social Intelligence and Ad-hoc Query Agents (optional, run as needed)
    const socialTools = [
      makeTool('Social Media Intelligence', 'Monitor social sentiment and public perception', socialMediaIntelligence),
    ];
    const queryTools = [
      makeTool('Query Tickets', 'Answer direct user questions about the ticket dataset', queryTickets),
    ];
    const socialModel = getModelForAgent('social');
    const queryModel = getModelForAgent('query');
    const socialAgent = await initializeAgentExecutorWithOptions(socialTools, socialModel, {
      agentType: 'chat-zero-shot-react-description', verbose: true,
    });
    const queryAgent = await initializeAgentExecutorWithOptions(queryTools, queryModel, {
      agentType: 'chat-zero-shot-react-description', verbose: true,
    });
    // These can be triggered by user request or run in parallel if needed
    // const socialResult = await socialAgent.call({ input: 'Monitor social sentiment and public perception.', tickets: tickets || [], ...rest });
    // const queryResult = await queryAgent.call({ input: userRequest, tickets: tickets || [], ...rest });

    // Get performance metrics
    const performanceMetrics = PerformanceTracker.getAveragePerformance();
    const totalDuration = Date.now() - startTime;
    
    // Count successful vs failed agents
    const results = [performanceResult, riskResult, coachingResult, sentimentResult];
    const successfulAgents = results.filter(r => r.status === 'fulfilled').length;
    const failedAgents = results.filter(r => r.status === 'rejected').length;
    
    // Log multi-agent processing completion
    await logMultiAgentEvent(
      user,
      'MULTI_AGENT_PROCESSING_COMPLETED',
      {
        agentTypes: ['discovery', 'performance', 'risk', 'coaching', 'sentiment', 'synthesis'],
        ticketCount: tickets.length,
        totalDuration,
        successfulAgents: successfulAgents + 2, // +2 for discovery and synthesis
        failedAgents,
        modelsUsed: {
          discovery: 'gemini-2.0-flash',
          performance: 'gemini-2.0-flash',
          risk: 'gemini-2.0-flash',
          coaching: 'claude-3.5-sonnet',
          sentiment: 'gemini-2.0-flash',
          synthesis: 'gpt-4o'
        }
      },
      correlationId
    );
    
    // Final response
    return NextResponse.json({
      result: {
        discovery: discoveryResult,
        performance: finalPerformanceResult,
        risk: finalRiskResult,
        coaching: finalCoachingResult,
        sentiment: finalSentimentResult,
        synthesis: synthesisResult,
        // social: socialResult,
        // query: queryResult,
        summary: 'All agents have completed their analyses including sentiment analysis. Review the synthesis for a comprehensive executive report.',
        metrics: {
          totalDuration,
          agentMetrics: performanceMetrics,
          modelsUsed: {
            discovery: 'gemini-2.0-flash',
            performance: 'gemini-2.0-flash',
            risk: 'gemini-2.0-flash',
            coaching: 'claude-3.5-sonnet (fallback to gemini-2.0-flash)',
            sentiment: 'gemini-2.0-flash',
            synthesis: 'gpt-4o (fallback to gemini-2.0-flash)'
          }
        },
        audit: {
          correlationId,
          auditTrail: 'Multi-agent processing completed with comprehensive audit logging'
        }
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log failed multi-agent processing
    await logMultiAgentEvent(
      user,
      'MULTI_AGENT_PROCESSING_COMPLETED',
      {
        agentTypes: ['discovery', 'performance', 'risk', 'coaching', 'sentiment', 'synthesis'],
        ticketCount: 0,
        totalDuration: Date.now() - startTime,
        successfulAgents: 0,
        failedAgents: 6,
        errorMessage
      },
      correlationId
    );
    
    // Log security event for processing failures (potential DoS or malformed requests)
    await logSecurityEvent(
      user,
      'SUSPICIOUS_ACTIVITY_DETECTED',
      {
        threatLevel: 'low',
        violationType: 'processing_failure',
        resourceAttempted: '/api/multi-agent',
        additionalContext: { error: errorMessage }
      },
      correlationId
    );
    
    return NextResponse.json({ 
      error: errorMessage,
      audit: { correlationId }
    }, { status: 500 });
  }
} 