
"use client";

import * as React from "react";
import {
  BarChart as BarChartRecharts,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart as PieChartRecharts,
  Legend,
} from "recharts";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "./ui/separator";
import { ClientDate } from "./client-date";
import { ClientOnly } from "./client-only";
import { Skeleton } from "./ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { logAuditEvent } from "@/lib/audit-service";


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
  
  const formatYAxisTick = (tick: string) => {
    const maxLength = 15;
    if (tick.length > maxLength) {
      return `${tick.substring(0, maxLength)}...`;
    }
    return tick;
  };

  const sentimentData = [
      { name: "Positive", value: agent.sentimentCounts.Positive, fill: "hsl(var(--chart-2))" },
      { name: "Neutral", value: agent.sentimentCounts.Neutral, fill: "hsl(var(--chart-3))" },
      { name: "Negative", value: agent.sentimentCounts.Negative, fill: "hsl(var(--chart-5))" },
  ];

  const hasSentimentData = sentimentData.some(d => d.value > 0);
  const hasCategoryData = agent.categoryCounts.length > 0;
  
  const legendWrapperStyle = {
    backgroundColor: "hsl(var(--secondary))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    padding: "8px 12px",
  };

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card>
                  <CardHeader>
                    <CardTitle>Solved Tickets by Category</CardTitle>
                    <CardDescription>Top 5 categories for solved tickets.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[250px] w-full pl-2">
                     {hasCategoryData ? (
                        <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChartRecharts data={agent.categoryCounts} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--foreground))" }} width={120} tickFormatter={formatYAxisTick} />
                                <RechartsTooltip
                                  cursor={{ fill: "hsl(var(--muted))" }}
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "calc(var(--radius) - 2px)",
                                  }}
                                  itemStyle={{ color: "hsl(var(--foreground))" }}
                                  labelStyle={{ color: "hsl(var(--foreground))" }}
                                />
                                <Bar dataKey="value" barSize={25} radius={[0, 4, 4, 0]}>
                                  {agent.categoryCounts.map((_entry, index) => <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />)}
                                </Bar>
                              </BarChartRecharts>
                            </ResponsiveContainer>
                        </ClientOnly>
                     ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">No category data</div>
                     )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment on Solved Tickets</CardTitle>
                    <CardDescription>Distribution of customer sentiment.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[250px] w-full">
                     {hasSentimentData ? (
                        <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChartRecharts>
                              <RechartsTooltip
                                cursor={{ fill: "hsl(var(--muted))" }}
                                contentStyle={{
                                  backgroundColor: "hsl(var(--background))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "calc(var(--radius) - 2px)",
                                }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                                labelStyle={{ color: "hsl(var(--foreground))" }}
                              />
                                <Pie
                                    data={sentimentData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    labelLine={false}
                                    label={({
                                        cx,
                                        cy,
                                        midAngle,
                                        innerRadius,
                                        outerRadius,
                                        percent,
                                    }) => {
                                        if (percent === 0) {
                                            return null;
                                        }
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

                                        return (
                                            <text
                                            x={x}
                                            y={y}
                                            fill="white"
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            className="text-xs font-bold"
                                            >
                                            {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}
                                >
                                    {sentimentData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.fill}
                                        />
                                    ))}
                                </Pie>
                              <Legend wrapperStyle={legendWrapperStyle} />
                            </PieChartRecharts>
                          </ResponsiveContainer>
                        </ClientOnly>
                     ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">No sentiment data</div>
                     )}
                  </CardContent>
                </Card>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Assigned Tickets</h3>
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
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
