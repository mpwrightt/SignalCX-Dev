'use client';

import * as React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat,
  Activity, 
  AlertTriangle, 
  Target,
  Users,
  Clock,
  Heart,
  Shield,
  BarChart3,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  RefreshCw
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Types for KPI metrics
interface KpiMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number;
  change: number;
  changeLabel?: string;
  trend: 'up' | 'down' | 'flat';
  status: 'success' | 'warning' | 'error' | 'neutral';
  format: 'number' | 'percentage' | 'time' | 'currency' | 'rate';
  icon: React.ComponentType<{ className?: string }>;
  critical?: boolean;
  target?: number;
  description?: string;
  drillDownContext?: Record<string, any>;
}

interface AnalyticsKpiHeaderProps {
  tickets?: any[];
  prediction?: any;
  timeframe?: string;
  onDrillDown?: (level: any, context?: any) => void;
  loading?: boolean;
  lastUpdated?: Date;
}

export const AnalyticsKpiHeader: React.FC<AnalyticsKpiHeaderProps> = ({
  tickets = [],
  prediction,
  timeframe = '7d',
  onDrillDown,
  loading = false,
  lastUpdated = new Date()
}) => {
  // Calculate real-time KPI metrics
  const calculateKpis = React.useMemo((): KpiMetric[] => {
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === 'solved' || t.status === 'closed').length;
    const pending = tickets.filter(t => t.status === 'pending' || t.status === 'open').length;
    const breached = tickets.filter(t => t.sla_breached).length;
    const highPriority = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
    
    // Calculate averages
    const csatTickets = tickets.filter(t => t.csat_score);
    const avgCsat = csatTickets.length > 0 
      ? csatTickets.reduce((acc, t) => acc + (t.csat_score || 0), 0) / csatTickets.length 
      : 0;
    
    // Mock calculations for demo (in production, these would come from real analytics)
    const resolutionTime = 4.2; // hours
    const agentUtilization = 87.5; // percentage
    const escalationRate = (breached / total) * 100;
    const responseTime = 15; // minutes
    const satisfactionTrend = 2.3; // percentage change
    const volumeGrowth = 12.5; // percentage change
    const efficiency = ((resolved / total) * 100);

    return [
      {
        id: 'volume',
        label: 'Ticket Volume',
        value: total,
        change: volumeGrowth,
        changeLabel: 'vs last period',
        trend: volumeGrowth > 0 ? 'up' : volumeGrowth < 0 ? 'down' : 'flat',
        status: volumeGrowth > 20 ? 'warning' : 'neutral',
        format: 'number',
        icon: BarChart3,
        description: 'Total tickets in selected timeframe',
        drillDownContext: { category: 'volume', type: 'tickets' }
      },
      {
        id: 'resolution',
        label: 'Resolution Rate',
        value: efficiency,
        change: 8.2,
        trend: 'up',
        status: efficiency > 80 ? 'success' : efficiency > 60 ? 'warning' : 'error',
        format: 'percentage',
        icon: Target,
        target: 85,
        description: 'Percentage of tickets resolved successfully',
        drillDownContext: { category: 'resolution', type: 'performance' }
      },
      {
        id: 'response',
        label: 'Avg Response Time',
        value: responseTime,
        change: -15.2,
        trend: 'down',
        status: responseTime < 30 ? 'success' : responseTime < 60 ? 'warning' : 'error',
        format: 'time',
        icon: Clock,
        target: 20,
        description: 'Average first response time in minutes',
        drillDownContext: { category: 'response', type: 'timing' }
      },
      {
        id: 'satisfaction',
        label: 'Customer Satisfaction',
        value: avgCsat,
        change: satisfactionTrend,
        trend: satisfactionTrend > 0 ? 'up' : 'down',
        status: avgCsat > 4 ? 'success' : avgCsat > 3 ? 'warning' : 'error',
        format: 'rate',
        icon: Heart,
        target: 4.5,
        description: 'Average CSAT score (1-5 scale)',
        drillDownContext: { category: 'satisfaction', type: 'csat' }
      },
      {
        id: 'utilization',
        label: 'Agent Utilization',
        value: agentUtilization,
        change: 3.1,
        trend: 'up',
        status: agentUtilization > 90 ? 'warning' : agentUtilization > 70 ? 'success' : 'error',
        format: 'percentage',
        icon: Users,
        target: 85,
        description: 'Agent workload and availability',
        drillDownContext: { category: 'agents', type: 'utilization' }
      },
      {
        id: 'escalation',
        label: 'Escalation Rate',
        value: escalationRate,
        change: -2.8,
        trend: 'down',
        status: escalationRate < 10 ? 'success' : escalationRate < 20 ? 'warning' : 'error',
        format: 'percentage',
        icon: AlertTriangle,
        critical: escalationRate > 15,
        target: 10,
        description: 'Percentage of tickets requiring escalation',
        drillDownContext: { category: 'escalation', type: 'risk' }
      },
      {
        id: 'health',
        label: 'System Health',
        value: 92.3,
        change: 1.8,
        trend: 'up',
        status: 'success',
        format: 'percentage',
        icon: Shield,
        target: 95,
        description: 'Overall system performance and reliability',
        drillDownContext: { category: 'health', type: 'system' }
      },
      {
        id: 'efficiency',
        label: 'Process Efficiency',
        value: 78.5,
        change: 5.2,
        trend: 'up',
        status: 'success',
        format: 'percentage',
        icon: Zap,
        target: 80,
        description: 'Automated vs manual process ratio',
        drillDownContext: { category: 'efficiency', type: 'automation' }
      }
    ];
  }, [tickets, timeframe]);

  // Format values based on type
  const formatValue = (value: number | string, format: KpiMetric['format']): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return value < 1 ? `${Math.round(value * 60)}min` : `${value.toFixed(1)}hr`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'rate':
        return `${value.toFixed(1)}/5`;
      default:
        return value.toLocaleString();
    }
  };

  // Get trend icon and color
  const getTrendDisplay = (metric: KpiMetric) => {
    const isPositiveTrend = (metric.trend === 'up' && !['escalation', 'response'].includes(metric.id)) ||
                           (metric.trend === 'down' && ['escalation', 'response'].includes(metric.id));
    
    const trendColor = isPositiveTrend ? 'text-green-600' : 
                      metric.trend === 'flat' ? 'text-gray-500' : 'text-red-600';
    
    const TrendIcon = metric.trend === 'up' ? ArrowUpRight : 
                     metric.trend === 'down' ? ArrowDownRight : Minus;
    
    return { TrendIcon, trendColor, isPositiveTrend };
  };

  // Get status color for metric card
  const getStatusColor = (status: KpiMetric['status']) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50 text-green-900';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-900';
      case 'error': return 'border-red-200 bg-red-50 text-red-900';
      default: return 'border-gray-200 bg-gray-50 text-gray-900';
    }
  };

  // Handle metric click for drill-down
  const handleMetricClick = (metric: KpiMetric) => {
    if (onDrillDown && metric.drillDownContext) {
      onDrillDown('category', metric.drillDownContext);
    }
  };

  return (
    <div className="bg-card border-b">
      <div className="p-4">
        {/* Header with refresh info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Real-time Analytics</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              Live Data
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <Badge variant="secondary" className="text-xs">
              {timeframe.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {calculateKpis.map((metric) => {
            const { TrendIcon, trendColor, isPositiveTrend } = getTrendDisplay(metric);
            const statusColor = getStatusColor(metric.status);
            
            return (
              <TooltipProvider key={metric.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card 
                      className={`
                        ${statusColor} 
                        cursor-pointer hover:shadow-md transition-all duration-200 
                        border-2 relative overflow-hidden
                        ${metric.critical ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
                      `}
                      onClick={() => handleMetricClick(metric)}
                    >
                      {/* Critical indicator */}
                      {metric.critical && (
                        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-500">
                          <AlertTriangle className="absolute -top-4 -right-4 h-3 w-3 text-white" />
                        </div>
                      )}
                      
                      <CardContent className="p-4">
                        {/* Icon and Label */}
                        <div className="flex items-center justify-between mb-2">
                          <metric.icon className="h-5 w-5 opacity-70" />
                          {metric.target && (
                            <div className="text-xs opacity-60">
                              Target: {formatValue(metric.target, metric.format)}
                            </div>
                          )}
                        </div>
                        
                        {/* Value */}
                        <div className="space-y-1">
                          <div className="text-2xl font-bold leading-none">
                            {formatValue(metric.value, metric.format)}
                          </div>
                          
                          {/* Trend */}
                          <div className="flex items-center gap-1">
                            <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                            <span className={`text-xs font-medium ${trendColor}`}>
                              {Math.abs(metric.change).toFixed(1)}%
                            </span>
                            {metric.changeLabel && (
                              <span className="text-xs opacity-60">
                                {metric.changeLabel}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress bar for percentage metrics */}
                        {(metric.format === 'percentage' || metric.target) && (
                          <div className="mt-2">
                            <Progress 
                              value={typeof metric.value === 'number' ? metric.value : 0} 
                              max={metric.target || 100}
                              className="h-1"
                            />
                          </div>
                        )}
                        
                        {/* Label */}
                        <div className="text-xs font-medium mt-2 opacity-80 truncate">
                          {metric.label}
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="font-medium">{metric.label}</div>
                      <div className="text-sm">{metric.description}</div>
                      {metric.target && (
                        <div className="text-xs opacity-80">
                          Target: {formatValue(metric.target, metric.format)}
                        </div>
                      )}
                      <div className="text-xs opacity-60">
                        Click to drill down for detailed analysis
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </div>
  );
};