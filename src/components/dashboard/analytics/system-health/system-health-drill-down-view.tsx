import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HealthMetricsGrid } from './health-metrics-grid';

export function SystemHealthDrillDownView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health Drill-Down</CardTitle>
        <CardDescription>A detailed breakdown of the system's health metrics.</CardDescription>
      </CardHeader>
      <CardContent>
        <HealthMetricsGrid />
      </CardContent>
    </Card>
  );
}