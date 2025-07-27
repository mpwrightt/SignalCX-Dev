'use client';

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TopLevelFilterState = {
  sentiment: "all" | "Positive" | "Neutral" | "Negative";
  status: "all" | "new" | "open" | "pending" | "on-hold" | "solved" | "closed";
};

interface FilterControlsProps {
  filters: TopLevelFilterState;
  onFiltersChange: (filters: TopLevelFilterState) => void;
  showDrilldown: boolean;
  drilldownFilters: any;
  onDrilldownFiltersChange: (filters: any) => void;
  filterOptions: any;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFiltersChange,
  showDrilldown,
  drilldownFilters,
  onDrilldownFiltersChange,
  filterOptions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, status: value as TopLevelFilterState['status'] })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by status..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="on-hold">On-hold</SelectItem>
          <SelectItem value="solved">Solved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={filters.sentiment}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, sentiment: value as TopLevelFilterState['sentiment'] })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by sentiment..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sentiments</SelectItem>
          <SelectItem value="Positive">Positive</SelectItem>
          <SelectItem value="Neutral">Neutral</SelectItem>
          <SelectItem value="Negative">Negative</SelectItem>
        </SelectContent>
      </Select>

      {showDrilldown && drilldownFilters && (
        <>
          {filterOptions?.categories && (
            <Select
              value={drilldownFilters.category || "all"}
              onValueChange={(value) =>
                onDrilldownFiltersChange({ ...drilldownFilters, category: value })
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterOptions.categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {filterOptions?.priorities && (
            <Select
              value={drilldownFilters.priority || "all"}
              onValueChange={(value) =>
                onDrilldownFiltersChange({ ...drilldownFilters, priority: value })
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {filterOptions.priorities.map((priority: string) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      )}
    </div>
  );
};