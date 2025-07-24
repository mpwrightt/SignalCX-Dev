import type { TicketAnalysis } from "@/lib/types";

// Cache utility functions
export const getLocalCachedData = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

export const setLocalCachedData = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export const getLocalCachedAnalyses = (ticketIds: number[]): Record<number, TicketAnalysis> => {
  const cached = getLocalCachedData<Record<number, TicketAnalysis>>('ticketAnalyses') || {};
  const result: Record<number, TicketAnalysis> = {};
  
  ticketIds.forEach(id => {
    if (cached[id]) {
      result[id] = cached[id];
    }
  });
  
  return result;
};

export const setLocalCachedAnalyses = (newAnalyses: Record<number, TicketAnalysis>) => {
  const existing = getLocalCachedData<Record<number, TicketAnalysis>>('ticketAnalyses') || {};
  const updated = { ...existing, ...newAnalyses };
  setLocalCachedData('ticketAnalyses', updated);
};

// Type definitions
export type SortConfig = {
  key: keyof any | null;
  direction: "ascending" | "descending";
};

export type TopLevelFilterState = {
  sentiment: "all" | "Positive" | "Neutral" | "Negative";
  status: "all" | "new" | "open" | "pending" | "on-hold" | "solved" | "closed";
};

export type DrilldownFilterState = {
  category: "all" | string;
  priority: "all" | string;
  tag: "all" | string;
  sentiment: "all" | "Positive" | "Neutral" | "Negative";
};

export type SelectedTicketInfo = {
  ticket: any;
  riskAnalysis?: any;
}; 