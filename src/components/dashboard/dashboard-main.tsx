"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useDashboardState } from "@/hooks/use-dashboard-state";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";

// Temporarily removed complex sidebar components
import { DashboardSidebarSimple } from "@/components/dashboard/dashboard-sidebar-simple";
import { DashboardHeader, DashboardFilters } from "@/components/dashboard/dashboard-header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardMain() {
  const { user, logout, isLoading: authLoading, sessionMode } = useAuth();
  const router = useRouter();
  const isOnline = true; // Network status is handled automatically by Supabase

  // Temporarily disable complex hooks to debug infinite loop
  // const dashboardState = useDashboardState();
  // const dashboardData = useDashboardData();
  
  // // Use filtering hook
  // const {
  //   dashboardFilteredTickets,
  //   drilldownFilteredTickets,
  //   filterOptions,
  // } = useDashboardFilters(
  //   dashboardState.tickets,
  //   dashboardState.searchTerm,
  //   dashboardState.activeFilters,
  //   dashboardState.drilldownFilters,
  //   dashboardState.sortConfig
  // );

  // Temporary simple state
  const [mode, setMode] = React.useState('dashboard');
  const [activeView, setActiveView] = React.useState('All Views');

  // Auth redirect effect
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);
  
  // Temporarily disabled - loading views feature

  // Temporarily disabled - fetching tickets feature

  // Generate trend summary when tickets are loaded
  React.useEffect(() => {
    if (dashboardState.tickets.length > 0 && dashboardState.mode === 'dashboard') {
      dashboardData.generateTrendSummary(
        dashboardState.tickets,
        dashboardState.setTrendSummary,
        dashboardState.setSummaryLoading
      );
    }
  }, [dashboardState.tickets, dashboardState.mode, dashboardData, dashboardState]);

  // Generate analysis data based on mode
  React.useEffect(() => {
    if (dashboardState.tickets.length === 0 || dashboardState.loading) return;

    switch (dashboardState.mode) {
      case 'predictive':
        dashboardData.generatePredictiveAnalysis(
          dashboardState.tickets,
          dashboardState.setPrediction
        );
        break;
      case 'coaching':
        dashboardData.generateCoachingInsights(
          dashboardState.tickets,
          dashboardState.setCoachingInsights
        );
        break;
      case 'clustering':
        dashboardData.generateTicketClusters(
          dashboardState.tickets,
          dashboardState.setTicketClusters
        );
        break;
      case 'advanced-analytics':
        dashboardData.generatePerformanceForecasts(
          dashboardState.tickets,
          dashboardState.setPerformanceForecasts
        );
        break;
    }
  }, [
    dashboardState.tickets,
    dashboardState.mode,
    dashboardState.loading,
    dashboardData,
    dashboardState
  ]);

  // Handler functions
  const handleAnalyzeSelected = () => {
    if (dashboardState.selectedRowIds.size > 0) {
      dashboardData.analyzeSelectedTickets(
        Array.from(dashboardState.selectedRowIds),
        dashboardState.tickets,
        dashboardState.setIsAnalyzing,
        dashboardState.setAnalysisProgress
      );
    }
  };

  const handleClearSelection = () => {
    dashboardState.setSelectedRowIds(new Set());
  };

  // Show loading state during authentication
  if (authLoading || !user || !sessionMode) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-row bg-muted/40">
      <DashboardSidebarSimple
        mode={mode}
        onModeChange={setMode}
        onViewChange={setActiveView}
        user={user}
        sessionMode={sessionMode}
        onLogout={logout}
      />
        
        <div className="flex flex-col flex-1">
          <div className="border-b bg-background p-4">
            <h1 className="text-2xl font-bold">Dashboard - {mode}</h1>
            <p className="text-sm text-muted-foreground">Active View: {activeView}</p>
          </div>
          
          <main className="flex-1 p-4">
            <div className="text-center">
              <p>Dashboard content for mode: {mode}</p>
              <p>Debugging infinite loop issue...</p>
            </div>
          </main>
        </div>
      </div>
  );
}
