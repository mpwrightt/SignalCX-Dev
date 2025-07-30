import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Eye, UserCircle, TrendingUp, Lightbulb } from 'lucide-react';

interface InsightsTabEnhancedProps {
  holisticAnalysis: any;
  getConfidenceColor: (confidence: number) => string;
  getConfidenceLevel: (confidence: number) => string;
}

export function InsightsTabEnhanced({
  holisticAnalysis,
  getConfidenceColor,
  getConfidenceLevel,
}: InsightsTabEnhancedProps) {
  return (
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
                <ul className="space-y-2">
                  {holisticAnalysis.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-sm">{rec}</p>
                    </li>
                  ))}
                </ul>
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
  );
}