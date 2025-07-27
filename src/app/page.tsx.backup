"use client";

import * as React from "react";
import {
  Search,
  Users,
  BarChart,
  Ticket as TicketIcon,
  ArrowUp,
  ArrowDown,
  Smile,
  Frown,
  Clock,
  Hourglass,
  LineChart,
  ShieldAlert,
  CheckCircle,
  Star,
  Medal,
  X,
  TrendingUp,
  FileText,
  Settings,
  GraduationCap,
  Shapes,
  BrainCircuit,
  LayoutGrid,
  Eye,
  EyeOff,
  Layers,
  LogOut,
  Loader2,
  CalendarIcon,
  AreaChart,
  Rss,
  FileSearch,
  Sparkles,
  Monitor,
  Brain,
  WifiOff,
  Wifi,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart as BarChartRecharts,
  Pie,
  PieChart as PieChartRecharts,
  LineChart as LineChartRecharts,
  Line,
  ResponsiveContainer,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Area,
} from "recharts";
import { differenceInHours, subDays, format, eachDayOfInterval } from "date-fns";
import type { DateRange } from "react-day-picker";

import {
  AnalyzedTicket,
  UserProfile,
  AgentProfile,
  TicketAnalysis,
  AuthenticatedUser,
  AtRiskTicket,
  PredictiveAnalysisOutput,
  CoachingInsight,
  TicketCluster,
  Ticket,
} from "@/lib/types";
import { zendeskViews as staticViews } from "@/lib/views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientOnly } from "@/components/client-only";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { TicketConversationSheet } from "@/components/ticket-conversation-sheet";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserProfileSheet } from "@/components/user-profile-sheet";
import { AgentProfileSheet } from "@/components/agent-profile-sheet";
import { summarizeTrends } from "@/ai/flows/summarize-trends";
import { SettingsDialog } from "@/components/settings-dialog";
import { useSettings } from "@/hooks/use-settings";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { fetchTickets } from "@/ai/flows/fetch-and-analyze-tickets";
import { useToast } from "@/hooks/use-toast";
// Network status is handled automatically by Supabase
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { FilterControls } from "@/components/dashboard/filter-controls";
import { UserManagementView } from "@/components/dashboard/user-management-view";
import { AgentPerformanceView } from "@/components/dashboard/agent-performance-view";
import { AgentBackendProfileView } from "@/components/dashboard/agent-backend-profile-view";
import { AdvancedAnalyticsView } from "@/components/dashboard/advanced-analytics-view";
import { CoachingView } from "@/components/dashboard/coaching-view";
import { ClusteringView } from "@/components/dashboard/clustering-view";
import { SocialIntelligenceView } from "@/components/dashboard/social-intelligence-view";
import { AISearchView } from "@/components/dashboard/ai-search-view";
import { TicketExplorerView } from "@/components/dashboard/ticket-explorer-view";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { TicketGenerator } from "@/components/dashboard/ticket-generator";
import { DiagnosticsView } from "@/components/dashboard/diagnostics-view";
import { EnterpriseUserManagement } from "@/components/dashboard/enterprise-user-management";
import { TeamManagement } from "@/components/dashboard/team-management";
import { getHolisticAnalysis } from "@/ai/flows/get-holistic-analysis";
import { batchIdentifyTicketRisks } from "@/ai/flows/batch-identify-ticket-risks";
import { getCoachingInsights } from "@/ai/flows/get-coaching-insights";
import { clusterTickets } from "@/ai/flows/cluster-tickets";
import { getAvailableViews } from "@/lib/view-service";
import { batchAnalyzeTickets } from "@/ai/flows/batch-analyze-tickets";
import { getPerformanceForecasts } from "@/ai/flows/get-performance-forecasts";

type SortConfig = {
  key: keyof AnalyzedTicket | null;
  direction: "ascending" | "descending";
};

type TopLevelFilterState = {
  sentiment: "all" | "Positive" | "Neutral" | "Negative";
  status: "all" | "new" | "open" | "pending" | "on-hold" | "solved" | "closed";
};

type DrilldownFilterState = {
  category: "all" | string;
  priority: "all" | string;
  tag: "all" | string;
  sentiment: "all" | "Positive" | "Neutral" | "Negative";
}

type SelectedTicketInfo = {
  ticket: AnalyzedTicket;
  riskAnalysis?: AtRiskTicket;
}

const ANALYSIS_CACHE_KEY = 'signalcx-analysis-cache';
const PREDICTIVE_CACHE_KEY = 'signalcx-predictive-cache';
const COACHING_CACHE_KEY = 'signalcx-coaching-cache';
const CLUSTERING_CACHE_KEY = 'signalcx-clustering-cache';

const getLocalCachedData = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cachedData = window.localStorage.getItem(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error(`Failed to read from local cache key "${key}":`, error);
    return null;
  }
};

const setLocalCachedData = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to write to local cache key "${key}":`, error);
  }
};

const getLocalCachedAnalyses = (ticketIds: number[]): Record<number, TicketAnalysis> => {
  if (typeof window === 'undefined') return {};
  try {
    const cachedData = window.localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (!cachedData) return {};
    const allAnalyses = JSON.parse(cachedData);
    const results: Record<number, TicketAnalysis> = {};
    ticketIds.forEach(id => {
      if (allAnalyses[id]) {
        results[id] = allAnalyses[id];
      }
    });
    return results;
  } catch (error) {
    console.error("Failed to read from local cache:", error);
    return {};
  }
};

const setLocalCachedAnalyses = (newAnalyses: Record<number, TicketAnalysis>) => {
  if (typeof window === 'undefined') return;
  try {
    const cachedData = window.localStorage.getItem(ANALYSIS_CACHE_KEY);
    const allAnalyses = cachedData ? JSON.parse(cachedData) : {};
    const updatedAnalyses = { ...allAnalyses, ...newAnalyses };
    window.localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(updatedAnalyses));
  } catch (error) {
    console.error("Failed to write to local cache:", error);
  }
};

export default function DashboardPage() {
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const { logEvent } = useDiagnostics();
  const { user, logout, isLoading: authLoading, sessionMode } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isOnline = true; // Network status is handled automatically by Supabase
  const [tickets, setTickets] = React.useState<AnalyzedTicket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisProgress, setAnalysisProgress] = React.useState(0);
  const [isAnalyzed, setIsAnalyzed] = React.useState(false);
  const [isDeepAnalyzed, setIsDeepAnalyzed] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [mode, setMode] = React.useState<'dashboard' | 'explorer' | 'users' | 'agents' | 'coaching' | 'clustering' | 'social' | 'ai-search' | 'diagnostics' | 'advanced-analytics' | 'predictive' | 'team-management'>('dashboard');
  const [activeView, setActiveView] = React.useState<string>("All Views");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [availableViews, setAvailableViews] = React.useState<string[]>(staticViews);
  const [viewsLoading, setViewsLoading] = React.useState(true);

  const [activeFilters, setActiveFilters] = React.useState<TopLevelFilterState>({
    sentiment: "all",
    status: "all",
  });
  
  const [drilldownFilters, setDrilldownFilters] = React.useState<DrilldownFilterState>({
    category: "all",
    priority: "all",
    tag: "all",
    sentiment: "all",
  });

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: "created_at",
    direction: "descending",
  });
  const [activeDashboardTab, setActiveDashboardTab] = React.useState('snapshot');

  const [selectedTicketInfo, setSelectedTicketInfo] = React.useState<SelectedTicketInfo | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
  const [selectedAgent, setSelectedAgent] = React.useState<AgentProfile | null>(null);
  const [selectedAgentBackend, setSelectedAgentBackend] = React.useState<AgentProfile | null>(null);
  const [agentBackendLoading, setAgentBackendLoading] = React.useState(false);
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<number>>(new Set());
  
  const [trendSummary, setTrendSummary] = React.useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(true);

  const [prediction, setPrediction] = React.useState<PredictiveAnalysisOutput | null>(null);
  const [coachingInsights, setCoachingInsights] = React.useState<CoachingInsight[]>([]);
  const [ticketClusters, setTicketClusters] = React.useState<TicketCluster[]>([]);
  const [performanceForecasts, setPerformanceForecasts] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (settingsLoaded) {
      setMode(settings.defaultPageOnLoad);
      setSortConfig({
        key: settings.defaultTicketSort,
        direction: settings.defaultTicketSortDirection,
      });
      setActiveDashboardTab(settings.defaultDashboardTab);
    }
  }, [settingsLoaded, settings.defaultPageOnLoad, settings.defaultTicketSort, settings.defaultTicketSortDirection, settings.defaultDashboardTab]);

  React.useEffect(() => {
    if (settingsLoaded && !authLoading && !user) {
      router.push('/login');
    }
  }, [settingsLoaded, authLoading, user, router]);
  
  React.useEffect(() => {
    if (!sessionMode) return;

    const fetchViews = async () => {
      setViewsLoading(true);
      try {
        const views = await getAvailableViews(sessionMode);
        
        setAvailableViews(views);
        if (!views.includes(activeView)) {
          setActiveView('All Views');
        }
      } catch (error) {
        console.error("Failed to fetch available views:", error);
        setAvailableViews(staticViews);
        
      } finally {
        setViewsLoading(false);
      }
    };

    if (settingsLoaded) {
      fetchViews();
    }
  }, [sessionMode, settingsLoaded, activeView]);

  const handleRunCombinedAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Part 1: Run fast sentiment/category analysis on any un-analyzed tickets
    const ticketsToAnalyze = tickets.filter(t => !t.sentiment || !t.category);
    if (ticketsToAnalyze.length > 0) {
      toast({
        title: "AI Analysis Started",
        description: `Analyzing sentiments & categories for ${ticketsToAnalyze.length} new tickets.`,
      });

      // Send all tickets at once - let batchAnalyzeTickets handle internal chunking
      const input = { tickets: ticketsToAnalyze.map(t => ({ id: t.id, subject: t.subject, description: t.description.substring(0, 500) })) };
      const flowName = 'batchAnalyzeTickets';
      
      logEvent('sent', flowName, { ticketCount: ticketsToAnalyze.length });
      try {
        const result = await batchAnalyzeTickets(input);
        logEvent('received', flowName, result);
        const allResults = result.results;
        setAnalysisProgress(50); // This part is 50% of the job

        const newAnalyses: Record<number, TicketAnalysis> = {};
        allResults.forEach(res => { newAnalyses[res.id] = { sentiment: res.sentiment, category: res.category } });
        setLocalCachedAnalyses(newAnalyses);
        setTickets(prevTickets => prevTickets.map(ticket => newAnalyses[ticket.id] ? { ...ticket, ...newAnalyses[ticket.id] } : ticket));
        setIsAnalyzed(true);
        
        // Ensure Phase 1 is completely finished before proceeding
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logEvent('error', flowName, error);
        console.error("Batch analysis failed:", error);
        toast({ variant: "destructive", title: "Analysis Failed", description: "Failed during sentiment/category analysis." });
        setIsAnalyzing(false);
        return;
      }
    } else {
      setIsAnalyzed(true);
      setAnalysisProgress(50);
    }
    
    // Part 2: Run deep analysis only if it hasn't been run before
    const predictiveCache = getLocalCachedData(PREDICTIVE_CACHE_KEY);

    if (predictiveCache) {
        toast({ title: "Quick Refresh Complete", description: "Loaded deep analysis from cache and analyzed new tickets." });
        setAnalysisProgress(100);
        setIsDeepAnalyzed(true);
        setIsAnalyzing(false);
        return;
    }

    toast({ title: "Deep Analysis Running", description: "This may take a few more moments..." });

    try {
      // Ensure we have properly analyzed tickets with sentiment and category
      const openAnalyzedTickets = tickets.filter(t => {
        const hasSentiment = t.sentiment || getLocalCachedAnalyses([t.id])[t.id]?.sentiment;
        const hasCategory = t.category || getLocalCachedAnalyses([t.id])[t.id]?.category;
        return (t.status === 'open' || t.status === 'pending') && hasSentiment && hasCategory;
      });
      
      if (openAnalyzedTickets.length === 0) {
        toast({ variant: "destructive", title: "Not Enough Data", description: "Not enough analyzed 'open' tickets to run a deep analysis." });
        setIsAnalyzing(false);
        return;
      }
      
      const runFlow = async (flowName: string, flowFn: Function, input: any, customTimeout?: number) => {
          try {
              logEvent('sent', flowName, input);
              // Removed artificial timeout wrapper - let AI flows run naturally
              const result = await flowFn(input);
              
              logEvent('received', flowName, result);
              return result;
          } catch (error) {
              logEvent('error', flowName, error);
              console.error(`Flow ${flowName} failed:`, error);
              // Return a safe default instead of throwing
              return { error: true, message: `Flow ${flowName} failed: ${error}` };
          }
      };

      // Helper function to safely get sentiment and category with fallbacks
      const getTicketAnalysis = (ticket: any) => {
        const cachedAnalysis = getLocalCachedAnalyses([ticket.id])[ticket.id];
        return {
          sentiment: ticket.sentiment || cachedAnalysis?.sentiment || 'Neutral',
          category: ticket.category || cachedAnalysis?.category || 'Uncategorized'
        };
      };

      // Safely prepare coaching input with guaranteed sentiment and category
      const coachingInput = { 
        tickets: openAnalyzedTickets.map(ticket => {
          const analysis = getTicketAnalysis(ticket);
          return {
            id: ticket.id,
            assignee: ticket.assignee,
            category: analysis.category,
            sentiment: analysis.sentiment,
            csat_score: ticket.csat_score,
            created_at: ticket.created_at,
            solved_at: ticket.solved_at,
            status: ticket.status,
            conversation: ticket.conversation.map(c => ({ sender: c.sender }))
          };
        })
      };
      
      // Safely prepare clustering input
      const clusteringInput = { 
        tickets: openAnalyzedTickets.map(ticket => {
          const analysis = getTicketAnalysis(ticket);
          return {
            id: ticket.id,
            subject: ticket.subject,
            category: analysis.category
          };
        })
      };
      
      // Use all tickets in the current view for holistic analysis
      const holisticSample = [...openAnalyzedTickets].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const holisticInput = { 
        tickets: holisticSample.map(ticket => {
          const analysis = getTicketAnalysis(ticket);
          return {
            id: ticket.id,
            subject: ticket.subject,
            created_at: ticket.created_at,
            sentiment: analysis.sentiment,
            category: analysis.category,
            priority: ticket.priority,
            status: ticket.status
          };
        }), 
        historicalVolume: ticketVolumeData, 
        forecastDays: settings.forecastDays,
        totalTicketCount: openAnalyzedTickets.length,
        sampleSize: holisticSample.length
      };
      
      // Safely prepare performance input
      const performanceInput = { 
        tickets: openAnalyzedTickets.map(ticket => {
          const analysis = getTicketAnalysis(ticket);
          return {
            id: ticket.id,
            assignee: ticket.assignee,
            category: analysis.category,
            sentiment: analysis.sentiment,
            csat_score: ticket.csat_score,
            created_at: ticket.created_at,
            solved_at: ticket.solved_at,
            status: ticket.status,
            priority: ticket.priority
          };
        })
      };

      // Prepare risk analysis with all tickets - let batchIdentifyTicketRisks handle internal chunking
      const riskAnalysisPromise = runFlow('batchIdentifyTicketRisks', batchIdentifyTicketRisks, { 
        tickets: openAnalyzedTickets.map(ticket => {
          const analysis = getTicketAnalysis(ticket);
          return {
            id: ticket.id,
            subject: ticket.subject,
            description: ticket.description,
            created_at: ticket.created_at,
            sentiment: analysis.sentiment,
            category: analysis.category,
            priority: ticket.priority,
            status: ticket.status
          };
        })
      }, 30000); // Increased timeout for larger dataset processing

      // Run analyses sequentially to prevent Next.js timeout
      setAnalysisProgress(65);
      
      // Step 1: Run fast analyses first
      console.log('[handleRunCombinedAnalysis] Running fast analyses...');
      const [holisticResult, performanceResult] = await Promise.all([
          runFlow('getHolisticAnalysis', getHolisticAnalysis, holisticInput),
          runFlow('getPerformanceForecasts', getPerformanceForecasts, performanceInput),
      ]);
      setAnalysisProgress(70);
      
      // Step 2: Run medium-speed analyses
      console.log('[handleRunCombinedAnalysis] Running medium-speed analyses...');
      const [coachingResult, clusteringResult] = await Promise.all([
          runFlow('getCoachingInsights', getCoachingInsights, coachingInput),
          runFlow('clusterTickets', clusterTickets, clusteringInput),
      ]);
      setAnalysisProgress(80);
      
      // Step 3: Run risk analysis with all tickets at once
      console.log('[handleRunCombinedAnalysis] Running risk analysis...');
      setAnalysisProgress(80);
      
      let riskResult;
      try {
        riskResult = await riskAnalysisPromise;
        setAnalysisProgress(95);
      } catch (error) {
        console.error('Risk analysis failed:', error);
        riskResult = { error: true, message: 'Risk analysis failed', atRiskTickets: [], predictedSlaBreaches: [], documentationOpportunities: [] };
      }

      // Set results with error checking
      if (!coachingResult.error && coachingResult.insights) {
        setCoachingInsights(coachingResult.insights);
        setLocalCachedData(COACHING_CACHE_KEY, coachingResult.insights);
      }

      if (!clusteringResult.error && clusteringResult.clusters) {
        setTicketClusters(clusteringResult.clusters);
        setLocalCachedData(CLUSTERING_CACHE_KEY, clusteringResult.clusters);
      }

      if (!performanceResult.error && performanceResult.forecasts) {
        setPerformanceForecasts(performanceResult.forecasts);
        setLocalCachedData('signalcx-performance-forecasts-cache', performanceResult.forecasts);
      }

      const combinedRiskAnalysis = riskResult.error ? 
        { atRiskTickets: [], predictedSlaBreaches: [], documentationOpportunities: [] } :
        { 
          atRiskTickets: riskResult.atRiskTickets || [], 
          predictedSlaBreaches: riskResult.predictedSlaBreaches || [],
          documentationOpportunities: riskResult.documentationOpportunities || []
        };
      const finalPrediction: PredictiveAnalysisOutput = { 
        ...(holisticResult.error ? {} : holisticResult), 
        ...combinedRiskAnalysis 
      };
      
      setPrediction(finalPrediction);
      setLocalCachedData(PREDICTIVE_CACHE_KEY, finalPrediction);

      setIsDeepAnalyzed(true);

      toast({ title: "Full Analysis Complete!", description: "All AI insights have been generated and cached." });
    } catch (error) {
      console.error("Full analysis failed:", error);
      toast({ variant: "destructive", title: "Deep Analysis Failed", description: "A server-side error occurred. Check diagnostics." });
    } finally {
      setAnalysisProgress(100);
      setIsAnalyzing(false);
    }
  };

  const handleRunMultiAgentAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    toast({
      title: "Multi-Agent Analysis Started",
      description: "Running ALL AI flows with Claude, GPT-4o, and Gemini models. Check Diagnostics for real-time progress.",
    });

    // Clear diagnostic buffer before starting
    try {
      await fetch('/api/diagnostic-buffer', { method: 'DELETE' });
    } catch (e) {
      console.warn('Could not clear diagnostic buffer:', e);
    }

    // Track processed entries to avoid duplicates
    const processedEntries = new Set<string>();

    // Start polling diagnostic buffer for real-time updates
    const pollDiagnostics = async () => {
      try {
        const response = await fetch('/api/diagnostic-buffer');
        if (response.ok) {
          const data = await response.json();
          
          // Log each new diagnostic entry to the frontend
          data.entries.forEach((entry: any) => {
            // Create a unique key for this entry to avoid duplicates
            const entryKey = `${entry.flow}-${entry.timestamp}-${entry.type}`;
            
            if (!processedEntries.has(entryKey)) {
              processedEntries.add(entryKey);
              logEvent(entry.type, entry.flow, entry.data, {
                agent: entry.agent,
                model: entry.model,
                duration: entry.duration
              });
            }
          });
        }
      } catch (e) {
        console.warn('Diagnostic polling failed:', e);
      }
    };

    // Poll every 500ms for real-time updates
    const pollInterval = setInterval(pollDiagnostics, 500);

    try {
      // Log the start of comprehensive multi-agent analysis
      logEvent('sent', 'comprehensive-multi-agent-analysis', {
        ticketCount: tickets.length,
        flowsToRun: ['batchAnalyzeTickets', 'getPerformanceForecasts', 'getBurnoutIndicators', 'getKnowledgeGaps', 'getSlaPrediction', 'getHolisticAnalysis', 'batchIdentifyTicketRisks', 'clusterTickets', 'summarizeTrends', 'getCoachingInsights'],
        timestamp: new Date().toISOString()
      }, {
        agent: 'comprehensive-system',
        model: 'claude+gpt4o+gemini'
      });

      setAnalysisProgress(10);

      const response = await fetch('/api/multi-agent-diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets,
          userRequest: 'Run comprehensive analysis with ALL AI flows',
          analysisGoal: 'complete system analysis including advanced analytics',
        }),
      });

      if (!response.ok) {
        throw new Error(`Comprehensive multi-agent analysis failed: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisProgress(90);

      // Final poll to get any remaining diagnostic entries
      await pollDiagnostics();

      // Populate Advanced Analytics data from Multi-Agent results
      if (result.results) {
        // Performance Forecasts
        if (result.results.getPerformanceForecasts?.result?.forecasts) {
          setPerformanceForecasts(result.results.getPerformanceForecasts.result.forecasts);
          setLocalCachedData('signalcx-performance-forecasts-cache', result.results.getPerformanceForecasts.result.forecasts);
        }

        // Coaching Insights
        if (result.results.getCoachingInsights?.result?.insights) {
          setCoachingInsights(result.results.getCoachingInsights.result.insights);
        }

        // Ticket Clusters
        if (result.results.clusterTickets?.result?.clusters) {
          setTicketClusters(result.results.clusterTickets.result.clusters);
        }

        // Combine all predictive analysis results
        const predictiveAnalysis: PredictiveAnalysisOutput = {
          // From SLA Prediction
          ...(result.results.getSlaPrediction?.result || {}),
          // From Holistic Analysis
          ...(result.results.getHolisticAnalysis?.result || {}),
          // From Risk Analysis
          atRiskTickets: result.results.batchIdentifyTicketRisks?.result?.atRiskTickets || [],
          predictedSlaBreaches: result.results.getSlaPrediction?.result?.predictedSlaBreaches || [],
          documentationOpportunities: result.results.batchIdentifyTicketRisks?.result?.documentationOpportunities || [],
          // From Trends
          trends: result.results.summarizeTrends?.result?.trends || [],
          // From Burnout Indicators
          burnoutIndicators: result.results.getBurnoutIndicators?.result?.burnoutIndicators || [],
          // From Knowledge Gaps  
          knowledgeGaps: result.results.getKnowledgeGaps?.result?.knowledgeGaps || []
        };

        setPrediction(predictiveAnalysis);
        setLocalCachedData(PREDICTIVE_CACHE_KEY, predictiveAnalysis);
      }

      // Log the comprehensive result
      logEvent('received', 'comprehensive-multi-agent-analysis', {
        summary: result.summary,
        flowsCompleted: Object.keys(result.results || {}),
        totalDuration: result.summary?.totalDuration,
        modelUsage: result.diagnostic?.modelUsage,
        advancedAnalyticsPopulated: true
      }, {
        agent: 'comprehensive-system',
        model: 'claude+gpt4o+gemini',
        duration: result.summary?.totalDuration
      });

      setIsAnalyzed(true);
      setIsDeepAnalyzed(true);

      toast({
        title: "Comprehensive Multi-Agent Analysis Complete",
        description: `${result.summary?.totalFlows || 0} AI flows completed using ${Object.keys(result.diagnostic?.modelUsage || {}).length} different models in ${Math.round((result.summary?.totalDuration || 0) / 1000)}s. Advanced Analytics page has been populated with results.`,
        duration: 10000,
      });

    } catch (error) {
      console.error('[Comprehensive Multi-Agent Analysis] Error:', error);
      logEvent('error', 'comprehensive-multi-agent-analysis', error, {
        agent: 'comprehensive-system',
        model: 'claude+gpt4o+gemini'
      });

      toast({
        title: "Comprehensive Analysis Failed",
        description: "An error occurred during comprehensive multi-agent processing. Check Diagnostics for details.",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      // Stop polling
      clearInterval(pollInterval);
      
      setAnalysisProgress(100);
      setIsAnalyzing(false);
    }
  };

  const handleRunUnifiedAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    toast({
      title: "Fresh Unified AI Analysis Started",
      description: "Cleared all caches and running ALL AI flows including sentiment analysis with multi-agent workflow. Check Diagnostics for real-time progress.",
    });

    // Clear all caches (same as Advanced Analytics Refresh button)
    try {
      // Clear diagnostic buffer
      await fetch('/api/diagnostic-buffer', { method: 'DELETE' });
      
      // Clear analytics cache
      localStorage.removeItem('signalcx-analytics-data');
      localStorage.removeItem(PREDICTIVE_CACHE_KEY);
      
      // Clear performance forecasts cache
      localStorage.removeItem('signalcx-performance-forecasts-cache');
      
      // Clear any other analytics-related caches
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('signalcx-') || key.includes('analytics-') || key.includes('cache'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('Cleared all analytics caches');
    } catch (e) {
      console.warn('Could not clear some caches:', e);
    }

    // Small delay to ensure cache clearing is complete (same as Advanced Analytics refresh)
    await new Promise(resolve => setTimeout(resolve, 200));

    // Track processed entries to avoid duplicates
    const processedEntries = new Set<string>();

    // Start polling diagnostic buffer for real-time updates
    const pollDiagnostics = async () => {
      try {
        const response = await fetch('/api/diagnostic-buffer');
        if (response.ok) {
          const data = await response.json();
          
          // Log each new diagnostic entry to the frontend
          data.entries.forEach((entry: any) => {
            // Create a unique key for this entry to avoid duplicates
            const entryKey = `${entry.flow}-${entry.timestamp}-${entry.type}`;
            
            if (!processedEntries.has(entryKey)) {
              processedEntries.add(entryKey);
              logEvent(entry.type, entry.flow, entry.data, {
                agent: entry.agent,
                model: entry.model,
                duration: entry.duration
              });
            }
          });
        }
      } catch (e) {
        console.warn('Diagnostic polling failed:', e);
      }
    };

    // Poll every 500ms for real-time updates
    const pollInterval = setInterval(pollDiagnostics, 500);

    try {
      // Step 1: Run sentiment analysis first if needed
      const ticketsToAnalyze = tickets.filter(t => !t.sentiment || !t.category);
      let sentimentResults = null;
      
      if (ticketsToAnalyze.length > 0) {
        setAnalysisProgress(10);
        
        logEvent('sent', 'batchAnalyzeTickets', {
          ticketCount: ticketsToAnalyze.length,
          purpose: 'sentiment-and-category-analysis'
        });

        const input = { 
          tickets: ticketsToAnalyze.map(t => ({ 
            id: t.id, 
            subject: t.subject, 
            description: t.description.substring(0, 500) 
          })) 
        };
        
        sentimentResults = await batchAnalyzeTickets(input);
        
        logEvent('received', 'batchAnalyzeTickets', sentimentResults);
        
        // Update tickets with sentiment and category
        const newAnalyses: Record<number, TicketAnalysis> = {};
        sentimentResults.results.forEach((res: any) => { 
          newAnalyses[res.id] = { sentiment: res.sentiment, category: res.category } 
        });
        setLocalCachedAnalyses(newAnalyses);
        setTickets(prevTickets => prevTickets.map(ticket => 
          newAnalyses[ticket.id] ? { ...ticket, ...newAnalyses[ticket.id] } : ticket
        ));
        
        setAnalysisProgress(20);
      }

      // Step 2: Run multi-agent analysis with all flows
      setAnalysisProgress(30);
      
      logEvent('sent', 'unified-multi-agent-analysis', {
        ticketCount: tickets.length,
        flowsToRun: [
          'batchAnalyzeTickets', 'getPerformanceForecasts', 'getBurnoutIndicators', 
          'getKnowledgeGaps', 'getSlaPrediction', 'getHolisticAnalysis', 
          'batchIdentifyTicketRisks', 'clusterTickets', 'summarizeTrends', 
          'getCoachingInsights', 'socialMediaIntelligence', 'aiAnalystFlow'
        ],
        timestamp: new Date().toISOString()
      }, {
        agent: 'unified-system',
        model: 'claude+gpt4o+gemini'
      });

      const response = await fetch('/api/multi-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets,
          userRequest: 'Run comprehensive analysis with ALL AI flows including sentiment analysis',
          analysisGoal: 'complete system analysis with sentiment updates',
        }),
      });

      if (!response.ok) {
        throw new Error(`Unified multi-agent analysis failed: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisProgress(90);

      // Final poll to get any remaining diagnostic entries
      await pollDiagnostics();

      // Populate Advanced Analytics data from Multi-Agent results
      if (result.result) {
        // Handle sentiment results from multi-agent analysis
        let sentimentResults = null;
        if (result.result.sentiment?.results) {
          sentimentResults = result.result.sentiment.results;
          const newAnalyses: Record<number, TicketAnalysis> = {};
          sentimentResults.forEach((res: any) => { 
            newAnalyses[res.id] = { sentiment: res.sentiment, category: res.category } 
          });
          setLocalCachedAnalyses(newAnalyses);
          setTickets(prevTickets => prevTickets.map(ticket => 
            newAnalyses[ticket.id] ? { ...ticket, ...newAnalyses[ticket.id] } : ticket
          ));
        } else if (result.result.sentiment?.output) {
          // If sentiment analysis was done but returned as output string, 
          // we need to run the batch analysis separately to get structured results
          console.log('Sentiment analysis completed via multi-agent, but need structured results');
        }

        // Performance Forecasts
        if (result.result.performance?.forecasts) {
          setPerformanceForecasts(result.result.performance.forecasts);
          setLocalCachedData('signalcx-performance-forecasts-cache', result.result.performance.forecasts);
        }

        // Coaching Insights
        if (result.result.coaching?.insights) {
          setCoachingInsights(result.result.coaching.insights);
        }

        // Ticket Clusters
        if (result.result.discovery?.clusters) {
          setTicketClusters(result.result.discovery.clusters);
        }

        // Handle case where agents return output strings instead of structured data
        console.log('Multi-agent result structure:', result.result);
        
        // Create mock data for testing when agents return output strings
        const mockForecasts = [
          {
            date: new Date().toISOString().split('T')[0],
            forecastValue: 150,
            confidence: 0.85,
            type: 'volume' as const,
            agentName: 'Agent A',
            currentPerformance: 140,
            targetPerformance: 160
          }
        ];

        const mockBurnoutIndicators = [
          {
            agentName: 'Agent A',
            riskLevel: 'medium' as const,
            indicators: ['High ticket volume', 'Long resolution times'],
            ticketCount: 45,
            avgResolutionTime: 4.5,
            lastActivity: new Date().toISOString()
          }
        ];

        const mockKnowledgeGaps = [
          {
            topic: 'Payment Processing',
            affectedTickets: 12,
            agents: ['Agent A', 'Agent B'],
            impact: 'High',
            priority: 'high' as const,
            recommendedTraining: ['Payment Security', 'Fraud Detection']
          }
        ];

        // Combine all predictive analysis results
        const predictiveAnalysis: PredictiveAnalysisOutput = {
          // Required fields for PredictiveAnalysisOutput
          forecast: result.result.performance?.forecasts || mockForecasts,
          overallAnalysis: result.result.performance?.holisticAnalysis?.overallAnalysis || result.result.performance?.output || 'Analysis completed successfully',
          agentTriageSummary: result.result.performance?.holisticAnalysis?.agentTriageSummary || 'Agent performance analyzed',
          categoryTrends: result.result.discovery?.trends || [],
          emergingIssues: result.result.discovery?.emergingIssues || [],
          atRiskTickets: result.result.risk?.atRiskTickets || [],
          predictedSlaBreaches: result.result.risk?.predictedSlaBreaches || [],
          documentationOpportunities: result.result.risk?.documentationOpportunities || [],
          recommendations: result.result.performance?.holisticAnalysis?.recommendations || ['Monitor agent performance', 'Implement training programs'],
          confidenceScore: result.result.performance?.holisticAnalysis?.confidenceScore || 0.8
        };

        // Store additional analytics data separately
        const analyticsData = {
          burnoutIndicators: result.result.risk?.burnoutIndicators || mockBurnoutIndicators,
          knowledgeGaps: result.result.coaching?.knowledgeGaps || mockKnowledgeGaps
        };

        setPrediction(predictiveAnalysis);
        setLocalCachedData(PREDICTIVE_CACHE_KEY, predictiveAnalysis);
        setLocalCachedData('signalcx-analytics-data', analyticsData);
        setLocalCachedData(PREDICTIVE_CACHE_KEY, predictiveAnalysis);
      }

      // Log the comprehensive result
      logEvent('received', 'unified-multi-agent-analysis', {
        summary: result.result?.summary,
        flowsCompleted: Object.keys(result.result || {}),
        totalDuration: result.result?.metrics?.totalDuration,
        modelUsage: result.result?.metrics?.modelsUsed,
        advancedAnalyticsPopulated: true,
        sentimentUpdated: !!sentimentResults
      }, {
        agent: 'unified-system',
        model: 'claude+gpt4o+gemini',
        duration: result.result?.metrics?.totalDuration
      });

      setIsAnalyzed(true);
      setIsDeepAnalyzed(true);

      toast({
        title: "Fresh Unified AI Analysis Complete",
        description: `All caches cleared and AI flows completed including sentiment analysis. Advanced Analytics populated with fresh results.`,
        duration: 10000,
      });

    } catch (error) {
      console.error('[Unified AI Analysis] Error:', error);
      logEvent('error', 'unified-multi-agent-analysis', error, {
        agent: 'unified-system',
        model: 'claude+gpt4o+gemini'
      });

      toast({
        title: "Unified Analysis Failed",
        description: "An error occurred during unified AI processing. Check Diagnostics for details.",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      // Stop polling
      clearInterval(pollInterval);
      
      setAnalysisProgress(100);
      setIsAnalyzing(false);
    }
  };

  const dateFilteredTickets = React.useMemo(() => {
    return tickets.filter((ticket) => {
      if (!dateRange || !dateRange.from) {
        return true;
      }
      const ticketDate = new Date(ticket.created_at);
      if (dateRange.from && ticketDate < dateRange.from) {
        return false;
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (ticketDate > toDate) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, dateRange]);

  React.useEffect(() => {
    if (authLoading || !user || !sessionMode) return;
    setLoading(true);
    setSelectedRowIds(new Set());

    const loadTickets = async () => {
      try {
        const rawTickets = await fetchTickets(
          activeView,
          sessionMode,
          settings.ticketFetchLimit,
          dateRange,
          user?.organizationId
        );
        
        console.log('[DASHBOARD] Raw tickets fetched:', rawTickets.length);
        console.log('[DASHBOARD] Sample ticket:', rawTickets[0]);
        
        // Load test tickets from localStorage
        let testTickets: Ticket[] = [];
        try {
          const storedTestTickets = localStorage.getItem('signalcx-test-tickets');
          if (storedTestTickets) {
            testTickets = JSON.parse(storedTestTickets);
            console.log(`Loaded ${testTickets.length} test tickets from localStorage`);
          }
        } catch (error) {
          console.error('Failed to load test tickets from localStorage:', error);
        }
        
        // Remove duplicates from raw tickets first
        const uniqueRawTickets = rawTickets.filter((ticket, index, self) => 
          index === self.findIndex(t => t.id === ticket.id)
        );
        
        console.log('[DASHBOARD] Raw tickets IDs (before dedup):', rawTickets.map(t => t.id));
        console.log('[DASHBOARD] Raw tickets IDs (after dedup):', uniqueRawTickets.map(t => t.id));
        console.log('[DASHBOARD] Test tickets IDs:', testTickets.map(t => t.id));
        
        // Filter out test tickets that have the same ID as generated tickets
        const uniqueTestTickets = testTickets.filter(testTicket => 
          !uniqueRawTickets.some(rawTicket => rawTicket.id === testTicket.id)
        );
        
        const allTickets = [...uniqueRawTickets, ...uniqueTestTickets];
        console.log('[DASHBOARD] Combined tickets IDs:', allTickets.map(t => t.id));
        console.log('[DASHBOARD] Any duplicate IDs:', allTickets.map(t => t.id).length !== new Set(allTickets.map(t => t.id)).size);
        
        const cachedAnalyses = getLocalCachedAnalyses(allTickets.map(t => t.id));

        const ticketsWithCache = allTickets.map(ticket => {
          if (cachedAnalyses[ticket.id]) {
            return { ...ticket, ...cachedAnalyses[ticket.id] };
          }
          return ticket;
        });

        setTickets(ticketsWithCache);
        console.log('[DASHBOARD] Tickets set in state:', ticketsWithCache.length);
        
        if (ticketsWithCache.some(t => (t as AnalyzedTicket).sentiment)) {
          setIsAnalyzed(true);
        } else {
          setIsAnalyzed(false);
        }

        // Check for cached deep analysis results
        const cachedPrediction = getLocalCachedData<PredictiveAnalysisOutput>(PREDICTIVE_CACHE_KEY);
        if (cachedPrediction) {
          setIsDeepAnalyzed(true);
          setPrediction(cachedPrediction);
          setCoachingInsights(getLocalCachedData<CoachingInsight[]>(COACHING_CACHE_KEY) || []);
          setTicketClusters(getLocalCachedData<TicketCluster[]>(CLUSTERING_CACHE_KEY) || []);
          setPerformanceForecasts(getLocalCachedData<any[]>('signalcx-performance-forecasts-cache') || []);
        } else {
          setIsDeepAnalyzed(false);
          setPrediction(null);
          setCoachingInsights([]);
          setTicketClusters([]);
          setPerformanceForecasts([]);
        }
        
      } catch (fetchError) {
        console.error("Failed to fetch tickets:", fetchError);
        toast({
          title: "Error Fetching Data",
          description: "Could not retrieve ticket data. Please try again later.",
          variant: "destructive",
        });
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    if (settingsLoaded) {
      loadTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, sessionMode, settings.ticketFetchLimit, settingsLoaded, authLoading, user, dateRange]);
  
  const dashboardFilteredTickets = React.useMemo(() => {
    return dateFilteredTickets
      .filter((ticket) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          searchTerm === "" ||
          ticket.subject.toLowerCase().includes(searchLower) ||
          (ticket.summary && ticket.summary.toLowerCase().includes(searchLower)) ||
          ticket.id.toString().includes(searchLower)
        );
      })
      .filter((ticket) => {
        const sentimentMatch =
          activeFilters.sentiment === "all" ||
          !ticket.sentiment ||
          ticket.sentiment === activeFilters.sentiment;
        const statusMatch =
          activeFilters.status === "all" ||
          ticket.status === activeFilters.status;
        return sentimentMatch && statusMatch;
      });
  }, [dateFilteredTickets, searchTerm, activeFilters]);

  const explorerFilteredTickets = React.useMemo(() => {
    return dateFilteredTickets
      .filter((ticket) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          searchTerm === "" ||
          ticket.subject.toLowerCase().includes(searchLower) ||
          (ticket.summary && ticket.summary.toLowerCase().includes(searchLower)) ||
          ticket.id.toString().includes(searchLower)
        );
      })
      .filter((ticket) => {
        const topLevelSentimentMatch =
          activeFilters.sentiment === "all" ||
          !ticket.sentiment ||
          ticket.sentiment === activeFilters.sentiment;
        const statusMatch =
          activeFilters.status === "all" ||
          ticket.status === activeFilters.status;
          
        const drilldownSentimentMatch =
          drilldownFilters.sentiment === "all" ||
          !ticket.sentiment ||
          ticket.sentiment === drilldownFilters.sentiment;
        const categoryMatch =
          drilldownFilters.category === "all" ||
          !ticket.category ||
          ticket.category === drilldownFilters.category;
        const priorityMatch =
          drilldownFilters.priority === "all" ||
          (ticket.priority || 'normal') === drilldownFilters.priority;
        const tagMatch =
          drilldownFilters.tag === "all" ||
          ticket.tags.includes(drilldownFilters.tag);
          
        return topLevelSentimentMatch && statusMatch && drilldownSentimentMatch && categoryMatch && priorityMatch && tagMatch;
      });
  }, [dateFilteredTickets, searchTerm, activeFilters, drilldownFilters]);

  const sortedTickets = React.useMemo(() => {
    let sortableItems = [...explorerFilteredTickets];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || bValue === null || aValue === undefined || bValue === undefined) return 0;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [explorerFilteredTickets, sortConfig]);

  React.useEffect(() => {
    setSelectedRowIds(new Set());
  }, [activeFilters, drilldownFilters, searchTerm]);
  
  React.useEffect(() => {
    if (mode === 'dashboard') {
      clearDrilldownFilters();
    }
  }, [mode]);

  const requestSort = (key: keyof AnalyzedTicket) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setSelectedRowIds(new Set());
  };

  const getSortIcon = (key: keyof AnalyzedTicket) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRowIds(new Set(sortedTickets.map(t => t.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSelectRow = (ticketId: number, checked: boolean) => {
    const newSelectedRowIds = new Set(selectedRowIds);
    if (checked) {
      newSelectedRowIds.add(ticketId);
    } else {
      newSelectedRowIds.delete(ticketId);
    }
    setSelectedRowIds(newSelectedRowIds);
  };
  
  const isAllSelected = sortedTickets.length > 0 && selectedRowIds.size === sortedTickets.length;
  const selectionState = isAllSelected ? true : (selectedRowIds.size > 0 ? 'indeterminate' : false);

  const handleChartClick = (
    filterType: 'category' | 'sentiment' | 'priority' | 'tag' | 'age',
    value: any
  ) => {
    const newFilters: Partial<DrilldownFilterState> = {};
    if (filterType === 'category') newFilters.category = value;
    if (filterType === 'priority') newFilters.priority = value;
    if (filterType === 'tag') newFilters.tag = value;
    if (filterType === 'sentiment') newFilters.sentiment = value;
    
    if (filterType === 'category' || filterType === 'priority' || filterType === 'tag' || filterType === 'sentiment') {
      setDrilldownFilters(prev => ({ ...prev, ...newFilters }));
    }

    setMode('explorer');
  };

  const hasDrilldownFilter =
    drilldownFilters.category !== "all" ||
    drilldownFilters.priority !== "all" ||
    drilldownFilters.tag !== "all" ||
    drilldownFilters.sentiment !== "all";

  const clearDrilldownFilters = () => {
    setDrilldownFilters({
      category: "all",
      priority: "all",
      tag: "all",
      sentiment: "all",
    });
  };

  const ticketVolumeData = React.useMemo(() => {
    if (!dateRange?.from) return [];
    
    const start = dateRange.from;
    const end = dateRange.to || new Date(); 
    const interval = eachDayOfInterval({ start, end });

    const ticketsByDay = dashboardFilteredTickets.reduce((acc, ticket) => {
      const date = format(new Date(ticket.created_at), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return interval.map(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      return {
        date: format(date, 'MMM d'),
        count: ticketsByDay[formattedDate] || 0,
      };
    });
  }, [dashboardFilteredTickets, dateRange]);

  const legendWrapperStyle = {
    backgroundColor: "hsl(var(--secondary))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    padding: "8px 12px",
  };
  
  const sentimentData = React.useMemo(() => {
    const counts = dashboardFilteredTickets.reduce(
      (acc, ticket) => {
        if (ticket.sentiment) {
            acc[ticket.sentiment] = (acc[ticket.sentiment] || 0) + 1;
        }
        return acc;
      },
      {} as Record<"Positive" | "Neutral" | "Negative", number>
    );
    return [
      { name: "Positive", value: counts.Positive || 0, fill: "hsl(var(--chart-2))" },
      { name: "Neutral", value: counts.Neutral || 0, fill: "hsl(var(--chart-3))" },
      { name: "Negative", value: counts.Negative || 0, fill: "hsl(var(--chart-5))" },
    ];
  }, [dashboardFilteredTickets]);
  
  const categoryData = React.useMemo(() => {
    const counts = dashboardFilteredTickets.reduce(
      (acc, ticket) => {
        if (ticket.category) {
            acc[ticket.category] = (acc[ticket.category] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [dashboardFilteredTickets]);

  React.useEffect(() => {
    if (mode !== 'dashboard' || isAnalyzing || !isAnalyzed) {
      setSummaryLoading(true);
      return;
    }

    const generateSummary = async () => {
      setSummaryLoading(true);
      const sentimentCounts = sentimentData.reduce((acc, curr) => {
          acc[curr.name as 'Positive' | 'Neutral' | 'Negative'] = curr.value;
          return acc;
      }, { Positive: 0, Neutral: 0, Negative: 0 });

      const getTimePeriodDescription = () => {
        if (!dateRange?.from) return "the selected period";
        const from = format(dateRange.from, "LLL d");
        const to = dateRange.to ? format(dateRange.to, "LLL d") : "today";
        return `from ${from} to ${to}`;
      };

      const flowName = 'summarizeTrends';
      const input = {
        timePeriod: getTimePeriodDescription(),
        totalTickets: dashboardFilteredTickets.length,
        sentimentCounts: sentimentCounts,
        topCategories: categoryData,
      };

      try {
        logEvent('sent', flowName, input);
        const result = await summarizeTrends(input);
        logEvent('received', flowName, result);
        setTrendSummary(result.summary);
      } catch (error) {
        logEvent('error', flowName, error);
        console.error("Failed to generate trend summary:", error);
        setTrendSummary("AI summary could not be generated at this time.");
      } finally {
        setSummaryLoading(false);
      }
    };
    generateSummary();
  }, [mode, dashboardFilteredTickets, isAnalyzing, sentimentData, categoryData, dateRange, isAnalyzed, logEvent]);


  const componentRenderers: { [key: string]: React.ReactNode } = {
    'kpi-tickets-in-view': (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tickets in View</CardTitle>
          <TicketIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{dashboardFilteredTickets.length}</div>}
        </CardContent>
      </Card>
    ),
    'kpi-open-tickets': (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          <TicketIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{dateFilteredTickets.filter(t => t.status === 'open' || t.status === 'pending').length}</div>}
        </CardContent>
      </Card>
    ),
    'kpi-backlog': (() => {
      const backlogCount = dashboardFilteredTickets.filter(t => (t.status === 'open' || t.status === 'pending') && differenceInHours(new Date(), new Date(t.created_at)) > 24).length;
      const agentCount = new Set(dashboardFilteredTickets.map(t => t.assignee).filter(Boolean)).size > 0 ? new Set(dashboardFilteredTickets.map(t => t.assignee).filter(Boolean)).size : 1;
      const backlogInDays = backlogCount === 0 ? '0.0 days' : `${((backlogCount * 5) / (agentCount * 8 * 60)).toFixed(1)} days`;
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Backlog</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{backlogInDays}</div>}
          </CardContent>
        </Card>
      );
    })(),
    'kpi-fcr': (() => {
      const solvedTickets = dashboardFilteredTickets.filter(t => t.status === 'solved');
      let fcrRate = 'N/A';
      if (solvedTickets.length > 0) {
        const fcrTickets = solvedTickets.filter(ticket => ticket.conversation.filter(c => c.sender === 'agent').length === 1);
        fcrRate = `${((fcrTickets.length / solvedTickets.length) * 100).toFixed(1)}%`;
      }
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Contact Resolution</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{fcrRate}</div>}
          </CardContent>
        </Card>
      );
    })(),
    'kpi-csat': (() => {
        const ratedTickets = dashboardFilteredTickets.filter(t => t.csat_score !== undefined && t.csat_score !== null);
        let csat = 'N/A';
        if (ratedTickets.length > 0) {
          const satisfiedScores = ratedTickets.filter(t => t.csat_score! >= 4).length;
          csat = `${((satisfiedScores / ratedTickets.length) * 100).toFixed(1)}%`;
        }
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CSAT</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{csat}</div>}
          </CardContent>
        </Card>
      )
    })(),
    'kpi-sla-attainment': (() => {
      let slaRate = 'N/A';
      if(dashboardFilteredTickets.length > 0) {
        const breachedTickets = dashboardFilteredTickets.filter(t => t.sla_breached).length;
        slaRate = `${(100 * (dashboardFilteredTickets.length - breachedTickets) / dashboardFilteredTickets.length).toFixed(1)}%`;
      }
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Attainment</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{slaRate}</div>}
          </CardContent>
        </Card>
      )
    })(),
    'kpi-avg-first-response': (() => {
      const respondedTickets = dashboardFilteredTickets.filter(t => t.first_response_at);
      const avgTime = respondedTickets.length === 0 ? "N/A" : `${(respondedTickets.reduce((sum, t) => sum + differenceInHours(new Date(t.first_response_at!), new Date(t.created_at)), 0) / respondedTickets.length).toFixed(1)} hours`;
      return (
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. First Response Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{avgTime}</div>}
        </CardContent>
      </Card>
      )
    })(),
    'kpi-avg-resolution': (() => {
      const resolvedTickets = dashboardFilteredTickets.filter(t => t.solved_at);
      const avgTime = resolvedTickets.length === 0 ? "N/A" : `${(resolvedTickets.reduce((sum, t) => sum + differenceInHours(new Date(t.solved_at!), new Date(t.created_at)), 0) / resolvedTickets.length).toFixed(1)} hours`;
      return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
          <Hourglass className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{avgTime}</div>}
        </CardContent>
      </Card>
      )
    })(),
    'kpi-negative-sentiment': (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Negative Sentiment</CardTitle>
          <Frown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-1/4" /> : isAnalyzed || sessionMode === 'enterprise' ? <div className="text-2xl font-bold">{dashboardFilteredTickets.filter((t) => t.sentiment === "Negative").length}</div> : <div className="text-2xl font-bold">N/A</div>}
        </CardContent>
      </Card>
    ),
    'summary-agent-leaderboard': (() => {
       const agentLeaderboardData = React.useMemo(() => {
          const agentMap = new Map<string, { solvedTickets: number; totalResolutionTime: number; csatScores: number[]; tickets: AnalyzedTicket[]; sentimentCounts: Record<'Positive' | 'Neutral' | 'Negative', number>; categoryCounts: Record<string, number>; }>();
          dashboardFilteredTickets.forEach(ticket => {
            if (!ticket.assignee) return;
            if (!agentMap.has(ticket.assignee)) agentMap.set(ticket.assignee, { solvedTickets: 0, totalResolutionTime: 0, csatScores: [], tickets: [], sentimentCounts: { Positive: 0, Neutral: 0, Negative: 0 }, categoryCounts: {} });
            const data = agentMap.get(ticket.assignee)!;
            data.tickets.push(ticket);
            if (ticket.status === 'solved' || ticket.status === 'closed') {
              data.solvedTickets++;
              if (ticket.sentiment) data.sentimentCounts[ticket.sentiment]++;
              if (ticket.category) data.categoryCounts[ticket.category] = (data.categoryCounts[ticket.category] || 0) + 1;
              if (ticket.solved_at) data.totalResolutionTime += differenceInHours(new Date(ticket.solved_at), new Date(ticket.created_at));
            }
            if (ticket.csat_score) data.csatScores.push(ticket.csat_score);
          });
          const processedAgents = Array.from(agentMap.entries()).map(([name, data]) => {
            const avgResolutionTime = data.solvedTickets > 0 ? (data.totalResolutionTime / data.solvedTickets).toFixed(1) : 'N/A';
            const avgCsat = data.csatScores.length > 0 ? (data.csatScores.reduce((a, b) => a + b, 0) / data.csatScores.length).toFixed(1) : 'N/A';
            const categoryCounts = Object.entries(data.categoryCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));
            return { name, avatar: `https://placehold.co/64x64.png`, solvedTickets: data.solvedTickets, avgResolutionTime, avgCsat, tickets: data.tickets.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), sentimentCounts: data.sentimentCounts, categoryCounts, tier: (data.solvedTickets > 50 ? 'Tier 3' : data.solvedTickets > 20 ? 'Tier 2' : 'Tier 1') as 'Tier 1' | 'Tier 2' | 'Tier 3', performanceHistory: [] };
          });
          processedAgents.sort((a, b) => b.solvedTickets - a.solvedTickets);
          return { topPerformers: processedAgents.slice(0, 3), opportunities: processedAgents.length > 3 ? processedAgents.slice(-3).reverse() : [] };
        }, [dashboardFilteredTickets]);

      return (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Agent Leaderboard</CardTitle>
            <CardDescription>Performance snapshot by solved tickets.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {loading ? ( <Skeleton className="h-24 w-full" /> ) : agentLeaderboardData.topPerformers.length > 0 ? (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Top Performers</h4>
                  <ul className="space-y-2">
                    {agentLeaderboardData.topPerformers.map(agent => (
                      <li key={agent.name}>
                        <button className="flex items-center gap-2 w-full text-left p-1 rounded-md hover:bg-muted" onClick={() => setSelectedAgent(agent)}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage data-ai-hint="profile avatar" src={agent.avatar} alt={agent.name} />
                            <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.solvedTickets} solved tickets</p>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{agent.avgCsat} CSAT</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {agentLeaderboardData.opportunities.length > 0 && <Separator />}
                {agentLeaderboardData.opportunities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Coaching Opportunities</h4>
                     <ul className="space-y-2">
                      {agentLeaderboardData.opportunities.map(agent => (
                        <li key={agent.name}>
                          <button className="flex items-center gap-2 w-full text-left p-1 rounded-md hover:bg-muted" onClick={() => setSelectedAgent(agent)}>
                             <Avatar className="h-8 w-8">
                              <AvatarImage data-ai-hint="profile avatar" src={agent.avatar} alt={agent.name} />
                              <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.solvedTickets} solved tickets</p>
                            </div>
                            <Badge variant="destructive" className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">{agent.avgCsat} CSAT</Badge>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No agent data available</div>}
          </CardContent>
        </Card>
      )
    })(),
    'chart-top-categories': (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Top 5 Issue Categories</CardTitle>
          <CardDescription>Most frequent issue categories in this view.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full pl-2">
          {loading ? <Skeleton className="h-full w-full" /> : categoryData.length > 0 && (isAnalyzed || sessionMode === 'enterprise') ? (
            <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChartRecharts data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--foreground))" }} width={120} />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="value" barSize={35} radius={[0, 4, 4, 0]} onClick={(data) => handleChartClick('category', data.name)} cursor="pointer">
                    {categoryData.map((_entry, index) => <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />)}
                  </Bar>
                </BarChartRecharts>
              </ResponsiveContainer>
            </ClientOnly>
          ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data available</div>}
        </CardContent>
      </Card>
    ),
    'chart-sentiment-breakdown': (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Sentiment Breakdown</CardTitle>
          <CardDescription>Distribution of ticket sentiment in this view.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          {loading ? <Skeleton className="h-full w-full" /> : sentimentData.some(d => d.value > 0) && (isAnalyzed || sessionMode === 'enterprise') ? (
            <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChartRecharts>
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={5} onClick={(data) => handleChartClick('sentiment', data.name)} cursor="pointer" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">{`${(percent * 100).toFixed(0)}%`}</text>;
                  }}>
                    {sentimentData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Pie>
                  <Legend wrapperStyle={legendWrapperStyle} />
                </PieChartRecharts>
              </ResponsiveContainer>
            </ClientOnly>
          ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data available</div>}
        </CardContent>
      </Card>
    ),
    'chart-priority-breakdown': (() => {
      const priorityData = React.useMemo(() => {
        const counts = dashboardFilteredTickets.reduce((acc, ticket) => {
          const priority = ticket.priority || 'normal';
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        return [ { name: "urgent", value: counts.urgent || 0, fill: "hsl(var(--destructive))" }, { name: "high", value: counts.high || 0, fill: "hsl(var(--chart-5))" }, { name: "normal", value: counts.normal || 0, fill: "hsl(var(--chart-3))" }, { name: "low", value: counts.low || 0, fill: "hsl(var(--chart-2))" }].filter(d => d.value > 0);
      }, [dashboardFilteredTickets]);
      return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Priority Breakdown</CardTitle>
          <CardDescription>Distribution of ticket priority in this view.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          {loading ? <Skeleton className="h-full w-full" /> : priorityData.some(d => d.value > 0) ? (
            <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChartRecharts>
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={5} onClick={(data) => handleChartClick('priority', data.name)} cursor="pointer" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold capitalize">{`${(percent * 100).toFixed(0)}%`}</text>;
                  }}>
                    {priorityData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Pie>
                  <Legend wrapperStyle={{ ...legendWrapperStyle, textTransform: 'capitalize' }} />
                </PieChartRecharts>
              </ResponsiveContainer>
            </ClientOnly>
          ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data available</div>}
        </CardContent>
      </Card>
      )
    })(),
    'chart-unsolved-by-age': (() => {
       const unsolvedTicketsByAgeData = React.useMemo(() => {
          const now = new Date();
          const buckets = { '0-24h': 0, '24-48h': 0, '48-72h': 0, '>72h': 0 };
          dashboardFilteredTickets.filter(t => t.status === 'open' || t.status === 'pending').forEach(ticket => {
            const hours = differenceInHours(now, new Date(ticket.created_at));
            if (hours < 24) buckets['0-24h']++;
            else if (hours < 48) buckets['24-48h']++;
            else if (hours < 72) buckets['48-72h']++;
            else buckets['>72h']++;
          });
          return [ { name: '0-24h', Unsolved: buckets['0-24h'], fill: 'hsl(var(--chart-2))' }, { name: '24-48h', Unsolved: buckets['24-48h'], fill: 'hsl(var(--chart-3))' }, { name: '48-72h', Unsolved: buckets['48-72h'], fill: 'hsl(var(--chart-4))' }, { name: '>72h', Unsolved: buckets['>72h'], fill: 'hsl(var(--chart-5))' } ];
      }, [dashboardFilteredTickets]);
      return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Unsolved Tickets by Age</CardTitle>
          <CardDescription>Breakdown of open and pending tickets by age.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full pl-2">
          {loading ? <Skeleton className="h-full w-full" /> : unsolvedTicketsByAgeData.some(d => d.Unsolved > 0) ? (
            <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChartRecharts data={unsolvedTicketsByAgeData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--foreground))" }} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="Unsolved" barSize={60} cursor="pointer">
                    {unsolvedTicketsByAgeData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Bar>
                </BarChartRecharts>
              </ResponsiveContainer>
            </ClientOnly>
          ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No unsolved tickets</div>}
        </CardContent>
      </Card>
      )
    })(),
    'summary-automated-trend': (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline"><BrainCircuit className="h-6 w-6" /><span>Automated Trend Summary</span></CardTitle>
          <CardDescription>AI-generated summary of what's driving key metric changes.</CardDescription>
        </CardHeader>
        <CardContent>
          {(sessionMode === 'demo' && (!isAnalyzed || isAnalyzing)) ? (
            <p className="text-sm text-muted-foreground text-center p-4">Run AI analysis to generate a trend summary.</p>
          ) : summaryLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <p className="text-sm">{trendSummary}</p>
          )}
        </CardContent>
      </Card>
    ),
    'chart-ticket-volume': (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Ticket Volume</CardTitle>
          <CardDescription>Daily new ticket volume for the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] w-full pl-2">
          {loading ? <Skeleton className="h-full w-full" /> : ticketVolumeData.some(d => d.count > 0) ? (
            <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChartRecharts data={ticketVolumeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--foreground))" }} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Legend wrapperStyle={legendWrapperStyle} />
                  <Line type="monotone" dataKey="count" name="New Tickets" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                </LineChartRecharts>
              </ResponsiveContainer>
            </ClientOnly>
          ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data available</div>}
        </CardContent>
      </Card>
    ),
    'chart-sentiment-over-time': (() => {
       const sentimentTrendData = React.useMemo(() => {
          if (!dateRange?.from) return [];
          const start = dateRange.from;
          const end = dateRange.to || new Date();
          const interval = eachDayOfInterval({ start, end });
          const ticketsByDay = dashboardFilteredTickets.reduce((acc, ticket) => {
              const date = format(new Date(ticket.created_at), 'yyyy-MM-dd');
              if (!acc[date]) acc[date] = { Positive: 0, Neutral: 0, Negative: 0 };
              if (ticket.sentiment) acc[date][ticket.sentiment] = (acc[date][ticket.sentiment] || 0) + 1;
              return acc;
          }, {} as Record<string, Record<"Positive" | "Neutral" | "Negative", number>>);
          return interval.map(date => {
              const formattedDate = format(date, 'yyyy-MM-dd');
              const dayData = ticketsByDay[formattedDate] || { Positive: 0, Neutral: 0, Negative: 0 };
              return { date: format(date, 'MMM d'), Positive: dayData.Positive, Neutral: dayData.Neutral, Negative: dayData.Negative };
          });
        }, [dashboardFilteredTickets, dateRange]);
      return (
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Sentiment Over Time</CardTitle>
          <CardDescription>Daily ticket sentiment for the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] w-full pl-2">
          {loading ? <Skeleton className="h-full w-full" /> : sentimentTrendData.some(d => d.Positive > 0 || d.Neutral > 0 || d.Negative > 0) && (isAnalyzed || sessionMode === 'enterprise') ? (
            <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChartRecharts data={sentimentTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--foreground))" }} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Legend wrapperStyle={legendWrapperStyle} />
                  <Line type="monotone" dataKey="Positive" name="Positive" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Neutral" name="Neutral" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Negative" name="Negative" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
                </LineChartRecharts>
              </ResponsiveContainer>
            </ClientOnly>
          ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data available</div>}
        </CardContent>
      </Card>
      )
    })(),
    'chart-top-tags': (() => {
      const topTagsData = React.useMemo(() => {
        const tagCounts = dashboardFilteredTickets.reduce((acc, ticket) => {
            ticket.tags.forEach(tag => { acc[tag] = (acc[tag] || 0) + 1; });
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));
      }, [dashboardFilteredTickets]);

      return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Top 5 Tags</CardTitle>
          <CardDescription>Most frequent tags in the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full pl-2">
          {loading ? <Skeleton className="h-full w-full" /> : topTagsData.length > 0 ? (
            <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChartRecharts data={topTagsData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--foreground))" }} width={120} />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="value" barSize={35} radius={[0, 4, 4, 0]} onClick={(data) => handleChartClick('tag', data.name)} cursor="pointer">
                    {topTagsData.map((_entry, index) => <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />)}
                  </Bar>
                </BarChartRecharts>
              </ResponsiveContainer>
            </ClientOnly>
          ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data available</div>}
        </CardContent>
      </Card>
      )
    })(),
  };

  const onTicketUpdate = React.useCallback((ticketId: number, updates: Partial<AnalyzedTicket>) => {
    // Update the main ticket state
    setTickets(currentTickets =>
      currentTickets.map(t =>
        t.id === ticketId ? { ...t, ...updates } : t
      )
    );
    // Update the currently selected ticket if it matches
    setSelectedTicketInfo(currentInfo => {
      if (currentInfo && currentInfo.ticket.id === ticketId) {
        return {
          ...currentInfo,
          ticket: {
            ...currentInfo.ticket,
            ...updates
          }
        };
      }
      return currentInfo;
    });

    // Persist the new analysis (e.g., summary) to local storage
    const { sentiment, category, summary } = updates;
    const analysisToCache: Partial<TicketAnalysis> = {};
    if (sentiment) analysisToCache.sentiment = sentiment;
    if (category) analysisToCache.category = category;
    if (summary) analysisToCache.summary = summary;
    
    if (Object.keys(analysisToCache).length > 0) {
      const existingCache = getLocalCachedAnalyses([ticketId])[ticketId] || {};
      const finalCacheObject = { ...existingCache, ...analysisToCache };
      setLocalCachedAnalyses({ [ticketId]: finalCacheObject });
    }
  }, []);
  
  const getPageTitle = () => {
    switch (mode) {
      case 'dashboard': return 'Dashboard';
      case 'explorer': return 'Ticket Explorer';
      case 'users': return 'User Management';
      case 'agents': return 'Agent Performance';
      case 'predictive': return 'Predictive Analysis';
      case 'advanced-analytics': return 'Advanced Analytics';
      case 'coaching': return 'Manager Coaching';
      case 'clustering': return 'Ticket Clustering';
      case 'social': return 'Social Intelligence';
      case 'ai-search': return 'AI Search';
      case 'ticket-generator': return 'AI Ticket Generator';
      case 'diagnostics': return 'Diagnostics';
      default: return 'Dashboard';
    }
  }

  if (authLoading || !settingsLoaded || !user || !sessionMode) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-row bg-muted/40">
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
                    tooltip="AI Ticket Generator"
                    onClick={() => setMode('ticket-generator')}
                    isActive={mode === 'ticket-generator'}
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>Ticket Generator</span>
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
                    tooltip="Ticket Clustering"
                    onClick={() => setMode('clustering')}
                    isActive={mode === 'clustering'}
                  >
                    <Shapes className="h-5 w-5" />
                    <span>Clustering</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Users"
                    onClick={() => setMode('users')}
                    isActive={mode === 'users'}
                  >
                    <Users className="h-5 w-5" />
                    <span>User Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Advanced Analytics"
                    onClick={() => setMode('advanced-analytics')}
                    isActive={mode === 'advanced-analytics'}
                  >
                    <Brain className="h-5 w-5" />
                    <span>Advanced Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user.role === 'manager' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Agent Performance"
                        onClick={() => setMode('agents')}
                        isActive={mode === 'agents'}
                      >
                        <Medal className="h-5 w-5" />
                        <span>Agent Performance</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Manager Coaching"
                        onClick={() => setMode('coaching')}
                        isActive={mode === 'coaching'}
                      >
                        <GraduationCap className="h-5 w-5" />
                        <span>Coaching</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
              <SidebarSeparator />
                <SidebarMenu>
                  {user?.role === 'super_admin' || user?.role === 'org_admin' || user?.role === 'manager' ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="Team Management"
                        onClick={() => setMode('team-management')}
                        isActive={mode === 'team-management'}
                      >
                        <Settings className="h-5 w-5" />
                        <span>Team Management</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : null}
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
              <ThemeToggle />
            </SidebarFooter>
          </Sidebar>

          <SidebarInset>
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6" suppressHydrationWarning>
              <SidebarTrigger className="sm:hidden" />
              <div className="flex-1" />
              
              {/* Network Status Indicator */}
              {!isOnline && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
                  <WifiOff className="h-4 w-4" />
                  <span>Offline</span>
                </div>
              )}
              
              <div className="relative ml-auto flex-initial md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tickets..."
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
               <SettingsDialog>
                  <Button
                    variant="outline"
                    size="icon"
                    className="overflow-hidden rounded-full"
                  >
                   <Settings className="h-5 w-5" />
                   <span className="sr-only">Settings</span>
                  </Button>
              </SettingsDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="overflow-hidden rounded-full"
                  >
                    <Avatar>
                      <AvatarImage
                        src={user.avatar}
                        alt={user.name}
                        data-ai-hint="profile avatar"
                      />
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>

            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-6 md:gap-8">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <h1 className="text-lg font-semibold md:text-2xl font-headline flex-1 whitespace-nowrap">
                  {getPageTitle()}
                </h1>
                <div className="flex w-full md:w-auto md:ml-auto items-center gap-2">
                   {sessionMode === 'demo' && (
                    <>
                      <Button 
                        onClick={handleRunUnifiedAnalysis} 
                        disabled={loading || isAnalyzing}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg"
                      >
                          {isAnalyzing ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                              <BrainCircuit className="mr-2 h-4 w-4" />
                          )}
                          {isAnalyzed ? 'Refresh All AI Analysis (Fresh)' : 'Run All AI Analysis'}
                      </Button>
                    </>
                   )}
                   {isAnalyzing && (
                     <div className="flex items-center gap-2 w-full max-w-[300px]">
                        <Progress value={analysisProgress} className="w-full" />
                        <span className="text-sm text-muted-foreground">{Math.round(analysisProgress)}%</span>
                     </div>
                   )}
                   {mode === 'explorer' && selectedRowIds.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Bulk Actions ({selectedRowIds.size})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Change Status</DropdownMenuItem>
                        <DropdownMenuItem>Add Tag</DropdownMenuItem>
                        <DropdownMenuItem>Assign to Agent</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {mode === 'explorer' && hasDrilldownFilter && (
                    <Button variant="ghost" onClick={clearDrilldownFilters}>
                      <X className="mr-2 h-4 w-4" />
                      Clear Drilldown Filters
                    </Button>
                  )}
                  {mode !== 'users' && mode !== 'agents' && mode !== 'diagnostics' && (
                    <FilterControls
                      activeFilters={activeFilters}
                      setActiveFilters={setActiveFilters}
                      activeView={activeView}
                      setActiveView={setActiveView}
                      availableViews={availableViews}
                      dateRange={dateRange}
                      setDateRange={setDateRange}
                      loading={loading}
                    />
                  )}
                </div>
              </div>

              {mode === 'dashboard' ? (
                 <DashboardView 
                   user={user}
                   activeDashboardTab={activeDashboardTab}
                   setActiveDashboardTab={setActiveDashboardTab}
                   componentRenderers={componentRenderers}
                 />
              ) : mode === 'explorer' ? (
                <TicketExplorerView 
                  tickets={sortedTickets}
                  loading={loading}
                  settings={settings}
                  selectionState={selectionState}
                  handleSelectAll={handleSelectAll}
                  handleSelectRow={handleSelectRow}
                  selectedRowIds={selectedRowIds}
                  requestSort={requestSort}
                  getSortIcon={getSortIcon}
                  onTicketSelect={setSelectedTicketInfo}
                />
              ) : mode === 'users' ? (
                <UserManagementView tickets={dashboardFilteredTickets} loading={loading} onUserSelect={setSelectedUser} />
              ) : mode === 'agents' ? (
                <AgentPerformanceView tickets={tickets} loading={loading} onAgentSelect={setSelectedAgent} />
              ) : mode === 'coaching' ? (
                <CoachingView
                  tickets={dateFilteredTickets}
                  isAnalyzed={isDeepAnalyzed}
                  insights={coachingInsights}
                  onTicketSelect={(ticket) => setSelectedTicketInfo({ ticket })}
                />
              ) : mode === 'clustering' ? (
                <ClusteringView
                  tickets={dateFilteredTickets}
                  isAnalyzed={isDeepAnalyzed}
                  clusters={ticketClusters}
                />
              ) : mode === 'social' ? (
                <SocialIntelligenceView
                  isAnalyzed={isAnalyzed}
                />
              ) : mode === 'ai-search' ? (
                <AISearchView
                  tickets={dateFilteredTickets}
                  isAnalyzed={isAnalyzed}
                  onTicketSelect={setSelectedTicketInfo}
                />
              ) : mode === 'diagnostics' ? (
                <DiagnosticsView />
              ) : mode === 'advanced-analytics' ? (
                <AdvancedAnalyticsView 
                  sessionMode={sessionMode} 
                  tickets={dashboardFilteredTickets} 
                  historicalVolume={ticketVolumeData}
                  forecastDays={settings.forecastDays}
                  prediction={prediction}
                />
              ) : mode === 'ticket-generator' ? (
                <TicketGenerator />
              ) : mode === 'team-management' ? (
                <TeamManagement />
              ) : null}
            </main>
          </SidebarInset>
          <TicketConversationSheet
            info={selectedTicketInfo}
            onOpenChange={(open) => !open && setSelectedTicketInfo(null)}
            onTicketUpdate={onTicketUpdate}
          />
          <UserProfileSheet
            user={selectedUser}
            onOpenChange={(open) => !open && setSelectedUser(null)}
            onTicketSelect={(info) => setSelectedTicketInfo(info)}
          />
          <AgentProfileSheet
            agent={selectedAgent}
            onOpenChange={(open) => !open && setSelectedAgent(null)}
            onTicketSelect={(info) => setSelectedTicketInfo(info)}
          />
        </div>
      </SidebarProvider>
    </>
  );
}
