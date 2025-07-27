
'use server';

import type {Ticket} from './types';
import {
  mockAgents,
  randomRequesters,
  issueTemplates,
  conversationTemplatesByCategory,
} from './mock-data';
import {differenceInHours, subDays} from 'date-fns';
import type { DateRange } from "react-day-picker";

let ticketIdCounter = 35436;

/**
 * Generates a single mock ticket for demo purposes in a deterministic way.
 */
function generateMockTicket(
  view: string, 
  dateRange: DateRange | undefined,
  index: number, // The index of this ticket in the generation loop (0, 1, 2...)
  totalCount: number, // The total number of tickets being generated
  forceTemplate?: Omit<Ticket, 'id' | 'created_at' | 'status' | 'view' | 'requester' | 'assignee' | 'conversation' | 'sla_breached' | 'csat_score' | 'first_response_at' | 'solved_at' | 'category'> & { category: string }
): Ticket {
  const id = ticketIdCounter++;

  // Start with a deterministic template.
  const baseTemplateIndex = index % issueTemplates.length;
  const finalTemplate = forceTemplate ? {...forceTemplate} : {...issueTemplates[baseTemplateIndex]};
  const category = finalTemplate.category;

  // Create tickets within the specified date range, spread out evenly.
  const now = new Date();
  const fromDate = dateRange?.from || subDays(now, 29);
  const toDate = dateRange?.to || now;
  const dateDiff = toDate.getTime() - fromDate.getTime();
  const deterministicOffset = (index / totalCount) * dateDiff;
  const createdAt = new Date(toDate.getTime() - deterministicOffset); // Generate from most recent backwards

  // Determine status deterministically using a repeating cycle.
  let status: Ticket['status'];
  const statusCycle: Ticket['status'][] = ['solved', 'open', 'solved', 'pending', 'new', 'closed', 'solved', 'open', 'on-hold', 'closed'];
  
  if (view.includes('(OPEN +24 HR)')) {
    status = 'open';
  } else {
    status = statusCycle[index % statusCycle.length];
  }
  
  // Generate dependent fields based on the final status.
  let first_response_at: string | undefined = undefined;
  let solved_at: string | undefined = undefined;
  let sla_breached = false;
  let csat_score: number | undefined = undefined;
  const slaResponseHours = 24;

  if (status !== 'new') {
    // If it's not 'new', it has a first response. Every 5th ticket breaches SLA.
    const responseHours = (index % 5 === 0) ? slaResponseHours + 8 : 1 + (index % 23);
    first_response_at = new Date(createdAt.getTime() + responseHours * 60 * 60 * 1000).toISOString();
    if (responseHours > slaResponseHours) {
      sla_breached = true;
    }
  } else {
    // For 'new' tickets, check if it has already breached SLA without a response
    const hoursSinceCreation = differenceInHours(new Date(), createdAt);
    if (hoursSinceCreation > slaResponseHours) {
      sla_breached = true;
    }
  }

  if (status === 'solved' || status === 'closed') {
    // If solved/closed, it must have a first response if it doesn't already
    if (!first_response_at) {
        first_response_at = new Date(createdAt.getTime() + (1 * 60 * 60 * 1000)).toISOString();
    }
    // Solved time is based on index
    const solvedDate = new Date(new Date(first_response_at).getTime() + (index % 71 + 1) * 60 * 60 * 1000);
    solved_at = solvedDate.toISOString();

    // Every 4th ticket gets a score, cycle through scores
    if (index % 4 !== 0) {
        const scoreCycle = [5, 4, 5, 3, 5, 4, 1, 5, 2, 4];
        csat_score = scoreCycle[index % scoreCycle.length];
    }
  }

  // Generate a relevant conversation using the derived category.
  const convCategory: keyof typeof conversationTemplatesByCategory = category as keyof typeof conversationTemplatesByCategory;
  const categoryConversations = conversationTemplatesByCategory[convCategory] || conversationTemplatesByCategory.Feedback;
  const convTemplateIndex = index % categoryConversations.length;
  const conversationTemplate = categoryConversations[convTemplateIndex];

  const conversation = conversationTemplate.map((msg, msgIndex) => ({
    sender: msg.sender as 'customer' | 'agent',
    message: msg.message,
    timestamp: new Date(createdAt.getTime() + (msgIndex * 5 + 3) * 60 * 1000).toISOString(),
  }));

  const requester = randomRequesters[index % randomRequesters.length];
  const assignee = mockAgents[index % mockAgents.length];

  // Add sentiment based on ticket content/category for realism
  const sentiments: ('Positive' | 'Neutral' | 'Negative')[] = ['Positive', 'Neutral', 'Negative'];
  const sentimentIndex = (id + category.length) % sentiments.length;
  const sentiment = sentiments[sentimentIndex];

  const ticket: Ticket & { sentiment?: 'Positive' | 'Neutral' | 'Negative' } = {
    ...finalTemplate,
    id,
    requester,
    assignee,
    view,
    status,
    category,
    created_at: createdAt.toISOString(),
    first_response_at,
    solved_at,
    conversation,
    sla_breached,
    csat_score,
    sentiment,
  };

  return ticket;
}

/**
 * Simulates fetching a list of tickets for a given view for demo mode.
 * This is now deterministic.
 *
 * @param view - The Zendesk view to fetch tickets from.
 * @param limit - The number of tickets to generate.
 * @returns A promise that resolves to an array of raw `Ticket` objects.
 */
export async function fetchMockTicketsForView(
  view: string,
  limit: number,
  dateRange: DateRange | undefined
): Promise<Ticket[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  ticketIdCounter = 35436; // Reset counter for deterministic generation

  const tickets: Ticket[] = [];
  const ticketCount = limit;

  for (let i = 0; i < ticketCount; i++) {
    // For 'All Views', we cycle through templates to ensure variety.
    // For other views, the template is picked inside generateMockTicket based on the index.
    const template = (view === 'All Views') ? issueTemplates[i % issueTemplates.length] : undefined;
    tickets.push(generateMockTicket(view, dateRange, i, ticketCount, template));
  }
  
  // The tickets are already generated in descending date order, so no final sort is needed.
  return tickets;
}
