
import type { Ticket, KnowledgeGap } from "./types";
import { sample, sampleSize } from 'lodash';

export function generateMockSlaPrediction(tickets: Ticket[]) {
  // Simple logic: more open/pending tickets = higher risk
  const atRiskTickets = tickets.filter(t => t.status === 'open' || t.status === 'pending').length;
  const probability = Math.min(1, atRiskTickets / Math.max(20, tickets.length));
  const actions = [
    'Reassign high-priority tickets to available agents',
    'Extend SLA for non-critical categories by 2 hours',
    'Activate backup support team',
    'Implement priority queuing for urgent tickets',
    'Send proactive updates to customers',
    'Review ticket backlog for bottlenecks',
  ];
  return {
    probability: Math.round(probability * 100) / 100,
    atRiskTickets,
    recommendedActions: sampleSize(actions, 3),
  };
}

export function generateMockKnowledgeGaps(tickets: Ticket[]): KnowledgeGap[] {
  // Group tickets by agent
  const agentMap = new Map();
  tickets.forEach(t => {
    if (t.assignee) {
      if (!agentMap.has(t.assignee)) agentMap.set(t.assignee, []);
      agentMap.get(t.assignee).push(t);
    }
  });
  const topics = [
    'Advanced Technical Troubleshooting',
    'Seller Platform Features',
    'Customer De-escalation Techniques',
    'Payment Processing Systems',
    'Quality Assurance Standards',
    'Zendesk Macros',
    'Product Knowledge',
    'Returns & Refunds',
    'Shipping Policies',
    'Inventory Management',
  ];
  const impacts = ['low', 'medium', 'high'];
  const trainings = [
    'Technical escalation procedures',
    'Advanced debugging techniques',
    'System architecture overview',
    'Pro Seller dashboard',
    'Inventory management tools',
    'Analytics and reporting',
    'Conflict resolution',
    'Emotional intelligence',
    'Advanced communication skills',
    'Payment gateway integration',
    'Fraud detection',
    'Refund processing',
    'Quality metrics',
    'Peer review process',
    'Documentation standards',
  ];
  return Array.from(agentMap.entries()).map(([agentName, agentTickets], i) => {
    const frequency = Math.max(1, Math.floor(agentTickets.length / 3) + Math.floor(Math.random() * 5));
    const recommendedTraining = sampleSize([
      'Customer Communication Skills',
      'Product Knowledge Update',
      'Technical Troubleshooting',
      'Conflict Resolution',
      'Time Management',
      'API Integration Training',
      'Advanced Analytics',
    ], 3);
    
    return {
      topic: sample(topics) ?? 'General Support',
      affectedTickets: frequency,
      agents: [String(agentName)],
      impact: (sample(impacts) ?? 'medium') as 'low' | 'medium' | 'high',
      priority: (sample(impacts) ?? 'medium') as 'low' | 'medium' | 'high',
      agentName: String(agentName),
      frequency,
      recommendedTraining,
    };
  });
}
