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
import type { BurnoutIndicator, KnowledgeGap } from "@/lib/types";

// Local interface for performance forecasts that matches the tabs component
interface PerformanceForecast {
  agentName: string;
  confidence: number;
  predictedTicketsNextWeek: number;
  predictedCsatNextWeek: number;
  riskFactors?: string[];
  recommendations?: string[];
  recentTickets?: any[];
}
import { getPerformanceForecasts } from "@/ai/flows/get-performance-forecasts";
import { getBurnoutIndicators } from "@/ai/flows/get-burnout-indicators";
import { getKnowledgeGaps } from "@/ai/flows/get-knowledge-gaps";
import { 
  generateMockPerformanceForecasts, 
  generateMockBurnoutIndicators, 
  generateMockKnowledgeGaps, 
  generateMockSlaPrediction, 
  generateMockHolisticAnalysis 
} from "@/lib/mock-data";
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
import {
  ADVANCED_ANALYTICS_CACHE_KEY,
  CACHE_TTL_MS,
  ELAPSED_TIMER_KEY,
  CONFIDENCE_THRESHOLDS,
  shouldRerun,
  getConfidenceLevel,
  getConfidenceColor,
  computeAnalyticsCacheKey,
  getCachedAnalyticsForKey,
  setCachedAnalyticsForKey,
  getLevelColor
} from './advanced-analytics-utils';
import { runAIAnalysis, runMultiAgentAnalysis, runAgentSpecificAnalysis } from './advanced-analytics-logic';
import { AdvancedAnalyticsHeader } from './AdvancedAnalyticsHeader';
import { AdvancedAnalyticsSkeleton } from './AdvancedAnalyticsSkeleton';
import { AdvancedAnalyticsTabs } from './AdvancedAnalyticsTabs';
import { AdvancedAnalyticsModal } from './AdvancedAnalyticsModal';
import { AdvancedAnalyticsSummaryCards } from './AdvancedAnalyticsSummaryCards';

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
  const { settings, updateSettings } = useSettings();
  
  // State management
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = React.useState<'standard' | 'agentic'>('standard');
  const [rerunningAnalysis, setRerunningAnalysis] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [storedStartTime, setStoredStartTime] = React.useState<number | null>(null);
  const [cacheInitialized, setCacheInitialized] = React.useState(false);
  
  // Analytics state
  const [performanceForecasts, setPerformanceForecasts] = React.useState<PerformanceForecast[]>([]);
  const [burnoutIndicators, setBurnoutIndicators] = React.useState<BurnoutIndicator[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = React.useState<KnowledgeGap[]>([]);
  const [slaPrediction, setSlaPrediction] = React.useState<any>(null);
  const [holisticAnalysis, setHolisticAnalysis] = React.useState<any>(null);
  
  // Agent analysis state
  const [agentAnalysisResult, setAgentAnalysisResult] = React.useState<any>(null);
  const [agentReasoning, setAgentReasoning] = React.useState<string>('');
  const [agentToolCalls, setAgentToolCalls] = React.useState<any[]>([]);
  const [agentLoadingStates, setAgentLoadingStates] = React.useState<Record<string, boolean>>({});
  
  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState<React.ReactNode>(null);
  
  // Preprocessed data
  const [preprocessedData, setPreprocessedData] = React.useState<ProcessedAnalyticsData | null>(null);
  
  // Settings state
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);
  
  // Function to find ticket by subject
  const findTicketBySubject = (ticketSubject: string) => {
    const ticket = tickets.find(t => t.subject === ticketSubject || t.subject.includes(ticketSubject));
    return ticket;
  };

  const handleExampleTicketClick = (ticketSubject: string) => {
    const ticket = findTicketBySubject(ticketSubject);
    if (ticket && onTicketSelect) {
      onTicketSelect({ ticket });
    }
  };

  // Timer management
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && loading) {
      interval = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, loading]);

  // Cache initialization
  React.useEffect(() => {
    if (!cacheInitialized && tickets.length > 0) {
      const cacheKey = computeAnalyticsCacheKey(tickets, analysisMode);
      const cached = getCachedAnalyticsForKey(cacheKey);
      if (cached) {
        setPerformanceForecasts(cached.performanceForecasts || []);
        setBurnoutIndicators(cached.burnoutIndicators || []);
        setKnowledgeGaps(cached.knowledgeGaps || []);
        setSlaPrediction(cached.slaPrediction || null);
        setHolisticAnalysis(cached.holisticAnalysis || null);
        setElapsed(cached.elapsed || 0);
      }
      setCacheInitialized(true);
    }
  }, [tickets, analysisMode, cacheInitialized]);

  // Settings loading
  React.useEffect(() => {
    if (settings && !settingsLoaded) {
      setSettingsLoaded(true);
    }
  }, [settings, settingsLoaded]);

  // Process prediction data and update individual state variables
  React.useEffect(() => {
    if (prediction) {
      console.log('Processing prediction data for Advanced Analytics:', prediction);
      
      // Extract performance forecasts
      if (prediction.forecast) {
        setPerformanceForecasts(prediction.forecast);
      }
      
      // Extract burnout indicators
      if (prediction.burnoutIndicators) {
        setBurnoutIndicators(prediction.burnoutIndicators);
      }
      
      // Extract knowledge gaps
      if (prediction.knowledgeGaps) {
        setKnowledgeGaps(prediction.knowledgeGaps);
      }
      
      // Extract SLA prediction
      if (prediction.predictedSlaBreaches) {
        setSlaPrediction({
          probability: prediction.predictedSlaBreaches.length > 0 ? 0.3 : 0.1,
          predictedBreaches: prediction.predictedSlaBreaches
        });
      }
      
      // Extract holistic analysis
      if (prediction.overallAnalysis || prediction.agentTriageSummary) {
        setHolisticAnalysis({
          overallAnalysis: prediction.overallAnalysis,
          agentTriageSummary: prediction.agentTriageSummary,
          confidenceScore: prediction.confidenceScore || 0.8
        });
      }
    }
  }, [prediction]);

  // Add fallback mock data when no real data is available
  React.useEffect(() => {
    if (!loading && tickets.length > 0) {
      // Only add fallback data if we don't have real data
      if (performanceForecasts.length === 0) {
        const mockForecasts = generateMockPerformanceForecasts(tickets);
        // Convert to the expected type structure for the tabs
        const convertedForecasts = mockForecasts.map((forecast: any) => ({
          agentName: forecast.agentName,
          confidence: forecast.confidence,
          predictedTicketsNextWeek: forecast.predictedTicketsNextWeek,
          predictedCsatNextWeek: forecast.predictedCsatNextWeek,
          riskFactors: forecast.riskFactors,
          recommendations: forecast.recommendations,
          recentTickets: forecast.recentTickets,
        }));
        setPerformanceForecasts(convertedForecasts);
        console.log('Using mock performance forecasts:', convertedForecasts);
      }
      
      if (burnoutIndicators.length === 0) {
        const mockBurnout = generateMockBurnoutIndicators(tickets);
        setBurnoutIndicators(mockBurnout);
        console.log('Using mock burnout indicators:', mockBurnout);
      }
      
      if (knowledgeGaps.length === 0) {
        const mockGaps = generateMockKnowledgeGaps(tickets);
        setKnowledgeGaps(mockGaps);
        console.log('Using mock knowledge gaps:', mockGaps);
      }
      
      if (!slaPrediction) {
        const mockSla = generateMockSlaPrediction(tickets);
        setSlaPrediction(mockSla);
        console.log('Using mock SLA prediction:', mockSla);
      }
      
      if (!holisticAnalysis) {
        const mockHolistic = generateMockHolisticAnalysis(tickets);
        setHolisticAnalysis(mockHolistic);
        console.log('Using mock holistic analysis:', mockHolistic);
      }
    }
  }, [loading, tickets, performanceForecasts.length, burnoutIndicators.length, knowledgeGaps.length, slaPrediction, holisticAnalysis]);

  // Load additional analytics data from cache
  React.useEffect(() => {
    try {
      const analyticsData = localStorage.getItem('signalcx-analytics-data');
      if (analyticsData) {
        const data = JSON.parse(analyticsData);
        console.log('Loading additional analytics data from cache:', data);
        
        if (data.burnoutIndicators) {
          setBurnoutIndicators(data.burnoutIndicators);
        }
        
        if (data.knowledgeGaps) {
          setKnowledgeGaps(data.knowledgeGaps);
        }
      }
    } catch (error) {
      console.error('Error loading analytics data from cache:', error);
    }
  }, []);

  // Helper functions
  const isAgentLoading = (agentName: string, analysisType: string) => {
    return agentLoadingStates[`${agentName}-${analysisType}`] || false;
  };

  const showDetailedAnalysis = (type: string, data: any) => {
    setModalContent(
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{type} Analysis</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
    setModalOpen(true);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Loading state
  if (loading && !performanceForecasts.length && !burnoutIndicators.length) {
    return <AdvancedAnalyticsSkeleton elapsed={elapsed} ticketsLength={tickets.length} />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Analysis Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => setError(null)}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <AdvancedAnalyticsHeader
        sessionMode={sessionMode}
        tickets={tickets}
        historicalVolume={historicalVolume}
        forecastDays={forecastDays}
        prediction={prediction}
        onTicketSelect={onTicketSelect}
        analysisMode={analysisMode}
        setAnalysisMode={setAnalysisMode}
        settings={settings}
        updateSettings={updateSettings}
        settingsLoaded={settingsLoaded}
        runAIAnalysis={runAIAnalysis}
        runMultiAgentAnalysis={runMultiAgentAnalysis}
        runAgentSpecificAnalysis={runAgentSpecificAnalysis}
        isAgentLoading={isAgentLoading}
        showDetailedAnalysis={showDetailedAnalysis}
        setSelectedToolDetails={() => {}}
        setAgentLoadingStates={setAgentLoadingStates}
        preprocessedData={preprocessedData}
        setPreprocessedData={setPreprocessedData}
        setModalOpen={setModalOpen}
        setModalContent={setModalContent}
        setAgentAnalysisResult={setAgentAnalysisResult}
        setAgentReasoning={setAgentReasoning}
        setAgentToolCalls={setAgentToolCalls}
        setPerformanceForecasts={setPerformanceForecasts}
        setBurnoutIndicators={setBurnoutIndicators}
        setKnowledgeGaps={setKnowledgeGaps}
        setSlaPrediction={setSlaPrediction}
        setHolisticAnalysis={setHolisticAnalysis}
        setLoading={setLoading}
        setError={setError}
        setRerunningAnalysis={setRerunningAnalysis}
        setElapsed={setElapsed}
        setStartTime={setStartTime}
        setStoredStartTime={setStoredStartTime}
        setCacheInitialized={setCacheInitialized}
        logEvent={logEvent}
        toast={toast}
        loading={loading}
        setCachedAnalyticsForKey={setCachedAnalyticsForKey}
        cacheKey={computeAnalyticsCacheKey(tickets, sessionMode)}
        AnalyticsCache={AnalyticsCache}
        AnalyticsPreprocessor={AnalyticsPreprocessor}
        aiFlowOptimizer={aiFlowOptimizer}
      />

      <AdvancedAnalyticsSummaryCards
        performanceForecasts={performanceForecasts}
        burnoutIndicators={burnoutIndicators}
        knowledgeGaps={knowledgeGaps}
        slaPrediction={slaPrediction}
        holisticAnalysis={holisticAnalysis}
        loading={loading}
        elapsed={elapsed}
        getRiskLevelColor={getRiskLevelColor}
        getImpactColor={getImpactColor}
        getConfidenceLevel={getConfidenceLevel}
        getConfidenceColor={getConfidenceColor}
        getLevelColor={getLevelColor}
      />

      <AdvancedAnalyticsTabs
        performanceForecasts={performanceForecasts}
        burnoutIndicators={burnoutIndicators}
        knowledgeGaps={knowledgeGaps}
        slaPrediction={slaPrediction}
        holisticAnalysis={holisticAnalysis}
        loading={loading}
        elapsed={elapsed}
        getRiskLevelColor={getRiskLevelColor}
        getImpactColor={getImpactColor}
        getConfidenceLevel={getConfidenceLevel}
        getConfidenceColor={getConfidenceColor}
        getLevelColor={getLevelColor}
        showDetailedAnalysis={showDetailedAnalysis}
        isAgentLoading={isAgentLoading}
        agentAnalysisResult={agentAnalysisResult}
        agentReasoning={agentReasoning}
        agentToolCalls={agentToolCalls}
        sessionMode={sessionMode}
        tickets={tickets}
        runAgentSpecificAnalysis={runAgentSpecificAnalysis}
      />

      <AdvancedAnalyticsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        content={modalContent}
      />
    </div>
  );
};