'use server';

import type { AgentProfile, WeeklyPerformance } from './types';
import { mockAgents } from './mock-data';
import { startOfWeek, endOfWeek, differenceInHours, format } from 'date-fns';

// Mock agent data with tiers and performance history
const mockAgentProfiles: Record<string, AgentProfile> = {
  "John Carter": {
    name: "John Carter",
    avatar: "https://placehold.co/64x64.png",
    solvedTickets: 0,
    avgResolutionTime: "0",
    avgCsat: "0",
    tickets: [],
    sentimentCounts: { Positive: 0, Neutral: 0, Negative: 0 },
    categoryCounts: [],
    tier: "Tier 1",
    performanceHistory: generateMockPerformanceHistory("John Carter"),
  },
  "Diana Prince": {
    name: "Diana Prince",
    avatar: "https://placehold.co/64x64.png",
    solvedTickets: 0,
    avgResolutionTime: "0",
    avgCsat: "0",
    tickets: [],
    sentimentCounts: { Positive: 0, Neutral: 0, Negative: 0 },
    categoryCounts: [],
    tier: "Tier 2",
    performanceHistory: generateMockPerformanceHistory("Diana Prince"),
  },
  "Bruce Wayne": {
    name: "Bruce Wayne",
    avatar: "https://placehold.co/64x64.png",
    solvedTickets: 0,
    avgResolutionTime: "0",
    avgCsat: "0",
    tickets: [],
    sentimentCounts: { Positive: 0, Neutral: 0, Negative: 0 },
    categoryCounts: [],
    tier: "Tier 3",
    performanceHistory: generateMockPerformanceHistory("Bruce Wayne"),
  },
  "Clark Kent": {
    name: "Clark Kent",
    avatar: "https://placehold.co/64x64.png",
    solvedTickets: 0,
    avgResolutionTime: "0",
    avgCsat: "0",
    tickets: [],
    sentimentCounts: { Positive: 0, Neutral: 0, Negative: 0 },
    categoryCounts: [],
    tier: "Tier 2",
    performanceHistory: generateMockPerformanceHistory("Clark Kent"),
  },
  "Barry Allen": {
    name: "Barry Allen",
    avatar: "https://placehold.co/64x64.png",
    solvedTickets: 0,
    avgResolutionTime: "0",
    avgCsat: "0",
    tickets: [],
    sentimentCounts: { Positive: 0, Neutral: 0, Negative: 0 },
    categoryCounts: [],
    tier: "Tier 1",
    performanceHistory: generateMockPerformanceHistory("Barry Allen"),
  },
};

function generateMockPerformanceHistory(agentName: string): WeeklyPerformance[] {
  const history: WeeklyPerformance[] = [];
  const now = new Date();
  
  // Generate 12 weeks of historical data
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
    const baseTickets = agentName.includes("Bruce") ? 85 : agentName.includes("Diana") ? 70 : 45;
    const variance = Math.random() * 20 - 10; // ±10 tickets variance
    const ticketsSolved = Math.max(1, Math.round(baseTickets + variance));
    const hoursWorked = 40 + (Math.random() * 5 - 2.5); // 37.5-42.5 hours
    const ticketsPerHour = ticketsSolved / hoursWorked;
    
    history.push({
      weekStart: weekStart.toISOString(),
      ticketsSolved,
      hoursWorked: Math.round(hoursWorked * 10) / 10,
      ticketsPerHour: Math.round(ticketsPerHour * 100) / 100,
      csatScore: 3.5 + Math.random() * 1.5, // 3.5-5.0
      resolutionTimeHours: 2 + Math.random() * 6, // 2-8 hours
    });
  }
  
  return history;
}

export async function getAgentProfile(agentName: string): Promise<AgentProfile | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return mockAgentProfiles[agentName] || null;
}

export async function updateAgentTier(agentName: string, newTier: 'Tier 1' | 'Tier 2' | 'Tier 3'): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  if (mockAgentProfiles[agentName]) {
    mockAgentProfiles[agentName].tier = newTier;
    return true;
  }
  
  return false;
}

export async function calculateWeeklyPerformance(agentName: string, tickets: any[]): Promise<WeeklyPerformance | null> {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  
  const weekTickets = tickets.filter(ticket => {
    if (!ticket.assignee || ticket.assignee !== agentName) return false;
    if (!ticket.solved_at) return false;
    
    const solvedDate = new Date(ticket.solved_at);
    return solvedDate >= weekStart && solvedDate <= weekEnd;
  });
  
  if (weekTickets.length === 0) return null;
  
  const ticketsSolved = weekTickets.length;
  const hoursWorked = 40; // Default assumption, could be enhanced with time tracking
  const ticketsPerHour = ticketsSolved / hoursWorked;
  
  const csatScores = weekTickets
    .map(t => t.csat_score)
    .filter(score => score !== undefined && score !== null);
  
  const avgCsat = csatScores.length > 0 
    ? csatScores.reduce((a, b) => a + b, 0) / csatScores.length 
    : undefined;
  
  const resolutionTimes = weekTickets
    .map(t => {
      if (!t.solved_at || !t.created_at) return null;
      return differenceInHours(new Date(t.solved_at), new Date(t.created_at));
    })
    .filter(time => time !== null);
  
  const avgResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
    : undefined;
  
  return {
    weekStart: weekStart.toISOString(),
    ticketsSolved,
    hoursWorked,
    ticketsPerHour: Math.round(ticketsPerHour * 100) / 100,
    csatScore: avgCsat,
    resolutionTimeHours: avgResolutionTime,
  };
}

export async function getAllAgents(): Promise<string[]> {
  return mockAgents;
} 