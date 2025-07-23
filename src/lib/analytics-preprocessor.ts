import { scrubPii } from './pii-scrubber';
import { aiFlowOptimizer } from './ai-flow-optimizer';
import type { Ticket } from './types';

export interface ProcessedAnalyticsData {
  scrubbedTickets: Ticket[];
  agentMap: Map<string, Ticket[]>;
  ticketsByCategory: Map<string, Ticket[]>;
  priorityMap: Map<string, Ticket[]>;
  sentimentMap: Map<string, Ticket[]>;
  recentTickets: Ticket[];
  ticketStats: {
    totalTickets: number;
    totalAgents: number;
    avgTicketsPerAgent: number;
    recentTicketCount: number;
    avgResolutionTime: number;
    categoryCounts: Record<string, number>;
    priorityCounts: Record<string, number>;
    sentimentCounts: Record<string, number>;
  };
  timeRanges: {
    oldestTicket: string;
    newestTicket: string;
    dateRange: number; // days
  };
  sampledData: {
    representativeSample: Ticket[];
    sampleSize: number;
    samplingStrategy: string;
  };
}

export class AnalyticsPreprocessor {
  private static readonly RECENT_TICKET_LIMIT = 100;
  private static readonly CACHE_KEY = 'signalcx-preprocessed-data';
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  static preprocess(tickets: Ticket[]): ProcessedAnalyticsData {
    // Check AI Flow Optimizer cache first for better performance
    const cacheKey = `preprocess-${tickets.length}-${this.hashTickets(tickets)}`;
    const optimizerCached = aiFlowOptimizer.getPromptResponse(cacheKey);
    if (optimizerCached) {
      console.log('[AnalyticsPreprocessor] AI Flow Optimizer cache hit');
      return optimizerCached;
    }

    // Check local cache second
    const cached = this.getCachedPreprocessedData(tickets);
    if (cached) {
      // Also cache in AI Flow Optimizer for cross-session benefits
      aiFlowOptimizer.setPromptResponse(cacheKey, cached, 1.0); // Low perplexity for exact data
      return cached;
    }

    // Single pass through data to minimize iterations
    const agentMap = new Map<string, Ticket[]>();
    const categoryMap = new Map<string, Ticket[]>();
    const priorityMap = new Map<string, Ticket[]>();
    const sentimentMap = new Map<string, Ticket[]>();
    
    // Statistics accumulators
    let totalResolutionTime = 0;
    let resolvedTicketCount = 0;
    const categoryCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    const sentimentCounts: Record<string, number> = {};
    
    // Track date ranges
    let oldestDate = Date.now();
    let newestDate = 0;
    
    // Pre-scrub and process all tickets in one pass
    const scrubbedTickets = tickets.map(ticket => {
      const scrubbed = {
        ...ticket,
        subject: scrubPii(ticket.subject),
        assignee: ticket.assignee ? scrubPii(ticket.assignee) : undefined,
        description: scrubPii(ticket.description || ''),
      };

      // Track date ranges
      const createdTime = new Date(scrubbed.created_at).getTime();
      oldestDate = Math.min(oldestDate, createdTime);
      newestDate = Math.max(newestDate, createdTime);

      // Calculate resolution time if solved
      if (scrubbed.solved_at) {
        const solvedTime = new Date(scrubbed.solved_at).getTime();
        totalResolutionTime += (solvedTime - createdTime) / (1000 * 60 * 60); // hours
        resolvedTicketCount++;
      }

      // Group by agent
      if (scrubbed.assignee) {
        if (!agentMap.has(scrubbed.assignee)) {
          agentMap.set(scrubbed.assignee, []);
        }
        agentMap.get(scrubbed.assignee)!.push(scrubbed);
      }

      // Group by category
      if (scrubbed.category) {
        if (!categoryMap.has(scrubbed.category)) {
          categoryMap.set(scrubbed.category, []);
        }
        categoryMap.get(scrubbed.category)!.push(scrubbed);
        categoryCounts[scrubbed.category] = (categoryCounts[scrubbed.category] || 0) + 1;
      }

      // Group by priority
      if (scrubbed.priority) {
        if (!priorityMap.has(scrubbed.priority)) {
          priorityMap.set(scrubbed.priority, []);
        }
        priorityMap.get(scrubbed.priority)!.push(scrubbed);
        priorityCounts[scrubbed.priority] = (priorityCounts[scrubbed.priority] || 0) + 1;
      }

      // Group by sentiment
      const sentiment = (scrubbed as any).sentiment || 'Neutral';
      if (!sentimentMap.has(sentiment)) {
        sentimentMap.set(sentiment, []);
      }
      sentimentMap.get(sentiment)!.push(scrubbed);
      sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;

      return scrubbed;
    });

    // Sort by date and take recent tickets
    const sortedTickets = [...scrubbedTickets].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const recentTickets = sortedTickets.slice(0, this.RECENT_TICKET_LIMIT);

    // Create intelligent sample for AI processing
    const sampledData = this.createIntelligentSample(scrubbedTickets, agentMap, categoryMap);

    // Calculate comprehensive stats
    const dateRange = Math.max(1, (newestDate - oldestDate) / (1000 * 60 * 60 * 24)); // days
    const ticketStats = {
      totalTickets: scrubbedTickets.length,
      totalAgents: agentMap.size,
      avgTicketsPerAgent: agentMap.size > 0 ? scrubbedTickets.length / agentMap.size : 0,
      recentTicketCount: recentTickets.length,
      avgResolutionTime: resolvedTicketCount > 0 ? totalResolutionTime / resolvedTicketCount : 0,
      categoryCounts,
      priorityCounts,
      sentimentCounts,
    };

    const timeRanges = {
      oldestTicket: new Date(oldestDate).toISOString(),
      newestTicket: new Date(newestDate).toISOString(),
      dateRange,
    };

    const result: ProcessedAnalyticsData = {
      scrubbedTickets,
      agentMap,
      ticketsByCategory: categoryMap,
      priorityMap,
      sentimentMap,
      recentTickets,
      ticketStats,
      timeRanges,
      sampledData,
    };

    // Cache the result in both local storage and AI Flow Optimizer
    this.setCachedPreprocessedData(tickets, result);
    aiFlowOptimizer.setPromptResponse(cacheKey, result, 1.0); // Low perplexity for exact data

    return result;
  }

  /**
   * Create an intelligent sample for AI processing
   * Uses stratified sampling to ensure representative data
   */
  private static createIntelligentSample(
    tickets: Ticket[], 
    agentMap: Map<string, Ticket[]>, 
    categoryMap: Map<string, Ticket[]>
  ): { representativeSample: Ticket[]; sampleSize: number; samplingStrategy: string } {
    const totalTickets = tickets.length;
    
    // Dynamic sample size based on total tickets
    let targetSampleSize: number;
    let strategy: string;
    
    if (totalTickets <= 200) {
      // Use all tickets for small datasets
      targetSampleSize = totalTickets;
      strategy = 'full_dataset';
    } else if (totalTickets <= 1000) {
      // Use 80% for medium datasets
      targetSampleSize = Math.floor(totalTickets * 0.8);
      strategy = 'high_coverage_sample';
    } else {
      // Use more generous sampling for large datasets - let AI flows handle internal chunking
      targetSampleSize = Math.min(2000, Math.max(1000, Math.floor(totalTickets * 0.8)));
      strategy = 'stratified_sample';
    }
    
    if (strategy === 'full_dataset') {
      return {
        representativeSample: tickets,
        sampleSize: totalTickets,
        samplingStrategy: strategy
      };
    }
    
    // Stratified sampling by category and agent
    const sample: Ticket[] = [];
    const categories = Array.from(categoryMap.keys());
    const agents = Array.from(agentMap.keys());
    
    // Ensure representation from each category
    const ticketsPerCategory = Math.floor(targetSampleSize / Math.max(categories.length, 1));
    categories.forEach(category => {
      const categoryTickets = categoryMap.get(category) || [];
      const sampleCount = Math.min(ticketsPerCategory, categoryTickets.length);
      
      // Take mix of recent and older tickets
      const sorted = categoryTickets.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // 70% recent, 30% older for temporal diversity
      const recentCount = Math.floor(sampleCount * 0.7);
      const olderCount = sampleCount - recentCount;
      
      sample.push(...sorted.slice(0, recentCount));
      if (olderCount > 0 && sorted.length > recentCount) {
        const olderTickets = sorted.slice(Math.floor(sorted.length * 0.5));
        sample.push(...olderTickets.slice(0, olderCount));
      }
    });
    
    // Fill remaining slots with random tickets
    const remaining = targetSampleSize - sample.length;
    if (remaining > 0) {
      const usedIds = new Set(sample.map(t => t.id));
      const unusedTickets = tickets.filter(t => !usedIds.has(t.id));
      
      // Shuffle and take remaining
      const shuffled = unusedTickets.sort(() => Math.random() - 0.5);
      sample.push(...shuffled.slice(0, remaining));
    }
    
    return {
      representativeSample: sample.slice(0, targetSampleSize),
      sampleSize: Math.min(sample.length, targetSampleSize),
      samplingStrategy: strategy
    };
  }

  static getAgentTickets(preprocessedData: ProcessedAnalyticsData, agentName: string): Ticket[] {
    return preprocessedData.agentMap.get(agentName) || [];
  }

  static getRecentAgentTickets(preprocessedData: ProcessedAnalyticsData, agentName: string, limit: number = 20): Ticket[] {
    const agentTickets = this.getAgentTickets(preprocessedData, agentName);
    return agentTickets
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  static getCategoryTickets(preprocessedData: ProcessedAnalyticsData, category: string): Ticket[] {
    return preprocessedData.ticketsByCategory.get(category) || [];
  }

  private static getCachedPreprocessedData(tickets: Ticket[]): ProcessedAnalyticsData | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp, ticketHash } = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp > this.CACHE_TTL_MS) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      // Check if ticket data has changed
      const currentHash = this.hashTickets(tickets);
      if (currentHash !== ticketHash) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      // Reconstruct Maps from cached data
      const agentMap = new Map<string, Ticket[]>(data.agentMapEntries);
      const ticketsByCategory = new Map<string, Ticket[]>(data.categoryMapEntries);
      const priorityMap = new Map<string, Ticket[]>(data.priorityMapEntries || []);
      const sentimentMap = new Map<string, Ticket[]>(data.sentimentMapEntries || []);

      return {
        scrubbedTickets: data.scrubbedTickets,
        agentMap,
        ticketsByCategory,
        priorityMap,
        sentimentMap,
        recentTickets: data.recentTickets,
        ticketStats: data.ticketStats,
        timeRanges: data.timeRanges || { oldestTicket: '', newestTicket: '', dateRange: 0 },
        sampledData: data.sampledData || { representativeSample: [], sampleSize: 0, samplingStrategy: 'none' },
      };
    } catch (error) {
      console.warn('Error reading preprocessed data cache:', error);
      return null;
    }
  }

  private static setCachedPreprocessedData(tickets: Ticket[], data: ProcessedAnalyticsData): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    
    try {
      const cacheData = {
        data: {
          scrubbedTickets: data.scrubbedTickets,
          agentMapEntries: Array.from(data.agentMap.entries()),
          categoryMapEntries: Array.from(data.ticketsByCategory.entries()),
          priorityMapEntries: Array.from(data.priorityMap.entries()),
          sentimentMapEntries: Array.from(data.sentimentMap.entries()),
          recentTickets: data.recentTickets,
          ticketStats: data.ticketStats,
          timeRanges: data.timeRanges,
          sampledData: data.sampledData,
        },
        timestamp: Date.now(),
        ticketHash: this.hashTickets(tickets),
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error caching preprocessed data:', error);
    }
  }

  private static hashTickets(tickets: Ticket[]): string {
    // Simple hash based on ticket count, IDs, and created times
    const key = `${tickets.length}-${tickets.map(t => `${t.id}-${t.created_at}`).join(',')}`;
    
    // Use browser-safe base64 encoding
    if (typeof btoa !== 'undefined') {
      return btoa(key).slice(0, 32);
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(key).toString('base64').slice(0, 32);
    } else {
      // Fallback: simple hash
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
    }
  }

  static clearCache(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
    }
  }
}