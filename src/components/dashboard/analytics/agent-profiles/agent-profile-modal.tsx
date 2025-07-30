import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AgentProfileTabs } from './agent-profile-tabs';
import { AgentPerformanceChart } from './agent-performance-chart';
import { AgentWorkloadMetrics } from './agent-workload-metrics';

export interface AgentProfileData {
  name: string;
  role: string;
  burnoutRisk: string;
  resolutionRate: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
}

interface AgentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentData: AgentProfileData | null;
  sessionMode?: 'demo' | 'enterprise';
  onAgentAction: (action: string, agentName: string) => void;
}

export const AgentProfileModal: React.FC<AgentProfileModalProps> = ({ open, onOpenChange, agentData, sessionMode, onAgentAction }) => {
  if (!agentData) return null;

  const tabs = [
    {
      title: "Performance",
      content: <AgentPerformanceChart />,
    },
    {
      title: "Workload",
      content: <AgentWorkloadMetrics />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{agentData.name}</DialogTitle>
          <DialogDescription>{agentData.role}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <AgentProfileTabs tabs={tabs} />
        </div>
      </DialogContent>
    </Dialog>
  );
};