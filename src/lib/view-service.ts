
'use server';

import { zendeskViews as mockViews } from './views';
import { getZendeskViews as getLiveViews } from './zendesk-service-live';

/**
 * Fetches the available ticket views.
 * In 'demo' mode, it returns a hardcoded list.
 * In 'enterprise' mode, it fetches the actual views from the Zendesk API.
 * @param mode The application mode ('demo' or 'enterprise').
 * @returns A promise that resolves to an array of view names.
 */
export async function getAvailableViews(mode: 'demo' | 'enterprise' | null): Promise<string[]> {
    if (mode === 'enterprise') {
        try {
            const liveViews = await getLiveViews();
            const viewNames = liveViews.map(v => v.title);
            // We want 'All Views' at the top, just like in the mock data.
            return ['All Views', ...viewNames];
        } catch (error) {
            console.error("Failed to fetch live Zendesk views. This is likely due to incorrect credentials or network issues. Returning a minimal view list.", error);
            // Return a minimal list to indicate failure without breaking the UI
            return ['All Views'];
        }
    }
    // Demo mode or if mode is null
    return mockViews;
}
