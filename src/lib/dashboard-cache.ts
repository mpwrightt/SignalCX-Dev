import { TicketAnalysis } from './types';

export const ANALYSIS_CACHE_KEY = 'signalcx-analysis-cache';
export const PREDICTIVE_CACHE_KEY = 'signalcx-predictive-cache';
export const COACHING_CACHE_KEY = 'signalcx-coaching-cache';
export const CLUSTERING_CACHE_KEY = 'signalcx-clustering-cache';

export const getLocalCachedData = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cachedData = window.localStorage.getItem(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error(`Failed to read from local cache key "${key}":`, error);
    return null;
  }
};

export const setLocalCachedData = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to write to local cache key "${key}":`, error);
  }
};

export const getLocalCachedAnalyses = (ticketIds: number[]): Record<number, TicketAnalysis> => {
  if (typeof window === 'undefined') return {};
  try {
    const cachedData = window.localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (!cachedData) return {};
    const allAnalyses = JSON.parse(cachedData);
    const results: Record<number, TicketAnalysis> = {};
    ticketIds.forEach(id => {
      if (allAnalyses[id]) {
        results[id] = allAnalyses[id];
      }
    });
    return results;
  } catch (error) {
    console.error("Failed to read from local cache:", error);
    return {};
  }
};

export const setLocalCachedAnalyses = (newAnalyses: Record<number, TicketAnalysis>) => {
  if (typeof window === 'undefined') return;
  try {
    const cachedData = window.localStorage.getItem(ANALYSIS_CACHE_KEY);
    const allAnalyses = cachedData ? JSON.parse(cachedData) : {};
    Object.assign(allAnalyses, newAnalyses);
    window.localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(allAnalyses));
  } catch (error) {
    console.error("Failed to write to local cache:", error);
  }
};