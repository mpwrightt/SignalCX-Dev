
import type { Ticket, BurnoutIndicator } from "./types";
import { sample, sampleSize } from 'lodash';

export const mockAgents = [
  "John Carter", "Diana Prince", "Bruce Wayne", "Clark Kent", "Barry Allen", 
  "Hal Jordan", "Arthur Curry", "Jessica Cruz", "Wally West", "Selina Kyle"
];

export function generateMockBurnoutIndicators(tickets: Ticket[]): BurnoutIndicator[] {
  // Group tickets by agent
  const agentMap = new Map();
  tickets.forEach(t => {
    if (t.assignee) {
      if (!agentMap.has(t.assignee)) agentMap.set(t.assignee, []);
      agentMap.get(t.assignee).push(t);
    }
  });
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const burnoutIndicators = [
    'Increased response time',
    'More escalations',
    'Declining CSAT scores',
    'Frequent overtime',
    'Increased sick days',
    'Declining engagement',
    'Consistent performance',
    'Positive feedback',
    'Good work-life balance',
    'Stable performance',
    'Good attendance',
    'Positive team feedback',
    'Excessive overtime',
    'Multiple escalations',
    'Customer complaints',
    'Team conflicts',
  ];
  const recommendations = [
    'Schedule breaks between complex tickets',
    'Consider workload reduction',
    'Team building activities',
    'Continue current practices',
    'Share best practices with team',
    'Immediate workload reduction',
    'Mental health support',
    'Flexible scheduling',
    'Continue current approach',
    'Mentor new team members',
    'Immediate intervention required',
    'Professional counseling',
    'Temporary role change',
  ];
  return Array.from(agentMap.entries()).map(([agentName, agentTickets], i) => {
    const riskLevel = (sample(riskLevels) ?? 'low') as 'low' | 'medium' | 'high' | 'critical';
    return {
      agentName: String(agentName),
      riskLevel,
      indicators: sampleSize(burnoutIndicators, 3),
      ticketCount: agentTickets.length,
      avgResolutionTime: Math.floor(Math.random() * 48) + 12, // 12-60 hours
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
}
