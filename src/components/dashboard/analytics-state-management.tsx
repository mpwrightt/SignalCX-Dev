
import * as React from "react";
import type { BurnoutIndicator, KnowledgeGap } from "@/lib/types";
import { ProcessedAnalyticsData } from '@/lib/analytics-preprocessor';

// Enhanced enterprise drill-down system
type DrillDownLevel = 'overview' | 'category' | 'individual' | 'deep' | 'actions';

type DrillDownState = {
  level: DrillDownLevel;
  category?: string;
  agentName?: string;
  ticketId?: number;
  timeframe?: string;
  path: string[];
  context?: Record<string, any>;
};

// Local interface for performance forecasts that matches the tabs component
interface PerformanceForecast {
  agentName: string;
  confidence: number;
  predictedTicketsNextWeek: number;
  predictedCsatNextWeek: number;
  riskFactors?: string[];
  recommendations?: string[];
  recentTickets?: any[];
}

export function useAnalyticsState(props: any) {
  // Enhanced state management for enterprise dashboard
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = React.useState<'standard' | 'agentic'>('standard');
  const [rerunningAnalysis, setRerunningAnalysis] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [storedStartTime, setStoredStartTime] = React.useState<number | null>(null);
  const [cacheInitialized, setCacheInitialized] = React.useState(false);
  
  // Enterprise dashboard state
  const [sidebarWidth, setSidebarWidth] = React.useState(280);
  const [panelLayout, setPanelLayout] = React.useState<Record<string, number>>({
    sidebar: 280,
    main: 1200,
    table: 400
  });
  const [activeFlows, setActiveFlows] = React.useState<Set<string>>(new Set());
  const [realTimeEnabled, setRealTimeEnabled] = React.useState(true);
  const [selectedMetric, setSelectedMetric] = React.useState<string | null>(null);
  
  // Enhanced drill-down and navigation state
  const [drillDown, setDrillDown] = React.useState<DrillDownState>({
    level: 'overview',
    path: ['Overview'],
    context: {}
  });
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'split'>('grid');
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [selectedTimeframe, setSelectedTimeframe] = React.useState('7d');
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [refreshInterval, setRefreshInterval] = React.useState<NodeJS.Timeout | null>(null);
  const [gridCols, setGridCols] = React.useState(3);
  const [fullscreenChart, setFullscreenChart] = React.useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = React.useState(false);
  const [selectedAgents, setSelectedAgents] = React.useState<Set<string>>(new Set());
  
  const {
    performanceForecasts,
    burnoutIndicators,
    knowledgeGaps,
    slaPrediction,
    holisticAnalysis,
    setPerformanceForecasts,
    setBurnoutIndicators,
    setKnowledgeGaps,
    setSlaPrediction,
    setHolisticAnalysis,
  } = props;
  
  // Agent analysis state
  const [agentAnalysisResult, setAgentAnalysisResult] = React.useState<any>(null);
  const [agentReasoning, setAgentReasoning] = React.useState<string>('');
  const [agentToolCalls, setAgentToolCalls] = React.useState<any[]>([]);
  const [agentLoadingStates, setAgentLoadingStates] = React.useState<Record<string, boolean>>({});
  
  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState<React.ReactNode>(null);
  
  // Preprocessed data
  const [preprocessedData, setPreprocessedData] = React.useState<ProcessedAnalyticsData | null>(null);
  
  // Settings state
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);

  return {
    loading, setLoading,
    error, setError,
    analysisMode, setAnalysisMode,
    rerunningAnalysis, setRerunningAnalysis,
    elapsed, setElapsed,
    startTime, setStartTime,
    storedStartTime, setStoredStartTime,
    cacheInitialized, setCacheInitialized,
    sidebarWidth, setSidebarWidth,
    panelLayout, setPanelLayout,
    activeFlows, setActiveFlows,
    realTimeEnabled, setRealTimeEnabled,
    selectedMetric, setSelectedMetric,
    drillDown, setDrillDown,
    sidebarCollapsed, setSidebarCollapsed,
    selectedFilters, setSelectedFilters,
    searchQuery, setSearchQuery,
    viewMode, setViewMode,
    expandedRows, setExpandedRows,
    selectedTimeframe, setSelectedTimeframe,
    autoRefresh, setAutoRefresh,
    refreshInterval, setRefreshInterval,
    gridCols, setGridCols,
    fullscreenChart, setFullscreenChart,
    comparisonMode, setComparisonMode,
    selectedAgents, setSelectedAgents,
    performanceForecasts, setPerformanceForecasts,
    burnoutIndicators, setBurnoutIndicators,
    knowledgeGaps, setKnowledgeGaps,
    slaPrediction, setSlaPrediction,
    holisticAnalysis, setHolisticAnalysis,
    agentAnalysisResult, setAgentAnalysisResult,
    agentReasoning, setAgentReasoning,
    agentToolCalls, setAgentToolCalls,
    agentLoadingStates, setAgentLoadingStates,
    modalOpen, setModalOpen,
    modalContent, setModalContent,
    preprocessedData, setPreprocessedData,
    settingsLoaded, setSettingsLoaded,
  };
}
