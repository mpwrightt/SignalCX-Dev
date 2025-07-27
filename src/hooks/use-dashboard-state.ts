"use client";

import * as React from "react";
import { subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  AnalyzedTicket,
  UserProfile,
  AgentProfile,
  PredictiveAnalysisOutput,
  CoachingInsight,
  TicketCluster,
  AtRiskTicket,
} from "@/lib/types";
import {
  SortConfig,
  TopLevelFilterState,
  DrilldownFilterState,
  SelectedTicketInfo,
} from "@/lib/types/dashboard";
import { useSettings } from "@/hooks/use-settings";

export type DashboardMode = 'dashboard' | 'explorer' | 'users' | 'agents' | 'coaching' | 'clustering' | 'social' | 'ai-search' | 'diagnostics' | 'advanced-analytics' | 'predictive' | 'team-management';

export function useDashboardState() {
  const { settings, isLoaded: settingsLoaded } = useSettings();

  // Core state
  const [tickets, setTickets] = React.useState<AnalyzedTicket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisProgress, setAnalysisProgress] = React.useState(0);
  const [isAnalyzed, setIsAnalyzed] = React.useState(false);
  const [isDeepAnalyzed, setIsDeepAnalyzed] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [mode, setMode] = React.useState<DashboardMode>('dashboard');
  const [activeView, setActiveView] = React.useState<string>("All Views");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [availableViews, setAvailableViews] = React.useState<string[]>([]);
  const [viewsLoading, setViewsLoading] = React.useState(true);

  // Filter state
  const [activeFilters, setActiveFilters] = React.useState<TopLevelFilterState>({
    sentiment: "all",
    status: "all",
  });
  
  const [drilldownFilters, setDrilldownFilters] = React.useState<DrilldownFilterState>({
    category: "all",
    priority: "all",
    tag: "all",
    sentiment: "all",
  });

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: "created_at",
    direction: "descending",
  });
  const [activeDashboardTab, setActiveDashboardTab] = React.useState('snapshot');

  // Selection state
  const [selectedTicketInfo, setSelectedTicketInfo] = React.useState<SelectedTicketInfo | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
  const [selectedAgent, setSelectedAgent] = React.useState<AgentProfile | null>(null);
  const [selectedAgentBackend, setSelectedAgentBackend] = React.useState<AgentProfile | null>(null);
  const [agentBackendLoading, setAgentBackendLoading] = React.useState(false);
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<number>>(new Set());
  
  // Analysis state
  const [trendSummary, setTrendSummary] = React.useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [prediction, setPrediction] = React.useState<PredictiveAnalysisOutput | null>(null);
  const [coachingInsights, setCoachingInsights] = React.useState<CoachingInsight[]>([]);
  const [ticketClusters, setTicketClusters] = React.useState<TicketCluster[]>([]);
  const [performanceForecasts, setPerformanceForecasts] = React.useState<any[]>([]);

  // Apply settings on load
  const [settingsApplied, setSettingsApplied] = React.useState(false);
  React.useEffect(() => {
    if (settingsLoaded && !settingsApplied) {
      setMode(settings.defaultPageOnLoad);
      setSortConfig({
        key: settings.defaultTicketSort,
        direction: settings.defaultTicketSortDirection,
      });
      setActiveDashboardTab(settings.defaultDashboardTab);
      setSettingsApplied(true);
    }
  }, [settingsLoaded, settingsApplied, settings.defaultPageOnLoad, settings.defaultTicketSort, settings.defaultTicketSortDirection, settings.defaultDashboardTab]);

  // Clear drilldown filters when switching to dashboard mode
  React.useEffect(() => {
    if (mode === 'dashboard') {
      setDrilldownFilters({
        category: "all",
        priority: "all",
        tag: "all",
        sentiment: "all",
      });
    }
  }, [mode]);

  // Helper functions
  const clearDrilldownFilters = () => {
    setDrilldownFilters({
      category: "all",
      priority: "all",
      tag: "all",
      sentiment: "all",
    });
  };

  const hasDrilldownFilter = 
    drilldownFilters.category !== "all" || 
    drilldownFilters.priority !== "all" || 
    drilldownFilters.tag !== "all" || 
    drilldownFilters.sentiment !== "all";

  const resetSearch = () => {
    setSearchTerm("");
  };

  const resetFilters = () => {
    setActiveFilters({
      sentiment: "all",
      status: "all",
    });
    clearDrilldownFilters();
  };

  return {
    // Core state
    tickets,
    setTickets,
    loading,
    setLoading,
    isAnalyzing,
    setIsAnalyzing,
    analysisProgress,
    setAnalysisProgress,
    isAnalyzed,
    setIsAnalyzed,
    isDeepAnalyzed,
    setIsDeepAnalyzed,
    searchTerm,
    setSearchTerm,
    mode,
    setMode,
    activeView,
    setActiveView,
    dateRange,
    setDateRange,
    availableViews,
    setAvailableViews,
    viewsLoading,
    setViewsLoading,

    // Filter state
    activeFilters,
    setActiveFilters,
    drilldownFilters,
    setDrilldownFilters,
    sortConfig,
    setSortConfig,
    activeDashboardTab,
    setActiveDashboardTab,

    // Selection state
    selectedTicketInfo,
    setSelectedTicketInfo,
    selectedUser,
    setSelectedUser,
    selectedAgent,
    setSelectedAgent,
    selectedAgentBackend,
    setSelectedAgentBackend,
    agentBackendLoading,
    setAgentBackendLoading,
    selectedRowIds,
    setSelectedRowIds,

    // Analysis state
    trendSummary,
    setTrendSummary,
    summaryLoading,
    setSummaryLoading,
    prediction,
    setPrediction,
    coachingInsights,
    setCoachingInsights,
    ticketClusters,
    setTicketClusters,
    performanceForecasts,
    setPerformanceForecasts,

    // Helper functions
    clearDrilldownFilters,
    hasDrilldownFilter,
    resetSearch,
    resetFilters,
  };
}