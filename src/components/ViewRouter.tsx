import React from 'react';
import { DashboardView } from './dashboard/dashboard-view';
import { TicketExplorerView } from './dashboard/ticket-explorer-view';
import { UserManagementView } from './dashboard/user-management-view';
import { AgentPerformanceView } from './dashboard/agent-performance-view';
import { CoachingView } from './dashboard/coaching-view';
import { ClusteringView } from './dashboard/clustering-view';
import { SocialIntelligenceView } from './dashboard/social-intelligence-view';
import { AISearchView } from './dashboard/ai-search-view';
import { DiagnosticsView } from './dashboard/diagnostics-view';
import { AdvancedAnalyticsView } from './dashboard/advanced-analytics-view';
import { TeamManagement } from './dashboard/team-management';
import { PredictiveView } from './dashboard/predictive-view';
import type { SelectedTicketInfo } from '@/lib/page-utils';

interface ViewRouterProps {
  mode: string;
  tickets: any[];
  sortedTickets: any[];
  dashboardFilteredTickets: any[];
  dateFilteredTickets: any[];
  loading: boolean;
  settings: any;
  sessionMode: 'demo' | 'enterprise';
  ticketVolumeData: { date: string; count: number }[];
  prediction: any;
  isAnalyzed: boolean;
  isDeepAnalyzed: boolean;
  coachingInsights: any[];
  ticketClusters: any[];
  activeDashboardTab: string;
  setActiveDashboardTab: (tab: string) => void;
  componentRenderers: Record<string, React.ComponentType<any>>;
  selectionState: string;
  selectedRowIds: Set<number>;
  requestSort: (key: any) => void;
  getSortIcon: (key: any) => any;
  handleSelectAll: (checked: boolean | 'indeterminate') => void;
  handleSelectRow: (ticketId: number, checked: boolean) => void;
  setSelectedTicketInfo: (info: SelectedTicketInfo | null) => void;
  setSelectedUser: (user: any) => void;
  setSelectedAgent: (agent: any) => void;
}

export function ViewRouter({
  mode,
  tickets,
  sortedTickets,
  dashboardFilteredTickets,
  dateFilteredTickets,
  loading,
  settings,
  sessionMode,
  ticketVolumeData,
  prediction,
  isAnalyzed,
  isDeepAnalyzed,
  coachingInsights,
  ticketClusters,
  activeDashboardTab,
  setActiveDashboardTab,
  componentRenderers,
  selectionState,
  selectedRowIds,
  requestSort,
  getSortIcon,
  handleSelectAll,
  handleSelectRow,
  setSelectedTicketInfo,
  setSelectedUser,
  setSelectedAgent
}: ViewRouterProps) {
  switch (mode) {
    case 'dashboard':
      return (
        <DashboardView 
          user={{} as any} // TODO: Pass user from props
          activeDashboardTab={activeDashboardTab}
          setActiveDashboardTab={setActiveDashboardTab}
          componentRenderers={componentRenderers as any}
        />
      );
      
    case 'explorer':
      return (
        <TicketExplorerView 
          tickets={sortedTickets}
          loading={loading}
          settings={settings}
          selectionState={selectionState as any}
          handleSelectAll={handleSelectAll}
          handleSelectRow={handleSelectRow}
          selectedRowIds={selectedRowIds}
          requestSort={requestSort}
          getSortIcon={getSortIcon}
          onTicketSelect={setSelectedTicketInfo}
        />
      );
      
    case 'users':
      return (
        <UserManagementView 
          tickets={dashboardFilteredTickets} 
          loading={loading} 
          onUserSelect={setSelectedUser} 
        />
      );
      
    case 'agents':
      return (
        <AgentPerformanceView 
          tickets={tickets} 
          loading={loading} 
          onAgentSelect={setSelectedAgent} 
        />
      );
      
    case 'coaching':
      return (
        <CoachingView
          tickets={dateFilteredTickets}
          isAnalyzed={isDeepAnalyzed}
          insights={coachingInsights}
          onTicketSelect={(ticket) => setSelectedTicketInfo({ ticket })}
        />
      );
      
    case 'clustering':
      return (
        <ClusteringView
          tickets={dateFilteredTickets}
          isAnalyzed={isDeepAnalyzed}
          clusters={ticketClusters}
        />
      );
      
    case 'social':
      return (
        <SocialIntelligenceView
          isAnalyzed={isAnalyzed}
        />
      );
      
    case 'ai-search':
      return (
        <AISearchView
          tickets={dateFilteredTickets}
          isAnalyzed={isAnalyzed}
          onTicketSelect={setSelectedTicketInfo}
        />
      );
      
    case 'diagnostics':
      return <DiagnosticsView />;
      
    case 'advanced-analytics':
      return (
        <AdvancedAnalyticsView 
          sessionMode={sessionMode} 
          tickets={dashboardFilteredTickets} 
          historicalVolume={ticketVolumeData}
          forecastDays={settings.forecastDays}
          prediction={prediction}
        />
      );
      
    case 'team-management':
      return <TeamManagement />;
      
    case 'predictive':
      return (
        <PredictiveView
          tickets={dashboardFilteredTickets}
          loading={loading}
          prediction={prediction}
          user={{} as any}
          historicalVolume={ticketVolumeData}
          legendWrapperStyle={{}}
          onTicketSelect={setSelectedTicketInfo}
          isAnalyzed={isAnalyzed}
        />
      );
      
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Select a view from the sidebar</p>
        </div>
      );
  }
} 