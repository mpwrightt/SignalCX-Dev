// Burnout Indicators Tab Component
// Extracted from advanced-analytics-view.tsx for better modularity

import React from 'react';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Heart, 
  UserCircle, 
  AlertTriangle, 
  BarChart3, 
  Info, 
  Shield,
  Loader2 
} from "lucide-react";
import { getRiskLevelColor, getLevelColor } from "@/lib/advanced-analytics-cache";
import { AgentLoadingButton, LoadingOverlay } from "./analytics-loading-states";

interface BurnoutIndicator {
  agentName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  ticketCount: number;
  avgResolutionTime: string | number;
  lastActivity: string;
  indicators?: string[];
}

interface BurnoutIndicatorsTabProps {
  burnoutIndicators: BurnoutIndicator[];
  isAgentLoading: (agentName: string, analysisType: string) => boolean;
  runAgentSpecificAnalysis: (agentName: string, analysisType: 'performance' | 'burnout' | 'knowledge') => void;
  showAgentDetails: (content: React.ReactNode) => void;
}

export function BurnoutIndicatorsTab({
  burnoutIndicators,
  isAgentLoading,
  runAgentSpecificAnalysis,
  showAgentDetails
}: BurnoutIndicatorsTabProps) {
  const handleRerunHighRisk = () => {
    burnoutIndicators
      .filter(b => b.riskLevel === 'high' || b.riskLevel === 'critical')
      .forEach(b => runAgentSpecificAnalysis(b.agentName, 'burnout'));
  };

  const isAnyAgentLoading = burnoutIndicators.some(b => isAgentLoading(b.agentName, 'burnout'));
  const hasHighRiskIndicators = burnoutIndicators.some(b => b.riskLevel === 'high' || b.riskLevel === 'critical');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Burnout Detection</CardTitle>
            <CardDescription>
              AI-identified burnout risk indicators
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasHighRiskIndicators && (
              <AgentLoadingButton
                isLoading={isAnyAgentLoading}
                onClick={handleRerunHighRisk}
                disabled={isAnyAgentLoading}
                size="sm"
                className="text-xs"
              >
                {isAnyAgentLoading ? 'Rerunning...' : 'Rerun High Risk'}
              </AgentLoadingButton>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {burnoutIndicators?.map((indicator: BurnoutIndicator, indicatorIndex: number) => (
            <LoadingOverlay
              key={indicatorIndex}
              isLoading={isAgentLoading(indicator.agentName, 'burnout')}
            >
              <div className="p-4 border rounded-lg relative">
                <BurnoutIndicatorItem
                  indicator={indicator}
                  isLoading={isAgentLoading(indicator.agentName, 'burnout')}
                  onRunAnalysis={() => runAgentSpecificAnalysis(indicator.agentName, 'burnout')}
                  onShowDetails={() => showAgentDetails(
                    <BurnoutIndicatorDetails indicator={indicator} />
                  )}
                />
              </div>
            </LoadingOverlay>
          ))}
          
          {burnoutIndicators?.length === 0 && (
            <EmptyBurnoutIndicatorsState />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BurnoutIndicatorItemProps {
  indicator: BurnoutIndicator;
  isLoading: boolean;
  onRunAnalysis: () => void;
  onShowDetails: () => void;
}

function BurnoutIndicatorItem({
  indicator,
  isLoading,
  onRunAnalysis,
  onShowDetails
}: BurnoutIndicatorItemProps) {
  const isHighRisk = indicator.riskLevel === 'high' || indicator.riskLevel === 'critical';
  const riskValue = getRiskLevelValue(indicator.riskLevel);

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
            <span>{indicator.agentName}</span>
            <Info className="h-4 w-4 opacity-70 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={getRiskLevelColor(indicator.riskLevel)}
            >
              {indicator.riskLevel.toUpperCase()}
            </Badge>
            {isHighRisk && (
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
          <Heart className="h-4 w-4 text-destructive" />
          <span className="text-sm text-muted-foreground">
            {indicator.riskLevel}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Risk Level</span>
            <span className="font-medium">{indicator.riskLevel}</span>
          </div>
          <Progress value={riskValue} />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Risk Level</span>
            <span className="font-medium">{indicator.riskLevel}</span>
          </div>
          <Progress value={riskValue} />
        </div>
      </div>

      <div>
        <h5 className="text-sm font-medium mb-2 flex items-center">
          <Shield className="h-4 w-4 text-muted-foreground mr-1" />
          Risk Factors
        </h5>
        <ul className="text-sm text-muted-foreground space-y-1">
          {indicator.indicators?.map((factor, factorIndex) => (
            <li key={factorIndex}>• {factor}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

interface BurnoutIndicatorDetailsProps {
  indicator: BurnoutIndicator;
}

function BurnoutIndicatorDetails({ indicator }: BurnoutIndicatorDetailsProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <UserCircle className="h-8 w-8 text-destructive" />
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {indicator.agentName}
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getLevelColor(indicator.riskLevel)}`}>
              {indicator.riskLevel.toUpperCase()}
            </span>
          </DialogTitle>
        </DialogHeader>
      </div>
      
      <div className="mb-2 text-sm flex flex-wrap gap-4">
        <div><strong>Ticket Count:</strong> {indicator.ticketCount}</div>
        <div><strong>Avg Resolution Time:</strong> {indicator.avgResolutionTime} hrs</div>
        <div><strong>Last Activity:</strong> {indicator.lastActivity}</div>
      </div>
      
      {indicator.indicators && indicator.indicators.length > 0 && (
        <>
          <div className="border-b mb-3 pb-2 flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Burnout Indicators</span>
          </div>
          <ul className="list-disc ml-6 mb-4 text-sm">
            {indicator.indicators.map((ind: string, i: number) => <li key={i}>{ind}</li>)}
          </ul>
        </>
      )}
      
      <div className="mt-4">
        <div className="font-semibold mb-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Workload Summary
        </div>
        <div className="text-xs">
          <div>Tickets handled: {indicator.ticketCount}</div>
          <div>Average resolution time: {indicator.avgResolutionTime} hrs</div>
          <div>Last activity: {indicator.lastActivity}</div>
        </div>
      </div>
    </>
  );
}

function EmptyBurnoutIndicatorsState() {
  return (
    <div className="text-center py-6 text-muted-foreground">
      <Heart className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
      <p>No burnout indicators detected</p>
      <p className="text-sm">Run advanced analysis to identify risks</p>
    </div>
  );
}

// Helper function to convert risk level to progress value
function getRiskLevelValue(riskLevel: string): number {
  switch (riskLevel) {
    case 'critical':
      return 100;
    case 'high':
      return 75;
    case 'medium':
      return 50;
    case 'low':
      return 25;
    default:
      return 0;
  }
}