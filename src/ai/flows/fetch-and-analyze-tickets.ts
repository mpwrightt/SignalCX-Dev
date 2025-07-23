
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
 * Fetches raw tickets from the data source.
 * @param view - The Zendesk view to fetch tickets from.
 * @param mode - The application mode ('demo' or 'enterprise').
 * @param ticketFetchLimit - The number of tickets to fetch.
 * @param dateRange - The date range for which to fetch tickets (used in demo mode).
 * @returns A promise that resolves to an array of tickets.
 */
export async function fetchTickets(
  view: string,
  mode: 'demo' | 'enterprise',
  ticketFetchLimit: number,
  dateRange?: DateRange
): Promise<Ticket[]> {
  console.log(
    `Fetching tickets for view: ${view} in ${mode} mode.`
  );

  try {
    if (mode === 'enterprise') {
      console.log('[ENTERPRISE MODE] Fetching tickets from live data source...');
      return await fetchLiveTicketsForView(view, ticketFetchLimit);
    } else {
      console.log('[DEMO MODE] Fetching mock tickets...');
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
