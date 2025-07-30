
import * as React from "react";
import { TrendingUp, TrendingDown, TrendingFlat } from "lucide-react";

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
  drillTarget?: any;
};

export function useDataProcessing() {
  const formatMetricValue = (metric: MetricConfig): string => {
    if (typeof metric.value === 'string') return metric.value;
    
    switch (metric.format) {
      case 'percentage':
        return `${metric.value.toFixed(1)}%`;
      case 'currency':
        return `$${metric.value.toLocaleString()}`;
      case 'time':
        return `${metric.value.toFixed(1)}h`;
      default:
        return metric.value.toLocaleString();
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      default: return <TrendingFlat className="h-3 w-3" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'flat', isPositive: boolean = true) => {
    if (trend === 'flat') return 'text-gray-500';
    const color = (trend === 'up') === isPositive ? 'text-green-600' : 'text-red-600';
    return color;
  };

  return { formatMetricValue, getTrendIcon, getTrendColor };
}
