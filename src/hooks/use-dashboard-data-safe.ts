"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { AnalyzedTicket } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { fetchMockTicketsForView } from "@/lib/zendesk-service";
import { fetchTickets as fetchTicketsFlow } from "@/ai/flows/fetch-and-analyze-tickets";

export function useDashboardDataSafe() {
  const { sessionMode } = useAuth();
  const { toast } = useToast();
  
  // Tickets state
  const [tickets, setTickets] = React.useState<AnalyzedTicket[]>([]);
  
  // Stable fetch function with proper error handling
  const fetchTickets = React.useCallback(async (
    activeView: string,
    dateRange: DateRange | undefined,
    onLoadingChange?: (loading: boolean) => void
  ) => {
    if (!sessionMode || !dateRange?.from || !dateRange?.to) {
      return;
    }

    try {
      onLoadingChange?.(true);
      
      // Try to use real API first, fallback to mock data
      let ticketsData: AnalyzedTicket[] = [];
      
      try {
        // Use mock data service for now (replace with real API when available)
        const result = await fetchMockTicketsForView(activeView, 50, dateRange);
        
        if (result && Array.isArray(result)) {
          ticketsData = result as AnalyzedTicket[];
        } else {
          throw new Error("Invalid data format");
        }
      } catch (apiError) {
        console.warn("API call failed, using mock data:", apiError);
        
        // Fallback to mock data
        ticketsData = [
          {
            id: 1,
            subject: "Sample ticket 1 (Mock)",
            status: "open",
            priority: "high",
            created_at: new Date().toISOString(),
            category: "Technical",
            sentiment: "Neutral",
            assignee: "John Doe",
            requester: "Customer A",
            description: "Sample ticket description",
            analysis: {
              sentiment: "Neutral",
              urgency: "medium",
              category: "Technical",
            }
          },
          {
            id: 2,
            subject: "Sample ticket 2 (Mock)", 
            status: "pending",
            priority: "medium",
            created_at: new Date().toISOString(),
            category: "Billing",
            sentiment: "Negative",
            assignee: "Jane Smith",
            requester: "Customer B",
            description: "Another sample ticket",
            analysis: {
              sentiment: "Negative",
              urgency: "high",
              category: "Billing",
            }
          },
          {
            id: 3,
            subject: "Customer login issue (Mock)",
            status: "new",
            priority: "low",
            created_at: new Date().toISOString(),
            category: "Account",
            sentiment: "Positive",
            assignee: "Mike Wilson",
            requester: "Customer C",
            description: "User cannot access their account",
            analysis: {
              sentiment: "Positive",
              urgency: "low",
              category: "Account",
            }
          }
        ];
      }
      
      setTickets(ticketsData);
      
      toast({
        title: "Tickets loaded",
        description: `Loaded ${ticketsData.length} tickets for ${activeView}`,
      });
      
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast({
        title: "Error loading tickets",
        description: "Failed to load tickets. Please try again.",
        variant: "destructive",
      });
      
      // Set empty array on complete failure
      setTickets([]);
    } finally {
      onLoadingChange?.(false);
    }
  }, [sessionMode, toast]);

  // Stable analysis functions (mocked for now)
  const generateTrendSummary = React.useCallback(async (
    tickets: AnalyzedTicket[],
    onSummaryChange?: (summary: string) => void
  ) => {
    if (tickets.length === 0) return;
    
    try {
      // Mock summary generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      const summary = `Analyzed ${tickets.length} tickets. Recent trends show increased activity in technical support with ${tickets.filter(t => t.sentiment === 'Negative').length} tickets requiring attention.`;
      onSummaryChange?.(summary);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    }
  }, []);

  // Memoized return object
  return React.useMemo(() => ({
    tickets,
    setTickets,
    fetchTickets,
    generateTrendSummary,
  }), [
    tickets,
    fetchTickets,
    generateTrendSummary,
  ]);
}