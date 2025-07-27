"use client";

import * as React from "react";
import {
  AnalyzedTicket,
  UserProfile,
  AgentProfile,
  PredictiveAnalysisOutput,
  CoachingInsight,
  TicketCluster,
  AuthenticatedUser,
} from "@/lib/types";
import { SelectedTicketInfo } from "@/lib/types/dashboard";
import { DashboardMode } from "@/hooks/use-dashboard-state";

// Import all view components
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { TicketExplorerView } from "@/components/dashboard/ticket-explorer-view";
import { UserManagementView } from "@/components/dashboard/user-management-view";
import { AgentPerformanceView } from "@/components/dashboard/agent-performance-view";
import { AgentBackendProfileView } from "@/components/dashboard/agent-backend-profile-view";
import { AdvancedAnalyticsView } from "@/components/dashboard/advanced-analytics-view";
import { CoachingView } from "@/components/dashboard/coaching-view";
import { ClusteringView } from "@/components/dashboard/clustering-view";
import { SocialIntelligenceView } from "@/components/dashboard/social-intelligence-view";
import { AISearchView } from "@/components/dashboard/ai-search-view";
import { DiagnosticsView } from "@/components/dashboard/diagnostics-view";
import { TeamManagement } from "@/components/dashboard/team-management";
import { TicketGenerator } from "@/components/dashboard/ticket-generator";
import { UserProfileSheet } from "@/components/user-profile-sheet";
import { AgentProfileSheet } from "@/components/agent-profile-sheet";
import { TicketConversationSheet } from "@/components/ticket-conversation-sheet";

interface DashboardContentProps {
  mode: DashboardMode;
  user: AuthenticatedUser;
  
  // Ticket data
  dashboardFilteredTickets: AnalyzedTicket[];
  drilldownFilteredTickets: AnalyzedTicket[];
  loading: boolean;
  
  // Selection states
  selectedTicketInfo: SelectedTicketInfo | null;
  onTicketSelect: (info: SelectedTicketInfo | null) => void;
  selectedUser: UserProfile | null;
  onUserSelect: (user: UserProfile | null) => void;
  selectedAgent: AgentProfile | null;
  onAgentSelect: (agent: AgentProfile | null) => void;
  selectedAgentBackend: AgentProfile | null;
  setSelectedAgentBackend: (agent: AgentProfile | null) => void;
  agentBackendLoading: boolean;
  setAgentBackendLoading: (loading: boolean) => void;
  
  // Analysis data
  trendSummary: string | null;
  summaryLoading: boolean;
  prediction: PredictiveAnalysisOutput | null;
  coachingInsights: CoachingInsight[];
  ticketClusters: TicketCluster[];
  performanceForecasts: any[];
  
  // Dashboard configuration
  activeDashboardTab: string;
  setActiveDashboardTab: (tab: string) => void;
  
  // Date range for analytics
  dateRange: any;
}

export function DashboardContent({
  mode,
  user,
  dashboardFilteredTickets,
  drilldownFilteredTickets,
  loading,
  selectedTicketInfo,
  onTicketSelect,
  selectedUser,
  onUserSelect,
  selectedAgent,
  onAgentSelect,
  selectedAgentBackend,
  setSelectedAgentBackend,
  agentBackendLoading,
  setAgentBackendLoading,
  trendSummary,
  summaryLoading,
  prediction,
  coachingInsights,
  ticketClusters,
  performanceForecasts,
  activeDashboardTab,
  setActiveDashboardTab,
  dateRange,
}: DashboardContentProps) {
  
  // Component renderers for dashboard view
  const componentRenderers = React.useMemo(() => ({
    TicketGenerator: () => <TicketGenerator />,
  }), []);

  const renderContent = () => {
    switch (mode) {
      case 'dashboard':
        return (
          <DashboardView 
            user={user}
            tickets={dashboardFilteredTickets}
            loading={loading}
            trendSummary={trendSummary}
            summaryLoading={summaryLoading}
            activeDashboardTab={activeDashboardTab}
            setActiveDashboardTab={setActiveDashboardTab}
            componentRenderers={componentRenderers}
          />
        );

      case 'explorer':
        return (
          <TicketExplorerView 
            tickets={drilldownFilteredTickets}
            loading={loading}
            selectedTicketInfo={selectedTicketInfo}
            onTicketSelect={onTicketSelect}
          />
        );

      case 'users':
        return (
          <UserManagementView 
            tickets={dashboardFilteredTickets} 
            loading={loading} 
            onUserSelect={onUserSelect} 
          />
        );

      case 'agents':
        return (
          <AgentPerformanceView 
            tickets={dashboardFilteredTickets} 
            loading={loading} 
            onAgentSelect={onAgentSelect} 
          />
        );

      case 'coaching':
        return (
          <CoachingView 
            tickets={dashboardFilteredTickets}
            coachingInsights={coachingInsights}
            loading={loading}
          />
        );

      case 'clustering':
        return (
          <ClusteringView 
            tickets={dashboardFilteredTickets}
            clusters={ticketClusters}
            loading={loading}
          />
        );

      case 'social':
        return (
          <SocialIntelligenceView 
            tickets={dashboardFilteredTickets}
            loading={loading}
          />
        );

      case 'ai-search':
        return (
          <AISearchView 
            tickets={dashboardFilteredTickets}
            loading={loading}
          />
        );

      case 'advanced-analytics':
        return (
          <AdvancedAnalyticsView 
            tickets={dashboardFilteredTickets}
            dateRange={dateRange}
            loading={loading}
          />
        );

      case 'predictive':
        return (
          <AdvancedAnalyticsView 
            tickets={dashboardFilteredTickets}
            dateRange={dateRange}
            loading={loading}
          />
        );

      case 'diagnostics':
        return <DiagnosticsView />;

      case 'team-management':
        return <TeamManagement />;

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Mode not implemented: {mode}</p>
          </div>
        );
    }
  };

  return (
    <main className="flex-1 overflow-hidden">
      <div className="h-full overflow-auto">
        {renderContent()}
      </div>

      {/* Profile Sheets */}
      {selectedUser && (
        <UserProfileSheet
          user={selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && onUserSelect(null)}
        />
      )}

      {selectedAgent && (
        <AgentProfileSheet
          agent={selectedAgent}
          open={!!selectedAgent}
          onOpenChange={(open) => !open && onAgentSelect(null)}
        />
      )}

      {selectedAgentBackend && (
        <AgentBackendProfileView
          agent={selectedAgentBackend}
          onClose={() => setSelectedAgentBackend(null)}
          loading={agentBackendLoading}
          setLoading={setAgentBackendLoading}
        />
      )}

      {selectedTicketInfo && (
        <TicketConversationSheet
          ticketInfo={selectedTicketInfo}
          open={!!selectedTicketInfo}
          onOpenChange={(open) => !open && onTicketSelect(null)}
        />
      )}
    </main>
  );
}