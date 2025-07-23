// Analytics Loading States and Skeletons
// Extracted from advanced-analytics-view.tsx for better modularity

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Brain, Loader2 } from "lucide-react";

interface AnalysisLoadingProps {
  elapsed: number;
}

export function AnalysisLoading({ elapsed }: AnalysisLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Card className="w-full max-w-md mx-auto p-6 flex flex-col items-center gap-4">
        <CardHeader className="flex flex-col items-center">
          <Brain className="h-8 w-8 text-primary animate-pulse mb-2" />
          <CardTitle className="text-lg font-bold">Running AI Analysis</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Analyzing tickets and generating advanced analytics.<br />
            <span className="text-xs">This may take 30-60 seconds</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full flex flex-col items-center">
          <div className="w-full mt-2">
            <Progress value={undefined} className="animate-pulse h-3" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Elapsed: {elapsed}s</div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AnalysisProgressProps {
  elapsed: number;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function AnalysisProgress({ elapsed, onCancel, showCancel = true }: AnalysisProgressProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-primary animate-pulse" />
            <div>
              <h3 className="font-semibold text-primary">AI Analysis in Progress</h3>
              <p className="text-sm text-muted-foreground">
                Generating comprehensive insights from your ticket data...
              </p>
            </div>
          </div>
          
          {showCancel && onCancel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel}
              className="text-xs"
            >
              Cancel
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>
              {elapsed < 15 ? 'Initializing...' : 
               elapsed < 30 ? 'Analyzing patterns...' : 
               elapsed < 45 ? 'Generating insights...' : 
               'Finalizing results...'}
            </span>
          </div>
          <Progress 
            value={Math.min((elapsed / 60) * 80, 90)} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Elapsed: {elapsed}s
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CacheInitializationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

interface AgentLoadingButtonProps {
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AgentLoadingButton({
  isLoading,
  onClick,
  disabled = false,
  children,
  className = "",
  variant = "outline",
  size = "default"
}: AgentLoadingButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  );
}

interface LoadingStateManagerProps {
  loading: boolean;
  elapsed: number;
  cacheInitialized: boolean;
  prediction?: any;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function LoadingStateManager({
  loading,
  elapsed,
  cacheInitialized,
  prediction,
  onCancel,
  showCancel = true
}: LoadingStateManagerProps) {
  // Show main analysis loading state
  if (loading) {
    return <AnalysisLoading elapsed={elapsed} />;
  }

  // Show loading skeleton if cache not yet initialized AND no prediction data provided
  if (!cacheInitialized && !prediction) {
    return <CacheInitializationSkeleton />;
  }

  return null;
}

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function AnalyticsProgressBar({ value, className = "w-20" }: ProgressBarProps) {
  return <Progress value={value} className={className} />;
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  opacity?: number;
}

export function LoadingOverlay({ isLoading, children, opacity = 0.6 }: LoadingOverlayProps) {
  return (
    <div className={`relative ${isLoading ? `opacity-${Math.round(opacity * 100)}` : ''}`}>
      {children}
    </div>
  );
}

// Helper hook for managing loading states
export function useLoadingStates() {
  const [agentLoadingStates, setAgentLoadingStates] = React.useState<Map<string, boolean>>(new Map());

  const setAgentLoading = React.useCallback((agentKey: string, isLoading: boolean) => {
    setAgentLoadingStates(prev => {
      const updated = new Map(prev);
      if (isLoading) {
        updated.set(agentKey, true);
      } else {
        updated.delete(agentKey);
      }
      return updated;
    });
  }, []);

  const isAgentLoading = React.useCallback((agentKey: string): boolean => {
    return agentLoadingStates.get(agentKey) || false;
  }, [agentLoadingStates]);

  const clearAllLoading = React.useCallback(() => {
    setAgentLoadingStates(new Map());
  }, []);

  return {
    setAgentLoading,
    isAgentLoading,
    clearAllLoading,
    loadingCount: agentLoadingStates.size
  };
}