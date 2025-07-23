
'use client';

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

export const FilterControls = ({
  activeFilters,
  setActiveFilters,
  activeView,
  setActiveView,
  availableViews,
  dateRange,
  setDateRange,
  loading,
}: {
  activeFilters: TopLevelFilterState;
  setActiveFilters: React.Dispatch<React.SetStateAction<TopLevelFilterState>>;
  activeView: string;
  setActiveView: React.Dispatch<React.SetStateAction<string>>;
  availableViews: string[];
  dateRange: DateRange | undefined;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  loading: boolean;
}) => (
  <div className="flex flex-col sm:flex-row items-center gap-2">
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "w-full sm:w-[260px] justify-start text-left font-normal",
            !dateRange && "text-muted-foreground"
          )}
          disabled={loading}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "LLL dd, y")} -{" "}
                {format(dateRange.to, "LLL dd, y")}
              </>
            ) : (
              format(dateRange.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
    <Select value={activeView} onValueChange={setActiveView} disabled={loading}>
      <SelectTrigger className="w-full sm:w-[280px]">
        <SelectValue placeholder="Select a view" />
      </SelectTrigger>
      <SelectContent>
        {availableViews.map((view) => (
          <SelectItem key={view} value={view}>
            {view}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Select
      value={activeFilters.status}
      onValueChange={(value) =>
        setActiveFilters((f) => ({ ...f, status: value as TopLevelFilterState['status'] }))
      }
      disabled={loading}
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
      value={activeFilters.sentiment}
      onValueChange={(value) =>
        setActiveFilters((f) => ({ ...f, sentiment: value as TopLevelFilterState['sentiment'] }))
      }
      disabled={loading}
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
  </div>
);
