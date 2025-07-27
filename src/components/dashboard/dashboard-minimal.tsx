"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function DashboardMinimal() {
  const { user, logout, isLoading: authLoading, sessionMode } = useAuth();
  const [mode, setMode] = React.useState('dashboard');

  if (authLoading || !user || !sessionMode) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-row bg-muted/40">
      <div className="w-64 bg-muted border-r">
        <div className="p-4">
          <h2 className="font-semibold">SignalCX</h2>
          <p className="text-sm text-muted-foreground">User: {user.email}</p>
        </div>
        <nav className="p-2">
          <button
            onClick={() => setMode('dashboard')}
            className={`w-full text-left p-2 rounded mb-1 ${mode === 'dashboard' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setMode('explorer')}
            className={`w-full text-left p-2 rounded mb-1 ${mode === 'explorer' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          >
            Explorer
          </button>
        </nav>
        <div className="absolute bottom-4 left-4">
          <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground">
            Logout
          </button>
        </div>
      </div>
      
      <div className="flex flex-col flex-1">
        <header className="border-b bg-background p-4">
          <h1 className="text-2xl font-bold">Dashboard - {mode}</h1>
        </header>
        <main className="flex-1 p-4">
          <div className="text-center">
            <p>Dashboard content for mode: {mode}</p>
            <p>This is a minimal dashboard to test for infinite loops.</p>
          </div>
        </main>
      </div>
    </div>
  );
}