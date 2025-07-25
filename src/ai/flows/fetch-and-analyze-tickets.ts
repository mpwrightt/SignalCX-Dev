
'use server';

/**
 * @fileOverview A master flow to fetch Zendesk tickets.
 * This serves as the primary data entry point for the application.
 *
 * - fetchTickets - Fetches tickets from the data source (demo or live).
 */

import type { Ticket } from '@/lib/types';
import { fetchMockTicketsForView } from '@/lib/zendesk-service';
import { fetchLiveTicketsForView } from '@/lib/zendesk-service-live';
import type { DateRange } from 'react-day-picker';

/**
 * Converts EnterpriseTicket to legacy Ticket format for compatibility
 */
function convertEnterpriseTicketToTicket(enterpriseTicket: EnterpriseTicket): Ticket {
  return {
    id: enterpriseTicket.id,
    subject: enterpriseTicket.subject,
    requester: enterpriseTicket.requester || 'Unknown',
    assignee: enterpriseTicket.assignee || undefined,
    description: enterpriseTicket.description || '',
    created_at: enterpriseTicket.created_at,
    first_response_at: enterpriseTicket.first_response_at,
    solved_at: enterpriseTicket.solved_at,
    status: enterpriseTicket.status === 'on-hold' ? 'hold' : enterpriseTicket.status as any,
    priority: enterpriseTicket.priority,
    tags: enterpriseTicket.tags || [],
    view: enterpriseTicket.view || 'Generated Data',
    category: enterpriseTicket.category || 'general',
    conversation: enterpriseTicket.conversation || [],
    sla_breached: enterpriseTicket.sla_breached || false,
    csat_score: enterpriseTicket.csat_score
  };
}

/**
 * Fetches raw tickets from the data source.
 * @param view - The Zendesk view to fetch tickets from.
 * @param mode - The application mode ('demo' or 'enterprise').
 * @param ticketFetchLimit - The number of tickets to fetch.
 * @param dateRange - The date range for which to fetch tickets (used in demo mode).
 * @param organizationId - The organization ID for fetching generated tickets in demo mode.
 * @returns A promise that resolves to an array of tickets.
 */
export async function fetchTickets(
  view: string,
  mode: 'demo' | 'enterprise',
  ticketFetchLimit: number,
  dateRange?: DateRange,
  organizationId?: string
): Promise<Ticket[]> {
  console.log(
    `Fetching tickets for view: ${view} in ${mode} mode.`
  );

  try {
    if (mode === 'enterprise') {
      console.log('[ENTERPRISE MODE] Fetching tickets from live data source...');
      return await fetchLiveTicketsForView(view, ticketFetchLimit);
    } else {
      console.log('[DEMO MODE] Checking for generated tickets first...');
      
      // First try to fetch AI-generated tickets from Firebase
      if (organizationId) {
        try {
          const generatedTickets = await fetchGeneratedTickets(organizationId, ticketFetchLimit);
          if (generatedTickets.length > 0) {
            console.log(`[DEMO MODE] Found ${generatedTickets.length} generated tickets, using them instead of mock data`);
            // Convert EnterpriseTickets to legacy Ticket format
            const convertedTickets = generatedTickets.map(convertEnterpriseTicketToTicket);
            return convertedTickets;
          }
        } catch (generatedError) {
          console.log('[DEMO MODE] Error fetching generated tickets, falling back to mock data:', generatedError);
        }
      }
      
      // Fallback to mock data if no generated tickets or no organizationId
      console.log('[DEMO MODE] No generated tickets found, using mock data...');
      return await fetchMockTicketsForView(view, ticketFetchLimit, dateRange);
    }
  } catch (error) {
    console.error(
      `[${mode.toUpperCase()} MODE] An error occurred during the fetch process. Error:`,
      error
    );
    // Return empty array on error to prevent crash
    return [];
  }
}
