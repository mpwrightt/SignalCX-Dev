"use client";

import * as React from "react";
import type { AgentProfile, AnalyzedTicket } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "./ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { logAuditEvent } from "@/lib/audit-service";
import { AgentProfileTabs } from "./dashboard/analytics/agent-profiles/agent-profile-tabs";
import { AgentPerformanceChart } from "./dashboard/analytics/agent-profiles/agent-performance-chart";
import { AgentWorkloadMetrics } from "./dashboard/analytics/agent-profiles/agent-workload-metrics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientDate } from "./client-date";

export function AgentProfileSheet({
  agent,
  onOpenChange,
  onTicketSelect,
}: {
  agent: AgentProfile | null;
  onOpenChange: (open: boolean) => void;
  onTicketSelect: (info: { ticket: AnalyzedTicket }) => void;
}) {
  const { user: authUser } = useAuth();

  React.useEffect(() => {
    if (agent && authUser) {
        logAuditEvent(authUser, 'AGENT_PROFILE_VIEWED', {
            viewedAgentName: agent.name,
        });
    }
  }, [agent, authUser]);

  if (!agent) {
    return null;
  }

  const getAgentInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  const tabs = [
    {
      title: "Performance",
      content: <AgentPerformanceChart />,
    },
    {
      title: "Workload",
      content: <AgentWorkloadMetrics />,
    },
    {
      title: "Tickets",
      content: (
        <div className="border rounded-lg max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agent.tickets.map(ticket => (
                <TableRow key={ticket.id} onClick={() => onTicketSelect({ ticket })} className="cursor-pointer">
                  <TableCell className="font-medium">#{ticket.id}</TableCell>
                  <TableCell className="max-w-[250px] truncate">{ticket.subject}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{ticket.status}</Badge></TableCell>
                  <TableCell><ClientDate dateString={ticket.created_at} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ),
    },
  ];

  return (
    <Sheet open={!!agent} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl w-full flex flex-col p-0">
        <SheetHeader className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage data-ai-hint="profile avatar" src={agent.avatar} alt={agent.name} />
              <AvatarFallback>{getAgentInitials(agent.name)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-2xl font-headline">{agent.name}</SheetTitle>
              <SheetDescription>Agent Performance Profile</SheetDescription>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 text-center">
            <div>
              <div className="font-bold text-lg">{agent.solvedTickets}</div>
              <div className="text-xs text-muted-foreground">Solved Tickets</div>
            </div>
            <div>
              <div className="font-bold text-lg">{agent.avgResolutionTime} hrs</div>
              <div className="text-xs text-muted-foreground">Avg. Resolution</div>
            </div>
            <div>
              <div className="font-bold text-lg">{agent.avgCsat} / 5</div>
              <div className="text-xs text-muted-foreground">Avg. CSAT</div>
            </div>
          </div>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <AgentProfileTabs tabs={tabs} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}