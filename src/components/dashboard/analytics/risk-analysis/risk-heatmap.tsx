import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { x: 'Agent Burnout', y: 'High', value: 8 },
  { x: 'SLA Breach', y: 'Medium', value: 5 },
  { x: 'Customer Churn', y: 'Low', value: 2 },
  { x: 'System Overload', y: 'Medium', value: 6 },
  { x: 'Quality Decline', y: 'High', value: 9 },
];

export function RiskHeatmap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {data.map((d) => (
            <div key={d.x} className="text-center p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-foreground mb-2">{d.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{d.x}</div>
              <div className="text-xs text-muted-foreground font-medium">{d.y}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}