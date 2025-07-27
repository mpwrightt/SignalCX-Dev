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

      <TabsContent value="performance" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Performance Forecasts */}
          <PerformanceForecastsTab
            performanceForecasts={performanceForecasts}
            sessionMode={sessionMode}
            tickets={tickets}
            isAgentLoading={isAgentLoading}
            runAgentSpecificAnalysis={runAgentSpecificAnalysis || (() => {})}
            showAgentDetails={showAgentDetails}
          />
          
          {/* SLA Breach Risk */}
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
                  <div className="p-4 border rounded-lg bg-card">
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
                  <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
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
        </div>
      </TabsContent>

      <TabsContent value="risk" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Burnout Indicators */}
          <BurnoutIndicatorsTab
            burnoutIndicators={burnoutIndicators}
            isAgentLoading={isAgentLoading}
            runAgentSpecificAnalysis={runAgentSpecificAnalysis || (() => {})}
            showAgentDetails={showAgentDetails}
          />
          
          {/* Knowledge Gaps */}
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
                  <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
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
        </div>
      </TabsContent>

      <TabsContent value="insights" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              Strategic Insights
            </CardTitle>
            <CardDescription>
              Comprehensive system-wide insights and AI-powered recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holisticAnalysis && (
                <>
                  <div className="p-4 border rounded-lg bg-card">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Overall Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {holisticAnalysis.overallAnalysis}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-card">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Agent Triage Summary
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {holisticAnalysis.agentTriageSummary}
                    </p>
                  </div>
                  
                  {holisticAnalysis.confidenceScore && (
                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Confidence Score
                      </h4>
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
                  
                  {/* Strategic Recommendations */}
                  <div className="p-4 border rounded-lg bg-card">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Strategic Recommendations
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <p className="text-sm">Focus on high-risk agents identified in burnout analysis</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <p className="text-sm">Implement targeted training for critical knowledge gaps</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <p className="text-sm">Monitor SLA breach predictions and allocate resources accordingly</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {!holisticAnalysis && (
                <div className="text-center py-8 text-muted-foreground">
                  <BrainCircuit className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No strategic insights available</p>
                  <p className="text-xs mt-2">Run advanced analytics to generate insights</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 