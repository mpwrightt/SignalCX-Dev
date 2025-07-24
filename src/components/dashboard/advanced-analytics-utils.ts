// Utility and helper functions for Advanced Analytics View

export const ADVANCED_ANALYTICS_CACHE_KEY = 'signalcx-advanced-analytics-cache';
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
export const ELAPSED_TIMER_KEY = 'signalcx-advanced-analytics-timer';

// AI-driven confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
  CRITICAL: 0.3
};

export function shouldRerun(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLDS.MEDIUM;
}

export function getConfidenceLevel(confidence: number): string {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'High';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'Medium';
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'Low';
  return 'Critical';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'text-accent';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'text-primary';
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'text-yellow-600';
  return 'text-destructive';
}

export function computeAnalyticsCacheKey(tickets: any[], sessionMode: string) {
  const ids = tickets.map(t => t.id).sort((a, b) => a - b).join(',');
  const ticketCount = tickets.length;
  return `${sessionMode || 'demo'}:${ticketCount}:${ids}`;
}

export function getCachedAnalyticsForKey(key: string) {
  if (typeof window === 'undefined') return null;
  try {
    const cacheRaw = window.localStorage.getItem(ADVANCED_ANALYTICS_CACHE_KEY);
    if (!cacheRaw) {
      console.log('[AdvancedAnalyticsView] No cache found in localStorage');
      return null;
    }
    const cache = JSON.parse(cacheRaw);
    if (!cache[key]) {
      console.log('[AdvancedAnalyticsView] No cache found for key:', key, 'Available keys:', Object.keys(cache));
      return null;
    }
    const { data, timestamp } = cache[key];
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      console.log('[AdvancedAnalyticsView] Cache expired for key:', key);
      return null;
    }
    console.log('[AdvancedAnalyticsView] Cache hit for key:', key);
    return data;
  } catch (error) {
    console.log('[AdvancedAnalyticsView] Cache error:', error);
    return null;
  }
}

export function setCachedAnalyticsForKey(key: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    const cacheRaw = window.localStorage.getItem(ADVANCED_ANALYTICS_CACHE_KEY);
    const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
    
    if (data === null) {
      // Clear this specific cache key
      delete cache[key];
    } else {
      cache[key] = { data, timestamp: Date.now() };
    }
    
    window.localStorage.setItem(ADVANCED_ANALYTICS_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export function getLevelColor(level: string) {
  switch (level) {
    case 'critical':
    case 'high':
      return 'bg-red-600 text-white';
    case 'medium':
      return 'bg-yellow-500 text-white';
    case 'low':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
} 