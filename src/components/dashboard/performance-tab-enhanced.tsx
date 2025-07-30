
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { PerformanceForecastsTab } from './performance-forecasts-tab';

interface PerformanceTabEnhancedProps {
  performanceForecasts: any[];
  slaPrediction: any;
  getConfidenceColor: (confidence: number) => string;
  isAgentLoading: (agentName: string, analysisType: string) => boolean;
  runAgentSpecificAnalysis?: (agentName: string, analysisType: 'performance' | 'burnout' | 'knowledge') => void;
  showAgentDetails: (content: React.ReactNode) => void;
  sessionMode?: string;
  tickets?: any[];
}

export function PerformanceTabEnhanced({
  performanceForecasts,
  slaPrediction,
  getConfidenceColor,
  isAgentLoading,
  runAgentSpecificAnalysis,
  showAgentDetails,
  sessionMode,
  tickets,
}: PerformanceTabEnhancedProps) {
  return (
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
  );
}
