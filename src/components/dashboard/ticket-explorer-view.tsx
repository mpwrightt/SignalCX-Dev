
'use client';

import * as React from "react";
import { ArrowDown, ArrowUp, ShieldAlert } from "lucide-react";
import type { AnalyzedTicket, AtRiskTicket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClientDate } from "@/components/client-date";
import type { Settings } from "@/hooks/use-settings";

type SortConfig = {
  key: keyof AnalyzedTicket | null;
  direction: "ascending" | "descending";
};

type SelectedTicketInfo = {
  ticket: AnalyzedTicket;
  riskAnalysis?: AtRiskTicket;
}

export const TicketExplorerView = ({
  tickets,
  loading,
  settings,
  selectionState,
  handleSelectAll,
  handleSelectRow,
  selectedRowIds,
  requestSort,
  getSortIcon,
  onTicketSelect,
}: {
  tickets: AnalyzedTicket[];
  loading: boolean;
  settings: Settings;
  selectionState: boolean | "indeterminate";
  handleSelectAll: (checked: boolean | "indeterminate") => void;
  handleSelectRow: (ticketId: number, checked: boolean) => void;
  selectedRowIds: Set<number>;
  requestSort: (key: keyof AnalyzedTicket) => void;
  getSortIcon: (key: keyof AnalyzedTicket) => React.ReactNode;
  onTicketSelect: (info: SelectedTicketInfo) => void;
}) => {
  const PAGE_SIZE = 20;
  const [page, setPage] = React.useState(1);
  const pageCount = Math.ceil(tickets.length / PAGE_SIZE);
  const pagedTickets = tickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    // Reset to first page if tickets change
    setPage(1);
  }, [tickets]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
                <TableRow className={cn(settings.enableCompactMode && "[&>th]:p-2")}>
                   <TableHead className="w-12">
                     <Checkbox
                       checked={selectionState}
                       onCheckedChange={handleSelectAll}
                       aria-label="Select all rows"
                     />
                   </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("id")}
                  >
                    <div className="flex items-center gap-2">
                      Ticket ID {getSortIcon("id")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("subject")}
                  >
                    <div className="flex items-center gap-2">
                      Subject {getSortIcon("subject")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("assignee")}
                  >
                    <div className="flex items-center gap-2">
                      Assignee {getSortIcon("assignee")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("sentiment")}
                  >
                    <div className="flex items-center gap-2">
                      Sentiment {getSortIcon("sentiment")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status {getSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("created_at")}
                  >
                    <div className="flex items-center gap-2">
                      Created {getSortIcon("created_at")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className={cn(settings.enableCompactMode && "[&>td]:p-2")}>
                      <TableCell>
                         <Skeleton className="h-5 w-5" />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="mt-1 h-3 w-4/5" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-2 w-2 rounded-full" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : pagedTickets.length > 0 ? (
                  pagedTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      data-state={selectedRowIds.has(ticket.id) ? "selected" : undefined}
                      className={cn(settings.enableCompactMode && "[&>td]:p-2")}
                    >
                       <TableCell>
                         <Checkbox
                           checked={selectedRowIds.has(ticket.id)}
                           onCheckedChange={(checked) => handleSelectRow(ticket.id, !!checked)}
                           aria-label={`Select ticket ${ticket.id}`}
                         />
                       </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                           <span>#{ticket.id}</span>
                           {ticket.sla_breached && (
                            <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger>
                                   <ShieldAlert className="h-4 w-4 text-destructive" />
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>SLA breached</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                           )}
                         </div>
                      </TableCell>
                      <TableCell 
                        className="max-w-[300px] cursor-pointer"
                        onClick={() => onTicketSelect({ ticket })}
                      >
                        <p className={cn("font-medium truncate hover:underline", settings.enableCompactMode && "text-xs")}>{ticket.subject}</p>
                        {ticket.summary && (
                            <p className="text-xs text-muted-foreground truncate">
                                {ticket.summary}
                            </p>
                        )}
                      </TableCell>
                       <TableCell className={cn(settings.enableCompactMode && "text-xs")}>
                        {ticket.assignee || <span className="text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell>
                        {ticket.sentiment ? (
                            <Badge
                            variant={
                                ticket.sentiment === "Positive"
                                ? "default"
                                : ticket.sentiment === "Negative"
                                ? "destructive"
                                : "secondary"
                            }
                            className={cn(
                                ticket.sentiment === "Positive" &&
                                "bg-green-600/80 text-white"
                            )}
                            >
                            {ticket.sentiment}
                            </Badge>
                        ) : (
                            <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "h-2 w-2 shrink-0 rounded-full",
                                {
                                    'bg-blue-500': ticket.status === 'new',
                                    'bg-green-500': ticket.status === 'open',
                                    'bg-yellow-500': ticket.status === 'pending',
                                    'bg-orange-500': ticket.status === 'on-hold',
                                    'bg-purple-500': ticket.status === 'solved',
                                    'bg-slate-400 dark:bg-slate-600': ticket.status === 'closed',
                                }
                            )} />
                            <span className={cn("capitalize", settings.enableCompactMode && "text-xs")}>{ticket.status.replace('-', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className={cn(settings.enableCompactMode && "text-xs")}>
                        <ClientDate dateString={ticket.created_at} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No tickets found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        {/* Pagination controls */}
        {pageCount > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              className="px-3 py-1 rounded bg-muted text-muted-foreground disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {pageCount}
            </span>
            <button
              className="px-3 py-1 rounded bg-muted text-muted-foreground disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === pageCount}
            >
              Next
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
