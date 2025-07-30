import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExecutiveSummaryPanel } from './executive-summary-panel';
import { ForecastConfidenceDrillDownView } from './forecast-confidence-drill-down-view';

interface StrategicInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StrategicInsightsModal: React.FC<StrategicInsightsModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Strategic Insights</DialogTitle>
          <DialogDescription>A detailed breakdown of the system's strategic insights.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ExecutiveSummaryPanel />
          <ForecastConfidenceDrillDownView confidenceBreakdown={{ historicalAccuracy: 0, dataVolume: 0, modelStability: 0 }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};