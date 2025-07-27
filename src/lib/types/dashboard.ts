import { AnalyzedTicket, AtRiskTicket } from '../types';

export type SortConfig = {
  key: keyof AnalyzedTicket | null;
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
  ticket: AnalyzedTicket;
  riskAnalysis?: AtRiskTicket;
};