
'use client';

import * as React from "react";
import { differenceInHours } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { AgentProfile, AnalyzedTicket } from "@/lib/types";
import { getAgentProfile } from "@/lib/agent-service";
import { AgentBackendProfileView } from "./agent-backend-profile-view";

export const AgentPerformanceView = ({
  tickets,
  loading,
  onAgentSelect,
}: {
  tickets: AnalyzedTicket[];
  loading: boolean;
  onAgentSelect: (agent: AgentProfile) => void;
}) => {
  const [selectedAgentBackend, setSelectedAgentBackend] = React.useState<AgentProfile | null>(null);
  const [agentBackendLoading, setAgentBackendLoading] = React.useState(false);

  const handleViewBackendProfile = async (agentName: string) => {
    setAgentBackendLoading(true);
    try {
      const agentProfile = await getAgentProfile(agentName);
      if (agentProfile) {
        setSelectedAgentBackend(agentProfile);
      }
    } catch (error) {
      console.error("Failed to fetch agent profile:", error);
    } finally {
      setAgentBackendLoading(false);
    }
  };

  const handleTierUpdate = (agentName: string, newTier: 'Tier 1' | 'Tier 2' | 'Tier 3') => {
    // Update the agent in the list
    const updatedAgent = agentData.find(agent => agent.name === agentName);
    if (updatedAgent) {
      updatedAgent.tier = newTier;
    }
  };
  const agentData: AgentProfile[] = React.useMemo(() => {
    const agentMap = new Map<string, {
      solvedTickets: number,
      totalResolutionTime: number,
      csatScores: number[],
      tickets: AnalyzedTicket[],
      sentimentCounts: Record<'Positive' | 'Neutral' | 'Negative', number>,
      categoryCounts: Record<string, number>,
    }>();

    tickets.forEach(ticket => {
      if (!ticket.assignee) return;

      if (!agentMap.has(ticket.assignee)) {
        agentMap.set(ticket.assignee, { 
          solvedTickets: 0, 
          totalResolutionTime: 0, 
          csatScores: [], 
          tickets: [],
          sentimentCounts: { Positive: 0, Neutral: 0, Negative: 0 },
          categoryCounts: {},
        });
      }

      const data = agentMap.get(ticket.assignee)!;
      data.tickets.push(ticket);
      
      if (ticket.status === 'solved' || ticket.status === 'closed') {
        data.solvedTickets++;
        if (ticket.sentiment) {
          data.sentimentCounts[ticket.sentiment]++;
        }
        if (ticket.category) {
          data.categoryCounts[ticket.category] = (data.categoryCounts[ticket.category] || 0) + 1;
        }
        
        if (ticket.solved_at) {
          data.totalResolutionTime += differenceInHours(new Date(ticket.solved_at), new Date(ticket.created_at));
        }
      }

      if (ticket.csat_score) {
        data.csatScores.push(ticket.csat_score);
      }
    });

    return Array.from(agentMap.entries()).map(([name, data]) => {
      const avgResolutionTime = data.solvedTickets > 0 ? (data.totalResolutionTime / data.solvedTickets).toFixed(1) : 'N/A';
      const avgCsat = data.csatScores.length > 0 ? (data.csatScores.reduce((a, b) => a + b, 0) / data.csatScores.length).toFixed(1) : 'N/A';
      const categoryCounts = Object.entries(data.categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      return {
        name,
        avatar: `https://placehold.co/64x64.png`,
        solvedTickets: data.solvedTickets,
        avgResolutionTime,
        avgCsat,
        tickets: data.tickets.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        sentimentCounts: data.sentimentCounts,
        categoryCounts,
        tier: 'Tier 1' as const, // Default tier, will be updated by backend service
        performanceHistory: [], // Will be populated by backend service
      };
    }).sort((a, b) => b.solvedTickets - a.solvedTickets);
  }, [tickets]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Metrics for agent productivity and customer satisfaction.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Solved Tickets</TableHead>
                <TableHead>Avg. Resolution Time (hrs)</TableHead>
                <TableHead>Avg. CSAT (1-5)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`agent-skeleton-${i}`}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : (
                agentData.map(agent => (
                  <TableRow key={agent.name}>
                    <TableCell className="font-medium cursor-pointer" onClick={() => onAgentSelect(agent)}>
                      {agent.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {agent.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.solvedTickets}</TableCell>
                    <TableCell>{agent.avgResolutionTime}</TableCell>
                    <TableCell>{agent.avgCsat}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBackendProfile(agent.name)}
                        disabled={agentBackendLoading}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedAgentBackend && (
        <AgentBackendProfileView
          agent={selectedAgentBackend}
          loading={agentBackendLoading}
          onTierUpdate={handleTierUpdate}
        />
      )}
    </div>
  );
};
