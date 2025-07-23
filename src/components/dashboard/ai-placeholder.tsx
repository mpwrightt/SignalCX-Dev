
'use client';

import * as React from "react";

export const AIPlaceholder = ({
  pageName,
  isAnalyzed,
  Icon,
}: {
  pageName: string;
  isAnalyzed: boolean;
  Icon: React.ElementType;
}) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed h-96">
    <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
    <h3 className="mt-4 text-lg font-semibold">{pageName}</h3>
    {isAnalyzed ? (
      <p className="mt-1 text-sm text-center text-muted-foreground">
        Run the 'Full Analysis' from the dashboard header to generate data for this view.
      </p>
    ) : (
      <p className="mt-1 text-sm text-center text-muted-foreground">
        Run the initial 'Analyze Sentiments & Categories' from the dashboard header to enable this feature.
      </p>
    )}
  </div>
);
