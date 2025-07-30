
import * as React from "react";

// Enhanced enterprise drill-down system
type DrillDownLevel = 'overview' | 'category' | 'individual' | 'deep' | 'actions';

type DrillDownState = {
  level: DrillDownLevel;
  category?: string;
  agentName?: string;
  ticketId?: number;
  timeframe?: string;
  path: string[];
  context?: Record<string, any>;
};

type MetricConfig = {
  id: string;
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'flat';
  critical?: boolean;
  format: 'number' | 'percentage' | 'time' | 'currency';
  icon: React.ReactNode;
  description?: string;
  drillTarget?: DrillDownLevel;
};

export function useDrillDown(setDrillDown: React.Dispatch<React.SetStateAction<DrillDownState>>) {
  const navigateTo = (level: DrillDownLevel, context?: Partial<DrillDownState>) => {
    setDrillDown(prev => ({
      level,
      category: context?.category || prev.category,
      agentName: context?.agentName || prev.agentName,
      ticketId: context?.ticketId || prev.ticketId,
      timeframe: context?.timeframe || prev.timeframe,
      path: [...prev.path, context?.category || context?.agentName || level],
      context: { ...prev.context, ...context?.context }
    }));
  };

  const navigateBack = () => {
    setDrillDown(prev => {
      const newPath = [...prev.path];
      newPath.pop();
      const newLevel = newPath.length <= 1 ? 'overview' : 
                      newPath.length === 2 ? 'category' : 
                      newPath.length === 3 ? 'individual' : 
                      newPath.length === 4 ? 'deep' : 'actions';
      return {
        ...prev,
        level: newLevel,
        path: newPath
      };
    });
  };

  const resetToOverview = () => {
    setDrillDown({
      level: 'overview',
      path: ['Overview'],
      context: {}
    });
  };

  const handleMetricClick = (metric: MetricConfig) => {
    if (metric.drillTarget) {
      navigateTo(metric.drillTarget, {
        context: { sourceMetric: metric.id, value: metric.value }
      });
    }
  };

  const handleChartInteraction = (chartId: string, dataPoint: any, drillDown: DrillDownState) => {
    const nextLevel: DrillDownLevel = drillDown.level === 'overview' ? 'category' :
                                     drillDown.level === 'category' ? 'individual' :
                                     drillDown.level === 'individual' ? 'deep' :
                                     drillDown.level === 'deep' ? 'actions' : 'overview';
    
    navigateTo(nextLevel, {
      context: { sourceChart: chartId, dataPoint }
    });
  };

  return { navigateTo, navigateBack, resetToOverview, handleMetricClick, handleChartInteraction };
}
