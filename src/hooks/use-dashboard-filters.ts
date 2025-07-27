"use client";

import * as React from "react";
import {
  AnalyzedTicket,
} from "@/lib/types";
import {
  SortConfig,
  TopLevelFilterState,
  DrilldownFilterState,
} from "@/lib/types/dashboard";

export function useDashboardFilters(
  tickets: AnalyzedTicket[],
  searchTerm: string,
  activeFilters: TopLevelFilterState,
  drilldownFilters: DrilldownFilterState,
  sortConfig: SortConfig
) {
  // Filter tickets based on search term
  const searchFilteredTickets = React.useMemo(() => {
    if (!searchTerm.trim()) return tickets;
    
    const term = searchTerm.toLowerCase();
    return tickets.filter(ticket => 
      ticket.subject.toLowerCase().includes(term) ||
      ticket.description?.toLowerCase().includes(term) ||
      ticket.requester?.toLowerCase().includes(term) ||
      ticket.assignee?.toLowerCase().includes(term) ||
      ticket.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      ticket.category?.toLowerCase().includes(term)
    );
  }, [tickets, searchTerm]);

  // Apply top-level filters (dashboard view)
  const dashboardFilteredTickets = React.useMemo(() => {
    return searchFilteredTickets.filter(ticket => {
      // Sentiment filter
      if (activeFilters.sentiment !== "all" && ticket.sentiment !== activeFilters.sentiment) {
        return false;
      }

      // Status filter
      if (activeFilters.status !== "all" && ticket.status !== activeFilters.status) {
        return false;
      }

      return true;
    });
  }, [searchFilteredTickets, activeFilters]);

  // Apply drilldown filters (explorer view)
  const drilldownFilteredTickets = React.useMemo(() => {
    return searchFilteredTickets.filter(ticket => {
      // Category filter
      if (drilldownFilters.category !== "all" && ticket.category !== drilldownFilters.category) {
        return false;
      }

      // Priority filter
      if (drilldownFilters.priority !== "all" && ticket.priority !== drilldownFilters.priority) {
        return false;
      }

      // Tag filter
      if (drilldownFilters.tag !== "all") {
        if (!ticket.tags || !ticket.tags.includes(drilldownFilters.tag)) {
          return false;
        }
      }

      // Sentiment filter
      if (drilldownFilters.sentiment !== "all" && ticket.sentiment !== drilldownFilters.sentiment) {
        return false;
      }

      return true;
    });
  }, [searchFilteredTickets, drilldownFilters]);

  // Sort tickets
  const sortTickets = React.useCallback((ticketsToSort: AnalyzedTicket[]) => {
    if (!sortConfig.key) return ticketsToSort;

    return [...ticketsToSort].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "ascending" ? -1 : 1;
      if (bValue == null) return sortConfig.direction === "ascending" ? 1 : -1;

      // Handle different data types
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Convert to string for comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === "ascending" ? comparison : -comparison;
    });
  }, [sortConfig]);

  // Sorted tickets for different views
  const sortedDashboardTickets = React.useMemo(() => {
    return sortTickets(dashboardFilteredTickets);
  }, [dashboardFilteredTickets, sortTickets]);

  const sortedDrilldownTickets = React.useMemo(() => {
    return sortTickets(drilldownFilteredTickets);
  }, [drilldownFilteredTickets, sortTickets]);

  // Get filter options from tickets
  const filterOptions = React.useMemo(() => {
    const categories = new Set<string>();
    const priorities = new Set<string>();
    const tags = new Set<string>();
    const statuses = new Set<string>();

    tickets.forEach(ticket => {
      if (ticket.category) categories.add(ticket.category);
      if (ticket.priority) priorities.add(ticket.priority);
      if (ticket.status) statuses.add(ticket.status);
      if (ticket.tags) {
        ticket.tags.forEach(tag => tags.add(tag));
      }
    });

    return {
      categories: Array.from(categories).sort(),
      priorities: Array.from(priorities).sort(),
      tags: Array.from(tags).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }, [tickets]);

  // Calculate filter counts
  const filterCounts = React.useMemo(() => {
    const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 };
    const statusCounts: Record<string, number> = {};

    dashboardFilteredTickets.forEach(ticket => {
      if (ticket.sentiment && sentimentCounts.hasOwnProperty(ticket.sentiment)) {
        sentimentCounts[ticket.sentiment as keyof typeof sentimentCounts]++;
      }
      if (ticket.status) {
        statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;
      }
    });

    return {
      sentiment: sentimentCounts,
      status: statusCounts,
    };
  }, [dashboardFilteredTickets]);

  // Get at-risk tickets
  const atRiskTickets = React.useMemo(() => {
    return tickets.filter(ticket => {
      // Define at-risk criteria
      const hasSentiment = ticket.sentiment === 'Negative';
      const hasCategory = ticket.category && ['bug', 'incident', 'problem'].includes(ticket.category.toLowerCase());
      const isOpen = ticket.status === 'open' || ticket.status === 'pending';
      
      return isOpen && hasSentiment && hasCategory;
    });
  }, [tickets]);

  return {
    // Filtered and sorted tickets
    dashboardFilteredTickets: sortedDashboardTickets,
    drilldownFilteredTickets: sortedDrilldownTickets,
    searchFilteredTickets,
    atRiskTickets,

    // Filter options and counts
    filterOptions,
    filterCounts,

    // Utility function
    sortTickets,
  };
}