'use client';

import * as React from "react";
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
  Layout,
  Sidebar,
  PanelLeftOpen,
  PanelLeftClose
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";

import { AnalyticsKpiHeader } from "./analytics-kpi-header";
import { AnalyticsMetricsTree } from "./analytics-metrics-tree";
import { AnalyticsMainGrid } from "./analytics-main-grid";
import { AnalyticsDataTable } from "./analytics-data-table";

// Types for enterprise dashboard
type DrillDownLevel = 'overview' | 'category' | 'individual' | 'deep' | 'actions';
type ViewMode = 'grid' | 'list' | 'hybrid';
type PanelLayout = 'default' | 'wide-main' | 'wide-sidebar' | 'full-table';

interface DrillDownState {
  level: DrillDownLevel;
  category?: string;
  agentName?: string;
  ticketId?: number;
  timeframe?: string;
  path: string[];
  context?: Record<string, any>;
}

interface AnalyticsFilter {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'daterange' | 'slider';
  value: any;
  options?: { label: string; value: string }[];
}

interface EnterpriseAnalyticsDashboardProps {
  sessionMode?: 'demo' | 'enterprise';
  tickets?: any[];
  historicalVolume?: { date: string; count: number }[];
  forecastDays?: number;
  prediction?: any;
  onTicketSelect?: (info: { ticket: any }) => void;
}

export const EnterpriseAnalyticsDashboard: React.FC<EnterpriseAnalyticsDashboardProps> = ({
  sessionMode = 'demo',
  tickets = [],
  historicalVolume = [],
  forecastDays = 14,
  prediction = null,
  onTicketSelect
}) => {
  // Layout and navigation state
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [panelLayout, setPanelLayout] = React.useState<PanelLayout>('default');
  const [viewMode, setViewMode] = React.useState<ViewMode>('hybrid');
  const [fullscreenPanel, setFullscreenPanel] = React.useState<string | null>(null);

  // Drill-down state management
  const [drillDown, setDrillDown] = React.useState<DrillDownState>({
    level: 'overview',
    path: ['Overview']
  });

  // Filter and search state
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [activeFilters, setActiveFilters] = React.useState<AnalyticsFilter[]>([
    {
      id: 'timeframe',
      label: 'Time Range',
      type: 'select',
      value: '7d',
      options: [
        { label: 'Last 24 hours', value: '1d' },
        { label: 'Last 7 days', value: '7d' },
        { label: 'Last 30 days', value: '30d' },
        { label: 'Last quarter', value: '90d' },
        { label: 'Last year', value: '365d' }
      ]
    },
    {
      id: 'agents',
      label: 'Agents',
      type: 'multiselect',
      value: 'all',
      options: [
        { label: 'All Agents', value: 'all' },
        { label: 'High Performers', value: 'high' },
        { label: 'At Risk', value: 'risk' }
      ]
    }
  ]);

  // Data loading and refresh state
  const [loading, setLoading] = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState(new Date());
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [refreshInterval, setRefreshInterval] = React.useState(30); // seconds

  // Analytics data state
  const [analyticsData, setAnalyticsData] = React.useState<any>({
    kpis: [],
    charts: [],
    tables: [],
    insights: []
  });

  // Panel size state for resizable layout
  const [panelSizes, setPanelSizes] = React.useState({
    sidebar: 25,
    main: 50,
    table: 25
  });

  // Drill-down navigation functions
  const navigateTo = React.useCallback((level: DrillDownLevel, context?: Partial<DrillDownState>) => {
    setDrillDown(prev => ({
      level,
      category: context?.category || prev.category,
      agentName: context?.agentName || prev.agentName,
      ticketId: context?.ticketId || prev.ticketId,
      timeframe: context?.timeframe || prev.timeframe,
      path: [...prev.path, context?.category || context?.agentName || level],
      context: { ...prev.context, ...context?.context }
    }));
  }, []);

  const navigateBack = React.useCallback(() => {
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
  }, []);

  const resetToOverview = React.useCallback(() => {
    setDrillDown({
      level: 'overview',
      path: ['Overview']
    });
  }, []);

  // Filter management
  const updateFilter = React.useCallback((filterId: string, value: any) => {
    setActiveFilters(prev => 
      prev.map(filter => 
        filter.id === filterId ? { ...filter, value } : filter
      )
    );
  }, []);

  const addFilter = React.useCallback((filter: AnalyticsFilter) => {
    setActiveFilters(prev => [...prev, filter]);
  }, []);

  const removeFilter = React.useCallback((filterId: string) => {
    setActiveFilters(prev => prev.filter(filter => filter.id !== filterId));
  }, []);

  // Panel management
  const toggleSidebar = React.useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleFullscreen = React.useCallback((panelId: string) => {
    setFullscreenPanel(prev => prev === panelId ? null : panelId);
  }, []);

  const changePanelLayout = React.useCallback((layout: PanelLayout) => {
    setPanelLayout(layout);
    // Adjust panel sizes based on layout
    switch (layout) {
      case 'wide-main':
        setPanelSizes({ sidebar: 20, main: 65, table: 15 });
        break;
      case 'wide-sidebar':
        setPanelSizes({ sidebar: 35, main: 40, table: 25 });
        break;
      case 'full-table':
        setPanelSizes({ sidebar: 15, main: 25, table: 60 });
        break;
      default:
        setPanelSizes({ sidebar: 25, main: 50, table: 25 });
    }
  }, []);

  // Auto-refresh functionality
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Trigger data refresh here
      console.log('Auto-refreshing enterprise analytics...');
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Breadcrumb component for drill-down navigation
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={resetToOverview}
        className="p-0 h-auto text-sm hover:text-primary"
      >
        Overview
      </Button>
      {drillDown.path.slice(1).map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3 w-3" />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              const targetLevel = index === 0 ? 'category' : 
                                index === 1 ? 'individual' : 
                                index === 2 ? 'deep' : 'actions';
              const newPath = drillDown.path.slice(0, index + 2);
              setDrillDown(prev => ({ ...prev, level: targetLevel, path: newPath }));
            }}
            className="p-0 h-auto text-sm hover:text-primary"
          >
            {item}
          </Button>
        </React.Fragment>
      ))}
    </div>
  );

  // Toolbar component
  const Toolbar = () => (
    <div className="flex items-center justify-between gap-4 p-4 border-b bg-card">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="text-muted-foreground"
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        
        <Breadcrumb />
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search across all metrics..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  size="sm"
                />
                Auto-refresh
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Automatically refresh data every {refreshInterval} seconds</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Select value={panelLayout} onValueChange={changePanelLayout}>
          <SelectTrigger className="w-32">
            <Layout className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Balanced</SelectItem>
            <SelectItem value="wide-main">Wide Charts</SelectItem>
            <SelectItem value="wide-sidebar">Wide Sidebar</SelectItem>
            <SelectItem value="full-table">Full Table</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="sm">
          <Share className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (loading && !analyticsData.kpis.length) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-sm text-muted-foreground">
            Loading enterprise analytics dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Global KPI Header */}
      <AnalyticsKpiHeader 
        tickets={tickets}
        prediction={prediction}
        timeframe={activeFilters.find(f => f.id === 'timeframe')?.value || '7d'}
        onDrillDown={navigateTo}
      />

      {/* Toolbar */}
      <Toolbar />

      {/* Main Dashboard Layout */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Sidebar - Metrics Tree */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel 
                defaultSize={panelSizes.sidebar} 
                minSize={15} 
                maxSize={40}
                className="bg-card border-r"
              >
                <AnalyticsMetricsTree
                  drillDown={drillDown}
                  filters={activeFilters}
                  onNavigate={navigateTo}
                  onFilterChange={updateFilter}
                  tickets={tickets}
                  collapsed={false}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Main Content Area */}
          <ResizablePanelGroup direction="vertical" className="flex-1">
            {/* Charts and Visualizations */}
            <ResizablePanel 
              defaultSize={panelSizes.main} 
              minSize={30}
              className="bg-background"
            >
              <AnalyticsMainGrid
                drillDown={drillDown}
                tickets={tickets}
                prediction={prediction}
                viewMode={viewMode}
                onDrillDown={navigateTo}
                onTicketSelect={onTicketSelect}
                filters={activeFilters}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Data Table */}
            <ResizablePanel 
              defaultSize={panelSizes.table} 
              minSize={20}
              className="bg-card border-t"
            >
              <AnalyticsDataTable
                drillDown={drillDown}
                tickets={tickets}
                onDrillDown={navigateTo}
                onTicketSelect={onTicketSelect}
                filters={activeFilters}
                searchQuery={globalSearch}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};