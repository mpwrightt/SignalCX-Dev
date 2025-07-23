import { NextRequest, NextResponse } from 'next/server';
import { DynamicTool } from 'langchain/tools';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { getModelForAgent, PerformanceTracker } from '@/lib/ai-models';
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
  try {
    const body = await req.json();
    const { tickets, userRequest, analysisGoal, ...rest } = body;

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

    // 2. Performance, Risk, and Coaching Agents (in parallel)
    const performanceTools = [
      makeTool('Performance Forecasts', 'Generate AI-powered performance forecasts for agents', getPerformanceForecasts),
      makeTool('Holistic Analysis', 'Perform comprehensive holistic analysis with trends and predictions', getHolisticAnalysis),
      makeTool('Batch Analyze', 'Batch analyze tickets for patterns and insights', batchAnalyzeTickets),
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
    const performanceAgent = await initializeAgentExecutorWithOptions(performanceTools, performanceModel, {
      agentType: 'chat-zero-shot-react-description', verbose: true,
    });
    const riskAgent = await initializeAgentExecutorWithOptions(riskTools, riskModel, {
      agentType: 'chat-zero-shot-react-description', verbose: true,
    });
    const coachingAgent = await initializeAgentExecutorWithOptions(coachingTools, coachingModel, {
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
    
    const [performanceResult, riskResult, coachingResult] = await Promise.allSettled([
      performanceAgent.call({ ...agentInput, input: 'You are a Performance Analyst. Focus on forecasting, benchmarking, and identifying improvement opportunities.\n' + agentInput.input }),
      riskAgent.call({ ...agentInput, input: 'You are a Risk Analyst. Identify SLA risks, compliance issues, and burnout.\n' + agentInput.input }),
      coachingAgent.call({ ...agentInput, input: 'You are a Coaching Analyst. Generate actionable coaching and quality insights.\n' + agentInput.input }),
    ]);
    
    // Record metrics for parallel agents
    PerformanceTracker.recordMetric('performance', 'gemini-2.0-flash', performanceStartTime, performanceResult.status === 'fulfilled');
    PerformanceTracker.recordMetric('risk', 'gemini-2.0-flash', riskStartTime, riskResult.status === 'fulfilled');
    PerformanceTracker.recordMetric('coaching', 'claude-3.5-sonnet', coachingStartTime, coachingResult.status === 'fulfilled');
    
    // Extract results (fallback to error messages if failed)
    const finalPerformanceResult = performanceResult.status === 'fulfilled' ? performanceResult.value : { error: performanceResult.reason };
    const finalRiskResult = riskResult.status === 'fulfilled' ? riskResult.value : { error: riskResult.reason };
    const finalCoachingResult = coachingResult.status === 'fulfilled' ? coachingResult.value : { error: coachingResult.reason };

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
    const totalDuration = Date.now() - (discoveryStartTime || 0);
    
    // Final response
    return NextResponse.json({
      result: {
        discovery: discoveryResult,
        performance: finalPerformanceResult,
        risk: finalRiskResult,
        coaching: finalCoachingResult,
        synthesis: synthesisResult,
        // social: socialResult,
        // query: queryResult,
        summary: 'All agents have completed their analyses. Review the synthesis for a comprehensive executive report.',
        metrics: {
          totalDuration,
          agentMetrics: performanceMetrics,
          modelsUsed: {
            discovery: 'gemini-2.0-flash',
            performance: 'gemini-2.0-flash',
            risk: 'gemini-2.0-flash',
            coaching: 'claude-3.5-sonnet (fallback to gemini-2.0-flash)',
            synthesis: 'gpt-4o (fallback to gemini-2.0-flash)'
          }
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 