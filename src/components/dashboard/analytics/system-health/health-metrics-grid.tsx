import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const metrics = [
  { title: "API Uptime", value: "99.9%" },
  { title: "Average Response Time", value: "120ms" },
  { title: "Error Rate", value: "0.1%" },
  { title: "CPU Utilization", value: "60%" },
  { title: "Memory Utilization", value: "75%" },
  { title: "Database Connections", value: "50/100" },
];

export function HealthMetricsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
}