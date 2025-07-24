import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export function AdvancedAnalyticsSkeleton({ elapsed, ticketsLength }: { elapsed: number, ticketsLength: number }) {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Card className="w-full max-w-md mx-auto p-6 flex flex-col items-center gap-4">
        <CardHeader className="flex flex-col items-center">
          <div className="h-8 w-8 text-primary animate-pulse mb-2">🧠</div>
          <div className="text-lg font-bold">Running AI Analysis</div>
          <div className="text-center text-muted-foreground">
            Analyzing tickets and generating advanced analytics.<br />
            <span className="text-xs">This may take 30-60 seconds</span>
          </div>
        </CardHeader>
        <CardContent className="w-full flex flex-col items-center">
          <div className="w-full mt-2">
            <Progress value={undefined} className="animate-pulse h-3" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Elapsed: {elapsed}s</div>
        </CardContent>
      </Card>
    </div>
  );
} 