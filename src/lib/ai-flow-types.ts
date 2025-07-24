/**
 * AI Flow Optimizer Types and Interfaces
 */

export interface FlowConfig {
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

export interface PerformanceMetrics {
  latency: number;
  throughput: number;
  memoryUsage: number;
  tokenCount: number;
  perplexity?: number;
  accuracy?: number;
  slaBreaches: number;
  cacheHitRate: number;
}

export interface EmbeddingCache {
  embedding: number[];
  timestamp: number;
  ttl: number;
}

export interface PromptCache {
  response: any;
  timestamp: number;
  ttl: number;
  perplexity: number;
  tokenCount: number;
}

export interface FeatureCache {
  features: any;
  timestamp: number;
  ttl: number;
  extractionTime: number;
}

export interface FlowResult<T = any> {
  data: T;
  cached: boolean;
  executionTime: number;
  confidence?: number;
  cacheType?: 'result' | 'embedding' | 'prompt' | 'feature';
  metrics?: PerformanceMetrics;
  modelUsed?: string;
  ensembleResults?: T[];
}

export interface FlowExecution<T = any> {
  id: string;
  name: string;
  config: FlowConfig;
  executor: () => Promise<T>;
  resolve: (value: FlowResult<T>) => void;
  reject: (error: Error) => void;
  startTime: number;
  retryCount: number;
}

export interface CacheStats {
  result: number;
  embedding: number;
  prompt: number;
  feature: number;
  totalHitRate: number;
  totalSize: number;
}

export interface PerformanceDashboard {
  slaCompliance: number;
  avgLatency: number;
  avgThroughput: number;
  avgMemoryUsage: number;
  cacheHitRate: number;
  totalExecutions: number;
  driftStatus: { isDrifting: boolean; severity: 'low' | 'medium' | 'high' };
  topBottlenecks: string[];
  recommendations: string[];
}

export interface ModelDriftResult {
  isDrifting: boolean;
  severity: 'low' | 'medium' | 'high';
  metrics: any;
}

export type EnsembleStrategy = 'consensus' | 'weighted' | 'best'; 