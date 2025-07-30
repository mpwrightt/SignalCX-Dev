import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Heart, BrainCircuit } from 'lucide-react';
import { PerformanceTabEnhanced } from './performance-tab-enhanced';
import { RiskTabEnhanced } from './risk-tab-enhanced';
import { InsightsTabEnhanced } from './insights-tab-enhanced';

interface AdvancedAnalyticsTabsProps {
  performanceForecasts: any[];
  burnoutIndicators: any[];
  knowledgeGaps: any[];
  slaPrediction: any;
  holisticAnalysis: any;
  loading: boolean;
  elapsed: number;
  getRiskLevelColor: (level: string) => string;
  getImpactColor: (impact: string) => string;
  getConfidenceLevel: (confidence: number) => string;
  getConfidenceColor: (confidence: number) => string;
  getLevelColor: (level: string) => string;
  showDetailedAnalysis: (type: string, data: any) => void;
  isAgentLoading: (agentName: string, analysisType: string) => boolean;
  agentAnalysisResult: any;
  agentReasoning: string;
  agentToolCalls: any[];
  sessionMode?: string;
  tickets?: any[];
  runAgentSpecificAnalysis?: (agentName: string, analysisType: 'performance' | 'burnout' | 'knowledge') => void;
}

export function AdvancedAnalyticsTabs({
  performanceForecasts,
  burnoutIndicators,
  knowledgeGaps,
  slaPrediction,
  holisticAnalysis,
  getConfidenceColor,
  getConfidenceLevel,
  getLevelColor,
  isAgentLoading,
  runAgentSpecificAnalysis,
  showDetailedAnalysis,
  sessionMode,
  tickets,
}: AdvancedAnalyticsTabsProps) {
  
  const showAgentDetails = (content: React.ReactNode) => {
    showDetailedAnalysis('Agent Details', content);
  };

  return (
    <Tabs defaultValue="performance" className="space-y-3">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="performance" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Performance Overview
        </TabsTrigger>
        <TabsTrigger value="risk" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Risk Analysis
        </TabsTrigger>
        <TabsTrigger value="insights" className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4" />
          Strategic Insights
        </TabsTrigger>
      </TabsList>

      <TabsContent value="performance">
        <PerformanceTabEnhanced
          performanceForecasts={performanceForecasts}
          slaPrediction={slaPrediction}
          getConfidenceColor={getConfidenceColor}
          isAgentLoading={isAgentLoading}
          runAgentSpecificAnalysis={runAgentSpecificAnalysis}
          showAgentDetails={showAgentDetails}
          sessionMode={sessionMode}
          tickets={tickets}
        />
      </TabsContent>

      <TabsContent value="risk">
        <RiskTabEnhanced
          burnoutIndicators={burnoutIndicators}
          knowledgeGaps={knowledgeGaps}
          getLevelColor={getLevelColor}
          isAgentLoading={isAgentLoading}
          runAgentSpecificAnalysis={runAgentSpecificAnalysis}
          showAgentDetails={showAgentDetails}
        />
      </TabsContent>

      <TabsContent value="insights">
        <InsightsTabEnhanced
          holisticAnalysis={holisticAnalysis}
          getConfidenceColor={getConfidenceColor}
          getConfidenceLevel={getConfidenceLevel}
        />
      </TabsContent>
    </Tabs>
  );
}