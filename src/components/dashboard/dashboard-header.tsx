"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Search, X, Sparkles, Wifi, WifiOff } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { FilterControls } from "@/components/dashboard/filter-controls";
import { DashboardMode } from "@/hooks/use-dashboard-state";
import {
  TopLevelFilterState,
  DrilldownFilterState,
} from "@/lib/types/dashboard";

interface DashboardHeaderProps {
  mode: DashboardMode;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  activeView: string;
  availableViews: string[];
  onViewChange: (view: string) => void;
  viewsLoading: boolean;
  
  // Filter states
  activeFilters: TopLevelFilterState;
  onActiveFiltersChange: (filters: TopLevelFilterState) => void;
  drilldownFilters: DrilldownFilterState;
  onDrilldownFiltersChange: (filters: DrilldownFilterState) => void;
  
  // Analysis state
  isAnalyzing: boolean;
  analysisProgress: number;
  selectedRowIds: Set<number>;
  onAnalyzeSelected: () => void;
  onClearSelection: () => void;
  
  // Utilities
  hasDrilldownFilter: boolean;
  onClearDrilldownFilters: () => void;
  onResetSearch: () => void;
  onResetFilters: () => void;
  isOnline: boolean;
  
  // Filter options
  filterOptions: {
    categories: string[];
    priorities: string[];
    tags: string[];
    statuses: string[];
  };
}

export function DashboardHeader({
  mode,
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  activeView,
  availableViews,
  onViewChange,
  viewsLoading,
  activeFilters,
  onActiveFiltersChange,
  drilldownFilters,
  onDrilldownFiltersChange,
  isAnalyzing,
  analysisProgress,
  selectedRowIds,
  onAnalyzeSelected,
  onClearSelection,
  hasDrilldownFilter,
  onClearDrilldownFilters,
  onResetSearch,
  onResetFilters,
  isOnline,
  filterOptions,
}: DashboardHeaderProps) {
  const getModeTitle = (currentMode: DashboardMode): string => {
    switch (currentMode) {
      case 'dashboard': return 'Dashboard';
      case 'explorer': return 'Ticket Explorer';
      case 'users': return 'User Management';
      case 'agents': return 'Agent Performance';
      case 'coaching': return 'Coaching Insights';
      case 'clustering': return 'Ticket Clustering';
      case 'social': return 'Social Intelligence';
      case 'ai-search': return 'AI Search';
      case 'diagnostics': return 'Diagnostics';
      case 'advanced-analytics': return 'Advanced Analytics';
      case 'predictive': return 'Predictive Analytics';
      case 'team-management': return 'Team Management';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      {/* Page Title and Status */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">{getModeTitle(mode)}</h1>
        {!isOnline && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        )}
        {isOnline && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            Online
          </Badge>
        )}
      </div>

      <div className="flex-1" />

      {/* Main Actions and Filters */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 pl-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-6 w-6 p-0"
              onClick={onResetSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* View Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={viewsLoading}>
              {viewsLoading ? "Loading..." : activeView}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Available Views</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableViews.map((view) => (
              <DropdownMenuItem
                key={view}
                onClick={() => onViewChange(view)}
                className={activeView === view ? "bg-accent" : ""}
              >
                {view}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Explorer Mode Actions */}
        {mode === 'explorer' && selectedRowIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedRowIds.size} selected
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAnalyzeSelected}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClearSelection}>
                  Clear Selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Clear Drilldown Filters */}
        {mode === 'explorer' && hasDrilldownFilter && (
          <Button variant="ghost" onClick={onClearDrilldownFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}

        {/* Reset All Button */}
        {(searchTerm || hasDrilldownFilter || activeFilters.sentiment !== "all" || activeFilters.status !== "all") && (
          <Button variant="outline" onClick={onResetFilters}>
            Reset All
          </Button>
        )}
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="absolute top-16 left-0 right-0 z-50 bg-background border-b p-2">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              <span className="text-sm font-medium">Analyzing tickets...</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        </div>
      )}
    </header>
  );
}

interface DashboardFiltersProps {
  mode: DashboardMode;
  activeFilters: TopLevelFilterState;
  onActiveFiltersChange: (filters: TopLevelFilterState) => void;
  drilldownFilters: DrilldownFilterState;
  onDrilldownFiltersChange: (filters: DrilldownFilterState) => void;
  filterOptions: {
    categories: string[];
    priorities: string[];
    tags: string[];
    statuses: string[];
  };
}

export function DashboardFilters({
  mode,
  activeFilters,
  onActiveFiltersChange,
  drilldownFilters,
  onDrilldownFiltersChange,
  filterOptions,
}: DashboardFiltersProps) {
  if (mode === 'dashboard') {
    return (
      <div className="border-b px-4 py-2">
        <FilterControls
          filters={activeFilters}
          onFiltersChange={onActiveFiltersChange}
          showDrilldown={false}
          drilldownFilters={drilldownFilters}
          onDrilldownFiltersChange={onDrilldownFiltersChange}
          filterOptions={filterOptions}
        />
      </div>
    );
  }

  if (mode === 'explorer') {
    return (
      <div className="border-b px-4 py-2">
        <FilterControls
          filters={activeFilters}
          onFiltersChange={onActiveFiltersChange}
          showDrilldown={true}
          drilldownFilters={drilldownFilters}
          onDrilldownFiltersChange={onDrilldownFiltersChange}
          filterOptions={filterOptions}
        />
      </div>
    );
  }

  return null;
}