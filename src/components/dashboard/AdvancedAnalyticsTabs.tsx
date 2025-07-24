import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, Heart, BarChart3, Shield, BrainCircuit, TrendingUp, Eye, Lightbulb, Info, UserCircle } from 'lucide-react';
import { BurnoutIndicatorsTab } from './burnout-indicators-tab';
import { PerformanceForecastsTab } from './performance-forecasts-tab';

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
  loading,
  elapsed,
  getRiskLevelColor,
  getImpactColor,
  getConfidenceLevel,
  getConfidenceColor,
  getLevelColor,
  showDetailedAnalysis,
  isAgentLoading,
  agentAnalysisResult,
  agentReasoning,
  agentToolCalls,
  sessionMode = 'demo',
  tickets = [],
  runAgentSpecificAnalysis
}: AdvancedAnalyticsTabsProps) {
  
  const showAgentDetails = (content: React.ReactNode) => {
    showDetailedAnalysis('Agent Details', content);
  };

  return (
    <Tabs defaultValue="performance" className="space-y-3">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="performance" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Performance
        </TabsTrigger>
        <TabsTrigger value="burnout" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Burnout
        </TabsTrigger>
        <TabsTrigger value="knowledge" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Knowledge
        </TabsTrigger>
        <TabsTrigger value="sla" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          SLA Risk
        </TabsTrigger>
        <TabsTrigger value="holistic" className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4" />
          Holistic
        </TabsTrigger>
      </TabsList>

      <TabsContent value="performance" className="space-y-4">
        <PerformanceForecastsTab
          performanceForecasts={performanceForecasts}
          sessionMode={sessionMode}
          tickets={tickets}
          isAgentLoading={isAgentLoading}
          runAgentSpecificAnalysis={runAgentSpecificAnalysis || (() => {})}
          showAgentDetails={showAgentDetails}
        />
      </TabsContent>

      <TabsContent value="burnout" className="space-y-4">
        <BurnoutIndicatorsTab
          burnoutIndicators={burnoutIndicators}
          isAgentLoading={isAgentLoading}
          runAgentSpecificAnalysis={runAgentSpecificAnalysis || (() => {})}
          showAgentDetails={showAgentDetails}
        />
      </TabsContent>

      <TabsContent value="knowledge" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Knowledge Gaps
            </CardTitle>
            <CardDescription>
              AI-identified training and knowledge gaps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {knowledgeGaps?.map((gap: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{gap.topic}</h4>
                    <Badge className={getLevelColor(gap.priority)}>
                      {gap.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {gap.affectedTickets} tickets affected • {gap.agents?.join(', ')}
                  </p>
                  <p className="text-sm mb-2">{gap.impact} impact</p>
                  {gap.recommendedTraining && (
                    <div className="flex flex-wrap gap-1">
                      {gap.recommendedTraining.map((training: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {training}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {(!knowledgeGaps || knowledgeGaps.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No knowledge gaps identified</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sla" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SLA Breach Risk
            </CardTitle>
            <CardDescription>
              Predicted SLA breaches and risk analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slaPrediction && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Overall Risk</h4>
                    <Badge className={getConfidenceColor(slaPrediction.probability || 0)}>
                      {Math.round((slaPrediction.probability || 0) * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {slaPrediction.predictedBreaches?.length || 0} tickets at risk of SLA breach
                  </p>
                </div>
              )}
              
              {slaPrediction?.predictedBreaches?.map((breach: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Ticket #{breach.ticketId}</h4>
                    <Badge variant="destructive">High Risk</Badge>
                  </div>
                  <p className="text-sm mb-2">{breach.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    Predicted breach: {breach.predictedBreachTime}
                  </p>
                  <p className="text-xs text-muted-foreground">{breach.reason}</p>
                </div>
              ))}
              
              {(!slaPrediction || !slaPrediction.predictedBreaches || slaPrediction.predictedBreaches.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No SLA breaches predicted</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="holistic" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              Holistic Analysis
            </CardTitle>
            <CardDescription>
              Comprehensive system-wide insights and predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holisticAnalysis && (
                <>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Overall Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {holisticAnalysis.overallAnalysis}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Agent Triage Summary</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {holisticAnalysis.agentTriageSummary}
                    </p>
                  </div>
                  
                  {holisticAnalysis.confidenceScore && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Confidence Score</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getConfidenceColor(holisticAnalysis.confidenceScore)}>
                          {Math.round(holisticAnalysis.confidenceScore * 100)}%
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {getConfidenceLevel(holisticAnalysis.confidenceScore)} confidence
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {!holisticAnalysis && (
                <div className="text-center py-8 text-muted-foreground">
                  <BrainCircuit className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No holistic analysis available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 