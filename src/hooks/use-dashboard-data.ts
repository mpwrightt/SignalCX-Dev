"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import {
  AnalyzedTicket,
  TicketAnalysis,
  PredictiveAnalysisOutput,
  CoachingInsight,
  TicketCluster,
} from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { useToast } from "@/hooks/use-toast";
import { getAvailableViews } from "@/lib/view-service";
import { zendeskViews as staticViews } from "@/lib/views";
import { fetchTickets } from "@/ai/flows/fetch-and-analyze-tickets";
import { summarizeTrends } from "@/ai/flows/summarize-trends";
import { getHolisticAnalysis } from "@/ai/flows/get-holistic-analysis";
import { batchIdentifyTicketRisks } from "@/ai/flows/batch-identify-ticket-risks";
import { getCoachingInsights } from "@/ai/flows/get-coaching-insights";
import { clusterTickets } from "@/ai/flows/cluster-tickets";
import { batchAnalyzeTickets } from "@/ai/flows/batch-analyze-tickets";
import { getPerformanceForecasts } from "@/ai/flows/get-performance-forecasts";
import {
  getLocalCachedData,
  setLocalCachedData,
  getLocalCachedAnalyses,
  setLocalCachedAnalyses,
  ANALYSIS_CACHE_KEY,
  PREDICTIVE_CACHE_KEY,
  COACHING_CACHE_KEY,
  CLUSTERING_CACHE_KEY,
} from "@/lib/dashboard-cache";

export function useDashboardData() {
  const { sessionMode } = useAuth();
  const { logEvent } = useDiagnostics();
  const { toast } = useToast();

  // Fetch available views
  const fetchAvailableViews = React.useCallback(async (
    setAvailableViews: (views: string[]) => void,
    setViewsLoading: (loading: boolean) => void,
    activeView: string,
    setActiveView: (view: string) => void
  ) => {
    if (!sessionMode) return;

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
  }, [sessionMode]);

  // Fetch tickets
  const fetchDashboardTickets = React.useCallback(async (
    activeView: string,
    dateRange: DateRange | undefined,
    setTickets: (tickets: AnalyzedTicket[]) => void,
    setLoading: (loading: boolean) => void,
    setIsAnalyzed: (analyzed: boolean) => void
  ) => {
    if (!sessionMode || !dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    setIsAnalyzed(false);

    try {
      logEvent("fetch_tickets_start", {
        view: activeView,
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      });

      const result = await fetchTickets({
        viewId: activeView === "All Views" ? null : activeView,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });

      if (result.success && result.data) {
        setTickets(result.data);
        setIsAnalyzed(true);
        
        logEvent("fetch_tickets_success", {
          ticketCount: result.data.length,
          view: activeView
        });

        toast({
          title: "Tickets loaded successfully",
          description: `Loaded ${result.data.length} tickets from ${activeView}`,
        });
      } else {
        throw new Error(result.error || "Failed to fetch tickets");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      logEvent("fetch_tickets_error", { error: String(error) });
      
      toast({
        title: "Error loading tickets",
        description: "Please try again or check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionMode, logEvent, toast]);

  // Analyze selected tickets
  const analyzeSelectedTickets = React.useCallback(async (
    selectedTicketIds: number[],
    tickets: AnalyzedTicket[],
    setIsAnalyzing: (analyzing: boolean) => void,
    setAnalysisProgress: (progress: number) => void
  ) => {
    if (selectedTicketIds.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const selectedTickets = tickets.filter(t => selectedTicketIds.includes(t.id));
      const cachedAnalyses = getLocalCachedAnalyses(selectedTicketIds);
      const uncachedTickets = selectedTickets.filter(t => !cachedAnalyses[t.id]);

      if (uncachedTickets.length > 0) {
        logEvent("batch_analysis_start", { ticketCount: uncachedTickets.length });

        const result = await batchAnalyzeTickets({
          tickets: uncachedTickets.map(t => ({
            id: t.id,
            subject: t.subject,
            description: t.description || "",
            conversation: t.conversation || []
          }))
        });

        if (result.success && result.data) {
          const newAnalyses: Record<number, TicketAnalysis> = {};
          result.data.forEach((analysis, index) => {
            newAnalyses[uncachedTickets[index].id] = analysis;
          });

          setLocalCachedAnalyses(newAnalyses);
          setAnalysisProgress(100);

          logEvent("batch_analysis_success", { 
            analyzedCount: result.data.length 
          });

          toast({
            title: "Analysis complete",
            description: `Analyzed ${result.data.length} tickets`,
          });
        }
      } else {
        setAnalysisProgress(100);
        toast({
          title: "Analysis loaded from cache",
          description: `Found cached analysis for ${selectedTicketIds.length} tickets`,
        });
      }
    } catch (error) {
      console.error("Error analyzing tickets:", error);
      logEvent("batch_analysis_error", { error: String(error) });
      
      toast({
        title: "Analysis failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [logEvent, toast]);

  // Generate trend summary
  const generateTrendSummary = React.useCallback(async (
    tickets: AnalyzedTicket[],
    setTrendSummary: (summary: string | null) => void,
    setSummaryLoading: (loading: boolean) => void
  ) => {
    if (tickets.length === 0) return;

    setSummaryLoading(true);

    try {
      const result = await summarizeTrends({ tickets });
      
      if (result.success && result.data) {
        setTrendSummary(result.data.summary);
        
        toast({
          title: "Trend analysis complete",
          description: "Generated insights from your ticket data",
        });
      }
    } catch (error) {
      console.error("Error generating trend summary:", error);
      toast({
        title: "Trend analysis failed",
        description: "Unable to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [toast]);

  // Generate predictive analysis
  const generatePredictiveAnalysis = React.useCallback(async (
    tickets: AnalyzedTicket[],
    setPrediction: (prediction: PredictiveAnalysisOutput | null) => void
  ) => {
    const cacheKey = `${PREDICTIVE_CACHE_KEY}-${tickets.length}`;
    const cached = getLocalCachedData<PredictiveAnalysisOutput>(cacheKey);
    
    if (cached) {
      setPrediction(cached);
      return;
    }

    try {
      const result = await getHolisticAnalysis({
        tickets: tickets.slice(0, 100) // Limit for performance
      });

      if (result.success && result.data) {
        setPrediction(result.data);
        setLocalCachedData(cacheKey, result.data);
        
        toast({
          title: "Predictive analysis complete",
          description: "Generated forecasts and risk assessments",
        });
      }
    } catch (error) {
      console.error("Error generating predictive analysis:", error);
      toast({
        title: "Predictive analysis failed",
        description: "Unable to generate predictions. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Generate coaching insights
  const generateCoachingInsights = React.useCallback(async (
    tickets: AnalyzedTicket[],
    setCoachingInsights: (insights: CoachingInsight[]) => void
  ) => {
    const cacheKey = `${COACHING_CACHE_KEY}-${tickets.length}`;
    const cached = getLocalCachedData<CoachingInsight[]>(cacheKey);
    
    if (cached) {
      setCoachingInsights(cached);
      return;
    }

    try {
      const result = await getCoachingInsights({
        tickets: tickets.slice(0, 50) // Limit for performance
      });

      if (result.success && result.data) {
        setCoachingInsights(result.data);
        setLocalCachedData(cacheKey, result.data);
        
        toast({
          title: "Coaching insights generated",
          description: `Found ${result.data.length} coaching opportunities`,
        });
      }
    } catch (error) {
      console.error("Error generating coaching insights:", error);
      toast({
        title: "Coaching analysis failed",
        description: "Unable to generate coaching insights. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Generate ticket clusters
  const generateTicketClusters = React.useCallback(async (
    tickets: AnalyzedTicket[],
    setTicketClusters: (clusters: TicketCluster[]) => void
  ) => {
    const cacheKey = `${CLUSTERING_CACHE_KEY}-${tickets.length}`;
    const cached = getLocalCachedData<TicketCluster[]>(cacheKey);
    
    if (cached) {
      setTicketClusters(cached);
      return;
    }

    try {
      const result = await clusterTickets({
        tickets: tickets.slice(0, 100) // Limit for performance
      });

      if (result.success && result.data) {
        setTicketClusters(result.data);
        setLocalCachedData(cacheKey, result.data);
        
        toast({
          title: "Clustering complete",
          description: `Found ${result.data.length} ticket clusters`,
        });
      }
    } catch (error) {
      console.error("Error clustering tickets:", error);
      toast({
        title: "Clustering failed",
        description: "Unable to cluster tickets. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Generate performance forecasts
  const generatePerformanceForecasts = React.useCallback(async (
    tickets: AnalyzedTicket[],
    setPerformanceForecasts: (forecasts: any[]) => void
  ) => {
    try {
      const result = await getPerformanceForecasts({
        tickets: tickets.slice(0, 200) // Limit for performance
      });

      if (result.success && result.data) {
        setPerformanceForecasts(result.data);
        
        toast({
          title: "Performance forecasts generated",
          description: "Generated performance predictions",
        });
      }
    } catch (error) {
      console.error("Error generating performance forecasts:", error);
      toast({
        title: "Forecast generation failed",
        description: "Unable to generate forecasts. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    fetchAvailableViews,
    fetchDashboardTickets,
    analyzeSelectedTickets,
    generateTrendSummary,
    generatePredictiveAnalysis,
    generateCoachingInsights,
    generateTicketClusters,
    generatePerformanceForecasts,
  };
}