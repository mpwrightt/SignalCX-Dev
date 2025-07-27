"use client";

import * as React from "react";
import {
  BarChart,
  Users,
  Medal,
  GraduationCap,
  Shapes,
  Rss,
  FileSearch,
  Sparkles,
  Monitor,
  TrendingUp,
  Settings,
  LogOut,
  Ticket as TicketIcon,
  Brain,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsDialog } from "@/components/settings-dialog";
import { DashboardMode } from "@/hooks/use-dashboard-state";
import { AuthenticatedUser } from "@/lib/types";

interface DashboardSidebarProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  onViewChange: (view: string) => void;
  user: AuthenticatedUser;
  sessionMode: string;
  onLogout: () => void;
}

const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart,
      tooltip: 'Dashboard',
    },
    {
      id: 'explorer',
      label: 'Ticket Explorer',
      icon: TicketIcon,
      tooltip: 'Ticket Explorer',
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      tooltip: 'Users',
    },
    {
      id: 'agents',
      label: 'Agent Performance',
      icon: Medal,
      tooltip: 'Agent Performance',
    },
    {
      id: 'coaching',
      label: 'Coaching',
      icon: GraduationCap,
      tooltip: 'Coaching',
    },
    {
      id: 'clustering',
      label: 'Clustering',
      icon: Shapes,
      tooltip: 'Clustering',
    },
    {
      id: 'social',
      label: 'Social Intelligence',
      icon: Rss,
      tooltip: 'Social Intelligence',
    },
    {
      id: 'ai-search',
      label: 'AI Search',
      icon: FileSearch,
      tooltip: 'AI Search',
    },
    {
      id: 'advanced-analytics',
      label: 'Advanced Analytics',
      icon: Sparkles,
      tooltip: 'Advanced Analytics',
    },
    {
      id: 'predictive',
      label: 'Predictive',
      icon: TrendingUp,
      tooltip: 'Predictive',
    },
    {
      id: 'diagnostics',
      label: 'Diagnostics',
      icon: Monitor,
      tooltip: 'Diagnostics',
    },
    {
      id: 'team-management',
      label: 'Team Management',
      icon: Brain,
      tooltip: 'Team Management',
    },
  ] as const;

export function DashboardSidebar({
  mode,
  onModeChange,
  onViewChange,
  user,
  sessionMode,
  onLogout,
}: DashboardSidebarProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const handleModeChange = React.useCallback((newMode: DashboardMode) => {
    onModeChange(newMode);
    if (newMode === 'dashboard') {
      onViewChange("All Views");
    }
  }, [onModeChange, onViewChange]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <TicketIcon className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-headline font-semibold">
            SignalCX
          </h1>
          {sessionMode === 'demo' && <Badge variant="secondary">Demo</Badge>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                tooltip={item.tooltip}
                onClick={() => handleModeChange(item.id as DashboardMode)}
                isActive={mode === item.id}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign Out"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  );
}