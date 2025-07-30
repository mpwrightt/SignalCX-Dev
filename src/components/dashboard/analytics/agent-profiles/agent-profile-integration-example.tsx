'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Eye, Settings, MessageSquare } from 'lucide-react';
import { AgentProfileModal, transformToAgentProfileData, generateMockAgentProfile } from './index';
import type { Ticket, BurnoutIndicator, KnowledgeGap } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AgentProfileIntegrationProps {
  agents: string[];
  tickets: Ticket[];
  burnoutIndicators?: BurnoutIndicator[];
  knowledgeGaps?: KnowledgeGap[];
  sessionMode?: 'demo' | 'enterprise';
}

/**
 * Example component showing how to integrate the agent profile system
 * with existing advanced analytics components
 */
export const AgentProfileIntegrationExample: React.FC<AgentProfileIntegrationProps> = ({
  agents,
  tickets,
  burnoutIndicators = [],
  knowledgeGaps = [],
  sessionMode = 'demo'
}) => {
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const { toast } = useToast();

  const handleAgentClick = (agentName: string) => {
    setSelectedAgent(agentName);
    setModalOpen(true);
  };

  const handleAgentAction = (action: string, agentName: string) => {
    toast({
      title: "Agent Action",
      description: `${action} triggered for ${agentName}`,
    });
    
    // Here you would implement actual actions like:
    // - Opening ticket views
    // - Scheduling coaching sessions
    // - Adjusting workloads
    // - Creating intervention plans
    console.log(`Action: ${action} for agent: ${agentName}`);
  };

  const getAgentProfileData = (agentName: string) => {
    if (sessionMode === 'demo') {
      return generateMockAgentProfile(agentName);
    }
    
    // For enterprise mode, use real data
    const agentBurnout = burnoutIndicators.find(b => b.agentName === agentName);
    const agentKnowledge = knowledgeGaps.find(k => k.agentName === agentName);
    
    return transformToAgentProfileData(
      agentName,
      tickets,
      agentBurnout,
      agentKnowledge
    );
  };

  const getBurnoutRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agent Performance Profiles</h3>
        <Badge variant="outline">
          {agents.length} agents
        </Badge>
      </div>

      {/* Agent Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agentName) => {
          const agentData = getAgentProfileData(agentName);
          const agentTickets = tickets.filter(t => t.assignee === agentName);
          
          return (
            <Card key={agentName} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{agentName}</CardTitle>
                      <div className="text-xs text-gray-500">{agentData.role}</div>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getBurnoutRiskColor(agentData.burnoutRisk)}`}
                  >
                    {agentData.burnoutRisk.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Quick Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">{agentTickets.length}</div>
                    <div className="text-gray-500">Tickets</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">{agentData.resolutionRate.toFixed(0)}%</div>
                    <div className="text-gray-500">Resolved</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">{agentData.avgResolutionTime.toFixed(1)}h</div>
                    <div className="text-gray-500">Avg Time</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold">{agentData.customerSatisfaction.toFixed(1)}</div>
                    <div className="text-gray-500">CSAT</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => handleAgentClick(agentName)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAgentAction('view_tickets', agentName)}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAgentAction('manage_settings', agentName)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agent Profile Modal */}
      <AgentProfileModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        agentData={selectedAgent ? getAgentProfileData(selectedAgent) : null}
        sessionMode={sessionMode}
        onAgentAction={handleAgentAction}
      />
    </div>
  );
};