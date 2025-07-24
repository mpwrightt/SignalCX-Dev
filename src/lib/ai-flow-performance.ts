/**
 * AI Flow Optimizer Performance Monitoring
 */

import type { 
  PerformanceMetrics, 
  PerformanceDashboard, 
  ModelDriftResult 
} from './ai-flow-types';

export class AIFlowPerformance {
  // Performance tracking
  private metricsHistory: PerformanceMetrics[] = [];
  private perplexityHistory: number[] = [];
  private slaViolations: number = 0;
  private totalExecutions: number = 0;
  
  // Configuration
  private readonly PERPLEXITY_THRESHOLD = 5.0;
  private readonly SLA_BREACH_THRESHOLD = 0.05; // 5%
  private readonly MAX_HISTORY_SIZE = 1000;

  recordExecution(metrics: PerformanceMetrics): void {
    this.metricsHistory.push(metrics);
    this.totalExecutions++;
    
    if (metrics.perplexity) {
      this.perplexityHistory.push(metrics.perplexity);
    }
    
    if (metrics.slaBreaches > 0) {
      this.slaViolations++;
    }
    
    // Keep history size manageable
    if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
      this.metricsHistory = this.metricsHistory.slice(-this.MAX_HISTORY_SIZE);
    }
    
    if (this.perplexityHistory.length > this.MAX_HISTORY_SIZE) {
      this.perplexityHistory = this.perplexityHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }

  detectModelDrift(): ModelDriftResult {
    if (this.perplexityHistory.length < 10) {
      return {
        isDrifting: false,
        severity: 'low',
        metrics: { recentPerplexity: 0, avgPerplexity: 0 }
      };
    }
    
    const recentPerplexity = this.perplexityHistory.slice(-10);
    const avgPerplexity = recentPerplexity.reduce((a, b) => a + b, 0) / recentPerplexity.length;
    const variance = this.calculateVariance(recentPerplexity);
    
    let isDrifting = false;
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    if (avgPerplexity > this.PERPLEXITY_THRESHOLD) {
      isDrifting = true;
      severity = avgPerplexity > this.PERPLEXITY_THRESHOLD * 2 ? 'high' : 'medium';
    }
    
    return {
      isDrifting,
      severity,
      metrics: {
        recentPerplexity: avgPerplexity,
        avgPerplexity: this.perplexityHistory.reduce((a, b) => a + b, 0) / this.perplexityHistory.length,
        variance,
        threshold: this.PERPLEXITY_THRESHOLD
      }
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  getPerformanceDashboard(): PerformanceDashboard {
    const recentMetrics = this.metricsHistory.slice(-100);
    
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
    
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
    const avgThroughput = recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const avgCacheHitRate = recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length;
    
    const slaCompliance = this.totalExecutions > 0 ? 
      (this.totalExecutions - this.slaViolations) / this.totalExecutions : 1.0;
    
    const driftStatus = this.detectModelDrift();
    const topBottlenecks = this.identifyBottlenecks(recentMetrics);
    const recommendations = this.generateRecommendations(recentMetrics, slaCompliance);
    
    return {
      slaCompliance,
      avgLatency,
      avgThroughput,
      avgMemoryUsage,
      cacheHitRate: avgCacheHitRate,
      totalExecutions: this.totalExecutions,
      driftStatus,
      topBottlenecks,
      recommendations
    };
  }

  private identifyBottlenecks(metrics: PerformanceMetrics[]): string[] {
    const bottlenecks: string[] = [];
    
    const avgLatency = metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const avgCacheHitRate = metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length;
    
    if (avgLatency > 5000) bottlenecks.push('High latency (>5s)');
    if (avgMemoryUsage > 512) bottlenecks.push('High memory usage (>512MB)');
    if (avgCacheHitRate < 0.3) bottlenecks.push('Low cache hit rate (<30%)');
    
    return bottlenecks;
  }

  private generateRecommendations(metrics: PerformanceMetrics[], slaCompliance: number): string[] {
    const recommendations: string[] = [];
    
    if (slaCompliance < 0.95) {
      recommendations.push('SLA compliance below 95%. Consider increasing timeout values or optimizing flow execution.');
    }
    
    const avgLatency = metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
    if (avgLatency > 3000) {
      recommendations.push('Average latency above 3s. Consider implementing request batching or caching strategies.');
    }
    
    const avgCacheHitRate = metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length;
    if (avgCacheHitRate < 0.5) {
      recommendations.push('Cache hit rate below 50%. Consider expanding cache TTL or implementing preloading.');
    }
    
    const driftStatus = this.detectModelDrift();
    if (driftStatus.isDrifting) {
      recommendations.push(`Model drift detected (${driftStatus.severity} severity). Consider retraining or model switching.`);
    }
    
    return recommendations;
  }

  reset(): void {
    this.metricsHistory = [];
    this.perplexityHistory = [];
    this.slaViolations = 0;
    this.totalExecutions = 0;
  }
} 