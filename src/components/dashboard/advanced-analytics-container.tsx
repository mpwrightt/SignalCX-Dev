
'use client';

import * as React from "react";
import { useAnalyticsState } from './analytics-state-management';
import { useDrillDown } from './analytics-drill-down-logic';
import { useDataProcessing } from './analytics-data-processing';
import { AdvancedAnalyticsHeader } from './AdvancedAnalyticsHeader';
import { AdvancedAnalyticsSkeleton } from './AdvancedAnalyticsSkeleton';
import { AdvancedAnalyticsTabs } from './AdvancedAnalyticsTabs';
import { AdvancedAnalyticsModal } from './AdvancedAnalyticsModal';
import { AdvancedAnalyticsSummaryCards } from './AdvancedAnalyticsSummaryCards';
import { runAIAnalysis, runMultiAgentAnalysis, runAgentSpecificAnalysis } from './advanced-analytics-logic';
import { computeAnalyticsCacheKey, getCachedAnalyticsForKey, setCachedAnalyticsForKey, getConfidenceLevel, getConfidenceColor, getLevelColor } from './advanced-analytics-utils';
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { AnalyticsPreprocessor } from '@/lib/analytics-preprocessor';
import { aiFlowOptimizer } from '@/lib/ai-flow-optimizer';

export const AdvancedAnalyticsContainer = ({ 
  sessionMode = 'demo',
  tickets = [],
  historicalVolume = [],
  forecastDays = 14,
  prediction = null,
  onTicketSelect,
  performanceForecasts,
  burnoutIndicators,
  knowledgeGaps,
  slaPrediction,
  holisticAnalysis,
  setPerformanceForecasts,
  setBurnoutIndicators,
  setKnowledgeGaps,
  setSlaPrediction,
  setHolisticAnalysis,
}: { 
  sessionMode?: 'demo' | 'enterprise';
  tickets?: any[];
  historicalVolume?: { date: string; count: number }[];
  forecastDays?: number;
  prediction?: any;
  onTicketSelect?: (info: { ticket: any }) => void;
  performanceForecasts: any[];
  burnoutIndicators: any[];
  knowledgeGaps: any[];
  slaPrediction: any;
  holisticAnalysis: any;
  setPerformanceForecasts: (data: any) => void;
  setBurnoutIndicators: (data: any) => void;
  setKnowledgeGaps: (data: any) => void;
  setSlaPrediction: (data: any) => void;
  setHolisticAnalysis: (data: any) => void;
}) => {
  const state = useAnalyticsState({
    performanceForecasts,
    burnoutIndicators,
    knowledgeGaps,
    slaPrediction,
    holisticAnalysis,
    setPerformanceForecasts,
    setBurnoutIndicators,
    setKnowledgeGaps,
    setSlaPrediction,
    setHolisticAnalysis,
  });
  const { navigateTo, navigateBack, resetToOverview, handleMetricClick, handleChartInteraction } = useDrillDown(state.setDrillDown);
  const { formatMetricValue, getTrendIcon, getTrendColor } = useDataProcessing();
  const { logEvent } = useDiagnostics();
  const { toast } = useToast();
  const { settings, updateSettings } = useSettings();

  // Loading state
  if (state.loading && !state.performanceForecasts.length && !state.burnoutIndicators.length) {
    return <AdvancedAnalyticsSkeleton elapsed={state.elapsed} ticketsLength={tickets.length} />;
  }

  // Error state
  if (state.error) {
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
            <p className="text-red-600">{state.error}</p>
            <Button 
              onClick={() => state.setError(null)}
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
        analysisMode={state.analysisMode}
        setAnalysisMode={state.setAnalysisMode}
        settings={settings}
        updateSettings={updateSettings}
        settingsLoaded={state.settingsLoaded}
        runAIAnalysis={runAIAnalysis}
        runMultiAgentAnalysis={runMultiAgentAnalysis}
        runAgentSpecificAnalysis={runAgentSpecificAnalysis}
        isAgentLoading={state.isAgentLoading}
        showDetailedAnalysis={state.showDetailedAnalysis}
        setSelectedToolDetails={() => {}}
        setAgentLoadingStates={state.setAgentLoadingStates}
        preprocessedData={state.preprocessedData}
        setPreprocessedData={state.setPreprocessedData}
        setModalOpen={state.setModalOpen}
        setModalContent={state.setModalContent}
        setAgentAnalysisResult={state.setAgentAnalysisResult}
        setAgentReasoning={state.setAgentReasoning}
        setAgentToolCalls={state.setAgentToolCalls}
        setPerformanceForecasts={state.setPerformanceForecasts}
        setBurnoutIndicators={state.setBurnoutIndicators}
        setKnowledgeGaps={state.setKnowledgeGaps}
        setSlaPrediction={state.setSlaPrediction}
        setHolisticAnalysis={state.setHolisticAnalysis}
        setLoading={state.setLoading}
        setError={state.setError}
        setRerunningAnalysis={state.setRerunningAnalysis}
        setElapsed={state.setElapsed}
        setStartTime={state.setStartTime}
        setStoredStartTime={state.setStoredStartTime}
        setCacheInitialized={state.setCacheInitialized}
        logEvent={logEvent}
        toast={toast}
        loading={state.loading}
        setCachedAnalyticsForKey={setCachedAnalyticsForKey}
        cacheKey={computeAnalyticsCacheKey(tickets, sessionMode)}
        AnalyticsPreprocessor={AnalyticsPreprocessor}
        aiFlowOptimizer={aiFlowOptimizer}
      />

      <AdvancedAnalyticsSummaryCards
        performanceForecasts={state.performanceForecasts}
        burnoutIndicators={state.burnoutIndicators}
        knowledgeGaps={state.knowledgeGaps}
        slaPrediction={state.slaPrediction}
        holisticAnalysis={state.holisticAnalysis}
        loading={state.loading}
        elapsed={state.elapsed}
        getRiskLevelColor={state.getRiskLevelColor}
        getImpactColor={state.getImpactColor}
        getConfidenceLevel={getConfidenceLevel}
        getConfidenceColor={getConfidenceColor}
        getLevelColor={getLevelColor}
      />

      <AdvancedAnalyticsTabs
        performanceForecasts={state.performanceForecasts}
        burnoutIndicators={state.burnoutIndicators}
        knowledgeGaps={state.knowledgeGaps}
        slaPrediction={state.slaPrediction}
        holisticAnalysis={state.holisticAnalysis}
        loading={state.loading}
        elapsed={state.elapsed}
        getRiskLevelColor={state.getRiskLevelColor}
        getImpactColor={state.getImpactColor}
        getConfidenceLevel={getConfidenceLevel}
        getConfidenceColor={getConfidenceColor}
        getLevelColor={getLevelColor}
        showDetailedAnalysis={state.showDetailedAnalysis}
        isAgentLoading={state.isAgentLoading}
        agentAnalysisResult={state.agentAnalysisResult}
        agentReasoning={state.agentReasoning}
        agentToolCalls={state.agentToolCalls}
        sessionMode={sessionMode}
        tickets={tickets}
        runAgentSpecificAnalysis={runAgentSpecificAnalysis}
      />

      <AdvancedAnalyticsModal
        open={state.modalOpen}
        onOpenChange={state.setModalOpen}
        content={state.modalContent}
      />
    </div>
  );
};
