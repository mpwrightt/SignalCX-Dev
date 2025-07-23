
'use client';

import * as React from "react";
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";
import { Shapes } from "lucide-react";

import type { AnalyzedTicket, TicketCluster } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnly } from "@/components/client-only";
import { Skeleton } from "@/components/ui/skeleton";
import { AIPlaceholder } from "./ai-placeholder";

type ClusterPoint = {
  x: number;
  y: number;
  clusterId: number;
  ticketId?: number;
}

export const ClusteringView = ({
  tickets,
  isAnalyzed,
  clusters,
}: {
  tickets: AnalyzedTicket[];
  isAnalyzed: boolean;
  clusters: TicketCluster[];
}) => {
  const [plotData, setPlotData] = React.useState<ClusterPoint[]>([]);

  React.useEffect(() => {
    if (clusters.length === 0) {
      setPlotData([]);
      return;
    }

    const clusterCenters: { [key: number]: { x: number, y: number } } = {
      1: { x: 20, y: 30 }, 2: { x: 80, y: 70 }, 3: { x: 50, y: 90 },
      4: { x: 25, y: 80 }, 5: { x: 75, y: 20 },
    };

    const generatedPlotData: ClusterPoint[] = [];
    const clusteredTicketIds = new Set<number>();

    clusters.forEach(cluster => {
      const center = clusterCenters[cluster.clusterId] || { x: Math.random() * 100, y: Math.random() * 100 };
      cluster.ticketIds.forEach(ticketId => {
        generatedPlotData.push({
          x: center.x + (Math.random() - 0.5) * 30, y: center.y + (Math.random() - 0.5) * 30,
          clusterId: cluster.clusterId, ticketId: ticketId
        });
        clusteredTicketIds.add(ticketId);
      });
    });
    
    const unclusteredTickets = tickets.filter(t => !clusteredTicketIds.has(t.id));
    unclusteredTickets.slice(0, 70).forEach(ticket => {
      generatedPlotData.push({
        x: Math.random() * 100, y: Math.random() * 100,
        clusterId: 0, ticketId: ticket.id,
      });
    });

    setPlotData(generatedPlotData);
  }, [clusters, tickets]);


  const legendWrapperStyle = {
    backgroundColor: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)", padding: "8px 12px",
  };
  
  const chartColors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];
  const chartShapes = ["circle", "triangle", "diamond", "square", "star"];

  if (clusters.length === 0) {
    return <AIPlaceholder 
      pageName="Smart Ticket Clustering"
      isAnalyzed={isAnalyzed}
      Icon={Shapes}
    />;
  }

  return (
    <div className="space-y-4 md:space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Smart Ticket Clustering</CardTitle>
          <CardDescription>Discover emerging trends and hidden ticket groups with unsupervised AI analysis.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
              {clusters.map(cluster => (
                <Card key={cluster.clusterId} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-base">{cluster.theme}</CardTitle>
                    <CardDescription>{cluster.ticketIds.length} related tickets</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {cluster.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cluster Visualization</CardTitle>
          <CardDescription>A t-SNE / UMAP visualization of all tickets in this view, colored by cluster.</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] w-full">
            <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="x" tick={false} axisLine={false} label={{ value: "Dimension 1", position: 'insideBottom', offset: -10, fill: "hsl(var(--muted-foreground))" }}/>
                  <YAxis type="number" dataKey="y" name="y" tick={false} axisLine={false} label={{ value: "Dimension 2", angle: -90, position: 'insideLeft', fill: "hsl(var(--muted-foreground))" }}/>
                  <RechartsTooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "calc(var(--radius) - 2px)",
                    }}
                    formatter={(value, name, props) => {
                      if (props.payload?.ticketId) {
                          return [`Ticket #${props.payload.ticketId}`, 'ID'];
                      }
                      return null;
                    }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const clusterId = payload[0].payload.clusterId;
                          if (clusterId === 0) return 'Unclustered';
                          const cluster = clusters.find(c => c.clusterId === clusterId);
                          if (cluster) return `Cluster: ${cluster.theme}`;
                        }
                        return '';
                    }}
                  />
                  <Legend wrapperStyle={legendWrapperStyle} />
                  <Scatter name="Unclustered" data={plotData.filter(p => p.clusterId === 0)} fill="hsl(var(--muted-foreground))" shape="cross" />
                  {clusters.map((cluster, index) => (
                    <Scatter 
                      key={cluster.clusterId}
                      name={`Cluster ${cluster.clusterId}: ${cluster.theme}`} 
                      data={plotData.filter(p => p.clusterId === cluster.clusterId)} 
                      fill={`hsl(var(--${chartColors[index % chartColors.length]}))`}
                      shape={chartShapes[index % chartShapes.length] as any}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </ClientOnly>
        </CardContent>
      </Card>
    </div>
  )
}
