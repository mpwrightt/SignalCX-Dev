
'use server';

import type {Ticket} from './types';

/**
 * Strips ".zendesk.com" from the subdomain if present, ensuring a clean subdomain for API calls.
 * This makes the configuration more robust if the user enters the full URL instead of just the subdomain.
 * @returns The cleaned subdomain, or undefined if not set.
 */
const getCleanSubdomain = (): string | undefined => {
    let subdomain = process.env.ZENDESK_SUBDOMAIN;
    if (subdomain?.includes('.zendesk.com')) {
        console.log(`[Zendesk Service] Received full domain "${subdomain}", stripping to just the subdomain part.`);
        subdomain = subdomain.split('.')[0];
    }
    return subdomain;
}


/**
 * Maps a single Zendesk comment object to our internal conversation entry format.
 * @param comment - The raw comment object from the Zendesk API.
 * @param users - An array of user objects to find the author's role.
 * @returns A conversation entry object, or null if the comment is a private note.
 */
const mapZendeskCommentToConversationEntry = (comment: any, users: any[]): Ticket['conversation'][0] | null => {
  if (!comment.public) {
    return null; // Don't include internal notes in the conversation view
  }
  const author = users.find(u => u.id === comment.author_id);
  const sender = author?.role === 'end-user' ? 'customer' : 'agent';
  return {
    sender,
    message: comment.body,
    timestamp: comment.created_at,
  };
};

/**
 * Maps a raw ticket object from the Zendesk API to our internal `Ticket` type.
 * This function acts as a translation layer, decoupling our application from the
 * specific structure of the Zendesk API response.
 * @param zendeskTicket - The raw ticket object from the Zendesk API.
 * @param users - An array of user objects sideloaded with the API request.
 * @param comments - An array of comment objects for this ticket.
 * @param allMetricSets - All sideloaded ticket metric sets.
 * @returns A `Ticket` object that conforms to our application's data model.
 */
const mapZendeskToTicket = (
    zendeskTicket: any, 
    users: any[], 
    comments: any[],
    allMetricSets: any[]
): Ticket => {
  const requester = users.find(u => u.id === zendeskTicket.requester_id);
  const assignee = users.find(u => u.id === zendeskTicket.assignee_id);

  // Translate Zendesk API status 'hold' to our internal 'on-hold'.
  const statusMap: { [key: string]: Ticket['status'] } = { 'hold': 'on-hold' };
  const status = statusMap[zendeskTicket.status] || zendeskTicket.status;

  // The first "comment" from the API is the original description. We map the rest.
  const conversation = comments
    .map(comment => mapZendeskCommentToConversationEntry(comment, users))
    .filter((entry): entry is Ticket['conversation'][0] => entry !== null); // Filter out any nulls (private notes)
    
  // Sort to ensure chronological order, as the first entry from comments is the description
  conversation.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // --- CSAT data now comes from Qualtrics, so it is not derived here ---

  // --- Derive Timestamps and SLA Status from Sideloaded Metrics for accuracy ---
  const metricSet = allMetricSets.find(m => m.ticket_id === zendeskTicket.id);
  
  let first_response_at = metricSet?.first_response_time_in_minutes?.calendar
    ? new Date(new Date(zendeskTicket.created_at).getTime() + metricSet.first_response_time_in_minutes.calendar * 60000).toISOString()
    : undefined;

  let solved_at = (status === 'solved' || status === 'closed')
    ? metricSet?.solved_at || zendeskTicket.updated_at
    : undefined;

  let sla_breached = metricSet?.latest_sla_breach_at ? true : false;


  return {
    id: zendeskTicket.id,
    subject: zendeskTicket.subject,
    requester: requester?.name || 'Unknown User',
    assignee: assignee?.name,
    description: zendeskTicket.description,
    created_at: zendeskTicket.created_at,
    first_response_at,
    solved_at,
    status,
    priority: zendeskTicket.priority,
    tags: zendeskTicket.tags,
    view: 'Live Data', // Mark the data source
    category: 'General', // Default category for live data
    conversation,
    sla_breached,
    csat_score: undefined,
  };
};

// In-memory cache for the Zendesk view list to avoid re-fetching on every request.
let viewCache: { id: number; title: string }[] | null = null;
let viewCacheTimestamp: number | null = null;
const VIEW_CACHE_TTL = 5 * 60 * 1000; // Cache views for 5 minutes

/**
 * Fetches the list of active views from the Zendesk API and caches them.
 * @returns A promise that resolves to an array of views.
 */
export async function getZendeskViews(): Promise<{ id: number; title: string }[]> {
  const subdomain = getCleanSubdomain();
  const email = process.env.ZENDESK_EMAIL;
  const apiToken = process.env.ZENDESK_API_TOKEN;

  if (!subdomain || !email || !apiToken) {
    console.warn('[LIVE MODE] Zendesk credentials are not set for fetching views. Returning empty array.');
    return [];
  }
  
  const credentials = Buffer.from(`${email}/token:${apiToken}`).toString('base64');
  const now = Date.now();
  if (viewCache && viewCacheTimestamp && now - viewCacheTimestamp < VIEW_CACHE_TTL) {
    return viewCache;
  }

  const url = `https://${subdomain}.zendesk.com/api/v2/views/active.json`;
  const response = await fetch(url, { headers: { 'Authorization': `Basic ${credentials}` } });
  if (!response.ok) {
    throw new Error('Failed to fetch Zendesk views');
  }
  const data = await response.json();
  viewCache = data.views.map((v: any) => ({ id: v.id, title: v.title }));
  viewCacheTimestamp = now;
  return viewCache!;
}


/**
 * Fetches raw tickets from the live Zendesk API.
 * This is a production-ready implementation that uses environment variables for credentials.
 * @param viewName - The name of the Zendesk view to fetch (e.g., "All unassigned tickets").
 * @returns A promise that resolves to an array of raw `Ticket` objects.
 */
export async function fetchLiveTicketsForView(viewName: string, limit: number): Promise<Ticket[]> {
  const subdomain = getCleanSubdomain();
  const email = process.env.ZENDESK_EMAIL;
  const apiToken = process.env.ZENDESK_API_TOKEN;

  console.log(`[LIVE MODE] Attempting to fetch tickets for view: ${viewName}`);
  console.log(`[LIVE MODE] Diagnostics - Subdomain: ${subdomain ? 'FOUND' : 'NOT FOUND'}, Email: ${email ? 'FOUND' : 'NOT FOUND'}, Token: ${apiToken ? 'FOUND' : 'NOT FOUND'}`);

  if (!subdomain || !email || !apiToken) {
    console.warn('[LIVE MODE] Zendesk credentials are not set in environment variables. Cannot fetch live data. Please check your .env file for ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_TOKEN.');
    return Promise.resolve([]);
  }

  const credentials = Buffer.from(`${email}/token:${apiToken}`).toString('base64');
  const sideloads = 'users,metric_sets';
  let url: string;

  if (viewName === 'All Views') {
    // For "All Views", we use the search API to get all tickets.
    // Sideloading users and metrics to get all necessary data in one call.
    url = `https://${subdomain}.zendesk.com/api/v2/search.json?query=type:ticket&include=${sideloads}&per_page=${limit}`;
  } else {
    // For specific views, we first find the view's numeric ID.
    try {
      const views = await getZendeskViews();
      const view = views.find(v => v.title === viewName);
      if (!view) {
        console.warn(`[LIVE MODE] View with name "${viewName}" not found.`);
        return Promise.resolve([]);
      }
      url = `https://${subdomain}.zendesk.com/api/v2/views/${view.id}/tickets.json?include=${sideloads}&per_page=${limit}`;
    } catch (error) {
      console.error('[LIVE MODE] Failed to get Zendesk views:', error);
      return Promise.resolve([]);
    }
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Zendesk API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    
    // The search API returns results under `results`; view-based API returns under `tickets`.
    const zendeskTickets = data.tickets || data.results || [];
    const users = data.users || [];
    const metricSets = data.metric_sets || [];


    if (zendeskTickets.length === 0) {
      return [];
    }

    // Fetch comments for each ticket in parallel for performance.
    const commentPromises = zendeskTickets.map((ticket: any) =>
      fetch(`https://${subdomain}.zendesk.com/api/v2/tickets/${ticket.id}/comments.json`, {
        headers: { 'Authorization': `Basic ${credentials}` },
      }).then(res => (res.ok ? res.json() : Promise.resolve({ comments: [] })))
    );
    
    const commentResults = await Promise.all(commentPromises);

    const mappedTickets = zendeskTickets.map((ticket: any, index: number) => {
      const comments = commentResults[index]?.comments || [];
      return mapZendeskToTicket(ticket, users, comments, metricSets);
    });
    
    console.log(`[LIVE MODE] Successfully fetched and mapped ${mappedTickets.length} tickets with conversations and SLA data.`);
    return mappedTickets;

  } catch (error) {
    console.error('[LIVE MODE] An error occurred while fetching from Zendesk:', error);
    // In case of error, return an empty array to prevent app crash.
    return Promise.resolve([]);
  }
}
