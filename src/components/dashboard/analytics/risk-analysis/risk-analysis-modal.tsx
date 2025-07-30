import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RiskHeatmap } from './risk-heatmap';
import { RiskMitigationPanel } from './risk-mitigation-panel';

interface RiskAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RiskAnalysisModal: React.FC<RiskAnalysisModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Risk Analysis</DialogTitle>
          <DialogDescription>A detailed breakdown of the system's risk metrics.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RiskHeatmap />
          <RiskMitigationPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
};