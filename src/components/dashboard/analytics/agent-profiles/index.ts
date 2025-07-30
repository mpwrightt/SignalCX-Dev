// Agent Profile Components Export
export { AgentProfileModal } from './agent-profile-modal';
export { AgentProfileTabs } from './agent-profile-tabs';
export { AgentPerformanceChart } from './agent-performance-chart';
export { AgentWorkloadMetrics } from './agent-workload-metrics';

// Types
export type { AgentProfileData } from './agent-profile-modal';

// Utility functions for data transformation
import type { Ticket, BurnoutIndicator, KnowledgeGap } from '@/lib/types';
import { AgentProfileData } from './agent-profile-modal';

/**
 * Transform existing agent data from mock data structures into AgentProfileData format
 */
export function transformToAgentProfileData(
  agentName: string,
  tickets: Ticket[],
  burnoutIndicator?: BurnoutIndicator,
  knowledgeGaps?: KnowledgeGap[]
): AgentProfileData {
  // Filter tickets for this agent
  const agentTickets = tickets.filter(t => t.assignee === agentName);
  const resolvedTickets = agentTickets.filter(t => t.status === 'solved' || t.status === 'closed');
  
  // Calculate performance metrics
  const totalTickets = agentTickets.length;
  const resolvedCount = resolvedTickets.length;
  const resolutionRate = totalTickets > 0 ? (resolvedCount / totalTickets) * 100 : 0;
  
  // Calculate average resolution time
  const avgResolutionTime = resolvedTickets.reduce((sum, ticket) => {
    if (ticket.solved_at && ticket.created_at) {
      const created = new Date(ticket.created_at);
      const solved = new Date(ticket.solved_at);
      return sum + (solved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    }
    return sum;
  }, 0) / Math.max(1, resolvedTickets.length);

  // Calculate first response time (mock)
  const firstResponseTime = avgResolutionTime * 0.2; // Assume 20% of resolution time

  // Calculate customer satisfaction from tickets with CSAT scores
  const csatTickets = agentTickets.filter(t => t.csat_score);
  const customerSatisfaction = csatTickets.length > 0 
    ? csatTickets.reduce((sum, t) => sum + (t.csat_score || 0), 0) / csatTickets.length
    : 4.0 + Math.random(); // Default range 4-5

  // Generate workload metrics (mock data based on ticket count)
  const currentWorkload = Math.floor(totalTickets * 0.3 + Math.random() * 10);
  const maxCapacity = Math.max(currentWorkload + 5, 20);
  const utilizationRate = (currentWorkload / maxCapacity) * 100;

  // Generate performance trend (mock)
  const performanceTrend = (Math.random() - 0.5) * 20; // -10% to +10%

  // Generate historical data (mock)
  const generateHistoricalData = (days: number) => {
    const data = [];
    const baseDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString(),
        resolved: Math.floor(Math.random() * 5) + 1,
        avgTime: avgResolutionTime + (Math.random() - 0.5) * 2,
        csat: customerSatisfaction + (Math.random() - 0.5) * 0.5
      });
    }
    
    return data;
  };

  const generateWorkloadHistory = (days: number) => {
    const data = [];
    const baseDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString(),
        tickets: Math.floor(Math.random() * 8) + 2,
        utilization: utilizationRate + (Math.random() - 0.5) * 20
      });
    }
    
    return data;
  };

  // Extract knowledge gaps and recommendations
  const agentKnowledgeGaps = knowledgeGaps 
    ? [knowledgeGaps.topic]
    : ['Advanced Technical Support', 'Customer De-escalation'];

  const recommendations = knowledgeGaps?.recommendedTraining || [
    'Focus on resolution time improvement',
    'Enhance customer communication skills',
    'Consider workload balancing'
  ];

  return {
    agentName,
    email: `${agentName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
    role: 'Support Agent',
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: Math.random() > 0.7 ? 'away' : Math.random() > 0.1 ? 'active' : 'offline',
    
    // Performance metrics
    totalTickets,
    resolvedTickets: resolvedCount,
    resolutionRate,
    avgResolutionTime,
    firstResponseTime,
    customerSatisfaction,
    
    // Workload metrics  
    currentWorkload,
    maxCapacity,
    utilizationRate,
    peakHours: ['9:00 AM', '2:00 PM', '4:00 PM'],
    
    // Analytics data
    recentTickets: agentTickets.slice(-10),
    performanceTrend,
    burnoutRisk: burnoutIndicator?.riskLevel || 'low',
    knowledgeGaps: agentKnowledgeGaps,
    recommendations,
    
    // Historical data
    performanceHistory: generateHistoricalData(30),
    workloadHistory: generateWorkloadHistory(30)
  };
}

/**
 * Generate mock agent profile data for demo mode
 */
export function generateMockAgentProfile(agentName: string): AgentProfileData {
  const mockTickets: Ticket[] = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    subject: `Mock ticket ${i + 1}`,
    description: `Mock description for ticket ${i + 1}`,
    status: Math.random() > 0.3 ? 'solved' : Math.random() > 0.5 ? 'pending' : 'open',
    priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.3 ? 'normal' : 'low',
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    solved_at: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString() : null,
    assignee: agentName,
    requester: `customer${i}@example.com`,
    tags: ['support', 'general'],
    view: 'all_tickets',
    conversation: [],
    sla_breached: Math.random() > 0.8,
    csat_score: Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 4 : undefined,
    first_response_at: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'general_question'
  }));

  const mockBurnoutIndicator: BurnoutIndicator = {
    agentName,
    riskLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
    indicators: ['High ticket volume', 'Extended work hours'],
    ticketCount: mockTickets.length,
    avgResolutionTime: 4 + Math.random() * 8,
    lastActivity: new Date().toISOString()
  };

  const mockKnowledgeGap: KnowledgeGap = {
    topic: 'Advanced Technical Support',
    affectedTickets: 5,
    agents: [agentName],
    impact: 'medium',
    priority: 'high',
    agentName,
    frequency: 3,
    recommendedTraining: ['Technical troubleshooting', 'API integration']
  };

  return transformToAgentProfileData(agentName, mockTickets, mockBurnoutIndicator, mockKnowledgeGap);
}