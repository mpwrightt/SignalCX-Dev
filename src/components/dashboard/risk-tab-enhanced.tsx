
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { BurnoutIndicatorsTab } from './burnout-indicators-tab';

interface RiskTabEnhancedProps {
  burnoutIndicators: any[];
  knowledgeGaps: any[];
  getLevelColor: (level: string) => string;
  isAgentLoading: (agentName: string, analysisType: string) => boolean;
  runAgentSpecificAnalysis?: (agentName: string, analysisType: 'performance' | 'burnout' | 'knowledge') => void;
  showAgentDetails: (content: React.ReactNode) => void;
}

export function RiskTabEnhanced({
  burnoutIndicators,
  knowledgeGaps,
  getLevelColor,
  isAgentLoading,
  runAgentSpecificAnalysis,
  showAgentDetails,
}: RiskTabEnhancedProps) {
  return (
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
  );
}
