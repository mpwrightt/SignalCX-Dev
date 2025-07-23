/**
 * AI Flow Optimizer - Enterprise-grade AI flow optimization with multi-layer caching,
 * intelligent batching, model monitoring, and SLA compliance
 */

import { createHash } from 'crypto';

interface FlowConfig {
  timeout: number;
  retries: number;
  batchSize: number;
  maxBatchSize: number;
  minBatchSize: number;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
  slaMs: number;
  memoryLimitMB: number;
  modelName?: string;
  enableEnsemble?: boolean;
}

interface PerformanceMetrics {
  latency: number;
  throughput: number;
  memoryUsage: number;
  tokenCount: number;
  perplexity?: number;
  accuracy?: number;
  slaBreaches: number;
  cacheHitRate: number;
}

interface EmbeddingCache {
  embedding: number[];
  timestamp: number;
  ttl: number;
}

interface PromptCache {
  response: any;
  timestamp: number;
  ttl: number;
  perplexity: number;
  tokenCount: number;
}

interface FeatureCache {
  features: any;
  timestamp: number;
  ttl: number;
  extractionTime: number;
}

interface FlowResult<T = any> {
  data: T;
  cached: boolean;
  executionTime: number;
  confidence?: number;
  cacheType?: 'result' | 'embedding' | 'prompt' | 'feature';
  metrics?: PerformanceMetrics;
  modelUsed?: string;
  ensembleResults?: T[];
}

interface FlowExecution<T = any> {
  id: string;
  name: string;
  config: FlowConfig;
  executor: () => Promise<T>;
  resolve: (value: FlowResult<T>) => void;
  reject: (error: Error) => void;
  startTime: number;
  retryCount: number;
}

class AIFlowOptimizer {
  // Multi-layer caching system
  private resultCache = new Map<string, { data: any; timestamp: number; hash: string }>();
  private embeddingCache = new Map<string, EmbeddingCache>();
  private promptCache = new Map<string, PromptCache>();
  private featureCache = new Map<string, FeatureCache>();
  
  // Execution management
  private executionQueue: FlowExecution[] = [];
  private runningFlows = new Set<string>();
  private dependencyGraph = new Map<string, Set<string>>();
  
  // Performance tracking
  private metricsHistory: PerformanceMetrics[] = [];
  private perplexityHistory: number[] = [];
  private slaViolations: number = 0;
  private totalExecutions: number = 0;
  private cacheHits: number = 0;
  
  // Configuration
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly EMBEDDING_TTL = 60 * 60 * 1000; // 1 hour
  private readonly PROMPT_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly FEATURE_TTL = 45 * 60 * 1000; // 45 minutes
  private readonly MAX_CONCURRENT = 10; // Increased for better parallelism
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly PERPLEXITY_THRESHOLD = 5.0;
  private readonly SLA_BREACH_THRESHOLD = 0.05; // 5%
  private readonly FLOW_CONFIGS: Record<string, FlowConfig> = {
    performance: { 
      timeout: 0, retries: 2, batchSize: 8, maxBatchSize: 20, minBatchSize: 4,
      priority: 'high', slaMs: 0, memoryLimitMB: 256, modelName: 'gemini-2.0-flash'
    },
    burnout: { 
      timeout: 0, retries: 2, batchSize: 12, maxBatchSize: 30, minBatchSize: 6,
      priority: 'medium', slaMs: 0, memoryLimitMB: 128, enableEnsemble: true
    },
    knowledge: { 
      timeout: 0, retries: 2, batchSize: 12, maxBatchSize: 35, minBatchSize: 6,
      priority: 'medium', slaMs: 0, memoryLimitMB: 128
    },
    sla: { 
      timeout: 0, retries: 1, batchSize: 25, maxBatchSize: 60, minBatchSize: 12,
      priority: 'low', slaMs: 0, memoryLimitMB: 64
    },
    holistic: { 
      timeout: 0, retries: 2, batchSize: 2, maxBatchSize: 4, minBatchSize: 1,
      priority: 'high', slaMs: 0, memoryLimitMB: 512,
      enableEnsemble: false
    },
    'batch-analyze': {
      timeout: 0, retries: 2, batchSize: 1000, maxBatchSize: 2000, minBatchSize: 100,
      priority: 'high', slaMs: 0, memoryLimitMB: 256
    },
    'batch-risks': {
      timeout: 0, retries: 2, batchSize: 1000, maxBatchSize: 2000, minBatchSize: 100,
      priority: 'medium', slaMs: 0, memoryLimitMB: 192
    }
  };

  /**
   * Generate semantic cache key for flow execution
   */
  private generateCacheKey(flowName: string, input: any): string {
    const inputHash = createHash('md5').update(JSON.stringify(input)).digest('hex');
    return `flow-${flowName}-${inputHash}`;
  }

  /**
   * Generate semantic embedding cache key
   */
  private generateEmbeddingKey(content: string): string {
    const normalized = content.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
    return createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Generate prompt cache key with semantic similarity
   */
  private generatePromptKey(prompt: string): string {
    const semanticContent = prompt
      .replace(/\{\{.*?\}\}/g, '[VAR]') // Replace template variables
      .replace(/\s+/g, ' ')
      .trim();
    return createHash('md5').update(semanticContent).digest('hex');
  }

  /**
   * Generate data hash for cache validation
   */
  private generateDataHash(data: any): string {
    if (!data || typeof data !== 'object') return '';
    
    // Extract key properties for hashing
    const hashableData = {
      ticketCount: data.tickets?.length || data.scrubbedTickets?.length || 0,
      agentCount: data.agentMap?.size || 0,
      categories: data.categoryMap?.size || 0,
      timestamp: Math.floor(Date.now() / (60 * 1000)) // Round to minute for stability
    };
    
    return createHash('md5').update(JSON.stringify(hashableData)).digest('hex');
  }

  /**
   * Multi-layer cache validation with TTL and data integrity
   */
  private isCacheValid(cacheKey: string, currentDataHash: string, cacheType: 'result' | 'embedding' | 'prompt' | 'feature' = 'result'): boolean {
    let cached: any;
    let ttl: number;
    
    switch (cacheType) {
      case 'result':
        cached = this.resultCache.get(cacheKey);
        ttl = this.CACHE_TTL;
        break;
      case 'embedding':
        cached = this.embeddingCache.get(cacheKey);
        ttl = this.EMBEDDING_TTL;
        break;
      case 'prompt':
        cached = this.promptCache.get(cacheKey);
        ttl = this.PROMPT_TTL;
        break;
      case 'feature':
        cached = this.featureCache.get(cacheKey);
        ttl = this.FEATURE_TTL;
        break;
      default:
        return false;
    }
    
    if (!cached) return false;
    
    const isTimestampValid = Date.now() - cached.timestamp < ttl;
    const isDataValid = cacheType === 'result' ? cached.hash === currentDataHash : true;
    
    return isTimestampValid && isDataValid;
  }

  /**
   * Intelligent batch size optimization based on SLA and memory constraints
   */
  private optimizeBatchSize(flowName: string): number {
    const config = this.FLOW_CONFIGS[flowName] || this.FLOW_CONFIGS.performance;
    const recentMetrics = this.metricsHistory.slice(-20); // Last 20 executions
    
    if (recentMetrics.length < 5) return config.batchSize;
    
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const slaBreachRate = this.slaViolations / this.totalExecutions;
    
    let newSize = config.batchSize;
    
    // Increase batch size if performing well under SLA
    if (avgLatency < config.slaMs * 0.6 && 
        avgMemory < config.memoryLimitMB * 0.7 &&
        slaBreachRate < this.SLA_BREACH_THRESHOLD) {
      newSize = Math.min(config.maxBatchSize, config.batchSize + 5);
    }
    
    // Decrease batch size if approaching limits
    if (avgLatency > config.slaMs * 0.8 || 
        avgMemory > config.memoryLimitMB * 0.8 ||
        slaBreachRate > this.SLA_BREACH_THRESHOLD) {
      newSize = Math.max(config.minBatchSize, config.batchSize - 3);
    }
    
    // Update config with optimized batch size
    this.FLOW_CONFIGS[flowName] = { ...config, batchSize: newSize };
    
    console.log(`[AIFlowOptimizer] Optimized ${flowName} batch size: ${config.batchSize} -> ${newSize}`);
    return newSize;
  }

  /**
   * Get cached result from multi-layer cache system
   */
  private getCachedResult<T>(flowName: string, input: any): FlowResult<T> | null {
    const cacheKey = this.generateCacheKey(flowName, input);
    const dataHash = this.generateDataHash(input);
    
    // Check result cache first
    if (this.isCacheValid(cacheKey, dataHash, 'result')) {
      const cached = this.resultCache.get(cacheKey)!;
      this.cacheHits++;
      console.log(`[AIFlowOptimizer] Result cache hit for ${flowName}`);
      return {
        data: cached.data,
        cached: true,
        executionTime: 0,
        cacheType: 'result'
      };
    }
    
    return null;
  }

  /**
   * Get cached embedding
   */
  getEmbedding(content: string): number[] | null {
    const key = this.generateEmbeddingKey(content);
    
    if (this.isCacheValid(key, '', 'embedding')) {
      const cached = this.embeddingCache.get(key)!;
      this.cacheHits++;
      console.log(`[AIFlowOptimizer] Embedding cache hit`);
      return cached.embedding;
    }
    
    return null;
  }

  /**
   * Cache embedding with TTL
   */
  setEmbedding(content: string, embedding: number[]): void {
    const key = this.generateEmbeddingKey(content);
    this.embeddingCache.set(key, {
      embedding,
      timestamp: Date.now(),
      ttl: this.EMBEDDING_TTL
    });
    
    this.evictOldCache('embedding');
  }

  /**
   * Get cached prompt response with perplexity filtering
   */
  getPromptResponse(prompt: string): any | null {
    const key = this.generatePromptKey(prompt);
    
    if (this.isCacheValid(key, '', 'prompt')) {
      const cached = this.promptCache.get(key)!;
      
      // Only return if perplexity is acceptable
      if (cached.perplexity <= this.PERPLEXITY_THRESHOLD) {
        this.cacheHits++;
        console.log(`[AIFlowOptimizer] Prompt cache hit (perplexity: ${cached.perplexity})`);
        return cached.response;
      } else {
        // Remove high perplexity cached responses
        this.promptCache.delete(key);
      }
    }
    
    return null;
  }

  /**
   * Cache prompt response with perplexity tracking
   */
  setPromptResponse(prompt: string, response: any, perplexity: number = 0): void {
    const key = this.generatePromptKey(prompt);
    
    // Only cache low-perplexity responses
    if (perplexity <= this.PERPLEXITY_THRESHOLD) {
      this.promptCache.set(key, {
        response,
        timestamp: Date.now(),
        ttl: this.PROMPT_TTL,
        perplexity,
        tokenCount: this.estimateTokenCount(response)
      });
      
      this.perplexityHistory.push(perplexity);
      if (this.perplexityHistory.length > 100) {
        this.perplexityHistory = this.perplexityHistory.slice(-100);
      }
    }
    
    this.evictOldCache('prompt');
  }

  /**
   * Cache flow result with intelligent eviction
   */
  private setCachedResult(flowName: string, input: any, result: any): void {
    const cacheKey = this.generateCacheKey(flowName, input);
    const dataHash = this.generateDataHash(input);
    
    this.resultCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      hash: dataHash
    });
    
    this.evictOldCache('result');
  }

  /**
   * Intelligent cache eviction with LRU and TTL
   */
  private evictOldCache(cacheType: 'result' | 'embedding' | 'prompt' | 'feature'): void {
    let cache: Map<string, any>;
    let maxSize = this.MAX_CACHE_SIZE;
    
    switch (cacheType) {
      case 'result':
        cache = this.resultCache;
        break;
      case 'embedding':
        cache = this.embeddingCache;
        maxSize = this.MAX_CACHE_SIZE / 2; // Embeddings are large
        break;
      case 'prompt':
        cache = this.promptCache;
        break;
      case 'feature':
        cache = this.featureCache;
        break;
      default:
        return;
    }
    
    // Remove expired entries
    const now = Date.now();
    const entries = Array.from(cache.entries());
    for (const [key, value] of entries) {
      const ttl = cacheType === 'result' ? this.CACHE_TTL : 
                  cacheType === 'embedding' ? this.EMBEDDING_TTL :
                  cacheType === 'prompt' ? this.PROMPT_TTL : this.FEATURE_TTL;
                  
      if (now - value.timestamp > ttl) {
        cache.delete(key);
      }
    }
    
    // LRU eviction if still over limit
    if (cache.size > maxSize) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, cache.size - maxSize);
      toRemove.forEach(([key]) => cache.delete(key));
    }
  }

  /**
   * Execute flow with comprehensive monitoring and retry logic
   */
  private async executeFlowWithRetry<T>(execution: FlowExecution<T>): Promise<FlowResult<T>> {
    const { name, config, executor, retryCount } = execution;
    const startTime = Date.now();
    const memoryBefore = this.getMemoryUsage();
    
    try {
      // Optimize batch size based on historical performance
      const optimizedBatchSize = this.optimizeBatchSize(name);
      
      // Execute flow without timeout
      const result = await executor();
      const executionTime = Date.now() - startTime;
      const memoryAfter = this.getMemoryUsage();
      const memoryUsage = (memoryAfter - memoryBefore) / 1024 / 1024; // MB
      
      // Track SLA compliance
      const slaBreached = executionTime > config.slaMs;
      if (slaBreached) {
        this.slaViolations++;
      }
      this.totalExecutions++;
      
      // Record performance metrics
      const metrics: PerformanceMetrics = {
        latency: executionTime,
        throughput: optimizedBatchSize / (executionTime / 1000),
        memoryUsage,
        tokenCount: this.estimateTokenCount(result),
        perplexity: (result as any)?.perplexity || 0,
        accuracy: (result as any)?.accuracy || (result as any)?.confidenceScore || 0.8,
        slaBreaches: slaBreached ? 1 : 0,
        cacheHitRate: this.totalExecutions > 0 ? this.cacheHits / this.totalExecutions : 0
      };
      
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > 1000) {
        this.metricsHistory = this.metricsHistory.slice(-1000);
      }
      
      console.log(`[AIFlowOptimizer] ${name} completed: ${executionTime}ms, ${memoryUsage.toFixed(1)}MB, SLA: ${slaBreached ? 'BREACHED' : 'OK'}`);
      
      return {
        data: result,
        cached: false,
        executionTime,
        confidence: (result as any)?.confidenceScore || (result as any)?.confidence || 0.8,
        metrics,
        modelUsed: config.modelName || 'gemini-2.0-flash'
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.warn(`[AIFlowOptimizer] Flow ${name} failed (attempt ${retryCount + 1}) after ${executionTime}ms:`, error);
      
      // Track failed SLA
      if (executionTime > config.slaMs) {
        this.slaViolations++;
      }
      this.totalExecutions++;
      
      if (retryCount < config.retries) {
        execution.retryCount++;
        // Exponential backoff with jitter
        const backoffMs = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.executeFlowWithRetry(execution);
      }
      
      throw error;
    }
  }

  /**
   * Process execution queue with dependency management
   */
  private async processQueue(): Promise<void> {
    while (this.executionQueue.length > 0 && this.runningFlows.size < this.MAX_CONCURRENT) {
      // Find next executable flow (dependencies satisfied)
      const executableIndex = this.executionQueue.findIndex(execution => {
        const config = this.FLOW_CONFIGS[execution.name];
        if (!config.dependencies) return true;
        
        return config.dependencies.every(dep => !this.runningFlows.has(dep));
      });
      
      if (executableIndex === -1) break; // No executable flows
      
      const execution = this.executionQueue.splice(executableIndex, 1)[0];
      this.runningFlows.add(execution.name);
      
      // Execute flow
      this.executeFlowWithRetry(execution)
        .then(result => {
          execution.resolve(result);
        })
        .catch(error => {
          execution.reject(error);
        })
        .finally(() => {
          this.runningFlows.delete(execution.name);
          this.processQueue(); // Process next in queue
        });
    }
  }

  /**
   * Execute single flow with optimization
   */
  async executeFlow<T>(
    name: string, 
    input: any, 
    executor: () => Promise<T>
  ): Promise<FlowResult<T>> {
    // Check cache first
    const cached = this.getCachedResult<T>(name, input);
    if (cached) return cached;
    
    const config = this.FLOW_CONFIGS[name] || this.FLOW_CONFIGS.performance;
    
    return new Promise<FlowResult<T>>((resolve, reject) => {
      const execution: FlowExecution<T> = {
        id: `${name}-${Date.now()}`,
        name,
        config,
        executor: async () => {
          const result = await executor();
          // Cache successful results
          this.setCachedResult(name, input, result);
          return result;
        },
        resolve,
        reject,
        startTime: Date.now(),
        retryCount: 0
      };
      
      this.executionQueue.push(execution);
      this.processQueue();
    });
  }

  /**
   * Execute multiple flows in parallel with intelligent scheduling
   */
  async executeFlowsBatch<T extends Record<string, any>>(
    flows: Record<keyof T, { input: any; executor: () => Promise<any> }>
  ): Promise<Record<keyof T, FlowResult<any>>> {
    const flowNames = Object.keys(flows) as (keyof T)[];
    
    // Sort flows by priority and dependencies
    const sortedFlows = flowNames.sort((a, b) => {
      const configA = this.FLOW_CONFIGS[String(a)] || this.FLOW_CONFIGS.performance;
      const configB = this.FLOW_CONFIGS[String(b)] || this.FLOW_CONFIGS.performance;
      
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[configB.priority] - priorityWeight[configA.priority];
    });
    
    // Execute flows with intelligent batching
    const results: Record<keyof T, FlowResult<any>> = {} as any;
    const promises = sortedFlows.map(async (flowName) => {
      const flow = flows[flowName];
      const result = await this.executeFlow(String(flowName), flow.input, flow.executor);
      results[flowName] = result;
      return { flowName, result };
    });
    
    // Wait for all flows to complete
    const completed = await Promise.allSettled(promises);
    
    // Handle failed flows with fallbacks
    completed.forEach((result, index) => {
      const flowName = sortedFlows[index];
      if (result.status === 'rejected') {
        console.error(`[AIFlowOptimizer] Flow ${String(flowName)} failed:`, result.reason);
        results[flowName] = {
          data: this.getEmptyFallback(String(flowName)),
          cached: false,
          executionTime: 0,
          confidence: 0
        };
      }
    });
    
    return results;
  }

  /**
   * Get empty fallback data for failed flows
   */
  private getEmptyFallback(flowName: string): any {
    switch (flowName) {
      case 'performance':
        return { forecasts: [] };
      case 'burnout':
        return { burnoutIndicators: [] };
      case 'knowledge':
        return { knowledgeGaps: [] };
      case 'sla':
        return { probability: 0, atRiskTickets: 0, recommendedActions: [] };
      case 'holistic':
        return { 
          forecast: [], 
          overallAnalysis: 'Analysis unavailable', 
          categoryTrends: [], 
          emergingIssues: [], 
          recommendations: [],
          confidenceScore: 0
        };
      default:
        return {};
    }
  }

  /**
   * Model drift detection and monitoring
   */
  detectModelDrift(): { isDrifting: boolean; severity: 'low' | 'medium' | 'high'; metrics: any } {
    if (this.perplexityHistory.length < 20) {
      return { isDrifting: false, severity: 'low', metrics: {} };
    }

    const recent = this.perplexityHistory.slice(-10);
    const baseline = this.perplexityHistory.slice(-30, -10);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const baselineAvg = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    
    const degradation = (recentAvg - baselineAvg) / baselineAvg;
    const variance = this.calculateVariance(recent);
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    let isDrifting = false;
    
    if (degradation > 0.3 || variance > 2.0) {
      severity = 'high';
      isDrifting = true;
    } else if (degradation > 0.15 || variance > 1.0) {
      severity = 'medium';  
      isDrifting = true;
    } else if (degradation > 0.05 || variance > 0.5) {
      severity = 'low';
      isDrifting = true;
    }
    
    return {
      isDrifting,
      severity,
      metrics: {
        degradation: degradation * 100,
        variance,
        recentAvgPerplexity: recentAvg,
        baselineAvgPerplexity: baselineAvg
      }
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get comprehensive performance dashboard
   */
  getPerformanceDashboard(): {
    slaCompliance: number;
    avgLatency: number;
    avgThroughput: number;
    avgMemoryUsage: number;
    cacheHitRate: number;
    totalExecutions: number;
    driftStatus: { isDrifting: boolean; severity: 'low' | 'medium' | 'high' };
    topBottlenecks: string[];
    recommendations: string[];
  } {
    const recentMetrics = this.metricsHistory.slice(-50);
    
    if (recentMetrics.length === 0) {
      return {
        slaCompliance: 1.0,
        avgLatency: 0,
        avgThroughput: 0,
        avgMemoryUsage: 0,
        cacheHitRate: 0,
        totalExecutions: 0,
        driftStatus: { isDrifting: false, severity: 'low' },
        topBottlenecks: [],
        recommendations: []
      };
    }

    const slaCompliance = 1 - (this.slaViolations / this.totalExecutions);
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
    const avgThroughput = recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const cacheHitRate = this.totalExecutions > 0 ? this.cacheHits / this.totalExecutions : 0;

    // Identify bottlenecks
    const topBottlenecks = this.identifyBottlenecks(recentMetrics);
    const recommendations = this.generateRecommendations(recentMetrics, slaCompliance);

    return {
      slaCompliance,
      avgLatency,
      avgThroughput,
      avgMemoryUsage,
      cacheHitRate,
      totalExecutions: this.totalExecutions,
      driftStatus: this.detectModelDrift(),
      topBottlenecks,
      recommendations
    };
  }

  private identifyBottlenecks(metrics: PerformanceMetrics[]): string[] {
    const bottlenecks: string[] = [];
    
    const avgLatency = metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    
    if (avgLatency > 15000) bottlenecks.push('High latency (>15s average)');
    if (avgMemory > 200) bottlenecks.push('High memory usage (>200MB average)');
    if (this.cacheHits / this.totalExecutions < 0.3) bottlenecks.push('Low cache hit rate (<30%)');
    if (this.slaViolations / this.totalExecutions > 0.1) bottlenecks.push('High SLA breach rate (>10%)');
    
    return bottlenecks;
  }

  private generateRecommendations(metrics: PerformanceMetrics[], slaCompliance: number): string[] {
    const recommendations: string[] = [];
    
    if (slaCompliance < 0.95) {
      recommendations.push('Consider increasing batch sizes or reducing model complexity');
    }
    
    if (this.cacheHits / this.totalExecutions < 0.5) {
      recommendations.push('Optimize caching strategy or increase cache TTL');
    }
    
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    if (avgMemory > 300) {
      recommendations.push('Implement memory optimization or reduce batch sizes');
    }
    
    const driftStatus = this.detectModelDrift();
    if (driftStatus.isDrifting && driftStatus.severity === 'high') {
      recommendations.push('Model performance degrading - consider retraining or prompt optimization');
    }
    
    return recommendations;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.resultCache.clear();
    this.embeddingCache.clear();
    this.promptCache.clear();
    this.featureCache.clear();
    console.log('[AIFlowOptimizer] All caches cleared');
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats(): { 
    result: number; 
    embedding: number; 
    prompt: number; 
    feature: number; 
    totalHitRate: number;
    totalSize: number;
  } {
    return {
      result: this.resultCache.size,
      embedding: this.embeddingCache.size,
      prompt: this.promptCache.size,
      feature: this.featureCache.size,
      totalHitRate: this.totalExecutions > 0 ? this.cacheHits / this.totalExecutions : 0,
      totalSize: this.resultCache.size + this.embeddingCache.size + this.promptCache.size + this.featureCache.size
    };
  }

  /**
   * Preload flows with given data
   */
  async preloadFlows(flows: string[], input: any): Promise<void> {
    const preloadPromises = flows.map(async (flowName) => {
      const cached = this.getCachedResult(flowName, input);
      if (!cached) {
        console.log(`[AIFlowOptimizer] Preloading ${flowName}...`);
        // Could trigger background preloading here
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get memory usage - works in both browser and Node.js environments
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      // Node.js environment
      return process.memoryUsage().heapUsed;
    } else if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      // Browser environment with performance.memory API
      return (window as any).performance.memory.usedJSHeapSize;
    } else {
      // Fallback - estimate based on cached data size
      const cacheSize = this.resultCache.size + this.embeddingCache.size + 
                       this.promptCache.size + this.featureCache.size;
      return cacheSize * 1024; // Rough estimate: 1KB per cache entry
    }
  }

  /**
   * Estimate token count for cost and performance tracking
   */
  private estimateTokenCount(data: any): number {
    if (!data) return 0;
    
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      // Rough estimation: 4 characters per token on average
      return Math.ceil(text.length / 4);
    } catch {
      return 0;
    }
  }

  /**
   * Generate ensemble results for critical flows
   */
  async executeEnsemble<T>(
    flowName: string,
    input: any,
    executors: Array<() => Promise<T>>,
    aggregationStrategy: 'consensus' | 'weighted' | 'best' = 'consensus'
  ): Promise<FlowResult<T>> {
    const config = this.FLOW_CONFIGS[flowName];
    if (!config?.enableEnsemble || executors.length < 2) {
      // Fall back to single execution
      return this.executeFlow(flowName, input, executors[0]);
    }

    console.log(`[AIFlowOptimizer] Executing ensemble for ${flowName} with ${executors.length} models`);

    const results = await Promise.allSettled(
      executors.map(executor => this.executeFlow(`${flowName}-ensemble`, input, executor))
    );

    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<FlowResult<T>> => r.status === 'fulfilled')
      .map(r => r.value);

    if (successfulResults.length === 0) {
      throw new Error(`All ensemble models failed for ${flowName}`);
    }

    // Aggregate results based on strategy
    const aggregatedResult = this.aggregateEnsembleResults(successfulResults, aggregationStrategy);
    
    return {
      data: aggregatedResult,
      cached: false,
      executionTime: Math.max(...successfulResults.map(r => r.executionTime)),
      confidence: this.calculateEnsembleConfidence(successfulResults),
      ensembleResults: successfulResults.map(r => r.data)
    };
  }

  private aggregateEnsembleResults<T>(results: FlowResult<T>[], strategy: 'consensus' | 'weighted' | 'best'): T {
    switch (strategy) {
      case 'best':
        // Return result with highest confidence
        return results.reduce((best, current) => 
          (current.confidence || 0) > (best.confidence || 0) ? current : best
        ).data;
        
      case 'weighted':
        // Simple weighted average based on confidence (for numerical results)
        // For complex objects, fall back to best
        return this.weightedAverage(results) || results[0].data;
        
      case 'consensus':
      default:
        // Return most common result or highest confidence if no consensus
        return this.findConsensus(results) || results[0].data;
    }
  }

  private calculateEnsembleConfidence<T>(results: FlowResult<T>[]): number {
    const confidences = results.map(r => r.confidence || 0);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const consensusBonus = this.calculateConsensusBonus(results);
    
    return Math.min(1, avgConfidence + consensusBonus);
  }

  private calculateConsensusBonus<T>(results: FlowResult<T>[]): number {
    // Simple consensus check - in production would use more sophisticated similarity
    const firstResult = JSON.stringify(results[0].data);
    const consensusCount = results.filter(r => JSON.stringify(r.data) === firstResult).length;
    
    return (consensusCount / results.length) * 0.1; // Up to 10% bonus for consensus
  }

  private findConsensus<T>(results: FlowResult<T>[]): T | null {
    // Group identical results
    const groups = new Map<string, { data: T; count: number }>();
    
    for (const result of results) {
      const key = JSON.stringify(result.data);
      if (groups.has(key)) {
        groups.get(key)!.count++;
      } else {
        groups.set(key, { data: result.data, count: 1 });
      }
    }
    
    // Find majority consensus
    const majority = Math.ceil(results.length / 2);
    const groupValues = Array.from(groups.values());
    for (const group of groupValues) {
      if (group.count >= majority) {
        return group.data;
      }
    }
    
    return null;
  }

  private weightedAverage<T>(results: FlowResult<T>[]): T | null {
    // Only works for numerical data - placeholder implementation
    return null;
  }
}

// Export singleton instance
export const aiFlowOptimizer = new AIFlowOptimizer();
export type { FlowResult };