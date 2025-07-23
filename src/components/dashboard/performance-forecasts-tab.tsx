// Performance Forecasts Tab Component
// Extracted from advanced-analytics-view.tsx for better modularity

import React from 'react';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Target, 
  UserCircle, 
  AlertTriangle, 
  Lightbulb, 
  BarChart3, 
  Info, 
  Activity,
  Loader2 
} from "lucide-react";
import { shouldRerun, getConfidenceLevel, getConfidenceColor, getLevelColor } from "@/lib/advanced-analytics-cache";
import { AgentLoadingButton, LoadingOverlay } from "./analytics-loading-states";

interface PerformanceForecast {
  agentName: string;
  confidence: number;
  predictedTicketsNextWeek: number;
  predictedCsatNextWeek: number;
  riskFactors?: string[];
  recommendations?: string[];
  recentTickets?: any[];
}

interface PerformanceForecastsTabProps {
  performanceForecasts: PerformanceForecast[];
  sessionMode: string;
  tickets: any[];
  isAgentLoading: (agentName: string, analysisType: string) => boolean;
  runAgentSpecificAnalysis: (agentName: string, analysisType: 'performance' | 'burnout' | 'knowledge') => void;
  showAgentDetails: (content: React.ReactNode) => void;
}

export function PerformanceForecastsTab({
  performanceForecasts,
  sessionMode,
  tickets,
  isAgentLoading,
  runAgentSpecificAnalysis,
  showAgentDetails
}: PerformanceForecastsTabProps) {
  const handleRerunLowConfidence = () => {
    performanceForecasts
      .filter(f => shouldRerun(f.confidence))
      .forEach(f => runAgentSpecificAnalysis(f.agentName, 'performance'));
  };

  const isAnyAgentLoading = performanceForecasts.some(f => isAgentLoading(f.agentName, 'performance'));
  const hasLowConfidenceForecasts = performanceForecasts.some(f => shouldRerun(f.confidence));

  return (
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
            {hasLowConfidenceForecasts && (
              <AgentLoadingButton
                isLoading={isAnyAgentLoading}
                onClick={handleRerunLowConfidence}
                disabled={isAnyAgentLoading}
                size="sm"
                className="text-xs"
              >
                {isAnyAgentLoading ? 'Rerunning...' : 'Improve Low Confidence'}
              </AgentLoadingButton>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {performanceForecasts?.map((forecast, index) => (
            <LoadingOverlay
              key={index}
              isLoading={isAgentLoading(forecast.agentName, 'performance')}
            >
              <div className="p-3 border rounded-lg relative">
                <PerformanceForecastItem
                  forecast={forecast}
                  isLoading={isAgentLoading(forecast.agentName, 'performance')}
                  onRunAnalysis={() => runAgentSpecificAnalysis(forecast.agentName, 'performance')}
                  onShowDetails={() => showAgentDetails(
                    <PerformanceForecastDetails forecast={forecast} />
                  )}
                />
              </div>
            </LoadingOverlay>
          ))}
          
          {performanceForecasts.length === 0 && (
            <EmptyPerformanceForecastsState 
              sessionMode={sessionMode}
              hasTickets={tickets && tickets.length > 0}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PerformanceForecastItemProps {
  forecast: PerformanceForecast;
  isLoading: boolean;
  onRunAnalysis: () => void;
  onShowDetails: () => void;
}

function PerformanceForecastItem({
  forecast,
  isLoading,
  onRunAnalysis,
  onShowDetails
}: PerformanceForecastItemProps) {
  const shouldRerunForecast = shouldRerun(forecast.confidence);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button
            className="flex items-center gap-1 font-medium text-primary hover:underline focus:outline-none transition-all duration-150 px-2 py-1 rounded hover:bg-muted focus:ring-2 focus:ring-primary/30"
            onClick={onShowDetails}
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
            {shouldRerunForecast && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRunAnalysis}
                disabled={isLoading}
                className="h-6 px-2 text-xs"
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rerun'}
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
    </>
  );
}

interface PerformanceForecastDetailsProps {
  forecast: PerformanceForecast;
}

function PerformanceForecastDetails({ forecast }: PerformanceForecastDetailsProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <UserCircle className="h-8 w-8 text-primary" />
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {forecast.agentName}
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getLevelColor(forecast.confidence > 0.8 ? 'low' : forecast.confidence > 0.6 ? 'medium' : 'high')}`}>
              {Math.round(forecast.confidence * 100)}% confidence
            </span>
          </DialogTitle>
        </DialogHeader>
      </div>
      
      <div className="mb-2 text-sm flex flex-wrap gap-4">
        <div><strong>Predicted Tickets Next Week:</strong> {forecast.predictedTicketsNextWeek}</div>
        <div><strong>Predicted CSAT:</strong> {forecast.predictedCsatNextWeek}/5.0</div>
      </div>
      
      {forecast.riskFactors && forecast.riskFactors.length > 0 && (
        <>
          <div className="border-b mb-3 pb-2 flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Risk Factors</span>
          </div>
          <ul className="list-disc ml-6 mb-4 text-sm">
            {forecast.riskFactors.map((rf: string, i: number) => <li key={i}>{rf}</li>)}
          </ul>
        </>
      )}
      
      {forecast.recommendations && forecast.recommendations.length > 0 && (
        <>
          <div className="border-b mb-3 pb-2 flex items-center gap-2 text-muted-foreground">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Recommendations</span>
          </div>
          <ul className="list-disc ml-6 mb-4 text-sm">
            {forecast.recommendations.map((rec: string, i: number) => <li key={i}>{rec}</li>)}
          </ul>
        </>
      )}
      
      {forecast.recentTickets && forecast.recentTickets.length > 0 && (
        <div className="mt-4">
          <div className="font-semibold mb-2 flex items-center gap-2 text-primary">
            <BarChart3 className="h-4 w-4" />
            Recent Tickets
          </div>
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
  );
}

interface EmptyPerformanceForecastsStateProps {
  sessionMode: string;
  hasTickets: boolean;
}

function EmptyPerformanceForecastsState({ sessionMode, hasTickets }: EmptyPerformanceForecastsStateProps) {
  return (
    <div className="text-center py-6 text-muted-foreground">
      <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
      <p>No performance forecasts available</p>
      {sessionMode === 'enterprise' ? (
        <div className="mt-4">
          <p className="text-sm">Run the main AI analysis to generate performance forecasts</p>
          {!hasTickets && (
            <p className="text-xs mt-2">No ticket data available for analysis</p>
          )}
        </div>
      ) : (
        <p className="text-sm">Run advanced analysis to generate forecasts</p>
      )}
    </div>
  );
}