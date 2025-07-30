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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClientOnly } from "@/components/client-only";
import { Skeleton } from "@/components/ui/skeleton";

const data = [
  { name: "CSAT", value: 4.5 },
  { name: "Resolution Time", value: 8.2 },
  { name: "FCR", value: 85 },
];

export const AgentPerformanceChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>Key performance indicators.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full pl-2">
        <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChartRecharts data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--foreground))" }} width={120} />
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
              <Bar dataKey="value" barSize={35} radius={[0, 4, 4, 0]}>
                {data.map((_entry, index) => <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />)}
              </Bar>
            </BarChartRecharts>
          </ResponsiveContainer>
        </ClientOnly>
      </CardContent>
    </Card>
  );
};