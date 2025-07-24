import React from 'react';
import {
  BarChart,
  Ticket as TicketIcon,
  Users,
  UserCircle,
  Brain,
  TrendingUp,
  AreaChart,
  Rss,
  FileSearch,
  Monitor,
  Settings,
  LogOut,
  GraduationCap,
  Shapes,
  BrainCircuit,
  LayoutGrid,
  Eye,
  EyeOff,
  Layers,
  WifiOff,
  Wifi,
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
} from "@/components/ui/sidebar";

interface MainSidebarProps {
  sessionMode: 'demo' | 'enterprise';
  mode: string;
  setMode: (mode: string) => void;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  isOnline: boolean;
}

export function MainSidebar({
  sessionMode,
  mode,
  setMode,
  setActiveView,
  onLogout,
  isOnline
}: MainSidebarProps) {
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
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Dashboard"
              onClick={() => {
                setMode('dashboard');
                setActiveView("All Views");
              }}
              isActive={mode === 'dashboard'}
            >
              <BarChart className="h-5 w-5" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Ticket Explorer"
              onClick={() => {
                setMode('explorer');
              }}
              isActive={mode === 'explorer'}
            >
              <TicketIcon className="h-5 w-5" />
              <span>Ticket Explorer</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="AI Search"
              onClick={() => setMode('ai-search')}
              isActive={mode === 'ai-search'}
            >
              <FileSearch className="h-5 w-5" />
              <span>AI Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="User Management"
              onClick={() => setMode('users')}
              isActive={mode === 'users'}
            >
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Agent Performance"
              onClick={() => setMode('agents')}
              isActive={mode === 'agents'}
            >
              <UserCircle className="h-5 w-5" />
              <span>Agent Performance</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Predictive Analysis"
              onClick={() => setMode('predictive')}
              isActive={mode === 'predictive'}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Predictive Analysis</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Advanced Analytics"
              onClick={() => setMode('advanced-analytics')}
              isActive={mode === 'advanced-analytics'}
            >
              <AreaChart className="h-5 w-5" />
              <span>Advanced Analytics</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Manager Coaching"
              onClick={() => setMode('coaching')}
              isActive={mode === 'coaching'}
            >
              <GraduationCap className="h-5 w-5" />
              <span>Manager Coaching</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Ticket Clustering"
              onClick={() => setMode('clustering')}
              isActive={mode === 'clustering'}
            >
              <Shapes className="h-5 w-5" />
              <span>Ticket Clustering</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Social Intelligence"
              onClick={() => setMode('social')}
              isActive={mode === 'social'}
            >
              <Rss className="h-5 w-5" />
              <span>Social Intelligence</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Team Management"
              onClick={() => setMode('team-management')}
              isActive={mode === 'team-management'}
            >
              <Users className="h-5 w-5" />
              <span>Team Management</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Diagnostics"
              onClick={() => setMode('diagnostics')}
              isActive={mode === 'diagnostics'}
            >
              <Monitor className="h-5 w-5" />
              <span>Diagnostics</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 p-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span>Offline</span>
              </>
            )}
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Settings"
                onClick={() => {/* TODO: Open settings */}}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Logout"
                onClick={onLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
} 