"use client";

import * as React from "react";
import { DashboardMode } from "@/hooks/use-dashboard-state";

interface SimpleSidebarProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  onViewChange: (view: string) => void;
  user: any;
  sessionMode: string;
  onLogout: () => void;
}

export function DashboardSidebarSimple({
  mode,
  onModeChange,
  onViewChange,
  user,
  sessionMode,
  onLogout,
}: SimpleSidebarProps) {
  const handleModeChange = React.useCallback((newMode: DashboardMode) => {
    onModeChange(newMode);
    if (newMode === 'dashboard') {
      onViewChange("All Views");
    }
  }, [onModeChange, onViewChange]);

  return (
    <div className="w-64 bg-muted border-r">
      <div className="p-4">
        <h2 className="font-semibold">SignalCX</h2>
      </div>
      <nav className="p-2">
        <button
          onClick={() => handleModeChange('dashboard')}
          className={`w-full text-left p-2 rounded ${mode === 'dashboard' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => handleModeChange('explorer')}
          className={`w-full text-left p-2 rounded ${mode === 'explorer' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
        >
          Explorer
        </button>
      </nav>
      <div className="absolute bottom-4 left-4">
        <button onClick={onLogout} className="text-sm text-muted-foreground hover:text-foreground">
          Logout
        </button>
      </div>
    </div>
  );
}