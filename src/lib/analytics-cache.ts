export type AnalysisType = 'performance' | 'burnout' | 'knowledge' | 'sla';

interface CachedAnalysis {
  data: any;
  timestamp: number;
  ticketHash: string;
}

export class AnalyticsCache {
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  private static readonly CACHE_KEYS = {
    PERFORMANCE: 'perf',
    BURNOUT: 'burnout',
    KNOWLEDGE: 'knowledge',
    SLA: 'sla'
  };

  static getCachedAgentAnalysis(agentName: string, type: AnalysisType, ticketHash: string): any | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cacheKey = `signalcx-${type}-${agentName}`;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp, ticketHash: cachedHash }: CachedAnalysis = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp > this.CACHE_TTL_MS) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Check if ticket data has changed
      if (cachedHash !== ticketHash) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.warn(`Error reading cached ${type} analysis for ${agentName}:`, error);
      return null;
    }
  }

  static setCachedAgentAnalysis(agentName: string, type: AnalysisType, data: any, ticketHash: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheKey = `signalcx-${type}-${agentName}`;
      const cacheData: CachedAnalysis = {
        data,
        timestamp: Date.now(),
        ticketHash
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn(`Error caching ${type} analysis for ${agentName}:`, error);
    }
  }

  static getCachedGlobalAnalysis(type: AnalysisType, ticketHash: string): any | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cacheKey = `signalcx-${type}-global`;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp, ticketHash: cachedHash }: CachedAnalysis = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp > this.CACHE_TTL_MS) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Check if ticket data has changed
      if (cachedHash !== ticketHash) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.warn(`Error reading cached global ${type} analysis:`, error);
      return null;
    }
  }

  static setCachedGlobalAnalysis(type: AnalysisType, data: any, ticketHash: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheKey = `signalcx-${type}-global`;
      const cacheData: CachedAnalysis = {
        data,
        timestamp: Date.now(),
        ticketHash
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn(`Error caching global ${type} analysis:`, error);
    }
  }

  static invalidateAgentCache(agentName: string): void {
    if (typeof window === 'undefined') return;
    
    const types: AnalysisType[] = ['performance', 'burnout', 'knowledge', 'sla'];
    types.forEach(type => {
      const cacheKey = `signalcx-${type}-${agentName}`;
      localStorage.removeItem(cacheKey);
    });
  }

  static invalidateGlobalCache(): void {
    if (typeof window === 'undefined') return;
    
    const types: AnalysisType[] = ['performance', 'burnout', 'knowledge', 'sla'];
    types.forEach(type => {
      const cacheKey = `signalcx-${type}-global`;
      localStorage.removeItem(cacheKey);
    });
  }

  static clearAllAnalyticsCache(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('signalcx-')) {
        localStorage.removeItem(key);
      }
    });
  }

  static getCacheStats(): {
    totalCacheSize: number;
    cacheHitRatio: number;
    cacheEntries: Array<{
      key: string;
      size: number;
      age: number;
    }>;
  } {
    if (typeof window === 'undefined') {
      return { totalCacheSize: 0, cacheHitRatio: 0, cacheEntries: [] };
    }
    
    const cacheEntries: Array<{ key: string; size: number; age: number }> = [];
    let totalSize = 0;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('signalcx-')) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          
          try {
            const parsed = JSON.parse(value);
            const age = Date.now() - (parsed.timestamp || 0);
            cacheEntries.push({ key, size, age });
          } catch {
            cacheEntries.push({ key, size, age: 0 });
          }
        }
      }
    });
    
    return {
      totalCacheSize: totalSize,
      cacheHitRatio: 0, // This would need to be tracked separately
      cacheEntries: cacheEntries.sort((a, b) => b.size - a.size)
    };
  }
}