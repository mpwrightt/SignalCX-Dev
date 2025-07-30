import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RiskHeatmap } from './risk-heatmap';
import { RiskMitigationPanel } from './risk-mitigation-panel';

export function RiskLevelDrillDownView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Level Drill-Down</CardTitle>
        <CardDescription>A detailed breakdown of the system's risk metrics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RiskHeatmap />
        <RiskMitigationPanel />
      </CardContent>
    </Card>
  );
}