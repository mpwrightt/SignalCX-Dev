/**
 * AI Flow Optimizer Cache Management
 */

import { createHash } from 'crypto';
import type { 
  EmbeddingCache, 
  PromptCache, 
  FeatureCache, 
  FlowResult 
} from './ai-flow-types';

export class AIFlowCache {
  // Multi-layer caching system
  private resultCache = new Map<string, { data: any; timestamp: number; hash: string }>();
  private embeddingCache = new Map<string, EmbeddingCache>();
  private promptCache = new Map<string, PromptCache>();
  private featureCache = new Map<string, FeatureCache>();
  
  // Performance tracking
  private cacheHits: number = 0;
  private totalRequests: number = 0;
  
  // Configuration
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly EMBEDDING_TTL = 60 * 60 * 1000; // 1 hour
  private readonly PROMPT_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly FEATURE_TTL = 45 * 60 * 1000; // 45 minutes
  private readonly MAX_CACHE_SIZE = 1000; // Maximum cache entries per type

  generateCacheKey(flowName: string, input: any): string {
    const inputStr = JSON.stringify(input);
    return createHash('sha256').update(`${flowName}:${inputStr}`).digest('hex');
  }

  generateEmbeddingKey(content: string): string {
    return createHash('sha256').update(`embedding:${content}`).digest('hex');
  }

  generatePromptKey(prompt: string): string {
    return createHash('sha256').update(`prompt:${prompt}`).digest('hex');
  }

  generateDataHash(data: any): string {
    const dataStr = JSON.stringify(data);
    return createHash('sha256').update(dataStr).digest('hex');
  }

  isCacheValid(cacheKey: string, currentDataHash: string, cacheType: 'result' | 'embedding' | 'prompt' | 'feature' = 'result'): boolean {
    const now = Date.now();
    
    switch (cacheType) {
      case 'result':
        const resultEntry = this.resultCache.get(cacheKey);
        if (!resultEntry) return false;
        return now - resultEntry.timestamp < this.CACHE_TTL && resultEntry.hash === currentDataHash;
        
      case 'embedding':
        const embeddingEntry = this.embeddingCache.get(cacheKey);
        if (!embeddingEntry) return false;
        return now - embeddingEntry.timestamp < this.EMBEDDING_TTL;
        
      case 'prompt':
        const promptEntry = this.promptCache.get(cacheKey);
        if (!promptEntry) return false;
        return now - promptEntry.timestamp < this.PROMPT_TTL;
        
      case 'feature':
        const featureEntry = this.featureCache.get(cacheKey);
        if (!featureEntry) return false;
        return now - featureEntry.timestamp < this.FEATURE_TTL;
        
      default:
        return false;
    }
  }

  getCachedResult<T>(flowName: string, input: any): FlowResult<T> | null {
    this.totalRequests++;
    const cacheKey = this.generateCacheKey(flowName, input);
    const currentHash = this.generateDataHash(input);
    
    if (this.isCacheValid(cacheKey, currentHash, 'result')) {
      this.cacheHits++;
      const entry = this.resultCache.get(cacheKey)!;
      return {
        data: entry.data,
        cached: true,
        executionTime: 0,
        cacheType: 'result'
      };
    }
    
    return null;
  }

  getEmbedding(content: string): number[] | null {
    this.totalRequests++;
    const cacheKey = this.generateEmbeddingKey(content);
    
    if (this.isCacheValid(cacheKey, '', 'embedding')) {
      this.cacheHits++;
      return this.embeddingCache.get(cacheKey)!.embedding;
    }
    
    return null;
  }

  setEmbedding(content: string, embedding: number[]): void {
    const cacheKey = this.generateEmbeddingKey(content);
    this.embeddingCache.set(cacheKey, {
      embedding,
      timestamp: Date.now(),
      ttl: this.EMBEDDING_TTL
    });
    
    this.evictOldCache('embedding');
  }

  getPromptResponse(prompt: string): any | null {
    this.totalRequests++;
    const cacheKey = this.generatePromptKey(prompt);
    
    if (this.isCacheValid(cacheKey, '', 'prompt')) {
      this.cacheHits++;
      return this.promptCache.get(cacheKey)!.response;
    }
    
    return null;
  }

  setPromptResponse(prompt: string, response: any, perplexity: number = 0, tokenCount: number = 0): void {
    const cacheKey = this.generatePromptKey(prompt);
    this.promptCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      ttl: this.PROMPT_TTL,
      perplexity,
      tokenCount
    });
    
    this.evictOldCache('prompt');
  }

  setCachedResult(flowName: string, input: any, result: any): void {
    const cacheKey = this.generateCacheKey(flowName, input);
    const hash = this.generateDataHash(input);
    
    this.resultCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      hash
    });
    
    this.evictOldCache('result');
  }

  private evictOldCache(cacheType: 'result' | 'embedding' | 'prompt' | 'feature'): void {
    const now = Date.now();
    let cache: Map<string, any>;
    let ttl: number;
    
    switch (cacheType) {
      case 'result':
        cache = this.resultCache;
        ttl = this.CACHE_TTL;
        break;
      case 'embedding':
        cache = this.embeddingCache;
        ttl = this.EMBEDDING_TTL;
        break;
      case 'prompt':
        cache = this.promptCache;
        ttl = this.PROMPT_TTL;
        break;
      case 'feature':
        cache = this.featureCache;
        ttl = this.FEATURE_TTL;
        break;
      default:
        return;
    }
    
    // Remove expired entries
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.delete(key);
      }
    }
    
    // If still too large, remove oldest entries
    if (cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, cache.size - this.MAX_CACHE_SIZE);
      for (const [key] of toRemove) {
        cache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.resultCache.clear();
    this.embeddingCache.clear();
    this.promptCache.clear();
    this.featureCache.clear();
    this.cacheHits = 0;
    this.totalRequests = 0;
  }

  getCacheStats(): { 
    result: number; 
    embedding: number; 
    prompt: number; 
    feature: number; 
    totalHitRate: number;
    totalSize: number;
  } {
    const totalSize = this.resultCache.size + this.embeddingCache.size + 
                     this.promptCache.size + this.featureCache.size;
    
    return {
      result: this.resultCache.size,
      embedding: this.embeddingCache.size,
      prompt: this.promptCache.size,
      feature: this.featureCache.size,
      totalHitRate: this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0,
      totalSize
    };
  }
} 