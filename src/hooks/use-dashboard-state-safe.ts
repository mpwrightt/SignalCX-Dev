"use client";

import * as React from "react";
import { subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useSettings } from "@/hooks/use-settings";

export type DashboardMode = 
  | 'dashboard' 
  | 'explorer' 
  | 'users' 
  | 'agents' 
  | 'coaching' 
  | 'clustering' 
  | 'social' 
  | 'ai-search' 
  | 'diagnostics' 
  | 'advanced-analytics' 
  | 'predictive' 
  | 'team-management';

export type TopLevelFilterState = {
  sentiment: "all" | "Positive" | "Neutral" | "Negative";
  status: "all" | "new" | "open" | "pending" | "on-hold" | "solved" | "closed";
};

export type SortConfig = {
  key: string | null;
  direction: "ascending" | "descending";
};

export function useDashboardStateSafe() {
  const { settings, isLoaded: settingsLoaded } = useSettings();

  // Core state with stable initial values
  const [mode, setMode] = React.useState<DashboardMode>('dashboard');
  const [activeView, setActiveView] = React.useState<string>("All Views");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  
  // Date range with stable default
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => ({
    from: subDays(new Date(), 29),
    to: new Date(),
  }));

  // Filter state with stable defaults
  const [activeFilters, setActiveFilters] = React.useState<TopLevelFilterState>(() => ({
    sentiment: "all",
    status: "all",
  }));

  // Sort config with stable defaults
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(() => ({
    key: "created_at",
    direction: "descending",
  }));

  // Available views
  const [availableViews, setAvailableViews] = React.useState<string[]>([]);
  const [viewsLoading, setViewsLoading] = React.useState(true);

  // Apply settings only once when loaded
  const [settingsApplied, setSettingsApplied] = React.useState(false);
  React.useEffect(() => {
    if (settingsLoaded && !settingsApplied && settings) {
      setMode(settings.defaultPageOnLoad || 'dashboard');
      setSortConfig({
        key: settings.defaultTicketSort || "created_at",
        direction: settings.defaultTicketSortDirection || "descending",
      });
      setSettingsApplied(true);
    }
  }, [settingsLoaded, settingsApplied, settings]);

  // Memoized helper functions
  const resetSearch = React.useCallback(() => {
    setSearchTerm("");
  }, []);

  const resetFilters = React.useCallback(() => {
    setActiveFilters({
      sentiment: "all",
      status: "all",
    });
  }, []);

  // Memoized return object to prevent unnecessary re-renders
  return React.useMemo(() => ({
    // Core state
    mode,
    setMode,
    activeView,
    setActiveView,
    searchTerm,
    setSearchTerm,
    loading,
    setLoading,
    isAnalyzing,
    setIsAnalyzing,
    
    // Date and view state
    dateRange,
    setDateRange,
    availableViews,
    setAvailableViews,
    viewsLoading,
    setViewsLoading,

    // Filter state
    activeFilters,
    setActiveFilters,
    sortConfig,
    setSortConfig,

    // Helper functions
    resetSearch,
    resetFilters,

    // Settings state
    settingsApplied,
  }), [
    mode,
    activeView,
    searchTerm,
    loading,
    isAnalyzing,
    dateRange,
    availableViews,
    viewsLoading,
    activeFilters,
    sortConfig,
    resetSearch,
    resetFilters,
    settingsApplied,
  ]);
}