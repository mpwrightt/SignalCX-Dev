
'use server';

/**
 * @fileOverview A master flow to fetch Zendesk tickets.
 * This serves as the primary data entry point for the application.
 *
 * - fetchTickets - Fetches tickets from the data source (demo or live).
 */

import type { Ticket } from '@/lib/types';
import { fetchLiveTicketsForView } from '@/lib/zendesk-service-live';
import { GeneratedTicketService, type StoredTicket } from '@/lib/generated-ticket-service';
import type { DateRange } from 'react-day-picker';

/**
 * Converts StoredTicket (from generated_tickets table) to legacy Ticket format for compatibility
 */
function convertStoredTicketToTicket(storedTicket: StoredTicket): Ticket {
  const zendeskTicket = storedTicket.ticket_data;
  
  console.log('[CONVERSION] Converting ticket:', zendeskTicket.id, zendeskTicket.subject);
  
  return {
    id: zendeskTicket.id,
    subject: zendeskTicket.subject,
    requester: zendeskTicket.via?.source?.from?.name || zendeskTicket.via?.source?.from?.address || 'Unknown',
    assignee: `Agent ${zendeskTicket.assignee_id}`,
    description: zendeskTicket.description || '',
    created_at: zendeskTicket.created_at,
    first_response_at: undefined, // Generated tickets don't have response times yet
    solved_at: zendeskTicket.status === 'solved' ? zendeskTicket.updated_at : undefined,
    status: zendeskTicket.status === 'hold' ? 'on-hold' : zendeskTicket.status as any,
    priority: zendeskTicket.priority as 'urgent' | 'high' | 'normal' | 'low' || 'normal',
    tags: zendeskTicket.tags || [],
    view: 'Generated Data',
    category: storedTicket.scenario,
    conversation: [], // Generated tickets don't have conversations yet
    sla_breached: false, // Could calculate this based on created_at and priority
    csat_score: undefined // Generated tickets don't have CSAT scores yet
  };
}

/**
 * Fetches generated tickets from Supabase for demo mode
 */
async function fetchGeneratedTickets(organizationId: string, limit: number): Promise<StoredTicket[]> {
  const ticketService = new GeneratedTicketService();
  return await ticketService.getTickets(organizationId, {
    limit,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
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
      console.log('[DEMO MODE] Fetching generated tickets from Supabase...');
      console.log('[DEMO MODE] Organization ID:', organizationId);
      
      // Fetch AI-generated tickets from Supabase - no fallback to mock data
      if (!organizationId) {
        console.warn('[DEMO MODE] No organization ID provided - cannot fetch generated tickets');
        return [];
      }
      
      try {
        const generatedTickets = await fetchGeneratedTickets(organizationId, ticketFetchLimit);
        console.log(`[DEMO MODE] Found ${generatedTickets.length} generated tickets`);
        
        if (generatedTickets.length === 0) {
          console.log('[DEMO MODE] No generated tickets found - user needs to generate tickets first');
          return [];
        }
        
        // Convert StoredTickets to legacy Ticket format
        const convertedTickets = generatedTickets.map(convertStoredTicketToTicket);
        return convertedTickets;
      } catch (error) {
        console.error('[DEMO MODE] Error fetching generated tickets:', error);
        return [];
      }
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
