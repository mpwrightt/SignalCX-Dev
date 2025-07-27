"use client";

import * as React from "react";
import { 
  BarChart,
  Users,
  Medal,
  BrainCircuit,
  Shapes,
  Rss,
  FileSearch,
  Monitor,
  Brain,
  TicketIcon,
  TrendingUp 
} from "lucide-react";
import { DashboardMode } from "@/hooks/use-dashboard-state-safe";

interface DashboardSidebarEnhancedProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  onViewChange: (view: string) => void;
  user: any;
  sessionMode: string;
  onLogout: () => void;
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart,
    description: 'Overview and analytics'
  },
  {
    id: 'explorer',
    label: 'Ticket Explorer',
    icon: TicketIcon,
    description: 'Browse and search tickets'
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    description: 'User management'
  },
  {
    id: 'agents',
    label: 'Agent Performance',
    icon: Medal,
    description: 'Agent analytics and KPIs'
  },
  {
    id: 'predictive',
    label: 'Predictive Analysis',
    icon: TrendingUp,
    description: 'AI-powered predictions'
  },
  {
    id: 'advanced-analytics',
    label: 'Advanced Analytics',
    icon: BarChart,
    description: 'Deep dive analytics'
  },
  {
    id: 'coaching',
    label: 'Coaching',
    icon: BrainCircuit,
    description: 'Manager coaching insights'
  },
  {
    id: 'clustering',
    label: 'Clustering',
    icon: Shapes,
    description: 'Ticket clustering analysis'
  },
  {
    id: 'social',
    label: 'Social Intelligence',
    icon: Rss,
    description: 'Social media insights'
  },
  {
    id: 'ai-search',
    label: 'AI Search',
    icon: FileSearch,
    description: 'AI-powered search'
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: Monitor,
    description: 'System diagnostics'
  },
  {
    id: 'team-management',
    label: 'Team Management',
    icon: Brain,
    description: 'Team administration'
  },
] as const;

export function DashboardSidebarEnhanced({
  mode,
  onModeChange,
  onViewChange,
  user,
  sessionMode,
  onLogout,
}: DashboardSidebarEnhancedProps) {
  const handleModeChange = React.useCallback((newMode: DashboardMode) => {
    onModeChange(newMode);
    if (newMode === 'dashboard') {
      onViewChange("All Views");
    }
  }, [onModeChange, onViewChange]);

  return (
    <div className="w-64 bg-muted border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <TicketIcon className="w-8 h-8 text-primary" />
          <div>
            <h2 className="font-semibold text-lg">SignalCX</h2>
            <p className="text-xs text-muted-foreground">Analytics Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = mode === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleModeChange(item.id as DashboardMode)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
                title={item.description}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className={`text-xs truncate ${
                      isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-sm text-muted-foreground mb-2">
          <div className="font-medium">{user?.email}</div>
          <div className="text-xs">Mode: {sessionMode}</div>
        </div>
        <button 
          onClick={onLogout} 
          className="w-full text-sm text-muted-foreground hover:text-foreground p-2 rounded hover:bg-accent transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}