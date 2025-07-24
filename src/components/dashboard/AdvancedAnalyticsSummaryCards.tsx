import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, Heart, BarChart3, Shield, BrainCircuit } from 'lucide-react';

export function AdvancedAnalyticsSummaryCards({
  performanceForecasts,
  burnoutIndicators,
  knowledgeGaps,
  slaPrediction,
  holisticAnalysis,
  prediction
}: any) {
  return (
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
            {burnoutIndicators.filter((b: any) => b.riskLevel === 'high' || b.riskLevel === 'critical').length}
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
  );
} 