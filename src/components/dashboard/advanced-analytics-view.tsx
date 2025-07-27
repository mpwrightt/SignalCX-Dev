'use client';

import * as React from "react";
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Brain, 
  Target,
  Users,
  Clock,
  BarChart3,
  Lightbulb,
  Shield,
  Heart,
  Loader2,
  Sparkles,
  Info,
  UserCircle,
  BookOpen,
  BrainCircuit,
  FileText,
  FlaskConical,
  AreaChart,
  Eye,
  X,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  Calendar,
  Settings,
  RefreshCw,
  Download,
  Share,
  ZoomIn,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  MoreHorizontal,
  Grid,
  List,
  Maximize2,
  Minimize2,
  Layers,
  Database,
  PieChart,
  LineChart,
  Hash,
  TrendingFlat,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock4,
  Gauge,
  Zap,
  MessageSquare,
  Briefcase,
  Monitor,
  Cpu,
  Server,
  Globe,
  TreePine,
  Network,
  Map,
  Compass,
  MousePointer,
  Move,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { BurnoutIndicator, KnowledgeGap } from "@/lib/types";

// Local interface for performance forecasts that matches the tabs component
interface PerformanceForecast {
  agentName: string;
  confidence: number;
  predictedTicketsNextWeek: number;
  predictedCsatNextWeek: number;
  riskFactors?: string[];
  recommendations?: string[];
  recentTickets?: any[];
}
import { getPerformanceForecasts } from "@/ai/flows/get-performance-forecasts";
import { getBurnoutIndicators } from "@/ai/flows/get-burnout-indicators";
import { getKnowledgeGaps } from "@/ai/flows/get-knowledge-gaps";
import { 
  generateMockPerformanceForecasts, 
  generateMockBurnoutIndicators, 
  generateMockKnowledgeGaps, 
  generateMockSlaPrediction, 
  generateMockHolisticAnalysis 
} from "@/lib/mock-data";
import { getSlaPrediction } from "@/ai/flows/get-sla-prediction";
import { getHolisticAnalysis } from "@/ai/flows/get-holistic-analysis";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { createHash } from 'crypto';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AnalyticsPreprocessor, ProcessedAnalyticsData } from '@/lib/analytics-preprocessor';
// Analytics cache removed - using Supabase for caching
import { aiFlowOptimizer, FlowResult } from '@/lib/ai-flow-optimizer';
import { runAIAnalyst } from '@/ai/flows/ai-analyst-mode';
import {
  ADVANCED_ANALYTICS_CACHE_KEY,
  CACHE_TTL_MS,
  ELAPSED_TIMER_KEY,
  CONFIDENCE_THRESHOLDS,
  shouldRerun,
  getConfidenceLevel,
  getConfidenceColor,
  computeAnalyticsCacheKey,
  getCachedAnalyticsForKey,
  setCachedAnalyticsForKey,
  getLevelColor
} from './advanced-analytics-utils';
import { runAIAnalysis, runMultiAgentAnalysis, runAgentSpecificAnalysis } from './advanced-analytics-logic';
import { AdvancedAnalyticsHeader } from './AdvancedAnalyticsHeader';
import { AdvancedAnalyticsSkeleton } from './AdvancedAnalyticsSkeleton';
import { AdvancedAnalyticsTabs } from './AdvancedAnalyticsTabs';
import { AdvancedAnalyticsModal } from './AdvancedAnalyticsModal';
import { AdvancedAnalyticsSummaryCards } from './AdvancedAnalyticsSummaryCards';

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

type MetricsTreeNode = {
  id: string;
  label: string;
  icon: React.ReactNode;
  level: DrillDownLevel;
  children?: MetricsTreeNode[];
  badge?: number;
  active?: boolean;
  onClick?: () => void;
};

type PanelConfig = {
  id: string;
  title: string;
  minWidth: number;
  defaultWidth: number;
  maxWidth: number;
  resizable: boolean;
};

type ChartConfig = {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'gauge';
  dataSource: string;
  interactive: boolean;
  drillEnabled: boolean;
  span: 1 | 2 | 3 | 4;
};

export const AdvancedAnalyticsView = ({ 
  sessionMode = 'demo',
  tickets = [],
  historicalVolume = [],
  forecastDays = 14,
  prediction = null,
  onTicketSelect,
}: { 
  sessionMode?: 'demo' | 'enterprise';
  tickets?: any[];
  historicalVolume?: { date: string; count: number }[];
  forecastDays?: number;
  prediction?: any;
  onTicketSelect?: (info: { ticket: any }) => void;
}) => {
  const { logEvent } = useDiagnostics();
  const { toast } = useToast();
  const { settings, updateSettings } = useSettings();
  
  // Enhanced state management for enterprise dashboard
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = React.useState<'standard' | 'agentic'>('standard');
  const [rerunningAnalysis, setRerunningAnalysis] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [storedStartTime, setStoredStartTime] = React.useState<number | null>(null);
  const [cacheInitialized, setCacheInitialized] = React.useState(false);
  
  // Enterprise dashboard state
  const [sidebarWidth, setSidebarWidth] = React.useState(280);
  const [panelLayout, setPanelLayout] = React.useState<Record<string, number>>({
    sidebar: 280,
    main: 1200,
    table: 400
  });
  const [activeFlows, setActiveFlows] = React.useState<Set<string>>(new Set());
  const [realTimeEnabled, setRealTimeEnabled] = React.useState(true);
  const [chartConfigs, setChartConfigs] = React.useState<ChartConfig[]>([]);
  const [selectedMetric, setSelectedMetric] = React.useState<string | null>(null);
  
  // Enhanced drill-down and navigation state
  const [drillDown, setDrillDown] = React.useState<DrillDownState>({
    level: 'overview',
    path: ['Overview'],
    context: {}
  });
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'split'>('grid');
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [selectedTimeframe, setSelectedTimeframe] = React.useState('7d');
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [refreshInterval, setRefreshInterval] = React.useState<NodeJS.Timeout | null>(null);
  const [gridCols, setGridCols] = React.useState(3);
  const [fullscreenChart, setFullscreenChart] = React.useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = React.useState(false);
  const [selectedAgents, setSelectedAgents] = React.useState<Set<string>>(new Set());
  const [metricsTree, setMetricsTree] = React.useState<MetricsTreeNode[]>([]);
  
  // Analytics state
  const [performanceForecasts, setPerformanceForecasts] = React.useState<PerformanceForecast[]>([]);
  const [burnoutIndicators, setBurnoutIndicators] = React.useState<BurnoutIndicator[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = React.useState<KnowledgeGap[]>([]);
  const [slaPrediction, setSlaPrediction] = React.useState<any>(null);
  const [holisticAnalysis, setHolisticAnalysis] = React.useState<any>(null);
  
  // Agent analysis state
  const [agentAnalysisResult, setAgentAnalysisResult] = React.useState<any>(null);
  const [agentReasoning, setAgentReasoning] = React.useState<string>('');
  const [agentToolCalls, setAgentToolCalls] = React.useState<any[]>([]);
  const [agentLoadingStates, setAgentLoadingStates] = React.useState<Record<string, boolean>>({});
  
  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState<React.ReactNode>(null);
  
  // Preprocessed data
  const [preprocessedData, setPreprocessedData] = React.useState<ProcessedAnalyticsData | null>(null);
  
  // Settings state
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);
  
  // Enhanced real-time KPI calculations with icons and drill-down targets
  const calculateKPIs = React.useMemo((): MetricConfig[] => {
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === 'solved' || t.status === 'closed').length;
    const pending = tickets.filter(t => t.status === 'pending' || t.status === 'open').length;
    const breached = tickets.filter(t => t.sla_breached).length;
    const avgCsat = tickets.filter(t => t.csat_score).reduce((acc, t) => acc + (t.csat_score || 0), 0) / tickets.filter(t => t.csat_score).length || 0;
    const avgResolution = 4.2;
    const agentUtilization = 87.5;
    const escalationRate = (breached / total) * 100;
    const aiAccuracy = 94.2;
    
    return [
      { 
        id: 'total', 
        label: 'Total Tickets', 
        value: total, 
        change: 12.5, 
        trend: 'up', 
        format: 'number',
        icon: <Gauge className="h-4 w-4" />,
        description: 'Total tickets across all channels',
        drillTarget: 'category'
      },
      { 
        id: 'resolved', 
        label: 'Resolution Rate', 
        value: ((resolved / total) * 100), 
        change: 8.2, 
        trend: 'up', 
        format: 'percentage',
        icon: <CheckCircle className="h-4 w-4" />,
        description: 'Percentage of tickets resolved',
        drillTarget: 'individual'
      },
      { 
        id: 'pending', 
        label: 'Active Tickets', 
        value: pending, 
        change: -5.1, 
        trend: 'down', 
        format: 'number',
        icon: <Clock className="h-4 w-4" />,
        description: 'Currently open and pending tickets',
        drillTarget: 'deep'
      },
      { 
        id: 'csat', 
        label: 'Customer Satisfaction', 
        value: avgCsat, 
        change: 0.3, 
        trend: 'up', 
        format: 'number',
        icon: <Heart className="h-4 w-4" />,
        description: 'Average customer satisfaction score',
        drillTarget: 'category'
      },
      { 
        id: 'resolution', 
        label: 'Avg Resolution Time', 
        value: avgResolution, 
        change: -15.2, 
        trend: 'down', 
        format: 'time',
        icon: <Zap className="h-4 w-4" />,
        description: 'Average time to resolve tickets',
        drillTarget: 'individual'
      },
      { 
        id: 'utilization', 
        label: 'Agent Efficiency', 
        value: agentUtilization, 
        change: 3.1, 
        trend: 'up', 
        format: 'percentage',
        icon: <Users className="h-4 w-4" />,
        description: 'Overall agent utilization rate',
        drillTarget: 'individual'
      },
      { 
        id: 'escalation', 
        label: 'Risk Factor', 
        value: escalationRate, 
        change: -2.8, 
        trend: 'down', 
        critical: escalationRate > 15, 
        format: 'percentage',
        icon: <AlertTriangle className="h-4 w-4" />,
        description: 'Tickets requiring escalation',
        drillTarget: 'actions'
      },
      { 
        id: 'ai_accuracy', 
        label: 'AI Insights Accuracy', 
        value: aiAccuracy, 
        change: 2.1, 
        trend: 'up', 
        format: 'percentage',
        icon: <Brain className="h-4 w-4" />,
        description: 'AI prediction accuracy score',
        drillTarget: 'deep'
      }
    ];
  }, [tickets]);

  // Enhanced drill-down navigation with context preservation
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
    
    // Update metrics tree active state
    setMetricsTree(prev => 
      prev.map(node => ({ ...node, active: node.level === level }))
    );
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
    setMetricsTree(prev => 
      prev.map(node => ({ ...node, active: node.level === 'overview' }))
    );
  };

  const handleMetricClick = (metric: MetricConfig) => {
    setSelectedMetric(metric.id);
    if (metric.drillTarget) {
      navigateTo(metric.drillTarget, {
        context: { sourceMetric: metric.id, value: metric.value }
      });
    }
  };

  const handleChartInteraction = (chartId: string, dataPoint: any) => {
    const nextLevel: DrillDownLevel = drillDown.level === 'overview' ? 'category' :
                                     drillDown.level === 'category' ? 'individual' :
                                     drillDown.level === 'individual' ? 'deep' :
                                     drillDown.level === 'deep' ? 'actions' : 'overview';
    
    navigateTo(nextLevel, {
      context: { sourceChart: chartId, dataPoint }
    });
  };

  // Initialize metrics tree with enterprise structure
  React.useEffect(() => {
    const tree: MetricsTreeNode[] = [
      {
        id: 'overview',
        label: 'Enterprise Overview',
        icon: <Monitor className="h-4 w-4" />,
        level: 'overview',
        active: drillDown.level === 'overview',
        onClick: () => navigateTo('overview'),
        children: [
          {
            id: 'kpis',
            label: 'Key Performance Indicators',
            icon: <Gauge className="h-4 w-4" />,
            level: 'overview',
            badge: calculateKPIs.filter(k => k.critical).length,
            onClick: () => setSelectedMetric('overview-kpis')
          },
          {
            id: 'realtime',
            label: 'Real-time Monitoring',
            icon: <Activity className="h-4 w-4" />,
            level: 'overview',
            onClick: () => setRealTimeEnabled(!realTimeEnabled)
          }
        ]
      },
      {
        id: 'categories',
        label: 'Category Analysis',
        icon: <Grid className="h-4 w-4" />,
        level: 'category',
        active: drillDown.level === 'category',
        onClick: () => navigateTo('category'),
        children: [
          {
            id: 'ticket-types',
            label: 'Ticket Categories',
            icon: <FileText className="h-4 w-4" />,
            level: 'category',
            onClick: () => navigateTo('category', { category: 'types' })
          },
          {
            id: 'sentiment',
            label: 'Sentiment Analysis',
            icon: <MessageSquare className="h-4 w-4" />,
            level: 'category',
            onClick: () => navigateTo('category', { category: 'sentiment' })
          },
          {
            id: 'patterns',
            label: 'Pattern Discovery',
            icon: <Network className="h-4 w-4" />,
            level: 'category',
            onClick: () => navigateTo('category', { category: 'patterns' })
          }
        ]
      },
      {
        id: 'agents',
        label: 'Agent Performance',
        icon: <Users className="h-4 w-4" />,
        level: 'individual',
        active: drillDown.level === 'individual',
        onClick: () => navigateTo('individual'),
        children: [
          {
            id: 'performance',
            label: 'Performance Forecasts',
            icon: <TrendingUp className="h-4 w-4" />,
            level: 'individual',
            onClick: () => navigateTo('individual', { category: 'performance' })
          },
          {
            id: 'burnout',
            label: 'Burnout Indicators',
            icon: <AlertTriangle className="h-4 w-4" />,
            level: 'individual',
            badge: burnoutIndicators.filter(b => b.riskLevel === 'high' || b.riskLevel === 'critical').length,
            onClick: () => navigateTo('individual', { category: 'burnout' })
          },
          {
            id: 'coaching',
            label: 'Coaching Insights',
            icon: <Lightbulb className="h-4 w-4" />,
            level: 'individual',
            onClick: () => navigateTo('individual', { category: 'coaching' })
          }
        ]
      },
      {
        id: 'deep-analysis',
        label: 'Deep Analytics',
        icon: <BrainCircuit className="h-4 w-4" />,
        level: 'deep',
        active: drillDown.level === 'deep',
        onClick: () => navigateTo('deep'),
        children: [
          {
            id: 'ai-insights',
            label: 'AI Analysis',
            icon: <Brain className="h-4 w-4" />,
            level: 'deep',
            onClick: () => navigateTo('deep', { category: 'ai' })
          },
          {
            id: 'predictive',
            label: 'Predictive Models',
            icon: <AreaChart className="h-4 w-4" />,
            level: 'deep',
            onClick: () => navigateTo('deep', { category: 'predictive' })
          },
          {
            id: 'risk-analysis',
            label: 'Risk Assessment',
            icon: <Shield className="h-4 w-4" />,
            level: 'deep',
            onClick: () => navigateTo('deep', { category: 'risk' })
          }
        ]
      },
      {
        id: 'actions',
        label: 'Action Center',
        icon: <Target className="h-4 w-4" />,
        level: 'actions',
        active: drillDown.level === 'actions',
        onClick: () => navigateTo('actions'),
        children: [
          {
            id: 'recommendations',
            label: 'AI Recommendations',
            icon: <Sparkles className="h-4 w-4" />,
            level: 'actions',
            onClick: () => navigateTo('actions', { category: 'recommendations' })
          },
          {
            id: 'interventions',
            label: 'Interventions',
            icon: <Zap className="h-4 w-4" />,
            level: 'actions',
            onClick: () => navigateTo('actions', { category: 'interventions' })
          },
          {
            id: 'escalations',
            label: 'Escalation Management',
            icon: <AlertCircle className="h-4 w-4" />,
            level: 'actions',
            onClick: () => navigateTo('actions', { category: 'escalations' })
          }
        ]
      }
    ];
    setMetricsTree(tree);
  }, [drillDown.level, calculateKPIs, burnoutIndicators, realTimeEnabled]);

  // Initialize chart configurations based on current drill-down level
  React.useEffect(() => {
    const configs: ChartConfig[] = [
      {
        id: 'volume-trend',
        title: 'Ticket Volume Trend',
        type: 'line',
        dataSource: 'historical',
        interactive: true,
        drillEnabled: true,
        span: 2
      },
      {
        id: 'sentiment-distribution',
        title: 'Sentiment Distribution',
        type: 'pie',
        dataSource: 'sentiment',
        interactive: true,
        drillEnabled: true,
        span: 1
      },
      {
        id: 'agent-performance',
        title: 'Agent Performance Matrix',
        type: 'scatter',
        dataSource: 'agents',
        interactive: true,
        drillEnabled: true,
        span: 2
      },
      {
        id: 'risk-heatmap',
        title: 'Risk Assessment Heatmap',
        type: 'heatmap',
        dataSource: 'risks',
        interactive: true,
        drillEnabled: true,
        span: 1
      },
      {
        id: 'forecasting',
        title: 'Predictive Forecasting',
        type: 'line',
        dataSource: 'forecasts',
        interactive: true,
        drillEnabled: true,
        span: 2
      },
      {
        id: 'ai-accuracy',
        title: 'AI Model Accuracy',
        type: 'gauge',
        dataSource: 'ai',
        interactive: true,
        drillEnabled: false,
        span: 1
      }
    ];
    setChartConfigs(configs);
  }, [drillDown.level]);

  // Function to find ticket by subject
  const findTicketBySubject = (ticketSubject: string) => {
    const ticket = tickets.find(t => t.subject === ticketSubject || t.subject.includes(ticketSubject));
    return ticket;
  };

  const handleExampleTicketClick = (ticketSubject: string) => {
    const ticket = findTicketBySubject(ticketSubject);
    if (ticket && onTicketSelect) {
      onTicketSelect({ ticket });
    }
  };

  // Enhanced row expansion toggle with drill-down
  const toggleRowExpansion = (rowId: string, data?: any) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
        // Auto-navigate to deeper level when expanding critical rows
        if (data?.critical && drillDown.level !== 'actions') {
          const nextLevel: DrillDownLevel = 
            drillDown.level === 'overview' ? 'category' :
            drillDown.level === 'category' ? 'individual' :
            drillDown.level === 'individual' ? 'deep' : 'actions';
          navigateTo(nextLevel, { context: { expandedRow: rowId, data } });
        }
      }
      return newSet;
    });
  };

  // Panel resizing handler
  const handlePanelResize = (panelId: string, newWidth: number) => {
    setPanelLayout(prev => ({
      ...prev,
      [panelId]: Math.max(200, Math.min(800, newWidth))
    }));
  };

  // Chart fullscreen toggle
  const toggleChartFullscreen = (chartId: string) => {
    setFullscreenChart(prev => prev === chartId ? null : chartId);
  };

  // Format metric values based on type
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

  // Get trend icon based on direction
  const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      default: return <TrendingFlat className="h-3 w-3" />;
    }
  };

  // Get trend color based on direction and context
  const getTrendColor = (trend: 'up' | 'down' | 'flat', isPositive: boolean = true) => {
    if (trend === 'flat') return 'text-gray-500';
    const color = (trend === 'up') === isPositive ? 'text-green-600' : 'text-red-600';
    return color;
  };

  // Auto-refresh functionality
  React.useEffect(() => {
    if (autoRefresh && !loading) {
      const interval = setInterval(() => {
        // Trigger data refresh here
        console.log('Auto-refreshing analytics data...');
      }, 30000); // 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, loading]);

  // Timer management
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && loading) {
      interval = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, loading]);

  // Cache initialization
  React.useEffect(() => {
    if (!cacheInitialized && tickets.length > 0) {
      const cacheKey = computeAnalyticsCacheKey(tickets, analysisMode);
      const cached = getCachedAnalyticsForKey(cacheKey);
      if (cached) {
        setPerformanceForecasts(cached.performanceForecasts || []);
        setBurnoutIndicators(cached.burnoutIndicators || []);
        setKnowledgeGaps(cached.knowledgeGaps || []);
        setSlaPrediction(cached.slaPrediction || null);
        setHolisticAnalysis(cached.holisticAnalysis || null);
        setElapsed(cached.elapsed || 0);
      }
      setCacheInitialized(true);
    }
  }, [tickets, analysisMode, cacheInitialized]);

  // Settings loading
  React.useEffect(() => {
    if (settings && !settingsLoaded) {
      setSettingsLoaded(true);
    }
  }, [settings, settingsLoaded]);

  // Process prediction data and update individual state variables
  React.useEffect(() => {
    if (prediction) {
      console.log('Processing prediction data for Advanced Analytics:', prediction);
      
      // Extract performance forecasts
      if (prediction.forecast) {
        setPerformanceForecasts(prediction.forecast);
      }
      
      // Extract burnout indicators
      if (prediction.burnoutIndicators) {
        setBurnoutIndicators(prediction.burnoutIndicators);
      }
      
      // Extract knowledge gaps
      if (prediction.knowledgeGaps) {
        setKnowledgeGaps(prediction.knowledgeGaps);
      }
      
      // Extract SLA prediction
      if (prediction.predictedSlaBreaches) {
        setSlaPrediction({
          probability: prediction.predictedSlaBreaches.length > 0 ? 0.3 : 0.1,
          predictedBreaches: prediction.predictedSlaBreaches
        });
      }
      
      // Extract holistic analysis
      if (prediction.overallAnalysis || prediction.agentTriageSummary) {
        setHolisticAnalysis({
          overallAnalysis: prediction.overallAnalysis,
          agentTriageSummary: prediction.agentTriageSummary,
          confidenceScore: prediction.confidenceScore || 0.8
        });
      }
    }
  }, [prediction]);

  // Add fallback mock data when no real data is available
  React.useEffect(() => {
    if (!loading && tickets.length > 0) {
      // Only add fallback data if we don't have real data
      if (performanceForecasts.length === 0) {
        const mockForecasts = generateMockPerformanceForecasts(tickets);
        // Convert to the expected type structure for the tabs
        const convertedForecasts = mockForecasts.map((forecast: any) => ({
          agentName: forecast.agentName,
          confidence: forecast.confidence,
          predictedTicketsNextWeek: forecast.predictedTicketsNextWeek,
          predictedCsatNextWeek: forecast.predictedCsatNextWeek,
          riskFactors: forecast.riskFactors,
          recommendations: forecast.recommendations,
          recentTickets: forecast.recentTickets,
        }));
        setPerformanceForecasts(convertedForecasts);
        console.log('Using mock performance forecasts:', convertedForecasts);
      }
      
      if (burnoutIndicators.length === 0) {
        const mockBurnout = generateMockBurnoutIndicators(tickets);
        setBurnoutIndicators(mockBurnout);
        console.log('Using mock burnout indicators:', mockBurnout);
      }
      
      if (knowledgeGaps.length === 0) {
        const mockGaps = generateMockKnowledgeGaps(tickets);
        setKnowledgeGaps(mockGaps);
        console.log('Using mock knowledge gaps:', mockGaps);
      }
      
      if (!slaPrediction) {
        const mockSla = generateMockSlaPrediction(tickets);
        setSlaPrediction(mockSla);
        console.log('Using mock SLA prediction:', mockSla);
      }
      
      if (!holisticAnalysis) {
        const mockHolistic = generateMockHolisticAnalysis(tickets);
        setHolisticAnalysis(mockHolistic);
        console.log('Using mock holistic analysis:', mockHolistic);
      }
    }
  }, [loading, tickets, performanceForecasts.length, burnoutIndicators.length, knowledgeGaps.length, slaPrediction, holisticAnalysis]);

  // Load additional analytics data from cache
  React.useEffect(() => {
    try {
      const analyticsData = localStorage.getItem('signalcx-analytics-data');
      if (analyticsData) {
        const data = JSON.parse(analyticsData);
        console.log('Loading additional analytics data from cache:', data);
        
        if (data.burnoutIndicators) {
          setBurnoutIndicators(data.burnoutIndicators);
        }
        
        if (data.knowledgeGaps) {
          setKnowledgeGaps(data.knowledgeGaps);
        }
      }
    } catch (error) {
      console.error('Error loading analytics data from cache:', error);
    }
  }, []);

  // Helper functions
  const isAgentLoading = (agentName: string, analysisType: string) => {
    return agentLoadingStates[`${agentName}-${analysisType}`] || false;
  };

  const showDetailedAnalysis = (type: string, data: any) => {
    setModalContent(
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{type} Analysis</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
    setModalOpen(true);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Loading state
  if (loading && !performanceForecasts.length && !burnoutIndicators.length) {
    return <AdvancedAnalyticsSkeleton elapsed={elapsed} ticketsLength={tickets.length} />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Analysis Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => setError(null)}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <AdvancedAnalyticsHeader
        sessionMode={sessionMode}
        tickets={tickets}
        historicalVolume={historicalVolume}
        forecastDays={forecastDays}
        prediction={prediction}
        onTicketSelect={onTicketSelect}
        analysisMode={analysisMode}
        setAnalysisMode={setAnalysisMode}
        settings={settings}
        updateSettings={updateSettings}
        settingsLoaded={settingsLoaded}
        runAIAnalysis={runAIAnalysis}
        runMultiAgentAnalysis={runMultiAgentAnalysis}
        runAgentSpecificAnalysis={runAgentSpecificAnalysis}
        isAgentLoading={isAgentLoading}
        showDetailedAnalysis={showDetailedAnalysis}
        setSelectedToolDetails={() => {}}
        setAgentLoadingStates={setAgentLoadingStates}
        preprocessedData={preprocessedData}
        setPreprocessedData={setPreprocessedData}
        setModalOpen={setModalOpen}
        setModalContent={setModalContent}
        setAgentAnalysisResult={setAgentAnalysisResult}
        setAgentReasoning={setAgentReasoning}
        setAgentToolCalls={setAgentToolCalls}
        setPerformanceForecasts={setPerformanceForecasts}
        setBurnoutIndicators={setBurnoutIndicators}
        setKnowledgeGaps={setKnowledgeGaps}
        setSlaPrediction={setSlaPrediction}
        setHolisticAnalysis={setHolisticAnalysis}
        setLoading={setLoading}
        setError={setError}
        setRerunningAnalysis={setRerunningAnalysis}
        setElapsed={setElapsed}
        setStartTime={setStartTime}
        setStoredStartTime={setStoredStartTime}
        setCacheInitialized={setCacheInitialized}
        logEvent={logEvent}
        toast={toast}
        loading={loading}
        setCachedAnalyticsForKey={setCachedAnalyticsForKey}
        cacheKey={computeAnalyticsCacheKey(tickets, sessionMode)}
        AnalyticsPreprocessor={AnalyticsPreprocessor}
        aiFlowOptimizer={aiFlowOptimizer}
      />

      <AdvancedAnalyticsSummaryCards
        performanceForecasts={performanceForecasts}
        burnoutIndicators={burnoutIndicators}
        knowledgeGaps={knowledgeGaps}
        slaPrediction={slaPrediction}
        holisticAnalysis={holisticAnalysis}
        loading={loading}
        elapsed={elapsed}
        getRiskLevelColor={getRiskLevelColor}
        getImpactColor={getImpactColor}
        getConfidenceLevel={getConfidenceLevel}
        getConfidenceColor={getConfidenceColor}
        getLevelColor={getLevelColor}
      />

      <AdvancedAnalyticsTabs
        performanceForecasts={performanceForecasts}
        burnoutIndicators={burnoutIndicators}
        knowledgeGaps={knowledgeGaps}
        slaPrediction={slaPrediction}
        holisticAnalysis={holisticAnalysis}
        loading={loading}
        elapsed={elapsed}
        getRiskLevelColor={getRiskLevelColor}
        getImpactColor={getImpactColor}
        getConfidenceLevel={getConfidenceLevel}
        getConfidenceColor={getConfidenceColor}
        getLevelColor={getLevelColor}
        showDetailedAnalysis={showDetailedAnalysis}
        isAgentLoading={isAgentLoading}
        agentAnalysisResult={agentAnalysisResult}
        agentReasoning={agentReasoning}
        agentToolCalls={agentToolCalls}
        sessionMode={sessionMode}
        tickets={tickets}
        runAgentSpecificAnalysis={runAgentSpecificAnalysis}
      />

      <AdvancedAnalyticsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        content={modalContent}
      />
    </div>
  );
};