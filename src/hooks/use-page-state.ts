import * as React from "react";
import { useAuth } from "./use-auth";
import { useSettings } from "./use-settings";
import { useDiagnostics } from "./use-diagnostics";
import { useToast } from "./use-toast";
import type { DateRange } from "react-day-picker";
import type { 
  AnalyzedTicket, 
  UserProfile, 
  AgentProfile, 
  AuthenticatedUser,
  PredictiveAnalysisOutput,
  CoachingInsight,
  TicketCluster
} from "@/lib/types";
import type { SortConfig, TopLevelFilterState, DrilldownFilterState, SelectedTicketInfo } from "@/lib/page-utils";

export function usePageState() {
  const { user, isLoading: authLoading } = useAuth();
  const { settings, updateSettings } = useSettings();
  const settingsLoaded = true; // TODO: Add proper loading state from settings
  const { logEvent } = useDiagnostics();
  const { toast } = useToast();

  // Mode and view state
  const [mode, setMode] = React.useState<'dashboard' | 'explorer' | 'users' | 'agents' | 'predictive' | 'advanced-analytics' | 'coaching' | 'clustering' | 'social' | 'ai-search' | 'diagnostics' | 'team-management'>('dashboard');
  const [activeView, setActiveView] = React.useState<string>("All Views");
  const [activeDashboardTab, setActiveDashboardTab] = React.useState<string>("overview");

  // Data state
  const [tickets, setTickets] = React.useState<AnalyzedTicket[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sessionMode, setSessionMode] = React.useState<'demo' | 'enterprise'>('demo');

  // Filter and sort state
  const [activeFilters, setActiveFilters] = React.useState<TopLevelFilterState>({
    sentiment: "all",
    status: "all"
  });
  const [drilldownFilters, setDrilldownFilters] = React.useState<DrilldownFilterState>({
    category: "all",
    priority: "all", 
    tag: "all",
    sentiment: "all"
  });
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: null,
    direction: "ascending"
  });
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<number>>(new Set());
  const [selectedTicketInfo, setSelectedTicketInfo] = React.useState<SelectedTicketInfo | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
  const [selectedAgent, setSelectedAgent] = React.useState<AgentProfile | null>(null);

  // Analysis state
  const [isAnalyzed, setIsAnalyzed] = React.useState(false);
  const [isDeepAnalyzed, setIsDeepAnalyzed] = React.useState(false);
  const [analysisProgress, setAnalysisProgress] = React.useState(0);
  const [prediction, setPrediction] = React.useState<PredictiveAnalysisOutput | null>(null);
  const [coachingInsights, setCoachingInsights] = React.useState<CoachingInsight[]>([]);
  const [ticketClusters, setTicketClusters] = React.useState<TicketCluster[]>([]);

  // Views and data
  const [availableViews, setAvailableViews] = React.useState<any[]>([]);
  const [ticketVolumeData, setTicketVolumeData] = React.useState<{ date: string; count: number }[]>([]);
  const [componentRenderers, setComponentRenderers] = React.useState<Record<string, React.ComponentType<any>>>({});

  // Computed state
  const hasDrilldownFilter = React.useMemo(() => {
    return drilldownFilters.category !== "all" || 
           drilldownFilters.priority !== "all" || 
           drilldownFilters.tag !== "all" || 
           drilldownFilters.sentiment !== "all";
  }, [drilldownFilters]);

  const selectionState = React.useMemo(() => {
    const totalRows = tickets.length;
    const selectedRows = selectedRowIds.size;
    
    if (selectedRows === 0) return "none";
    if (selectedRows === totalRows) return "all";
    return "partial";
  }, [selectedRowIds, tickets.length]);

  // Filtered data
  const dateFilteredTickets = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return tickets;
    
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return ticketDate >= dateRange.from! && ticketDate <= dateRange.to!;
    });
  }, [tickets, dateRange]);

  const dashboardFilteredTickets = React.useMemo(() => {
    return dateFilteredTickets.filter(ticket => {
      const matchesSentiment = activeFilters.sentiment === "all" || ticket.sentiment === activeFilters.sentiment;
      const matchesStatus = activeFilters.status === "all" || ticket.status === activeFilters.status;
      return matchesSentiment && matchesStatus;
    });
  }, [dateFilteredTickets, activeFilters]);

  const sortedTickets = React.useMemo(() => {
    if (!sortConfig.key) return dashboardFilteredTickets;
    
    return [...dashboardFilteredTickets].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key!];
      const bValue = (b as any)[sortConfig.key!];
      
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [dashboardFilteredTickets, sortConfig]);

  return {
    // Auth and settings
    user,
    authLoading,
    settings,
    updateSettings,
    settingsLoaded,
    logEvent,
    toast,
    
    // Mode and view state
    mode,
    setMode,
    activeView,
    setActiveView,
    activeDashboardTab,
    setActiveDashboardTab,
    
    // Data state
    tickets,
    setTickets,
    loading,
    setLoading,
    error,
    setError,
    sessionMode,
    setSessionMode,
    
    // Filter and sort state
    activeFilters,
    setActiveFilters,
    drilldownFilters,
    setDrilldownFilters,
    sortConfig,
    setSortConfig,
    dateRange,
    setDateRange,
    
    // Selection state
    selectedRowIds,
    setSelectedRowIds,
    selectedTicketInfo,
    setSelectedTicketInfo,
    selectedUser,
    setSelectedUser,
    selectedAgent,
    setSelectedAgent,
    
    // Analysis state
    isAnalyzed,
    setIsAnalyzed,
    isDeepAnalyzed,
    setIsDeepAnalyzed,
    analysisProgress,
    setAnalysisProgress,
    prediction,
    setPrediction,
    coachingInsights,
    setCoachingInsights,
    ticketClusters,
    setTicketClusters,
    
    // Views and data
    availableViews,
    setAvailableViews,
    ticketVolumeData,
    setTicketVolumeData,
    componentRenderers,
    setComponentRenderers,
    
    // Computed state
    hasDrilldownFilter,
    selectionState,
    dateFilteredTickets,
    dashboardFilteredTickets,
    sortedTickets
  };
} 