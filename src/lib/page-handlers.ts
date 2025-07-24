import type { AnalyzedTicket } from "@/lib/types";
import type { SortConfig, SelectedTicketInfo } from "./page-utils";

export const createPageHandlers = (
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig>>,
  setSelectedRowIds: React.Dispatch<React.SetStateAction<Set<number>>>,
  setDrilldownFilters: React.Dispatch<React.SetStateAction<any>>,
  setSelectedTicketInfo: React.Dispatch<React.SetStateAction<SelectedTicketInfo | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  logEvent: (event: string, data?: any) => void
) => {
  const requestSort = (key: keyof AnalyzedTicket) => {
    setSortConfig(current => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "ascending" ? "descending" : "ascending"
        };
      }
      return { key, direction: "ascending" };
    });
  };

  const getSortIcon = (key: keyof AnalyzedTicket) => {
    // This would return the appropriate icon component
    return null;
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedRowIds(current => {
      const newSet = new Set(current);
      if (checked === true) {
        // Select all
        return new Set();
      } else {
        // Deselect all
        newSet.clear();
        return newSet;
      }
    });
  };

  const handleSelectRow = (ticketId: number, checked: boolean) => {
    setSelectedRowIds(current => {
      const newSet = new Set(current);
      if (checked) {
        newSet.add(ticketId);
      } else {
        newSet.delete(ticketId);
      }
      return newSet;
    });
  };

  const handleChartClick = (
    filterType: 'category' | 'sentiment' | 'priority' | 'tag' | 'age',
    value: any
  ) => {
    setDrilldownFilters((current: any) => ({
      ...current,
      [filterType]: value
    }));
    
    logEvent('chart_filter_applied', { filterType, value });
  };

  const clearDrilldownFilters = () => {
    setDrilldownFilters({
      category: "all",
      priority: "all",
      tag: "all", 
      sentiment: "all"
    });
    
    logEvent('drilldown_filters_cleared');
  };

  const onTicketUpdate = (ticketId: number, updates: Partial<AnalyzedTicket>) => {
    // This would update the ticket in the state
    // Implementation depends on the state management
    logEvent('ticket_updated', { ticketId, updates });
  };

  return {
    requestSort,
    getSortIcon,
    handleSelectAll,
    handleSelectRow,
    handleChartClick,
    clearDrilldownFilters,
    onTicketUpdate
  };
}; 