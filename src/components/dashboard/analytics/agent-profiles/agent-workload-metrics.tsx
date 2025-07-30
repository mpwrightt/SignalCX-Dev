import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  { title: "Open Tickets", value: 12 },
  { title: "Pending Tickets", value: 5 },
  { title: "Avg. Handle Time", value: "15m" },
  { title: "Utilization", value: "85%" },
];

export const AgentWorkloadMetrics = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};