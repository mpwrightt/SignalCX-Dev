"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TicketConversationSheet } from "@/components/ticket-conversation-sheet";
import { UserProfileSheet } from "@/components/user-profile-sheet";
import { AgentProfileSheet } from "@/components/agent-profile-sheet";
import { FilterControls } from "@/components/dashboard/filter-controls";

// Import extracted components and utilities
import { usePageState } from "@/hooks/use-page-state";
import { createPageHandlers } from "@/lib/page-handlers";
import { MainSidebar } from "@/components/MainSidebar";
import { ViewRouter } from "@/components/ViewRouter";
import { getLocalCachedAnalyses, setLocalCachedAnalyses } from "@/lib/page-utils";

export default function DashboardPage() {
  const {
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
  } = usePageState();

  // Create event handlers
  const handlers = createPageHandlers(
    setSortConfig,
    setSelectedRowIds,
    setDrilldownFilters,
    setSelectedTicketInfo,
    setError,
    (event: string, data?: any) => logEvent('received', event, data)
  );

  // Network status
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Logout handler
  const handleLogout = async () => {
    // TODO: Implement logout logic
    logEvent('received', 'user_logout', {});
  };

  // Ticket update handler
  const onTicketUpdate = React.useCallback((ticketId: number, updates: any) => {
    setTickets(current =>
      current.map(t =>
        t.id === ticketId ? { ...t, ...updates } : t
      )
    );
    
    setSelectedTicketInfo(currentInfo => {
      if (currentInfo && currentInfo.ticket.id === ticketId) {
        return {
          ...currentInfo,
          ticket: {
            ...currentInfo.ticket,
            ...updates
          }
        };
      }
      return currentInfo;
    });

    // Cache the analysis
    const { sentiment, category, summary } = updates;
    const analysisToCache: any = {};
    if (sentiment) analysisToCache.sentiment = sentiment;
    if (category) analysisToCache.category = category;
    if (summary) analysisToCache.summary = summary;
    
    if (Object.keys(analysisToCache).length > 0) {
      const existingCache = getLocalCachedAnalyses([ticketId])[ticketId] || {};
      const finalCacheObject = { ...existingCache, ...analysisToCache };
      setLocalCachedAnalyses({ [ticketId]: finalCacheObject });
    }
  }, [setTickets, setSelectedTicketInfo]);

  // Loading state
  if (authLoading || !settingsLoaded || !user || !sessionMode) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => setError(null)}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-row bg-muted/40">
                     <MainSidebar
             sessionMode={sessionMode}
             mode={mode}
             setMode={(mode: string) => setMode(mode as any)}
             setActiveView={setActiveView}
             onLogout={handleLogout}
             isOnline={isOnline}
           />
          
          <SidebarInset>
            <main className="flex flex-col gap-4 p-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold">
                    {mode === 'dashboard' ? 'Dashboard' : 
                     mode === 'explorer' ? 'Ticket Explorer' :
                     mode === 'users' ? 'User Management' :
                     mode === 'agents' ? 'Agent Performance' :
                     mode === 'predictive' ? 'Predictive Analysis' :
                     mode === 'advanced-analytics' ? 'Advanced Analytics' :
                     mode === 'coaching' ? 'Manager Coaching' :
                     mode === 'clustering' ? 'Ticket Clustering' :
                     mode === 'social' ? 'Social Intelligence' :
                     mode === 'ai-search' ? 'AI Search' :
                     mode === 'diagnostics' ? 'Diagnostics' :
                     mode === 'team-management' ? 'Team Management' :
                     'Dashboard'}
                  </h1>
                  
                  {loading && (
                    <div className="flex items-center gap-2 w-full max-w-[300px]">
                      <Progress value={analysisProgress} className="w-full" />
                      <span className="text-sm text-muted-foreground">
                        {Math.round(analysisProgress)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {mode === 'explorer' && selectedRowIds.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Bulk Actions ({selectedRowIds.size})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Change Status</DropdownMenuItem>
                        <DropdownMenuItem>Add Tag</DropdownMenuItem>
                        <DropdownMenuItem>Assign to Agent</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  {mode === 'explorer' && hasDrilldownFilter && (
                    <Button variant="ghost" onClick={handlers.clearDrilldownFilters}>
                      <X className="mr-2 h-4 w-4" />
                      Clear Drilldown Filters
                    </Button>
                  )}
                  
                  {mode !== 'users' && mode !== 'agents' && mode !== 'diagnostics' && (
                    <FilterControls
                      activeFilters={activeFilters}
                      setActiveFilters={setActiveFilters}
                      activeView={activeView}
                      setActiveView={setActiveView}
                      availableViews={availableViews}
                      dateRange={dateRange}
                      setDateRange={setDateRange}
                      loading={loading}
                    />
                  )}
                </div>
              </div>

              {/* Main Content */}
              <ViewRouter
                mode={mode}
                tickets={tickets}
                sortedTickets={sortedTickets}
                dashboardFilteredTickets={dashboardFilteredTickets}
                dateFilteredTickets={dateFilteredTickets}
                loading={loading}
                settings={settings}
                sessionMode={sessionMode}
                ticketVolumeData={ticketVolumeData}
                prediction={prediction}
                isAnalyzed={isAnalyzed}
                isDeepAnalyzed={isDeepAnalyzed}
                coachingInsights={coachingInsights}
                ticketClusters={ticketClusters}
                activeDashboardTab={activeDashboardTab}
                setActiveDashboardTab={setActiveDashboardTab}
                componentRenderers={componentRenderers}
                selectionState={selectionState}
                selectedRowIds={selectedRowIds}
                requestSort={handlers.requestSort}
                getSortIcon={handlers.getSortIcon}
                handleSelectAll={handlers.handleSelectAll}
                handleSelectRow={handlers.handleSelectRow}
                setSelectedTicketInfo={setSelectedTicketInfo}
                setSelectedUser={setSelectedUser}
                setSelectedAgent={setSelectedAgent}
              />
            </main>
          </SidebarInset>

          {/* Sheets */}
          <TicketConversationSheet
            info={selectedTicketInfo}
            onOpenChange={(open) => !open && setSelectedTicketInfo(null)}
            onTicketUpdate={onTicketUpdate}
          />
          <UserProfileSheet
            user={selectedUser}
            onOpenChange={(open) => !open && setSelectedUser(null)}
            onTicketSelect={(info) => setSelectedTicketInfo(info)}
          />
          <AgentProfileSheet
            agent={selectedAgent}
            onOpenChange={(open) => !open && setSelectedAgent(null)}
            onTicketSelect={(info) => setSelectedTicketInfo(info)}
          />
        </div>
      </SidebarProvider>
    </>
  );
} 