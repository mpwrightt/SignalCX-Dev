'use client';

import * as React from "react";
import { format, parseISO } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { logAuditEvent } from "@/lib/audit-service";
import { updateAgentTier } from "@/lib/agent-service";
import type { AgentProfile, WeeklyPerformance } from "@/lib/types";

interface AgentBackendProfileViewProps {
  agent: AgentProfile | null;
  loading: boolean;
  onTierUpdate?: (agentName: string, newTier: 'Tier 1' | 'Tier 2' | 'Tier 3') => void;
}

export const AgentBackendProfileView = ({
  agent,
  loading,
  onTierUpdate,
}: AgentBackendProfileViewProps) => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const { user } = useAuth();
  const [updatingTier, setUpdatingTier] = React.useState(false);

  const handleTierUpdate = async (newTier: 'Tier 1' | 'Tier 2' | 'Tier 3') => {
    if (!agent) return;
    
    setUpdatingTier(true);
    try {
      const success = await updateAgentTier(agent.name, newTier);
      if (success) {
        toast({
          title: "Tier Updated",
          description: `${agent.name} has been moved to ${newTier}.`,
        });
        onTierUpdate?.(agent.name, newTier);
        if (user) {
          logAuditEvent(user, 'AGENT_TIER_UPDATED', {
            agentName: agent.name,
            oldTier: agent.tier,
            newTier,
          });
        }
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update agent tier. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update agent tier:", error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating the agent tier.",
        variant: "destructive",
      });
    } finally {
      setUpdatingTier(false);
    }
  };

  const getTierTargets = (tier: string) => {
    switch (tier) {
      case 'Tier 1':
        return settings.agentTierMetrics.tier1;
      case 'Tier 2':
        return settings.agentTierMetrics.tier2;
      case 'Tier 3':
        return settings.agentTierMetrics.tier3;
      default:
        return { targetTicketsPerWeek: 0, targetHoursPerWeek: 0 };
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Tier 1':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Tier 2':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Tier 3':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatPerformanceData = (history: WeeklyPerformance[]) => {
    return history.map(week => ({
      week: format(parseISO(week.weekStart), 'MMM dd'),
      ticketsSolved: week.ticketsSolved,
      hoursWorked: week.hoursWorked,
      ticketsPerHour: week.ticketsPerHour,
      csatScore: week.csatScore || 0,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agent) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Select an agent to view their profile</p>
        </CardContent>
      </Card>
    );
  }

  const tierTargets = getTierTargets(agent.tier);
  const performanceData = formatPerformanceData(agent.performanceHistory);
  const currentWeek = agent.performanceHistory[agent.performanceHistory.length - 1];
  const targetAchievement = currentWeek ? (currentWeek.ticketsSolved / tierTargets.targetTicketsPerWeek) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{agent.name}</CardTitle>
              <CardDescription>Agent Performance Profile</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={getTierColor(agent.tier)}>
                {agent.tier}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Change Tier:</span>
                <Select
                  value={agent.tier}
                  onValueChange={handleTierUpdate}
                  disabled={updatingTier}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tier 1">Tier 1</SelectItem>
                    <SelectItem value="Tier 2">Tier 2</SelectItem>
                    <SelectItem value="Tier 3">Tier 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{agent.solvedTickets}</div>
              <div className="text-sm text-muted-foreground">Total Tickets Solved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{agent.avgCsat}</div>
              <div className="text-sm text-muted-foreground">Average CSAT</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{agent.avgResolutionTime}h</div>
              <div className="text-sm text-muted-foreground">Avg Resolution Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Week Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Current Week Performance</CardTitle>
          <CardDescription>Performance metrics for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          {currentWeek ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{currentWeek.ticketsSolved}</div>
                <div className="text-sm text-muted-foreground">Tickets Solved</div>
                <div className="text-xs text-muted-foreground">
                  Target: {tierTargets.targetTicketsPerWeek}
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{currentWeek.hoursWorked}h</div>
                <div className="text-sm text-muted-foreground">Hours Worked</div>
                <div className="text-xs text-muted-foreground">
                  Target: {tierTargets.targetHoursPerWeek}h
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{currentWeek.ticketsPerHour}</div>
                <div className="text-sm text-muted-foreground">Tickets/Hour</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{Math.round(targetAchievement)}%</div>
                <div className="text-sm text-muted-foreground">Target Achievement</div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No performance data available for the current week
            </p>
          )}
        </CardContent>
      </Card>

      {/* Performance Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>12-week performance history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="ticketsSolved" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Tickets Solved"
                />
                <Line 
                  type="monotone" 
                  dataKey="ticketsPerHour" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Tickets/Hour"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance History</CardTitle>
          <CardDescription>Detailed weekly performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week Starting</TableHead>
                <TableHead>Tickets Solved</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Tickets/Hour</TableHead>
                <TableHead>CSAT Score</TableHead>
                <TableHead>Avg Resolution (hrs)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agent.performanceHistory.map((week, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {format(parseISO(week.weekStart), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{week.ticketsSolved}</TableCell>
                  <TableCell>{week.hoursWorked}</TableCell>
                  <TableCell>{week.ticketsPerHour}</TableCell>
                  <TableCell>
                    {week.csatScore ? week.csatScore.toFixed(1) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {week.resolutionTimeHours ? week.resolutionTimeHours.toFixed(1) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}; 