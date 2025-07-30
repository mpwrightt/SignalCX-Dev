
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function ForecastConfidenceDrillDownView({ confidenceBreakdown }: { confidenceBreakdown: { historicalAccuracy: number, dataVolume: number, modelStability: number } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast Confidence Drill-Down</CardTitle>
        <CardDescription>A detailed breakdown of the forecast confidence metrics.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Historical Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confidenceBreakdown.historicalAccuracy}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Data Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confidenceBreakdown.dataVolume}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Model Stability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confidenceBreakdown.modelStability}%</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
