import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const strategies = [
  { title: 'Reduce agent workload', description: 'Reassign tickets to other agents or teams.' },
  { title: 'Provide additional training', description: 'Identify knowledge gaps and provide targeted training.' },
  { title: 'Improve documentation', description: 'Create or update documentation to address common issues.' },
  { title: 'Optimize workflows', description: 'Identify and remove bottlenecks in the support process.' },
];

export function RiskMitigationPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Mitigation Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {strategies.map((strategy) => (
            <li key={strategy.title} className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{strategy.title}</h4>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
              <Button variant="outline" size="sm">Implement</Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}