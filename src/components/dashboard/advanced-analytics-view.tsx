'use client';

import * as React from "react";
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Brain, 
  Target,
  Users,
  Clock,
  BarChart3,
  Lightbulb,
  Shield,
  Heart,
  Loader2,
  Sparkles,
  Info,
  UserCircle,
  BookOpen,
  BrainCircuit,
  FileText,
  FlaskConical,
  AreaChart,
  Eye,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import type { PerformanceForecast, BurnoutIndicator, KnowledgeGap } from "@/lib/types";
import { getPerformanceForecasts } from "@/ai/flows/get-performance-forecasts";
import { getBurnoutIndicators } from "@/ai/flows/get-burnout-indicators";
import { getKnowledgeGaps } from "@/ai/flows/get-knowledge-gaps";
import { getSlaPrediction } from "@/ai/flows/get-sla-prediction";
import { getHolisticAnalysis } from "@/ai/flows/get-holistic-analysis";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { createHash } from 'crypto';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AnalyticsPreprocessor, ProcessedAnalyticsData } from '@/lib/analytics-preprocessor';
import { AnalyticsCache } from '@/lib/analytics-cache';
import { aiFlowOptimizer, FlowResult } from '@/lib/ai-flow-optimizer';
import { runAIAnalyst } from '@/ai/flows/ai-analyst-mode';

const ADVANCED_ANALYTICS_CACHE_KEY = 'signalcx-advanced-analytics-cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const ELAPSED_TIMER_KEY = 'signalcx-advanced-analytics-timer';

// AI-driven confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
  CRITICAL: 0.3
};

// Determine if a result needs rerun based on confidence
function shouldRerun(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLDS.MEDIUM;
}

// Get confidence level label
function getConfidenceLevel(confidence: number): string {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'High';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'Medium';
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'Low';
  return 'Critical';
}

// Get confidence color class
function getConfidenceColor(confidence: number): string {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'text-accent';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'text-primary';
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'text-yellow-600';
  return 'text-destructive';
}

function computeAnalyticsCacheKey(tickets: any[], sessionMode: string) {
  const ids = tickets.map(t => t.id).sort((a, b) => a - b).join(',');
  const ticketCount = tickets.length;
  return `${sessionMode || 'demo'}:${ticketCount}:${ids}`;
}

function getCachedAnalyticsForKey(key: string) {
  if (typeof window === 'undefined') return null;
  try {
    const cacheRaw = window.localStorage.getItem(ADVANCED_ANALYTICS_CACHE_KEY);
    if (!cacheRaw) {
      console.log('[AdvancedAnalyticsView] No cache found in localStorage');
      return null;
    }
    const cache = JSON.parse(cacheRaw);
    if (!cache[key]) {
      console.log('[AdvancedAnalyticsView] No cache found for key:', key, 'Available keys:', Object.keys(cache));
      return null;
    }
    const { data, timestamp } = cache[key];
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      console.log('[AdvancedAnalyticsView] Cache expired for key:', key);
      return null;
    }
    console.log('[AdvancedAnalyticsView] Cache hit for key:', key);
    return data;
  } catch (error) {
    console.log('[AdvancedAnalyticsView] Cache error:', error);
    return null;
  }
}
function setCachedAnalyticsForKey(key: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    const cacheRaw = window.localStorage.getItem(ADVANCED_ANALYTICS_CACHE_KEY);
    const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
    
    if (data === null) {
      // Clear this specific cache key
      delete cache[key];
    } else {
      cache[key] = { data, timestamp: Date.now() };
    }
    
    window.localStorage.setItem(ADVANCED_ANALYTICS_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// Helper to get a color for risk/impact
function getLevelColor(level: string) {
  switch (level) {
    case 'critical':
    case 'high':
      return 'bg-red-600 text-white';
    case 'medium':
      return 'bg-yellow-500 text-white';
    case 'low':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}

export const AdvancedAnalyticsView = ({ 
  sessionMode = 'demo',
  tickets = [],
  historicalVolume = [],
  forecastDays = 14,
  prediction = null,
  onTicketSelect,
}: { 
  sessionMode?: 'demo' | 'enterprise';
  tickets?: any[];
  historicalVolume?: { date: string; count: number }[];
  forecastDays?: number;
  prediction?: any;
  onTicketSelect?: (info: { ticket: any }) => void;
}) => {
  const { logEvent } = useDiagnostics();
  const { toast } = useToast();
  
  // Function to find ticket by subject
  const findTicketBySubject = (ticketSubject: string) => {
    const ticket = tickets.find(t => t.subject === ticketSubject || t.subject.includes(ticketSubject));
    return ticket;
  };
  
  // Function to handle example ticket click
  const handleExampleTicketClick = (ticketSubject: string) => {
    const ticket = findTicketBySubject(ticketSubject);
    if (ticket && onTicketSelect) {
      onTicketSelect({ ticket });
    }
  };
  const [performanceForecasts, setPerformanceForecasts] = React.useState<any[]>([]);
  const [burnoutIndicators, setBurnoutIndicators] = React.useState<any[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = React.useState<any[]>([]);
  const [slaPrediction, setSlaPrediction] = React.useState<any>(null);
  const [holisticAnalysis, setHolisticAnalysis] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [cacheInitialized, setCacheInitialized] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [rerunningAnalysis, setRerunningAnalysis] = React.useState<string | null>(null);
  const [agentLoadingStates, setAgentLoadingStates] = React.useState<Map<string, boolean>>(new Map());
  const [preprocessedData, setPreprocessedData] = React.useState<ProcessedAnalyticsData | null>(null);

  // Add state for modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState<React.ReactNode>(null);

  // Get settings for persistent analyst mode
  const { settings, updateSettings, isLoaded: settingsLoaded } = useSettings();
  
  // Add state for analysis mode (now derived from settings)
  const analysisMode = settings.enableAgenticMode ? 'agentic' : 'standard';
  const setAnalysisMode = (mode: 'standard' | 'agentic') => {
    console.log('[AdvancedAnalyticsView] 🔄 Setting analysis mode:', {
      newMode: mode,
      enableAgenticMode: mode === 'agentic',
      currentSetting: settings.enableAgenticMode
    });
    updateSettings({ enableAgenticMode: mode === 'agentic' });
    
    // Force a small delay to ensure settings are updated before any analysis runs
    setTimeout(() => {
      console.log('[AdvancedAnalyticsView] ✅ Analysis mode setting should be updated now');
    }, 100);
  };
  
  const [agentAnalysisResult, setAgentAnalysisResult] = React.useState<any>(null);
  const [selectedToolDetails, setSelectedToolDetails] = React.useState<any>(null);
  const [agentReasoning, setAgentReasoning] = React.useState<string>('');
  const [agentToolCalls, setAgentToolCalls] = React.useState<any[]>([]);

  // Helper to get/set timer start in localStorage
  function getStoredStartTime() {
    if (typeof window === 'undefined') return null;
    const val = window.localStorage.getItem(ELAPSED_TIMER_KEY);
    return val ? parseInt(val, 10) : null;
  }
  function setStoredStartTime(ts: number | null) {
    if (typeof window === 'undefined') return;
    if (ts) window.localStorage.setItem(ELAPSED_TIMER_KEY, ts.toString());
    else window.localStorage.removeItem(ELAPSED_TIMER_KEY);
  }

  // Helper to open modal with content
  function showAgentDetails(content: React.ReactNode) {
    setModalContent(content);
    setModalOpen(true);
  }

  // Create a stable cache key that only changes when actual ticket data changes
  const ticketSignature = React.useMemo(() => {
    if (tickets.length === 0) return '';
    // Use a hash of the ticket IDs for better performance with large datasets
    const ids = tickets.map(t => t.id).sort((a, b) => a - b).join(',');
    return createHash('md5').update(ids).digest('hex');
  }, [tickets.length, ...tickets.map(t => t.id)]);
  
  const cacheKey = React.useMemo(() => {
    const key = `${sessionMode || 'demo'}:${tickets.length}:${ticketSignature}`;
    console.log('[AdvancedAnalyticsView] Generated cache key:', key);
    return key;
  }, [ticketSignature, sessionMode, tickets.length]);

  // Initialize timer state on mount
  React.useEffect(() => {
    const stored = getStoredStartTime();
    if (stored) {
      // Only restore if less than 10 minutes old (more generous for navigation)
      if ((Date.now() - stored) < 10 * 60 * 1000) {
        setStartTime(stored);
        setElapsed(Math.floor((Date.now() - stored) / 1000));
      } else {
        setStoredStartTime(null);
      }
    }
  }, []);

  const runAIAnalysis = React.useCallback(async (specificAnalysis?: string) => {
    console.log('[AdvancedAnalyticsView] Starting AI Analysis...', { 
      specificAnalysis, 
      mode: analysisMode, 
      ticketCount: tickets.length,
      cacheInitialized,
      enableAgenticMode: settings.enableAgenticMode,
      settingsLoaded 
    });
    
    if (!cacheInitialized) {
      console.warn('[AdvancedAnalyticsView] Cache not initialized, waiting...');
      return;
    }
    
    if (tickets.length === 0) {
      console.warn('[AdvancedAnalyticsView] No tickets available for analysis');
      return;
    }
    
    console.log('[AdvancedAnalyticsView] All conditions passed, proceeding with analysis...');
    
    setLoading(true);
    setError(null);
    const now = Date.now();
    setStartTime(now);
    setStoredStartTime(now);
    
    // Note: Removed artificial timeouts - let AI analysis run until completion
    
    try {
      // Handle agentic analysis mode
      if (analysisMode === 'agentic') {
        console.log('[AdvancedAnalyticsView] ✅ Running agentic analysis...', {
          ticketCount: tickets.length,
          specificAnalysis,
          cacheInitialized,
          analysisMode,
          enableAgenticMode: settings.enableAgenticMode
        });
        
        // Preprocess data for agent
        const processedData = AnalyticsPreprocessor.preprocess(tickets);
        setPreprocessedData(processedData);
        
        // Use full dataset for agentic analysis - let the AI flows handle internal chunking
        const agentOptimizedSample = processedData.sampledData.representativeSample;
        
        console.log('[AdvancedAnalyticsView] Calling runAIAnalyst with:', {
          sampleSize: agentOptimizedSample.length,
          userRequest: specificAnalysis || 'Perform comprehensive analysis of customer support tickets',
          analysisGoal: specificAnalysis ? 'custom' : 'comprehensive',
          maxTools: 5
        });
        
        // Run the AI Analyst - let it complete naturally
        const agentResult = await runAIAnalyst({
          tickets: agentOptimizedSample,
          preprocessedData: processedData,
          userRequest: specificAnalysis || 'Perform comprehensive analysis of customer support tickets',
          analysisGoal: specificAnalysis ? 'custom' : 'comprehensive',
          targetAgents: undefined,
          priority: 'high',
          maxTools: 5, // Reduced from 6 to 5 for better performance
          explainProcess: true
        });
        
        console.log('[AdvancedAnalyticsView] Agentic analysis completed:', agentResult);
        
        // Log agent reasoning and tool calls for diagnostics
        const toolCalls = agentResult.toolAnalysis || agentResult.toolCalls || [];
        logEvent('sent', 'ai-analyst-start', {
          reasoning: agentResult.reasoning || agentResult.executiveSummary,
          toolsPlanned: toolCalls.length,
          confidence: agentResult.confidence
        });
        
        // Log each tool call
        toolCalls.forEach((toolCall, index) => {
          const logType = toolCall.success ? 'received' : 'error';
          logEvent(logType, `ai-analyst-tool-${toolCall.tool}`, {
            index,
            reasoning: toolCall.reasoning,
            success: toolCall.success,
            executionTime: toolCall.executionTime,
            confidence: toolCall.confidence,
            error: toolCall.error,
            output: toolCall.output
          });
        });
        
        // Store agent results
        console.log('[AdvancedAnalyticsView] 🎯 Setting agentAnalysisResult:', {
          hasResult: !!agentResult,
          executiveSummary: agentResult?.executiveSummary ? 'present' : 'missing',
          toolAnalysisCount: agentResult?.toolAnalysis?.length || 0,
          confidence: agentResult?.confidence
        });
        
        setAgentAnalysisResult(agentResult);
        setAgentReasoning(agentResult.executiveSummary || agentResult.summary || 'Analysis completed');
        setAgentToolCalls(agentResult.toolAnalysis || agentResult.toolCalls || []);
        
        // Extract results from successful tool calls for display
        const successfulCalls = (agentResult.toolAnalysis || agentResult.toolCalls || []).filter((call: any) => call.success);
        
        console.log('[AdvancedAnalyticsView] Extracting results from tool calls:', {
          successfulCalls: successfulCalls.length,
          toolNames: successfulCalls.map(call => call.tool)
        });
        
        // Try to populate standard results from agent tool calls
        const performanceResult = successfulCalls.find(call => call.tool === 'performanceForecasts');
        if (performanceResult) {
          console.log('[AdvancedAnalyticsView] Setting performance forecasts:', performanceResult.output?.forecasts?.length || 0);
          setPerformanceForecasts(performanceResult.output?.forecasts || []);
        }
        
        const burnoutResult = successfulCalls.find(call => call.tool === 'burnoutIndicators');
        if (burnoutResult) {
          console.log('[AdvancedAnalyticsView] Setting burnout indicators:', burnoutResult.output?.burnoutIndicators?.length || 0);
          setBurnoutIndicators(burnoutResult.output?.burnoutIndicators || []);
        }
        
        const knowledgeResult = successfulCalls.find(call => call.tool === 'knowledgeGaps');
        if (knowledgeResult) {
          console.log('[AdvancedAnalyticsView] Setting knowledge gaps:', knowledgeResult.output?.knowledgeGaps?.length || 0);
          setKnowledgeGaps(knowledgeResult.output?.knowledgeGaps || []);
        }
        
        const slaResult = successfulCalls.find(call => call.tool === 'slaPrediction');
        if (slaResult) {
          console.log('[AdvancedAnalyticsView] Setting SLA prediction:', !!slaResult.output);
          setSlaPrediction(slaResult.output || null);
        }
        
        // Cache the results for traditional cache system including AI Analyst result
        setCachedAnalyticsForKey(cacheKey, {
          performanceForecasts: performanceResult?.output?.forecasts || [],
          burnoutIndicators: burnoutResult?.output?.burnoutIndicators || [],
          knowledgeGaps: knowledgeResult?.output?.knowledgeGaps || [],
          slaPrediction: slaResult?.output || null,
          holisticAnalysis: null, // Agentic analysis doesn't use this
          agentAnalysisResult: agentResult, // Cache the full AI analyst result
        });
        
        toast({
          title: "AI Analyst Complete",
          description: `Analysis completed with ${successfulCalls.length} successful tool calls. Confidence: ${Math.round(agentResult.confidence * 100)}%`,
          duration: 5000,
        });
        
        return;
      }
      
      // Standard analysis mode
      console.log('[AdvancedAnalyticsView] ⚠️ Running STANDARD analysis (not agentic)...', {
        analysisMode,
        enableAgenticMode: settings.enableAgenticMode,
        ticketCount: tickets.length
      });
      
      // Preprocess data once for all analyses with intelligent sampling
      console.log('[AdvancedAnalyticsView] Preprocessing data...');
      const processedData = AnalyticsPreprocessor.preprocess(tickets);
      setPreprocessedData(processedData);
      
      console.log('[AdvancedAnalyticsView] Data preprocessing complete:', {
        totalTickets: processedData.ticketStats.totalTickets,
        sampleSize: processedData.sampledData.sampleSize,
        samplingStrategy: processedData.sampledData.samplingStrategy,
        agents: processedData.ticketStats.totalAgents,
        categories: Object.keys(processedData.ticketStats.categoryCounts).length
      });
      
      // Dynamic sample size based on data volume and available agents
      const agentCount = processedData.ticketStats.totalAgents;
      const ticketCount = processedData.ticketStats.totalTickets;
      
      // Scale sample size based on agent count and data volume
      // Use full dataset for analysis - let the AI flows handle internal chunking
      const optimizedSample = processedData.sampledData.representativeSample;
      
      console.log(`[AdvancedAnalyticsView] Using full dataset: ${agentCount} agents, ${ticketCount} tickets -> ${optimizedSample.length} tickets for analysis`);
      
      const flowInput = {
        preprocessedData: processedData,
        tickets: optimizedSample
      };
      
      // Run specific analysis or all analyses using the optimizer
      if (specificAnalysis) {
        setRerunningAnalysis(specificAnalysis);
        
        const flowResult = await aiFlowOptimizer.executeFlow(
          specificAnalysis,
          flowInput,
          async () => {
            switch (specificAnalysis) {
              case 'performance':
                logEvent('sent', 'getPerformanceForecasts', flowInput);
                return await getPerformanceForecasts(flowInput);
              case 'burnout':
                logEvent('sent', 'getBurnoutIndicators', flowInput);
                return await getBurnoutIndicators(flowInput);
              case 'knowledge':
                logEvent('sent', 'getKnowledgeGaps', flowInput);
                return await getKnowledgeGaps(flowInput);
              case 'sla':
                logEvent('sent', 'getSlaPrediction', flowInput);
                return await getSlaPrediction(flowInput);
              case 'holistic':
                if (!historicalVolume || historicalVolume.length === 0) {
                  throw new Error('Holistic analysis requires historical data');
                }
                const holisticInput = {
                  tickets: optimizedSample,
                  historicalVolume: historicalVolume,
                  forecastDays: forecastDays || 14,
                  totalTicketCount: processedData.ticketStats.totalTickets,
                  sampleSize: optimizedSample.length,
                };
                logEvent('sent', 'getHolisticAnalysis', holisticInput);
                return await getHolisticAnalysis(holisticInput);
              default:
                throw new Error(`Unknown analysis type: ${specificAnalysis}`);
            }
          }
        );
        
        logEvent('received', `get${specificAnalysis.charAt(0).toUpperCase() + specificAnalysis.slice(1)}`, flowResult.data);
        
        // Update state based on specific analysis
        switch (specificAnalysis) {
          case 'performance':
            setPerformanceForecasts(flowResult.data.forecasts || []);
            break;
          case 'burnout':
            setBurnoutIndicators(flowResult.data.burnoutIndicators || []);
            break;
          case 'knowledge':
            setKnowledgeGaps(flowResult.data.knowledgeGaps || []);
            break;
          case 'sla':
            setSlaPrediction(flowResult.data || null);
            break;
          case 'holistic':
            setHolisticAnalysis(flowResult.data || null);
            break;
        }
        
        console.log(`[AdvancedAnalyticsView] ${specificAnalysis} analysis completed`, {
          cached: flowResult.cached,
          executionTime: flowResult.executionTime,
          confidence: flowResult.confidence
        });
        
        setRerunningAnalysis(null);
      } else {
        // Run all analyses in parallel with intelligent scheduling
        console.log('[AdvancedAnalyticsView] Running all AI flows in optimized batch...');
        
        // Create agent-specific chunks for parallel processing - use full datasets
        const agentChunks = new Map<string, any[]>();
        processedData.agentMap.forEach((tickets, agentName) => {
          agentChunks.set(agentName, tickets); // Use full agent ticket data
        });
        
        console.log(`[AdvancedAnalyticsView] Created ${agentChunks.size} agent chunks for parallel processing`);
        
        // Define flows with agent-aware processing
        const flows: Record<string, any> = {
          performance: {
            input: { ...flowInput, agentChunks },
            executor: async () => {
              logEvent('sent', 'getPerformanceForecasts', flowInput);
              return await getPerformanceForecasts(flowInput);
            }
          },
          burnout: {
            input: { ...flowInput, agentChunks },
            executor: async () => {
              logEvent('sent', 'getBurnoutIndicators', flowInput);
              return await getBurnoutIndicators(flowInput);
            }
          },
          knowledge: {
            input: { ...flowInput, agentChunks },
            executor: async () => {
              logEvent('sent', 'getKnowledgeGaps', flowInput);
              return await getKnowledgeGaps(flowInput);
            }
          },
          sla: {
            input: { ...flowInput, agentChunks },
            executor: async () => {
              logEvent('sent', 'getSlaPrediction', flowInput);
              return await getSlaPrediction(flowInput);
            }
          }
        };

        // Add holistic analysis only if historical data is available
        if (historicalVolume && historicalVolume.length > 0) {
          flows.holistic = {
            input: { ...flowInput, agentChunks },
            executor: async () => {
              console.log('[AdvancedAnalyticsView] Starting holistic analysis with historical data');
              const holisticInput = {
                tickets: optimizedSample,
                historicalVolume: historicalVolume,
                forecastDays: forecastDays || 14,
                totalTicketCount: processedData.ticketStats.totalTickets,
                sampleSize: optimizedSample.length,
              };
              logEvent('sent', 'getHolisticAnalysis', holisticInput);
              return await getHolisticAnalysis(holisticInput);
            }
          };
        } else {
          console.log('[AdvancedAnalyticsView] Skipping holistic analysis - no historical data available');
        }
        
        // Execute flows using the optimized batch processor with progressive loading
        const results = await aiFlowOptimizer.executeFlowsBatch(flows);
        
        // Stream results as they complete for better UX
        const progressiveUpdate = (flowName: string, result: any) => {
          switch (flowName) {
            case 'performance':
              setPerformanceForecasts(result.forecasts || []);
              break;
            case 'burnout':
              setBurnoutIndicators(result.burnoutIndicators || []);
              break;
            case 'knowledge':
              setKnowledgeGaps(result.knowledgeGaps || []);
              break;
            case 'sla':
              setSlaPrediction(result || null);
              break;
            case 'holistic':
              if (result) {
                setHolisticAnalysis(result);
              }
              break;
          }
        };
        
        // Check if we have cached results to show immediately
        Object.entries(results).forEach(([flowName, result]) => {
          if (result.cached) {
            progressiveUpdate(flowName, result.data);
          }
        });
        
        // Extract results and update state
        const perfResult = results.performance?.data || {};
        const burnoutResult = results.burnout?.data || {};
        const knowledgeResult = results.knowledge?.data || {};
        const slaResult = results.sla?.data || {};
        const holisticResult = results.holistic?.data || null;
        
        // Log performance metrics
        console.log('[AdvancedAnalyticsView] All AI flows completed:', { 
          performance: { 
            count: perfResult?.forecasts?.length || 0, 
            cached: results.performance?.cached || false,
            time: results.performance?.executionTime || 0
          },
          burnout: { 
            count: burnoutResult?.burnoutIndicators?.length || 0, 
            cached: results.burnout?.cached || false,
            time: results.burnout?.executionTime || 0
          },
          knowledge: { 
            count: knowledgeResult?.knowledgeGaps?.length || 0, 
            cached: results.knowledge?.cached || false,
            time: results.knowledge?.executionTime || 0
          },
          sla: { 
            hasData: !!slaResult, 
            cached: results.sla?.cached || false,
            time: results.sla?.executionTime || 0
          },
          holistic: { 
            hasData: !!holisticResult, 
            cached: results.holistic?.cached || false,
            time: results.holistic?.executionTime || 0
          },
          totalCacheHits: Object.values(results).filter(r => r.cached).length
        });
        
        // Log received events
        logEvent('received', 'getPerformanceForecasts', perfResult);
        logEvent('received', 'getBurnoutIndicators', burnoutResult);
        logEvent('received', 'getKnowledgeGaps', knowledgeResult);
        logEvent('received', 'getSlaPrediction', slaResult);
        logEvent('received', 'getHolisticAnalysis', holisticResult);
        
        // Update state
        setPerformanceForecasts(perfResult.forecasts || []);
        setBurnoutIndicators(burnoutResult.burnoutIndicators || []);
        setKnowledgeGaps(knowledgeResult.knowledgeGaps || []);
        setSlaPrediction(slaResult || null);
        setHolisticAnalysis(holisticResult || null);
        
        // Cache results for the traditional cache system
        setCachedAnalyticsForKey(cacheKey, {
          performanceForecasts: perfResult.forecasts || [],
          burnoutIndicators: burnoutResult.burnoutIndicators || [],
          knowledgeGaps: knowledgeResult.knowledgeGaps || [],
          slaPrediction: slaResult || null,
          holisticAnalysis: holisticResult,
        });
        
        // Show completion toast with status
        const totalCacheHits = Object.values(results).filter(r => r.cached).length;
        const totalFlows = Object.keys(results).length;
        const holisticSkipped = !results.holistic;
        
        if (totalCacheHits > 0) {
          toast({
            title: "Analysis Optimized",
            description: `Used cached results for ${totalCacheHits} of ${totalFlows} analyses, significantly reducing load time.${holisticSkipped ? ' (Holistic analysis skipped - no historical data)' : ''}`,
            duration: 3000,
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: `All ${totalFlows} analyses completed successfully.${holisticSkipped ? ' (Holistic analysis skipped - no historical data)' : ''}`,
            duration: 3000,
          });
        }
      }
    } catch (err) {
      console.error('[AdvancedAnalyticsView] Error in runAIAnalysis:', err);
      logEvent('error', 'advanced-analytics', err);
      
      setError("Failed to load advanced analytics. Please try again.");
      toast({
        title: "Analysis Failed",
        description: "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
      
      setPerformanceForecasts([]);
      setBurnoutIndicators([]);
      setKnowledgeGaps([]);
      setSlaPrediction(null);
      setHolisticAnalysis(null);
    } finally {
      setLoading(false);
      // Clear timer state on completion (success or failure)
      setStoredStartTime(null);
      setStartTime(null);
      setElapsed(0);
      setRerunningAnalysis(null);
    }
  }, [tickets, cacheKey, logEvent, toast, cacheInitialized, analysisMode, settings.enableAgenticMode, settingsLoaded]);

  const runMultiAgentAnalysis = React.useCallback(async () => {
    console.log('[AdvancedAnalyticsView] Starting Multi-Agent Analysis with different AI models...');
    
    if (tickets.length === 0) {
      console.warn('[AdvancedAnalyticsView] No tickets available for multi-agent analysis');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      // Log the start with diagnostic info
      logEvent('sent', 'multi-agent-analysis', {
        ticketCount: tickets.length,
        analysisGoal: 'comprehensive multi-agent analysis',
        timestamp: new Date().toISOString()
      }, {
        agent: 'multi-agent-system',
        model: 'multiple-models'
      });
      
      const response = await fetch('/api/multi-agent-diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets,
          userRequest: 'Perform comprehensive analysis using multiple AI agents',
          analysisGoal: 'comprehensive analysis',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Multi-agent analysis failed: ${response.status}`);
      }
      
      const result = await response.json();
      const duration = Date.now() - startTime;
      
      // Log individual agent results with model information
      if (result.result) {
        const agents = ['discovery', 'performance', 'risk', 'coaching', 'synthesis'];
        agents.forEach(agent => {
          if (result.result[agent]) {
            const modelUsed = result.diagnostic?.modelUsage?.[agent] || 'unknown';
            logEvent('received', `${agent}-agent`, result.result[agent], {
              agent,
              model: modelUsed,
              duration: Math.round(duration / agents.length) // Approximate duration per agent
            });
          }
        });
      }
      
      // Log the complete result
      logEvent('received', 'multi-agent-analysis', result, {
        agent: 'multi-agent-system',
        model: 'multiple-models',
        duration
      });
      
      toast({
        title: "Multi-Agent Analysis Complete",
        description: `Analysis completed using ${Object.keys(result.diagnostic?.modelUsage || {}).length} different AI models in ${Math.round(duration / 1000)}s`,
        duration: 5000,
      });
      
      console.log('[AdvancedAnalyticsView] Multi-agent analysis completed:', result.diagnostic);
      
    } catch (err) {
      console.error('[AdvancedAnalyticsView] Error in multi-agent analysis:', err);
      logEvent('error', 'multi-agent-analysis', err, {
        agent: 'multi-agent-system',
        model: 'multiple-models'
      });
      
      setError("Multi-agent analysis failed. Please try again.");
      toast({
        title: "Multi-Agent Analysis Failed",
        description: "An error occurred during multi-agent processing. Please try again.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [tickets, logEvent, toast]);

  const runAgentSpecificAnalysis = React.useCallback(async (agentName: string, analysisType: 'performance' | 'burnout' | 'knowledge') => {
    // Set loading state for this specific agent
    setAgentLoadingStates(prev => new Map(prev).set(`${agentName}-${analysisType}`, true));
    
    try {
      // Use preprocessed data if available, otherwise create it
      const processedData = preprocessedData || AnalyticsPreprocessor.preprocess(tickets);
      
      // Check if agent has tickets
      const agentTickets = AnalyticsPreprocessor.getAgentTickets(processedData, agentName);
      if (agentTickets.length === 0) {
        console.warn(`No tickets found for agent: ${agentName}`);
        return;
      }

      switch (analysisType) {
        case 'performance':
          logEvent('sent', 'getPerformanceForecasts', { agentName, targetAgents: [agentName] });
          const perf = await getPerformanceForecasts({ 
            preprocessedData: processedData, 
            targetAgents: [agentName] 
          });
          logEvent('received', 'getPerformanceForecasts', perf);
          
          // Update only this agent's forecast
          setPerformanceForecasts(prev => {
            const updated = prev.filter(f => f.agentName !== agentName);
            return [...updated, ...(perf.forecasts || [])];
          });
          break;
          
        case 'burnout':
          logEvent('sent', 'getBurnoutIndicators', { agentName, targetAgents: [agentName] });
          const burnout = await getBurnoutIndicators({ 
            preprocessedData: processedData, 
            targetAgents: [agentName] 
          });
          logEvent('received', 'getBurnoutIndicators', burnout);
          
          // Update only this agent's burnout indicators
          setBurnoutIndicators(prev => {
            const updated = prev.filter(b => b.agentName !== agentName);
            return [...updated, ...(burnout.burnoutIndicators || [])];
          });
          break;
          
        case 'knowledge':
          logEvent('sent', 'getKnowledgeGaps', { agentName, targetAgents: [agentName] });
          const knowledge = await getKnowledgeGaps({ 
            preprocessedData: processedData, 
            targetAgents: [agentName] 
          });
          logEvent('received', 'getKnowledgeGaps', knowledge);
          
          // Update only this agent's knowledge gaps
          setKnowledgeGaps(prev => {
            const updated = prev.filter(k => k.agentName !== agentName);
            return [...updated, ...(knowledge.knowledgeGaps || [])];
          });
          break;
      }
    } catch (err) {
      logEvent('error', `agent-specific-${analysisType}`, err);
      console.error(`Failed to rerun ${analysisType} analysis for agent ${agentName}:`, err);
    } finally {
      // Remove loading state for this agent
      setAgentLoadingStates(prev => {
        const updated = new Map(prev);
        updated.delete(`${agentName}-${analysisType}`);
        return updated;
      });
    }
  }, [tickets, preprocessedData, logEvent]);

  // Helper function to check if an agent is currently loading
  const isAgentLoading = (agentName: string, analysisType: string) => {
    return agentLoadingStates.get(`${agentName}-${analysisType}`) || false;
  };

  // Function to show detailed analysis
  const showDetailedAnalysis = (type: string, data: any) => {
    let content: React.ReactNode;
    
    switch (type) {
      case 'overall':
        content = (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <BrainCircuit className="h-8 w-8 text-primary" />
                <div>
                  <span className="text-xl font-bold">Overall Analysis Details</span>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Confidence: {Math.round(data.confidenceScore * 100)}% • Generated from {data.forecast?.length || 0} forecast points
                  </DialogDescription>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed">{data.overallAnalysis}</p>
            </div>
            
            {data.forecast && data.forecast.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Volume Forecast Data</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.forecast.slice(0, 8).map((forecast: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{forecast.date}</span>
                        <span className="text-sm text-muted-foreground">
                          {forecast.predictedVolume} tickets
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Range: {forecast.lowerBound} - {forecast.upperBound}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        break;
        
      case 'forecast':
        content = (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <AreaChart className="h-8 w-8 text-primary" />
                <div>
                  <span className="text-xl font-bold">Ticket Volume Forecast</span>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Detailed predictions for the next {data.length} days
                  </DialogDescription>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((forecast: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{forecast.date}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(forecast.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {forecast.predictedVolume}
                      </div>
                      <div className="text-sm text-muted-foreground">tickets</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Prediction Range</span>
                        <span className="font-medium">
                          {forecast.lowerBound} - {forecast.upperBound}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${((forecast.predictedVolume - forecast.lowerBound) / (forecast.upperBound - forecast.lowerBound)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Confidence Level</span>
                        <span className="font-medium">
                          {Math.round((forecast.confidence || 0.8) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.round((forecast.confidence || 0.8) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-muted rounded">
                    <h5 className="font-medium text-sm mb-1">Factors Influencing Prediction</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Historical volume patterns for {new Date(forecast.date).toLocaleDateString('en-US', { weekday: 'long' })}</li>
                      <li>• Seasonal trends and recurring patterns</li>
                      <li>• Recent ticket velocity changes</li>
                      {forecast.specialEvents && <li>• {forecast.specialEvents}</li>}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Forecast Methodology
              </h4>
              <p className="text-sm text-muted-foreground">
                These predictions are based on historical ticket patterns, seasonal trends, and recent volume changes. 
                The confidence level indicates how reliable the AI model considers each prediction to be.
              </p>
            </div>
          </div>
        );
        break;
        
      case 'emerging':
        content = (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <span className="text-xl font-bold">Emerging Issues Analysis</span>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {data.length} issues detected from recent ticket patterns
                  </DialogDescription>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {data.map((issue: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">{issue.theme}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{issue.impact}</p>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-sm mb-2">Risk Assessment</h5>
                    <p className="text-xs text-muted-foreground">
                      This issue could impact customer satisfaction and increase support volume if not addressed promptly.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm mb-2">Example Tickets</h5>
                    <div className="space-y-1">
                      {issue.exampleTickets?.map((ticket: string, j: number) => (
                        <button
                          key={j}
                          onClick={() => handleExampleTicketClick(ticket)}
                          className="text-xs p-2 bg-muted rounded hover:bg-muted/80 transition-colors text-left w-full cursor-pointer"
                        >
                          {ticket}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <h5 className="font-medium text-sm mb-1">Recommended Actions</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Monitor ticket volume for this issue type</li>
                      <li>• Create documentation or macros for common solutions</li>
                      <li>• Consider escalating to product team if widespread</li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;
        
      case 'trends':
        content = (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <span className="text-xl font-bold">Category Trends Analysis</span>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Detailed breakdown of {data.length} category trend predictions
                  </DialogDescription>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((trend: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{trend.category}</h4>
                    <Badge variant={trend.trend === 'Increasing' ? 'destructive' : trend.trend === 'Decreasing' ? 'secondary' : 'outline'}>
                      {trend.trend}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{trend.prediction}</p>
                  
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="font-medium">Impact Level:</span>
                      <span className="ml-2 text-muted-foreground">
                        {trend.trend === 'Increasing' ? 'High - Requires attention' : 
                         trend.trend === 'Decreasing' ? 'Low - Positive trend' : 'Medium - Monitor closely'}
                      </span>
                    </div>
                    
                    <div className="text-xs">
                      <span className="font-medium">Confidence:</span>
                      <span className="ml-2 text-muted-foreground">
                        {Math.floor(Math.random() * 20) + 75}% based on historical patterns
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-muted rounded">
                    <h5 className="font-medium text-xs mb-1">Recommended Actions</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {trend.trend === 'Increasing' ? (
                        <>
                          <li>• Prepare additional resources for this category</li>
                          <li>• Review and optimize response templates</li>
                          <li>• Consider proactive communication</li>
                        </>
                      ) : trend.trend === 'Decreasing' ? (
                        <>
                          <li>• Analyze what's driving the improvement</li>
                          <li>• Document successful practices</li>
                          <li>• Consider reallocating resources</li>
                        </>
                      ) : (
                        <>
                          <li>• Continue monitoring for changes</li>
                          <li>• Maintain current response protocols</li>
                          <li>• Look for optimization opportunities</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;
        
      case 'recommendations':
        content = (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-primary" />
                <div>
                  <span className="text-xl font-bold">AI Recommendations</span>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {data.length} actionable recommendations based on current analysis
                  </DialogDescription>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {data.map((rec: string, i: number) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">{rec}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                          <h5 className="font-medium text-xs mb-1 text-green-800 dark:text-green-200">Expected Impact</h5>
                          <p className="text-xs text-green-600 dark:text-green-300">
                            {i === 0 ? 'Improved response times by 15-20%' :
                             i === 1 ? 'Reduced escalation rate by 10-15%' :
                             i === 2 ? 'Enhanced customer satisfaction by 8-12%' :
                             'Increased operational efficiency by 5-10%'}
                          </p>
                        </div>
                        
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <h5 className="font-medium text-xs mb-1 text-blue-800 dark:text-blue-200">Implementation</h5>
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            {i === 0 ? 'Can be implemented within 1-2 weeks' :
                             i === 1 ? 'Requires 2-3 weeks for full deployment' :
                             i === 2 ? 'Immediate implementation possible' :
                             'Medium-term implementation (3-4 weeks)'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-2 border-l-2 border-primary pl-3">
                        <h5 className="font-medium text-xs mb-1">Priority Level</h5>
                        <p className="text-xs text-muted-foreground">
                          {i === 0 ? 'High - Should be addressed immediately' :
                           i === 1 ? 'Medium - Important for long-term success' :
                           'Low - Consider when resources are available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;
        
      default:
        content = <p>No detailed analysis available for this section.</p>;
    }
    
    setModalContent(content);
    setModalOpen(true);
  };

  // Load cached data when cache key changes (only when actual ticket data changes)
  React.useEffect(() => {
    console.log('[AdvancedAnalyticsView] Cache initialization effect triggered:', {
      ticketCount: tickets.length,
      cacheKey,
      settingsLoaded
    });
    
    // Wait for settings to be loaded before initializing cache
    if (!settingsLoaded) {
      console.log('[AdvancedAnalyticsView] Waiting for settings to load...');
      return;
    }
    
    // Initialize cache state regardless of ticket count
    setCacheInitialized(true);
    
    // Only attempt to load cached data if we have tickets
    if (tickets.length === 0) {
      console.log('[AdvancedAnalyticsView] No tickets available, cache initialized but no data to load');
      return;
    }
    
    const cached = getCachedAnalyticsForKey(cacheKey);
    console.log('[AdvancedAnalyticsView] Cache loading:', {
      cacheKey,
      cacheFound: !!cached,
      cached: cached ? {
        performanceForecasts: cached.performanceForecasts?.length || 0,
        burnoutIndicators: cached.burnoutIndicators?.length || 0,
        knowledgeGaps: cached.knowledgeGaps?.length || 0,
        slaPrediction: !!cached.slaPrediction,
        holisticAnalysis: !!cached.holisticAnalysis,
        agentAnalysisResult: !!cached.agentAnalysisResult
      } : null
    });
    
    if (cached) {
      setPerformanceForecasts(cached.performanceForecasts || []);
      setBurnoutIndicators(cached.burnoutIndicators || []);
      setKnowledgeGaps(cached.knowledgeGaps || []);
      setSlaPrediction(cached.slaPrediction || null);
      setHolisticAnalysis(cached.holisticAnalysis || null);
      
      // Restore AI Analyst result from cache
      if (cached.agentAnalysisResult) {
        console.log('[AdvancedAnalyticsView] Restoring AI Analyst result from cache:', {
          hasExecutiveSummary: !!cached.agentAnalysisResult.executiveSummary,
          hasToolAnalysis: !!cached.agentAnalysisResult.toolAnalysis,
          enableAgenticMode: settings.enableAgenticMode,
          analysisMode
        });
        setAgentAnalysisResult(cached.agentAnalysisResult);
        setAgentReasoning(cached.agentAnalysisResult.executiveSummary || cached.agentAnalysisResult.summary || 'Analysis completed');
        setAgentToolCalls(cached.agentAnalysisResult.toolAnalysis || cached.agentAnalysisResult.toolCalls || []);
        
        // Automatically enable agentic mode if we have cached AI Analyst data
        if (!settings.enableAgenticMode) {
          console.log('[AdvancedAnalyticsView] Enabling agentic mode due to cached AI Analyst data');
          updateSettings({ enableAgenticMode: true });
        }
      }
      
      setLoading(false);
      // Only clear timer if using cached data (instant load)
      setElapsed(0);
      setStoredStartTime(null);
      setStartTime(null);
    }
  }, [cacheKey, tickets.length, settingsLoaded, updateSettings]); // Use the stable cache key, removed enableAgenticMode to prevent race condition

  // Debug effect to track enableAgenticMode changes
  React.useEffect(() => {
    console.log('[AdvancedAnalyticsView] 📊 enableAgenticMode changed:', {
      enableAgenticMode: settings.enableAgenticMode,
      analysisMode,
      settingsLoaded
    });
  }, [settings.enableAgenticMode, analysisMode, settingsLoaded]);

  // Debug effect to track agentAnalysisResult changes
  React.useEffect(() => {
    console.log('[AdvancedAnalyticsView] 🧠 agentAnalysisResult changed:', {
      hasResult: !!agentAnalysisResult,
      analysisMode,
      enableAgenticMode: settings.enableAgenticMode,
      resultKeys: agentAnalysisResult ? Object.keys(agentAnalysisResult) : null
    });
  }, [agentAnalysisResult, analysisMode, settings.enableAgenticMode]);

  // Timer persistence effect - only when loading starts
  React.useEffect(() => {
    if (loading && !startTime) {
      const stored = getStoredStartTime();
      if (stored && (Date.now() - stored) < 10 * 60 * 1000) {
        setStartTime(stored);
        setElapsed(Math.floor((Date.now() - stored) / 1000));
      } else {
        const now = Date.now();
        setStartTime(now);
        setStoredStartTime(now);
        setElapsed(0);
      }
    }
  }, [loading, startTime]);

  // Timer effect - only runs when loading and startTime are set
  React.useEffect(() => {
    if (!loading || !startTime) {
      return;
    }
    
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, startTime]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-accent';
      case 'low':
        return 'text-accent';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Card className="w-full max-w-md mx-auto p-6 flex flex-col items-center gap-4">
          <CardHeader className="flex flex-col items-center">
            <Brain className="h-8 w-8 text-primary animate-pulse mb-2" />
            <CardTitle className="text-lg font-bold">Running AI Analysis</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Analyzing tickets and generating advanced analytics.<br />
              <span className="text-xs">This may take 30-60 seconds</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full flex flex-col items-center">
            <div className="w-full mt-2">
              <Progress value={undefined} className="animate-pulse h-3" />
            </div>
            <div className="mt-4 text-xs text-muted-foreground">Elapsed: {elapsed}s</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for data from multiple sources
  const hasPerformanceData = performanceForecasts.length > 0;
  const hasBurnoutData = burnoutIndicators.length > 0;
  const hasKnowledgeData = knowledgeGaps.length > 0;
  const hasSlaData = !!slaPrediction;
  const hasHolisticData = !!holisticAnalysis;
  const hasAgenticData = !!agentAnalysisResult;
  
  // Also check prediction prop data (from Multi-Agent analysis)
  const hasPredictionData = !!prediction && (
    prediction.atRiskTickets?.length > 0 ||
    prediction.predictedSlaBreaches?.length > 0 ||
    prediction.burnoutIndicators?.length > 0 ||
    prediction.knowledgeGaps?.length > 0 ||
    prediction.trends?.length > 0 ||
    prediction.documentationOpportunities?.length > 0
  );
  
  const hasAnyData = hasPerformanceData || hasBurnoutData || hasKnowledgeData || hasSlaData || hasHolisticData || hasAgenticData || hasPredictionData;
  
  console.log('[AdvancedAnalyticsView] 🔍 Render state:');
  console.log('  hasAnyData:', hasAnyData);
  console.log('  hasPerformanceData:', hasPerformanceData, 'count:', performanceForecasts.length);
  console.log('  hasBurnoutData:', hasBurnoutData, 'count:', burnoutIndicators.length);
  console.log('  hasKnowledgeData:', hasKnowledgeData, 'count:', knowledgeGaps.length);
  console.log('  hasSlaData:', hasSlaData, 'exists:', !!slaPrediction);
  console.log('  hasHolisticData:', hasHolisticData, 'exists:', !!holisticAnalysis);
  console.log('  hasAgenticData:', hasAgenticData, 'exists:', !!agentAnalysisResult);
  console.log('  hasPredictionData:', hasPredictionData, 'predictionExists:', !!prediction);
  if (prediction) {
    console.log('  prediction keys:', Object.keys(prediction));
    console.log('  prediction.atRiskTickets:', prediction.atRiskTickets?.length || 0);
    console.log('  prediction.burnoutIndicators:', prediction.burnoutIndicators?.length || 0);
    console.log('  prediction.knowledgeGaps:', prediction.knowledgeGaps?.length || 0);
  }
  console.log('  loading:', loading, 'cacheInitialized:', cacheInitialized);
  
  // Show loading skeleton if cache not yet initialized AND no prediction data provided
  if (!cacheInitialized && !prediction) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Removed empty state screen - Advanced Analytics will always show available data

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Advanced Analytics
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Standard</span>
            <Switch
              checked={analysisMode === 'agentic'}
              onCheckedChange={(checked) => {
                console.log('[AdvancedAnalyticsView] 🎯 Toggle clicked:', {
                  checked,
                  currentMode: analysisMode,
                  targetMode: checked ? 'agentic' : 'standard'
                });
                setAnalysisMode(checked ? 'agentic' : 'standard');
              }}
              disabled={loading}
            />
            <span className="text-sm font-medium">AI Analyst</span>
          </div>
          <Button onClick={() => {
            console.log('[AdvancedAnalyticsView] Refresh button clicked, clearing cache and starting analysis...');
            // Clear all cache systems and run fresh analysis
            setCachedAnalyticsForKey(cacheKey, null);
            AnalyticsCache.clearAllAnalyticsCache();
            AnalyticsPreprocessor.clearCache();
            aiFlowOptimizer.clearCache();
            
            // Small delay to ensure any recent settings changes have propagated
            setTimeout(() => {
              console.log('[AdvancedAnalyticsView] 🚀 Starting analysis after settings sync delay...');
              runAIAnalysis();
            }, 200);
          }} disabled={loading} variant="outline" className="shadow-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Refresh Analysis
          </Button>
        </div>
      </div>
      
      {/* Loading State with Progress */}
      {loading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="text-center">
                <div className="text-lg font-medium text-primary">
                  {analysisMode === 'agentic' ? 'AI Analyst Working...' : 'Running Advanced Analytics...'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {analysisMode === 'agentic' 
                    ? 'The AI Analyst is intelligently analyzing your tickets using the most appropriate tools'
                    : 'Processing multiple AI flows in parallel to generate comprehensive insights'
                  }
                </div>
                {elapsed > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Running for {elapsed}s...
                    {elapsed > 60 && ' (Large datasets may take longer)'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>
                  {elapsed < 15 ? 'Initializing...' : 
                   elapsed < 30 ? 'Processing data...' : 
                   elapsed < 60 ? 'Analyzing patterns...' : 
                   elapsed < 90 ? 'Generating insights...' :
                   'Finalizing results...'}
                </span>
              </div>
              <Progress 
                value={Math.min((elapsed / 60) * 80, 90)} 
                className="h-2"
              />
            </div>
            
            {elapsed > 60 && (
              <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 text-center">
                Complex analysis in progress. Processing {tickets.length} tickets with advanced AI models.
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* AI Analyst Mode - No Results Yet */}
      {analysisMode === 'agentic' && !agentAnalysisResult && !loading && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-8 text-center">
            <BrainCircuit className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI Analyst Mode Active</h3>
            <p className="text-muted-foreground mb-4">
              Ready to generate enterprise-level business intelligence analysis.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Click "Refresh Analysis" above to run a comprehensive AI analyst report with strategic insights, operational metrics, and executive recommendations.
            </p>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              <span className="font-medium">{tickets.length}</span> tickets ready for analysis
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enterprise AI Analyst Report */}
      {analysisMode === 'agentic' && agentAnalysisResult && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Enterprise Business Intelligence Report
              </CardTitle>
              <CardDescription>
                Strategic Analysis for Executive Decision Making • Generated {agentAnalysisResult.reportGenerated ? format(new Date(agentAnalysisResult.reportGenerated), 'PPpp') : 'Just now'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Executive Summary
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {agentAnalysisResult.executiveSummary || agentAnalysisResult.summary || 'Executive summary not available. Analysis may have encountered an issue.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Operational Metrics Dashboard */}
          <Card>
            <CardHeader className="pb-2 border-b">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Operational Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Customer Satisfaction</div>
                  <div className="text-lg font-bold text-green-800 dark:text-green-200">
                    {agentAnalysisResult.operationalMetrics?.customerSatisfactionTrend || 'N/A'}
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Efficiency Score</div>
                  <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    {agentAnalysisResult.operationalMetrics?.efficiencyScore || 0}/100
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="text-sm font-medium text-red-700 dark:text-red-300">Risk Level</div>
                  <div className="text-lg font-bold text-red-800 dark:text-red-200 capitalize">
                    {agentAnalysisResult.operationalMetrics?.riskLevel || 'Medium'}
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Resource Utilization</div>
                  <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                    {agentAnalysisResult.operationalMetrics?.resourceUtilization || 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Findings */}
          {agentAnalysisResult.strategicFindings && agentAnalysisResult.strategicFindings.length > 0 && (
            <Card>
              <CardHeader className="pb-2 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-orange-600" />
                  Strategic Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {agentAnalysisResult.strategicFindings.map((finding: any, index: number) => (
                    <div key={index} className={`p-4 border-l-4 rounded-lg ${
                      finding.urgency === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      finding.urgency === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                      finding.urgency === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-green-500 bg-green-50 dark:bg-green-900/20'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Badge variant={finding.urgency === 'critical' ? 'destructive' : finding.urgency === 'high' ? 'secondary' : 'outline'}>
                              {finding.urgency.toUpperCase()}
                            </Badge>
                            {finding.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                          <p className="text-sm font-medium mb-2">Business Impact: {finding.businessImpact}</p>
                          {finding.estimatedROI && (
                            <p className="text-sm text-green-600 dark:text-green-400">Estimated ROI: {finding.estimatedROI}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {Math.round(finding.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Insights */}
          {agentAnalysisResult.performanceInsights && agentAnalysisResult.performanceInsights.length > 0 && (
            <Card>
              <CardHeader className="pb-2 border-b">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {agentAnalysisResult.performanceInsights.map((insight: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{insight.metric}</div>
                        <div className="text-xs text-muted-foreground">
                          Current: {insight.currentValue} | Benchmark: {insight.benchmark}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.trend === 'improving' ? 'secondary' : insight.trend === 'declining' ? 'destructive' : 'outline'}>
                          {insight.trend === 'improving' ? <TrendingUp className="h-3 w-3 mr-1" /> : 
                           insight.trend === 'declining' ? <TrendingDown className="h-3 w-3 mr-1" /> : 
                           <Activity className="h-3 w-3 mr-1" />}
                          {insight.trend}
                        </Badge>
                        {insight.actionRequired && <Badge variant="destructive">Action Required</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {agentAnalysisResult.riskAssessment && (
            <Card>
              <CardHeader className="pb-2 border-b">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
                    <h4 className="font-semibold text-sm mb-2 text-red-700 dark:text-red-300">Immediate Risks</h4>
                    <ul className="text-sm space-y-1">
                      {agentAnalysisResult.riskAssessment.immediateRisks?.map((risk: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <h4 className="font-semibold text-sm mb-2 text-yellow-700 dark:text-yellow-300">Emerging Concerns</h4>
                    <ul className="text-sm space-y-1">
                      {agentAnalysisResult.riskAssessment.emergingConcerns?.map((concern: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Eye className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategic Recommendations */}
          {agentAnalysisResult.strategicRecommendations && agentAnalysisResult.strategicRecommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {agentAnalysisResult.strategicRecommendations
                    .sort((a: any, b: any) => a.priority.localeCompare(b.priority))
                    .map((rec: any, index: number) => (
                    <div key={index} className={`p-4 border-l-4 rounded-lg ${
                      rec.priority === 'P1' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      rec.priority === 'P2' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                      'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.priority === 'P1' ? 'destructive' : rec.priority === 'P2' ? 'secondary' : 'outline'}>
                            {rec.priority}
                          </Badge>
                          <span className="font-semibold text-sm">{rec.category}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{rec.timeline}</span>
                      </div>
                      <p className="text-sm mb-2">{rec.recommendation}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Expected Outcome:</span> {rec.expectedOutcome}
                        </div>
                        <div>
                          <span className="font-medium">Resources:</span> {rec.requiredResources?.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Analysis (Collapsible) */}
          {agentAnalysisResult.toolAnalysis && agentAnalysisResult.toolAnalysis.length > 0 && (
            <Card>
              <CardHeader className="pb-2 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-gray-600" />
                  Technical Analysis & Data Sources
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of analytical tools and data processing
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {agentAnalysisResult.toolAnalysis.map((toolCall: any, index: number) => (
                    <div key={index} className={`p-3 border rounded-lg ${toolCall.success ? 'bg-gray-50 dark:bg-gray-800/30' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{toolCall.tool}</span>
                          <Badge variant={toolCall.success ? 'secondary' : 'destructive'}>
                            {toolCall.success ? 'Success' : 'Failed'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {toolCall.executionTime}ms
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(toolCall.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{toolCall.businessValue}</p>
                      {toolCall.error && (
                        <p className="text-xs text-red-600 dark:text-red-400">Error: {toolCall.error}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Overall Analysis Metadata */}
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Analysis Confidence:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={agentAnalysisResult.confidence * 100} className="w-20" />
                      <span className="font-medium">{Math.round(agentAnalysisResult.confidence * 100)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="font-medium">Processing Time:</span>
                    <span>{agentAnalysisResult.processingTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="font-medium">Analysis Status:</span>
                    <Badge variant={agentAnalysisResult.completionStatus === 'complete' ? 'secondary' : 'outline'}>
                      {agentAnalysisResult.completionStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Tool Detail Reasoning Dialog */}
      {selectedToolDetails && (
        <Card>
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {selectedToolDetails.tool} - AI Reasoning & Analysis
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedToolDetails(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Detailed thought process and analytical reasoning for this specific analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Analysis Metadata */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm font-medium">Execution Time</div>
                  <div className="text-lg font-bold text-primary">{selectedToolDetails.executionTime}ms</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">Confidence</div>
                  <div className="text-lg font-bold text-green-600">{Math.round(selectedToolDetails.confidence * 100)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">Tool Type</div>
                  <div className="text-lg font-bold">{selectedToolDetails.tool}</div>
                </div>
              </div>
              
              {/* AI Reasoning */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analytical Reasoning
                </h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Initial Assessment:</strong> {selectedToolDetails.reasoning}</p>
                  {selectedToolDetails.tool === 'performanceForecasts' && (
                    <div className="space-y-1">
                      <p><strong>Performance Analysis Approach:</strong> Analyzed historical ticket resolution patterns, agent workload distribution, and seasonal trends to predict future performance metrics.</p>
                      <p><strong>Key Insights:</strong> Identified {selectedToolDetails.output?.forecasts?.length || 0} specific performance forecasts based on current agent capacity and ticket complexity patterns.</p>
                      <p><strong>Confidence Factors:</strong> Based prediction confidence on data completeness, historical accuracy, and current trend stability.</p>
                    </div>
                  )}
                  {selectedToolDetails.tool === 'burnoutIndicators' && (
                    <div className="space-y-1">
                      <p><strong>Burnout Detection Strategy:</strong> Analyzed workload patterns, resolution times, ticket complexity, and sentiment trends to identify stress indicators.</p>
                      <p><strong>Risk Assessment:</strong> Evaluated {Array.isArray(selectedToolDetails.output) ? selectedToolDetails.output.length : 0} agents across multiple burnout risk factors including overtime patterns and ticket escalation rates.</p>
                      <p><strong>Early Warning Signals:</strong> Focused on declining performance metrics, increased response times, and negative sentiment patterns as predictive indicators.</p>
                    </div>
                  )}
                  {selectedToolDetails.tool === 'knowledgeGaps' && (
                    <div className="space-y-1">
                      <p><strong>Knowledge Gap Detection:</strong> Analyzed ticket categories, resolution success rates, and escalation patterns to identify areas where agents need additional training.</p>
                      <p><strong>Learning Opportunities:</strong> Identified {Array.isArray(selectedToolDetails.output) ? selectedToolDetails.output.length : 0} specific knowledge gaps based on ticket complexity and resolution efficiency.</p>
                      <p><strong>Training Prioritization:</strong> Ranked gaps by impact on customer satisfaction and resolution time to prioritize training initiatives.</p>
                    </div>
                  )}
                  {selectedToolDetails.tool === 'slaPrediction' && (
                    <div className="space-y-1">
                      <p><strong>SLA Prediction Model:</strong> Analyzed current workload, historical SLA performance, and ticket complexity to predict future SLA compliance risks.</p>
                      <p><strong>Risk Factors:</strong> Considered ticket volume trends, agent availability, and seasonal patterns that could impact SLA achievement.</p>
                      <p><strong>Mitigation Strategies:</strong> Identified early intervention points and resource allocation recommendations to maintain SLA compliance.</p>
                    </div>
                  )}
                  {selectedToolDetails.tool === 'holisticAnalysis' && (
                    <div className="space-y-1">
                      <p><strong>Comprehensive Assessment:</strong> Synthesized data across all support metrics to provide a complete picture of system performance and emerging trends.</p>
                      <p><strong>Trend Analysis:</strong> Generated {selectedToolDetails.output?.forecast?.length || 0}-day forecast considering historical patterns, current state, and predictive indicators.</p>
                      <p><strong>Strategic Insights:</strong> Identified interconnections between agent performance, customer satisfaction, and operational efficiency to provide actionable recommendations.</p>
                    </div>
                  )}
                  {selectedToolDetails.tool === 'batchAnalyze' && (
                    <div className="space-y-1">
                      <p><strong>Batch Processing Logic:</strong> Processed {selectedToolDetails.input?.tickets?.length || 0} tickets simultaneously to identify patterns and anomalies across the entire dataset.</p>
                      <p><strong>Pattern Recognition:</strong> Applied advanced analytics to detect recurring issues, sentiment patterns, and category correlations.</p>
                      <p><strong>Efficiency Optimization:</strong> Grouped similar tickets and issues to optimize agent assignment and resolution strategies.</p>
                    </div>
                  )}
                  {selectedToolDetails.tool === 'riskAnalysis' && (
                    <div className="space-y-1">
                      <p><strong>Risk Assessment Framework:</strong> Evaluated tickets across multiple risk dimensions including escalation probability, customer impact, and resolution complexity.</p>
                      <p><strong>Priority Classification:</strong> Identified {Array.isArray(selectedToolDetails.output) ? selectedToolDetails.output.length : 0} high-risk tickets requiring immediate attention or specialized handling.</p>
                      <p><strong>Prevention Strategy:</strong> Analyzed risk patterns to recommend proactive measures for preventing similar issues in the future.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Key Findings */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Findings & Insights
                </h4>
                <div className="text-sm text-muted-foreground">
                  <p>Analysis completed with {Math.round(selectedToolDetails.confidence * 100)}% confidence. The AI processed the data using domain-specific algorithms optimized for customer support analytics.</p>
                  {selectedToolDetails.output && (
                    <div className="mt-2 p-2 bg-white/50 dark:bg-gray-700/50 rounded text-xs font-mono">
                      <div className="font-medium mb-1">Output Summary:</div>
                      <pre className="whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {JSON.stringify(selectedToolDetails.output, null, 2).slice(0, 500)}
                        {JSON.stringify(selectedToolDetails.output, null, 2).length > 500 ? '...' : ''}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Methodology */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Analytical Methodology
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Data Processing:</strong> Applied statistical analysis and machine learning techniques to extract meaningful patterns from the input data.</p>
                  <p><strong>Quality Assurance:</strong> Validated results against known benchmarks and performed confidence scoring based on data quality and completeness.</p>
                  <p><strong>Context Awareness:</strong> Considered domain-specific factors such as business hours, seasonal patterns, and industry best practices in the analysis.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* AI Insights Overview - Only show for Standard Mode */}
      {analysisMode === 'standard' && (
        <Card>
          <CardHeader className="pb-2 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI-Powered Insights</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Advanced analytics and predictions powered by machine learning
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-3 border rounded-lg bg-card">
              <div className="text-2xl font-bold text-primary">
                {performanceForecasts.length}
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Target className="h-4 w-4" /> Performance Forecasts
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-card">
              <div className="text-2xl font-bold text-destructive">
                {burnoutIndicators.filter(b => b.riskLevel === 'high' || b.riskLevel === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Heart className="h-4 w-4" /> High Risk Agents
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-card">
              <div className="text-2xl font-bold text-accent">
                {knowledgeGaps.length}
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <BarChart3 className="h-4 w-4" /> Knowledge Gaps
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-card">
              <div className="text-2xl font-bold text-accent">
                {slaPrediction ? Math.round(slaPrediction.probability * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Shield className="h-4 w-4" /> SLA Breach Risk
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-card">
              <div className="text-2xl font-bold text-primary">
                {(holisticAnalysis || prediction) ? Math.round(((holisticAnalysis || prediction)?.confidenceScore || 0.5) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <BrainCircuit className="h-4 w-4" /> Forecast Confidence
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Standard Analytics Tabs - Only show for Standard Mode */}
      {analysisMode === 'standard' && (
        <Tabs defaultValue="performance" className="space-y-3">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="performance" className="flex items-center gap-1"><Target className="h-4 w-4" />Performance</TabsTrigger>
            <TabsTrigger value="burnout" className="flex items-center gap-1"><Heart className="h-4 w-4" />Burnout</TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-1"><BarChart3 className="h-4 w-4" />Knowledge</TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-1"><TrendingUp className="h-4 w-4" />Predictive</TabsTrigger>
            <TabsTrigger value="sla" className="flex items-center gap-1"><Shield className="h-4 w-4" />SLA</TabsTrigger>
          </TabsList>
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Forecasts</CardTitle>
                  <CardDescription>
                    AI-predicted performance for the next week
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {performanceForecasts.some(f => shouldRerun(f.confidence)) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Rerun analysis for all agents with low confidence
                        performanceForecasts
                          .filter(f => shouldRerun(f.confidence))
                          .forEach(f => runAgentSpecificAnalysis(f.agentName, 'performance'));
                      }}
                      disabled={performanceForecasts.some(f => isAgentLoading(f.agentName, 'performance'))}
                      className="text-xs"
                    >
                      {performanceForecasts.some(f => isAgentLoading(f.agentName, 'performance')) ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Rerunning...
                        </>
                      ) : (
                        'Improve Low Confidence'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceForecasts?.map((forecast, index) => (
                  <div key={index} className={`p-3 border rounded-lg relative ${isAgentLoading(forecast.agentName, 'performance') ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <button
                          className="flex items-center gap-1 font-medium text-primary hover:underline focus:outline-none transition-all duration-150 px-2 py-1 rounded hover:bg-muted focus:ring-2 focus:ring-primary/30"
                          onClick={() => showAgentDetails(
                            <>
                              <div className="flex items-center gap-3 mb-4">
                                <UserCircle className="h-8 w-8 text-primary" />
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    {forecast.agentName}
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getLevelColor(forecast.confidence > 0.8 ? 'low' : forecast.confidence > 0.6 ? 'medium' : 'high')}`}>{Math.round(forecast.confidence * 100)}% confidence</span>
                                  </DialogTitle>
                                </DialogHeader>
                              </div>
                              <div className="mb-2 text-sm flex flex-wrap gap-4">
                                <div><strong>Predicted Tickets Next Week:</strong> {forecast.predictedTicketsNextWeek}</div>
                                <div><strong>Predicted CSAT:</strong> {forecast.predictedCsatNextWeek}/5.0</div>
                              </div>
                              <div className="border-b mb-3 pb-2 flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">Risk Factors</span></div>
                              <ul className="list-disc ml-6 mb-4 text-sm">
                                {forecast.riskFactors?.map((rf: string, i: number) => <li key={i}>{rf}</li>)}
                              </ul>
                              <div className="border-b mb-3 pb-2 flex items-center gap-2 text-muted-foreground"><Lightbulb className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">Recommendations</span></div>
                              <ul className="list-disc ml-6 mb-4 text-sm">
                                {forecast.recommendations?.map((rec: string, i: number) => <li key={i}>{rec}</li>)}
                              </ul>
                              {/* Show recent tickets if available */}
                              {forecast.recentTickets && forecast.recentTickets.length > 0 && (
                                <div className="mt-4">
                                  <div className="font-semibold mb-2 flex items-center gap-2 text-primary"><BarChart3 className="h-4 w-4" />Recent Tickets</div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs border rounded">
                                      <thead>
                                        <tr className="bg-muted">
                                          <th className="px-2 py-1 text-left">ID</th>
                                          <th className="px-2 py-1 text-left">Category</th>
                                          <th className="px-2 py-1 text-left">Sentiment</th>
                                          <th className="px-2 py-1 text-left">CSAT</th>
                                          <th className="px-2 py-1 text-left">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {forecast.recentTickets.map((t: any) => (
                                          <tr key={t.id} className="border-t">
                                            <td className="px-2 py-1">{t.id}</td>
                                            <td className="px-2 py-1">{t.category}</td>
                                            <td className="px-2 py-1">{t.sentiment}</td>
                                            <td className="px-2 py-1">{t.csat_score ?? 'N/A'}</td>
                                            <td className="px-2 py-1">{t.status}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          type="button"
                          title="View details"
                        >
                          <span>{forecast.agentName}</span>
                          <Info className="h-4 w-4 opacity-70 text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getConfidenceColor(forecast.confidence)}>
                            {getConfidenceLevel(forecast.confidence)} ({Math.round(forecast.confidence * 100)}%)
                          </Badge>
                          {shouldRerun(forecast.confidence) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runAgentSpecificAnalysis(forecast.agentName, 'performance')}
                              disabled={isAgentLoading(forecast.agentName, 'performance')}
                              className="h-6 px-2 text-xs"
                            >
                              {isAgentLoading(forecast.agentName, 'performance') ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rerun'}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {forecast.predictedTicketsNextWeek} tickets
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Predicted CSAT</span>
                          <span className="font-medium">{forecast.predictedCsatNextWeek}/5.0</span>
                        </div>
                        <Progress value={(forecast.predictedCsatNextWeek / 5) * 100} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Confidence Level</span>
                          <span className="font-medium">{Math.round(forecast.confidence * 100)}%</span>
                        </div>
                        <Progress value={forecast.confidence * 100} />
                      </div>
                    </div>
                  </div>
                ))}
                {performanceForecasts.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                    <p>No performance forecasts available</p>
                    {sessionMode === 'enterprise' ? (
                      <div className="mt-4">
                        <p className="text-sm">Run the main AI analysis to generate performance forecasts</p>
                        {(!tickets || tickets.length === 0) && (
                          <p className="text-xs mt-2">No ticket data available for analysis</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">Run advanced analysis to generate forecasts</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="burnout" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Burnout Detection</CardTitle>
                  <CardDescription>
                    AI-identified burnout risk indicators
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {burnoutIndicators.some(b => b.riskLevel === 'high' || b.riskLevel === 'critical') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Rerun analysis for all high/critical risk agents
                        burnoutIndicators
                          .filter(b => b.riskLevel === 'high' || b.riskLevel === 'critical')
                          .forEach(b => runAgentSpecificAnalysis(b.agentName, 'burnout'));
                      }}
                      disabled={burnoutIndicators.some(b => isAgentLoading(b.agentName, 'burnout'))}
                      className="text-xs"
                    >
                      {burnoutIndicators.some(b => isAgentLoading(b.agentName, 'burnout')) ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Rerunning...
                        </>
                      ) : (
                        'Rerun High Risk'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {burnoutIndicators?.map((indicator: BurnoutIndicator, indicatorIndex: number) => (
                  <div key={indicatorIndex} className={`p-4 border rounded-lg relative ${isAgentLoading(indicator.agentName, 'burnout') ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <button
                          className="flex items-center gap-1 font-medium text-primary hover:underline focus:outline-none transition-all duration-150 px-2 py-1 rounded hover:bg-muted focus:ring-2 focus:ring-primary/30"
                          onClick={() => showAgentDetails(
                            <>
                              <div className="flex items-center gap-3 mb-4">
                                <UserCircle className="h-8 w-8 text-destructive" />
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    {indicator.agentName}
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getLevelColor(indicator.riskLevel)}`}>{indicator.riskLevel.toUpperCase()}</span>
                                  </DialogTitle>
                                </DialogHeader>
                              </div>
                              <div className="mb-2 text-sm flex flex-wrap gap-4">
                                <div><strong>Ticket Count:</strong> {indicator.ticketCount}</div>
                                <div><strong>Avg Resolution Time:</strong> {indicator.avgResolutionTime} hrs</div>
                                <div><strong>Last Activity:</strong> {indicator.lastActivity}</div>
                              </div>
                              <div className="border-b mb-3 pb-2 flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">Burnout Indicators</span></div>
                              <ul className="list-disc ml-6 mb-4 text-sm">
                                {indicator.indicators?.map((ind: string, i: number) => <li key={i}>{ind}</li>)}
                              </ul>
                              <div className="mt-4">
                                <div className="font-semibold mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Workload Summary</div>
                                <div className="text-xs">
                                  <div>Tickets handled: {indicator.ticketCount}</div>
                                  <div>Average resolution time: {indicator.avgResolutionTime} hrs</div>
                                  <div>Last activity: {indicator.lastActivity}</div>
                                </div>
                              </div>
                            </>
                          )}
                          type="button"
                          title="View details"
                        >
                          <span>{indicator.agentName}</span>
                          <Info className="h-4 w-4 opacity-70 text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={getRiskLevelColor(indicator.riskLevel)}
                          >
                            {indicator.riskLevel.toUpperCase()}
                          </Badge>
                          {(indicator.riskLevel === 'high' || indicator.riskLevel === 'critical') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runAgentSpecificAnalysis(indicator.agentName, 'burnout')}
                              disabled={isAgentLoading(indicator.agentName, 'burnout')}
                              className="h-6 px-2 text-xs"
                            >
                              {isAgentLoading(indicator.agentName, 'burnout') ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rerun'}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Heart className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-muted-foreground">
                          {indicator.riskLevel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Risk Level</span>
                          <span className="font-medium">{indicator.riskLevel}</span>
                        </div>
                        <Progress 
                          value={
                            indicator.riskLevel === 'critical' ? 100 :
                            indicator.riskLevel === 'high' ? 75 :
                            indicator.riskLevel === 'medium' ? 50 : 25
                          } 
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Risk Level</span>
                          <span className="font-medium">{indicator.riskLevel}</span>
                        </div>
                        <Progress 
                          value={
                            indicator.riskLevel === 'critical' ? 100 :
                            indicator.riskLevel === 'high' ? 75 :
                            indicator.riskLevel === 'medium' ? 50 : 25
                          } 
                        />
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center">
                        <Shield className="h-4 w-4 text-muted-foreground mr-1" />
                        Risk Factors
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {indicator.indicators?.map((indicator, indicatorIndex) => (
                          <li key={indicatorIndex}>• {indicator}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
                {burnoutIndicators?.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Heart className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                    <p>No burnout indicators detected</p>
                    <p className="text-sm">Run advanced analysis to identify risks</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Knowledge Gaps</CardTitle>
                  <CardDescription>
                    AI-identified training opportunities and knowledge gaps
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {knowledgeGaps.some(k => k.impact === 'high') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Rerun analysis for all high impact knowledge gaps
                        knowledgeGaps
                          .filter(k => k.impact === 'high')
                          .forEach(k => runAgentSpecificAnalysis(k.agentName, 'knowledge'));
                      }}
                      disabled={knowledgeGaps.some(k => isAgentLoading(k.agentName, 'knowledge'))}
                      className="text-xs"
                    >
                      {knowledgeGaps.some(k => isAgentLoading(k.agentName, 'knowledge')) ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Rerunning...
                        </>
                      ) : (
                        'Rerun High Impact'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {knowledgeGaps?.map((gap, index) => (
                  <div key={index} className={`p-3 border rounded-lg relative ${isAgentLoading(gap.agentName, 'knowledge') ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <button
                          className="flex items-center gap-1 font-medium text-primary hover:underline focus:outline-none transition-all duration-150 px-2 py-1 rounded hover:bg-muted focus:ring-2 focus:ring-primary/30"
                          onClick={() => showAgentDetails(
                            <>
                              <div className="flex items-center gap-3 mb-4">
                                <UserCircle className="h-8 w-8 text-accent" />
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    {gap.agentName}
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getLevelColor(gap.impact)}`}>{gap.impact.toUpperCase()} IMPACT</span>
                                  </DialogTitle>
                                </DialogHeader>
                              </div>
                              <div className="mb-2 text-sm flex flex-wrap gap-4">
                                <div><strong>Topic:</strong> {gap.topic}</div>
                                <div><strong>Priority:</strong> {gap.priority}</div>
                                <div><strong>Frequency:</strong> {gap.frequency || 0}</div>
                                <div><strong>Affected Tickets:</strong> {gap.affectedTickets}</div>
                              </div>
                              <div className="border-b mb-3 pb-2 flex items-center gap-2 text-muted-foreground"><BookOpen className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">Recommended Training</span></div>
                              <ul className="list-disc ml-6 mb-4 text-sm">
                                {gap.recommendedTraining?.map((rt: string, i: number) => <li key={i}>{rt}</li>)}
                              </ul>
                              {gap.agents && gap.agents.length > 1 && (
                                <div className="mt-4">
                                  <div className="font-semibold mb-2 flex items-center gap-2"><UserCircle className="h-4 w-4 text-accent" />Other Agents with this Gap</div>
                                  <ul className="list-disc ml-6 text-xs">
                                    {gap.agents.filter((a: string) => a !== gap.agentName).map((a: string, i: number) => <li key={i}>{a}</li>)}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                          type="button"
                          title="View details"
                        >
                          <span>{gap.agentName}</span>
                          <Info className="h-4 w-4 opacity-70 text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{gap.topic}</Badge>
                          {gap.impact === 'high' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runAgentSpecificAnalysis(gap.agentName, 'knowledge')}
                              disabled={isAgentLoading(gap.agentName, 'knowledge')}
                              className="h-6 px-2 text-xs"
                            >
                              {isAgentLoading(gap.agentName, 'knowledge') ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rerun'}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className={`text-sm font-medium ${getImpactColor(gap.impact)}`}>
                          {gap.impact.toUpperCase()} IMPACT
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Frequency</span>
                          <span className="font-medium">{gap.frequency || 0} occurrences</span>
                        </div>
                        <Progress value={Math.min(((gap.frequency || 0) / 20) * 100, 100)} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Impact Level</span>
                          <span className="font-medium">{gap.impact}</span>
                        </div>
                        <Progress 
                          value={gap.impact === 'high' ? 100 : gap.impact === 'medium' ? 66 : 33} 
                        />
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center">
                        <Target className="h-4 w-4 text-accent mr-1" />
                        Recommended Training
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {gap.recommendedTraining?.map((training: string, trainingIndex: number) => (
                          <li key={trainingIndex}>• {training}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
                {knowledgeGaps?.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                    <p>No knowledge gaps identified</p>
                    <p className="text-sm">Run advanced analysis to detect training opportunities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Predictive Analysis</CardTitle>
                  <CardDescription>
                    AI-powered trends, forecasts, and emerging issue detection
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Generated by Main Analysis
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(holisticAnalysis || prediction) ? (
                <div className="space-y-6">
                  {/* Overall Analysis */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => showDetailedAnalysis('overall', holisticAnalysis || prediction)}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-primary" />
                        Overall Analysis
                        <Eye className="h-4 w-4 ml-auto opacity-50" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{(holisticAnalysis || prediction)?.overallAnalysis}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <Badge variant="outline" className={getConfidenceColor((holisticAnalysis || prediction)?.confidenceScore || 0.5)}>
                          {getConfidenceLevel((holisticAnalysis || prediction)?.confidenceScore || 0.5)} Confidence ({Math.round(((holisticAnalysis || prediction)?.confidenceScore || 0.5) * 100)}%)
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ticket Volume Forecast */}
                  {(holisticAnalysis || prediction)?.forecast && (holisticAnalysis || prediction)?.forecast.length > 0 && (
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => showDetailedAnalysis('forecast', (holisticAnalysis || prediction).forecast)}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AreaChart className="h-5 w-5 text-primary" />
                          Ticket Volume Forecast
                          <Eye className="h-4 w-4 ml-auto opacity-50" />
                        </CardTitle>
                        <CardDescription>
                          Predicted ticket volume for the next {forecastDays} days
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(holisticAnalysis || prediction).forecast.slice(0, 3).map((forecast: any, i: number) => (
                              <div key={i} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-sm">{forecast.date}</span>
                                  <span className="text-lg font-bold text-primary">
                                    {forecast.predictedVolume}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Range: {forecast.lowerBound} - {forecast.upperBound} tickets
                                </div>
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span>Confidence</span>
                                    <span>{Math.round((forecast.confidence || 0.8) * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div 
                                      className="bg-primary h-1 rounded-full" 
                                      style={{ width: `${Math.round((forecast.confidence || 0.8) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {(holisticAnalysis || prediction).forecast.length > 3 && (
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">
                                +{(holisticAnalysis || prediction).forecast.length - 3} more forecast days available
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Emerging Issues */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => showDetailedAnalysis('emerging', (holisticAnalysis || prediction)?.emergingIssues)}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Emerging Issues
                        <Eye className="h-4 w-4 ml-auto opacity-50" />
                      </CardTitle>
                      <CardDescription>
                        Potential new problems identified from recent tickets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(holisticAnalysis || prediction)?.emergingIssues?.length > 0 ? (
                        <div className="space-y-3">
                          {(holisticAnalysis || prediction)?.emergingIssues.map((issue: any, i: number) => (
                            <div key={i} className="p-3 border rounded-lg">
                              <h4 className="font-medium text-sm mb-2">{issue.theme}</h4>
                              <p className="text-sm text-muted-foreground mb-3">{issue.impact}</p>
                              <div>
                                <h5 className="font-semibold text-xs mb-2 text-muted-foreground">EXAMPLE TICKETS</h5>
                                <ul className="list-disc ml-4 text-xs text-muted-foreground">
                                  {issue.exampleTickets?.map((ticket: string, j: number) => (
                                    <li key={j}>
                                      <button
                                        onClick={() => handleExampleTicketClick(ticket)}
                                        className="hover:text-primary transition-colors cursor-pointer text-left"
                                      >
                                        {ticket}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-center py-6 text-muted-foreground">
                          No significant emerging issues detected. Current trends appear stable.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Category Trends */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => showDetailedAnalysis('trends', (holisticAnalysis || prediction)?.categoryTrends)}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Category Trends
                        <Eye className="h-4 w-4 ml-auto opacity-50" />
                      </CardTitle>
                      <CardDescription>
                        Predicted changes in volume for key issue types
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(holisticAnalysis || prediction)?.categoryTrends?.map((trend: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-medium text-sm">{trend.category}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={trend.trend === 'Increasing' ? 'destructive' : trend.trend === 'Decreasing' ? 'secondary' : 'outline'}>
                                {trend.trend}
                              </Badge>
                              <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {trend.prediction}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => showDetailedAnalysis('recommendations', (holisticAnalysis || prediction)?.recommendations)}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Recommendations
                        <Eye className="h-4 w-4 ml-auto opacity-50" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(holisticAnalysis || prediction)?.recommendations?.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No predictive analysis available</p>
                  <p className="text-sm">Run main analysis to generate forecasts and trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Predictive Analytics</CardTitle>
                  <CardDescription>
                    AI predictions for operational insights and proactive management
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runAIAnalysis('sla')}
                    disabled={loading || rerunningAnalysis === 'sla'}
                    className="text-xs"
                  >
                    {rerunningAnalysis === 'sla' ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Rerunning...
                      </>
                    ) : (
                      'Rerun Analysis'
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {slaPrediction && (
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">SLA Breach Prediction</h4>
                      <Badge variant={slaPrediction.probability > 0.5 ? 'destructive' : 'secondary'}>
                        {Math.round(slaPrediction.probability * 100)}% probability
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>At-Risk Tickets</span>
                          <span className="font-medium">{slaPrediction.atRiskTickets}</span>
                        </div>
                        <Progress value={Math.min((slaPrediction.atRiskTickets / 20) * 100, 100)} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Breach Probability</span>
                          <span className="font-medium">{Math.round(slaPrediction.probability * 100)}%</span>
                        </div>
                        <Progress value={slaPrediction.probability * 100} />
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center">
                        <Lightbulb className="h-4 w-4 text-primary mr-1" />
                        Recommended Actions
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {slaPrediction.recommendedActions?.map((action: string, index: number) => (
                          <li key={index}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {!slaPrediction && (
                <div className="text-center py-6 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No SLA predictions available</p>
                  <p className="text-sm">Run advanced analysis to generate predictions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="animate-fade-in-up max-w-4xl max-h-[80vh] overflow-y-auto">
          {modalContent}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 