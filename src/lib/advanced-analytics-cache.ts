// Advanced Analytics Cache and Utility Functions
// Extracted from advanced-analytics-view.tsx for better modularity

const ADVANCED_ANALYTICS_CACHE_KEY = 'signalcx-advanced-analytics-cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const ELAPSED_TIMER_KEY = 'signalcx-advanced-analytics-timer';

// AI-driven confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
  CRITICAL: 0.3
} as const;

// Determine if a result needs rerun based on confidence
export function shouldRerun(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLDS.MEDIUM;
}

// Get confidence level label
export function getConfidenceLevel(confidence: number): string {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'High';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'Medium';
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'Low';
  return 'Critical';
}

// Get confidence color class
export function getConfidenceColor(confidence: number): string {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'text-accent';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'text-primary';
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'text-yellow-600';
  return 'text-destructive';
}

// Helper to get a color for risk/impact levels
export function getLevelColor(level: string): string {
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

// Cache key computation
export function computeAnalyticsCacheKey(tickets: any[], sessionMode: string): string {
  const ids = tickets.map(t => t.id).sort((a, b) => a - b).join(',');
  const ticketCount = tickets.length;
  return `${sessionMode || 'demo'}:${ticketCount}:${ids}`;
}

// Cache retrieval
export function getCachedAnalyticsForKey(key: string): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const cacheRaw = window.localStorage.getItem(ADVANCED_ANALYTICS_CACHE_KEY);
    if (!cacheRaw) {
      console.log('[AdvancedAnalyticsCache] No cache found in localStorage');
      return null;
    }
    const cache = JSON.parse(cacheRaw);
    if (!cache[key]) {
      console.log('[AdvancedAnalyticsCache] No cache found for key:', key, 'Available keys:', Object.keys(cache));
      return null;
    }
    const { data, timestamp } = cache[key];
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      console.log('[AdvancedAnalyticsCache] Cache expired for key:', key);
      return null;
    }
    console.log('[AdvancedAnalyticsCache] Cache hit for key:', key);
    return data;
  } catch (error) {
    console.log('[AdvancedAnalyticsCache] Cache error:', error);
    return null;
  }
}

// Cache storage
export function setCachedAnalyticsForKey(key: string, data: any): void {
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
  } catch (error) {
    console.error('[AdvancedAnalyticsCache] Failed to set cache:', error);
  }
}

// Timer utilities
export function getStoredStartTime(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(ELAPSED_TIMER_KEY);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

export function setStoredStartTime(startTime: number | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (startTime === null) {
      window.localStorage.removeItem(ELAPSED_TIMER_KEY);
    } else {
      window.localStorage.setItem(ELAPSED_TIMER_KEY, startTime.toString());
    }
  } catch (error) {
    console.error('[AdvancedAnalyticsCache] Failed to set timer:', error);
  }
}

// Risk level color helper
export function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'text-muted-foreground';
  }
}

// Cache constants export
export { CACHE_TTL_MS, ELAPSED_TIMER_KEY };