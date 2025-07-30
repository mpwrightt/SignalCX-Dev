import { NextRequest, NextResponse } from 'next/server';


// Import all the individual AI flows
import { getPerformanceForecasts } from '@/ai/flows/get-performance-forecasts';
import { getBurnoutIndicators } from '@/ai/flows/get-burnout-indicators';
import { getKnowledgeGaps } from '@/ai/flows/get-knowledge-gaps';
import { getSlaPrediction } from '@/ai/flows/get-sla-prediction';
import { getHolisticAnalysis } from '@/ai/flows/get-holistic-analysis';
import { batchAnalyzeTickets } from '@/ai/flows/batch-analyze-tickets';
import { batchIdentifyTicketRisks } from '@/ai/flows/batch-identify-ticket-risks';
import { clusterTickets } from '@/ai/flows/cluster-tickets';
import { summarizeTrends } from '@/ai/flows/summarize-trends';
import { getCoachingInsights } from '@/ai/flows/get-coaching-insights';
import { socialMediaIntelligence } from '@/ai/flows/social-media-intelligence';
import { queryTickets } from '@/ai/flows/query-tickets';

async function logDiagnosticCall(type: 'sent' | 'received', flow: string, data: any, agent: string, model: string, duration?: number) {
  // This will be sent to the frontend via Server-Sent Events or polling
  console.log(`[DIAGNOSTIC] ${type.toUpperCase()} - ${flow} (${agent}) using ${model}:`, {
    timestamp: new Date().toISOString(),
    type,
    flow,
    agent,
    model,
    duration,
    dataSize: JSON.stringify(data).length
  });
  
  // Store in a global diagnostic buffer that the frontend can poll
  if (!global.diagnosticBuffer) {
    global.diagnosticBuffer = [];
  }
  
  global.diagnosticBuffer.push({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    type,
    flow,
    agent,
    model,
    duration,
    data
  });
  
  // Keep only last 100 entries
  if (global.diagnosticBuffer.length > 100) {
    global.diagnosticBuffer = global.diagnosticBuffer.slice(-100);
  }
}

export async function POST(req: NextRequest) {
  console.log('🔥 API ROUTE HIT: multi-agent-diagnostic');
  console.log('🔥 API ROUTE HIT: multi-agent-diagnostic');
  console.log('🔥 API ROUTE HIT: multi-agent-diagnostic');
  
  try {
    const body = await req.json();
    const { tickets, userId, organizationId, ticketHash } = body;
    console.log('🔥 API ROUTE - Received body:', { 
      hasTickets: !!tickets, 
      ticketCount: tickets?.length, 
      userId, 
      organizationId,
      hasTicketHash: !!ticketHash 
    });
    
    console.log('[Multi-Agent Diagnostic] Starting comprehensive multi-agent analysis with ALL AI flows');
    
    const startTime = Date.now();
    const results = {};
    
    // Run all AI flows individually with detailed logging
    const flows = [
      { name: 'batchAnalyzeTickets', func: batchAnalyzeTickets, agent: 'analysis', model: 'gemini-1.5-flash', input: { tickets: tickets.slice(0, 10).map(t => ({ id: t.id, subject: t.subject, description: t.description?.substring(0, 500) || '' })) } },
      { name: 'getPerformanceForecasts', func: getPerformanceForecasts, agent: 'performance', model: 'claude-3.5-sonnet', input: { tickets } },
      { name: 'getBurnoutIndicators', func: getBurnoutIndicators, agent: 'burnout', model: 'gpt-4o', input: { tickets } },
      { name: 'getKnowledgeGaps', func: getKnowledgeGaps, agent: 'knowledge', model: 'gemini-1.5-flash', input: { tickets } },
      { name: 'getSlaPrediction', func: getSlaPrediction, agent: 'sla', model: 'claude-3.5-sonnet', input: { tickets } },
      { name: 'getHolisticAnalysis', func: getHolisticAnalysis, agent: 'holistic', model: 'gpt-4o', input: { tickets } },
      { name: 'batchIdentifyTicketRisks', func: batchIdentifyTicketRisks, agent: 'risk', model: 'gemini-1.5-flash', input: { tickets: tickets.slice(0, 20) } },
      { name: 'clusterTickets', func: clusterTickets, agent: 'clustering', model: 'claude-3.5-sonnet', input: { tickets } },
      { name: 'summarizeTrends', func: summarizeTrends, agent: 'trends', model: 'gpt-4o', input: { tickets } },
      { name: 'getCoachingInsights', func: getCoachingInsights, agent: 'coaching', model: 'claude-3.5-sonnet', input: { tickets } },
    ];
    
    // Run flows in parallel batches for performance
    const batchSize = 3;
    for (let i = 0; i < flows.length; i += batchSize) {
      const batch = flows.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (flow) => {
        const flowStartTime = Date.now();
        
        try {
          // Log what we're sending to this AI model
          await logDiagnosticCall('sent', flow.name, flow.input, flow.agent, flow.model);
          
          // Execute the AI flow
          const result = await flow.func(flow.input);
          
          const duration = Date.now() - flowStartTime;
          
          // Log what we received from this AI model
          await logDiagnosticCall('received', flow.name, result, flow.agent, flow.model, duration);
          
          results[flow.name] = { 
            result, 
            agent: flow.agent, 
            model: flow.model, 
            duration,
            success: true 
          };
          
          console.log(`✅ Flow ${flow.name} completed successfully:`, JSON.stringify(result, null, 2));
          
        } catch (error) {
          const duration = Date.now() - flowStartTime;
          await logDiagnosticCall('received', flow.name, { error: error.message }, flow.agent, flow.model, duration);
          
          results[flow.name] = { 
            error: error.message, 
            agent: flow.agent, 
            model: flow.model, 
            duration,
            success: false 
          };
        }
      }));
    }
    
    const totalDuration = Date.now() - startTime;
    
    // Create summary of model usage and timings
    const modelUsage = {};
    const agentTimings = {};
    
    Object.entries(results).forEach(([flowName, result]) => {
      if (result.agent && result.model) {
        modelUsage[result.agent] = result.model;
        agentTimings[result.agent] = result.duration;
      }
    });
    
    const diagnosticResult = {
      success: true,
      results,
      summary: {
        totalFlows: flows.length,
        successfulFlows: Object.values(results).filter(r => r.success).length,
        failedFlows: Object.values(results).filter(r => !r.success).length,
        totalDuration,
        modelUsage,
        agentTimings
      },
      diagnostic: {
        modelUsage,
        agentTimings,
        agentCount: Object.keys(modelUsage).length,
        parallelExecution: true,
        timestamp: new Date().toISOString(),
        bufferSize: global.diagnosticBuffer?.length || 0
      }
    };
    
    console.log('[Multi-Agent Diagnostic] Completed comprehensive analysis');
    console.log('[Multi-Agent Diagnostic] Model usage:', modelUsage);
    console.log('[Multi-Agent Diagnostic] Timings:', agentTimings);
    
    console.log('📊 Multi-agent analysis completed, returning results directly');
    
    if (userId && organizationId) {
      console.log('✅ Analysis completed for user:', userId);
    }
    
    return NextResponse.json(diagnosticResult);
    
  } catch (error) {
    console.error('[Multi-Agent Diagnostic] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}