"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Calendar, Filter } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useDashboardStateSafe } from "@/hooks/use-dashboard-state-safe";
import { useDashboardDataSafe } from "@/hooks/use-dashboard-data-safe";
import { DashboardSidebarEnhanced } from "@/components/dashboard/dashboard-sidebar-enhanced";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardMainEnhanced() {
  const { user, logout, isLoading: authLoading, sessionMode } = useAuth();
  const router = useRouter();
  const dashboardState = useDashboardStateSafe();
  const dashboardData = useDashboardDataSafe();

  // Track when we've loaded tickets for the first time
  const [hasLoadedTickets, setHasLoadedTickets] = React.useState(false);
  const [trendSummary, setTrendSummary] = React.useState<string>("");

  // Auth redirect effect
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Load tickets when component mounts or key dependencies change
  React.useEffect(() => {
    if (sessionMode && dashboardState.dateRange && !hasLoadedTickets) {
      dashboardData.fetchTickets(
        dashboardState.activeView,
        dashboardState.dateRange,
        dashboardState.setLoading
      );
      setHasLoadedTickets(true);
    }
  }, [sessionMode, dashboardState.dateRange, dashboardState.activeView, hasLoadedTickets, dashboardData, dashboardState]);

  // Generate trend summary when tickets are loaded
  React.useEffect(() => {
    if (dashboardData.tickets.length > 0 && !trendSummary) {
      dashboardData.generateTrendSummary(dashboardData.tickets, setTrendSummary);
    }
  }, [dashboardData.tickets, dashboardData, trendSummary]);

  // Filter tickets based on search term and filters (MUST be before early return)
  const filteredTickets = React.useMemo(() => {
    let filtered = dashboardData.tickets;

    // Apply search filter
    if (dashboardState.searchTerm) {
      const searchLower = dashboardState.searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.assignee?.toLowerCase().includes(searchLower) ||
        ticket.requester?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (dashboardState.activeFilters.status !== "all") {
      filtered = filtered.filter(ticket => ticket.status === dashboardState.activeFilters.status);
    }

    // Apply sentiment filter
    if (dashboardState.activeFilters.sentiment !== "all") {
      filtered = filtered.filter(ticket => ticket.sentiment === dashboardState.activeFilters.sentiment);
    }

    return filtered;
  }, [dashboardData.tickets, dashboardState.searchTerm, dashboardState.activeFilters]);

  // Show loading state during authentication (MUST be after all hooks)
  if (authLoading || !user || !sessionMode) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render content based on dashboard mode
  const renderModeContent = () => {
    switch (dashboardState.mode) {
      case 'dashboard':
        return (
          <>
            {/* Trend Summary */}
            {trendSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trend Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{trendSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Tickets Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Tickets
                  <Badge variant="secondary">{filteredTickets.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardState.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading tickets...</span>
                  </div>
                ) : filteredTickets.length > 0 ? (
                  <div className="space-y-2">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{ticket.subject}</h4>
                          <p className="text-sm text-muted-foreground">
                            {ticket.assignee} • {ticket.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={ticket.sentiment === 'Positive' ? 'default' : 
                                   ticket.sentiment === 'Negative' ? 'destructive' : 'secondary'}
                          >
                            {ticket.sentiment}
                          </Badge>
                          <Badge variant="outline">{ticket.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {dashboardData.tickets.length === 0 
                        ? "No tickets available" 
                        : "No tickets match your search criteria"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        );

      case 'explorer':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Explorer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Enhanced ticket browsing and search functionality coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'users':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                User profile management and analytics coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'agents':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Agent performance metrics and KPIs coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'predictive':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Predictive Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AI-powered predictions and forecasting coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'advanced-analytics':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Deep dive analytics and custom reports coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'coaching':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manager Coaching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AI-powered coaching insights for managers coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'clustering':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Clustering</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Machine learning ticket clustering analysis coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'social':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Social Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Social media sentiment and intelligence coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'ai-search':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Search</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Natural language AI-powered search coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'diagnostics':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                System health and performance diagnostics coming soon...
              </p>
            </CardContent>
          </Card>
        );

      case 'team-management':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Team administration and role management coming soon...
              </p>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Select a dashboard mode from the sidebar to get started.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-row bg-muted/40">
      <DashboardSidebarEnhanced
        mode={dashboardState.mode}
        onModeChange={dashboardState.setMode}
        onViewChange={dashboardState.setActiveView}
        user={user}
        sessionMode={sessionMode}
        onLogout={logout}
      />
        
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Dashboard - {dashboardState.mode}</h1>
              <p className="text-sm text-muted-foreground">Active View: {dashboardState.activeView}</p>
            </div>
            <div className="flex items-center gap-2">
              {dashboardState.loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Badge variant="outline">
                {filteredTickets.length} of {dashboardData.tickets.length} tickets
              </Badge>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={dashboardState.searchTerm}
                onChange={(e) => dashboardState.setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={dashboardState.activeFilters.status}
              onValueChange={(value) => 
                dashboardState.setActiveFilters(prev => ({ 
                  ...prev, 
                  status: value as any 
                }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="on-hold">On-hold</SelectItem>
                <SelectItem value="solved">Solved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sentiment Filter */}
            <Select
              value={dashboardState.activeFilters.sentiment}
              onValueChange={(value) => 
                dashboardState.setActiveFilters(prev => ({ 
                  ...prev, 
                  sentiment: value as any 
                }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="Positive">Positive</SelectItem>
                <SelectItem value="Neutral">Neutral</SelectItem>
                <SelectItem value="Negative">Negative</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => dashboardData.fetchTickets(
                dashboardState.activeView, 
                dashboardState.dateRange, 
                dashboardState.setLoading
              )}
              disabled={dashboardState.loading}
            >
              Refresh
            </Button>

            {/* Clear Filters */}
            {(dashboardState.searchTerm || 
              dashboardState.activeFilters.status !== "all" || 
              dashboardState.activeFilters.sentiment !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  dashboardState.resetSearch();
                  dashboardState.resetFilters();
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        
        <main className="flex-1 p-4 space-y-4">
          {renderModeContent()}
        </main>
      </div>
    </div>
  );
}