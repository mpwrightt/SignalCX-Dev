'use server';

/**
 * @fileOverview Advanced trend analysis and anomaly detection
 * 
 * This flow provides:
 * - Multi-dimensional trend analysis
 * - Anomaly detection and pattern recognition
 * - Emerging trend identification
 * - Comparative analysis across time periods
 * - Statistical significance testing
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ProcessedAnalyticsData } from '@/lib/analytics-preprocessor';
import { AnalyticsPreprocessor } from '@/lib/analytics-preprocessor';
import { AnalyticsCache } from '@/lib/advanced-analytics-cache';
import { scrubPii } from '@/lib/pii-scrubber';

const TrendAnalysisInputSchema = z.object({
  tickets: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    created_at: z.string(),
    status: z.string(),
    priority: z.string().nullable(),
    category: z.string(),
    assignee: z.string().optional(),
    csat_score: z.number().optional(),
    first_response_at: z.string().optional(),
    solved_at: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })).optional(),
  preprocessedData: z.any().optional(),
  analysisDepth: z.enum(['basic', 'standard', 'comprehensive']).default('standard'),
  timeHorizon: z.number().default(90),
  includeAnomalies: z.boolean().default(true),
  includeForecasting: z.boolean().default(true),
});

export type TrendAnalysisInput = z.infer<typeof TrendAnalysisInputSchema>;

const TrendSchema = z.object({
  metric_name: z.string().describe("Name of the metric being analyzed"),
  trend_type: z.enum(['linear', 'exponential', 'logarithmic', 'polynomial', 'seasonal', 'cyclical']),
  direction: z.enum(['increasing', 'decreasing', 'stable', 'volatile']),
  strength: z.number().min(0).max(1).describe("Strength of the trend (0 = no trend, 1 = strong trend)"),
  significance: z.number().min(0).max(1).describe("Statistical significance of the trend"),
  start_date: z.string().describe("When the trend started"),
  current_value: z.number().describe("Current value of the metric"),
  predicted_value: z.number().describe("Predicted value in 30 days"),
  change_rate: z.number().describe("Rate of change per day"),
  confidence_interval: z.object({
    lower: z.number(),
    upper: z.number(),
  }),
  description: z.string().describe("Human-readable description of the trend"),
  business_implication: z.string().describe("What this trend means for the business"),
});

const AnomalySchema = z.object({
  anomaly_type: z.enum(['spike', 'drop', 'outlier', 'pattern_break', 'seasonal_deviation']),
  metric_affected: z.string().describe("Which metric shows the anomaly"),
  detected_at: z.string().describe("When the anomaly was detected"),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  anomaly_score: z.number().min(0).max(1).describe("How anomalous this is (1 = highly anomalous)"),
  expected_value: z.number().describe("What the value should have been"),
  actual_value: z.number().describe("What the actual value was"),
  deviation_percentage: z.number().describe("Percentage deviation from expected"),
  potential_causes: z.array(z.string()).describe("Possible reasons for this anomaly"),
  impact_assessment: z.string().describe("How this anomaly affects operations"),
  recommended_actions: z.array(z.string()).describe("What actions should be taken"),
});

const PatternSchema = z.object({
  pattern_name: z.string().describe("Name of the identified pattern"),
  pattern_type: z.enum(['recurring', 'emerging', 'declining', 'cyclical', 'correlation']),
  frequency: z.string().describe("How often this pattern occurs"),
  strength: z.number().min(0).max(1).describe("Strength of the pattern"),
  entities_involved: z.array(z.string()).describe("Metrics, categories, or agents involved"),
  description: z.string().describe("Detailed description of the pattern"),
  business_relevance: z.string().describe("Why this pattern matters for the business"),
  actionability: z.string().describe("How this pattern can be leveraged"),
});

const ComparativeAnalysisSchema = z.object({
  comparison_type: z.string().describe("Type of comparison (e.g., 'Month over Month', 'Year over Year')"),
  metric: z.string(),
  period_1: z.object({
    name: z.string(),
    value: z.number(),
    date_range: z.string(),
  }),
  period_2: z.object({
    name: z.string(),
    value: z.number(),
    date_range: z.string(),
  }),
  change_absolute: z.number().describe("Absolute change between periods"),
  change_percentage: z.number().describe("Percentage change between periods"),
  statistical_significance: z.number().min(0).max(1).describe("Statistical significance of the change"),
  interpretation: z.string().describe("What this change means"),
});

const TrendAnalysisOutputSchema = z.object({
  summary: z.object({
    total_trends_identified: z.number(),
    total_anomalies_detected: z.number(),
    total_patterns_found: z.number(),
    overall_health_score: z.number().min(0).max(1),
    key_insights: z.array(z.string()),
  }),
  trends: z.array(TrendSchema),
  anomalies: z.array(AnomalySchema),
  patterns: z.array(PatternSchema),
  comparative_analysis: z.array(ComparativeAnalysisSchema),
  forecasting_insights: z.object({
    next_30_days: z.array(z.object({
      metric: z.string(),
      predicted_trend: z.enum(['improving', 'stable', 'declining']),
      confidence: z.number().min(0).max(1),
      key_factors: z.array(z.string()),
    })),
  }),
  statistical_tests: z.array(z.object({
    test_name: z.string(),
    metric: z.string(),
    p_value: z.number(),
    result: z.string(),
    interpretation: z.string(),
  })),
  model_confidence: z.number().min(0).max(1),
  analysis_timestamp: z.string(),
});

export type TrendAnalysisOutput = z.infer<typeof TrendAnalysisOutputSchema>;

const prompt = ai.definePrompt({
  name: 'trendAnalysisPrompt',
  input: { 
    schema: z.object({
      time_series_data: z.array(z.object({
        date: z.string(),
        metrics: z.record(z.number()),
      })),
      category_trends: z.array(z.object({
        category: z.string(),
        trend_data: z.array(z.object({
          date: z.string(),
          count: z.number(),
          avg_resolution_time: z.number(),
          avg_csat: z.number(),
        })),
      })),
      agent_trends: z.array(z.object({
        agent: z.string(),
        performance_data: z.array(z.object({
          date: z.string(),
          tickets_handled: z.number(),
          avg_csat: z.number(),
          avg_response_time: z.number(),
        })),
      })),
      system_metrics: z.object({
        overall_volume: z.array(z.object({ date: z.string(), value: z.number() })),
        response_times: z.array(z.object({ date: z.string(), value: z.number() })),
        customer_satisfaction: z.array(z.object({ date: z.string(), value: z.number() })),
        sla_performance: z.array(z.object({ date: z.string(), value: z.number() })),
      }),
      analysis_depth: z.string(),
      time_horizon: z.number(),
    })
  },
  output: { schema: TrendAnalysisOutputSchema },
  prompt: `You are an expert data scientist specializing in advanced trend analysis and anomaly detection for customer support operations.

Perform a comprehensive analysis of the provided time series data to identify trends, anomalies, patterns, and provide forecasting insights.

ANALYSIS REQUIREMENTS:

1. **Trend Identification**: 
   - Identify significant trends in all key metrics
   - Determine trend types, direction, and strength
   - Assess statistical significance
   - Provide business implications

2. **Anomaly Detection**:
   - Detect spikes, drops, outliers, and pattern breaks
   - Assess severity and potential impact
   - Suggest possible causes and recommended actions

3. **Pattern Recognition**:
   - Identify recurring, emerging, and cyclical patterns
   - Analyze correlations between different metrics
   - Assess business relevance and actionability

4. **Comparative Analysis**:
   - Compare performance across different time periods
   - Identify significant changes and their implications
   - Assess statistical significance of changes

5. **Forecasting Insights**:
   - Predict trends for the next 30 days
   - Identify key factors that will influence future performance
   - Provide confidence levels for predictions

TIME SERIES DATA:
{{#each time_series_data}}
Date: {{this.date}}
Metrics: {{#each this.metrics}}{{@key}}: {{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}

CATEGORY TRENDS:
{{#each category_trends}}
Category: {{this.category}}
Data Points: {{this.trend_data.length}}
{{/each}}

AGENT PERFORMANCE TRENDS:
{{#each agent_trends}}
Agent: {{this.agent}}
Performance Points: {{this.performance_data.length}}
{{/each}}

ANALYSIS PARAMETERS:
- Analysis Depth: {{analysis_depth}}
- Time Horizon: {{time_horizon}} days
- Focus on actionable insights and business implications

Apply advanced statistical methods including:
- Trend analysis (linear, polynomial, seasonal decomposition)
- Anomaly detection (statistical outliers, pattern breaks)
- Time series forecasting
- Correlation analysis
- Significance testing

Provide insights that enable:
- Proactive decision making
- Performance optimization
- Risk mitigation
- Strategic planning
- Operational improvements`,
});

export const getTrendAnalysis = ai.defineFlow(
  {
    name: 'getTrendAnalysis',
    inputSchema: TrendAnalysisInputSchema,
    outputSchema: TrendAnalysisOutputSchema,
  },
  async (input) => {
    try {
      // Use preprocessed data if available, otherwise process tickets
      let preprocessedData: ProcessedAnalyticsData;
      if (input.preprocessedData) {
        preprocessedData = input.preprocessedData;
      } else if (input.tickets) {
        const scrubbedTickets = input.tickets.map(ticket => ({
          ...ticket,
          subject: scrubPii(ticket.subject),
        }));
        preprocessedData = AnalyticsPreprocessor.preprocess(scrubbedTickets);
      } else {
        console.log('[getTrendAnalysis] No tickets or preprocessed data provided');
        return {
          summary: {
            total_trends_identified: 0,
            total_anomalies_detected: 0,
            total_patterns_found: 0,
            overall_health_score: 0.5,
            key_insights: [],
          },
          trends: [],
          anomalies: [],
          patterns: [],
          comparative_analysis: [],
          forecasting_insights: { next_30_days: [] },
          statistical_tests: [],
          model_confidence: 0,
          analysis_timestamp: new Date().toISOString(),
        };
      }

      // Generate cache key
      const cacheKey = `trend-analysis-${preprocessedData.ticketStats.totalTickets}-${input.analysisDepth}-${input.timeHorizon}`;
      
      // Check cache
      const cached = AnalyticsCache.getCachedAnalysis('trend-analysis', cacheKey);
      if (cached) {
        console.log('[getTrendAnalysis] Using cached trend analysis');
        return { ...cached, analysis_timestamp: new Date().toISOString() };
      }

      // Prepare time series data
      const timeSeriesData = preprocessedData.timeSeriesData.map(point => ({
        date: point.date,
        metrics: {
          volume: point.count,
          avg_response_time: point.avgResponseTime || 0,
          avg_csat: point.avgCsat || 0,
          sla_breach_rate: (point.slaBreaches || 0) / (point.count || 1),
        },
      }));

      // Prepare category trends
      const categoryTrends = Object.entries(preprocessedData.categoryDistribution).map(([category, percentage]) => ({
        category,
        trend_data: preprocessedData.timeSeriesData.map(point => ({
          date: point.date,
          count: Math.round((point.count * percentage) / 100),
          avg_resolution_time: 4.2, // Mock data - would come from real analysis
          avg_csat: 4.1,
        })),
      }));

      // Prepare agent trends
      const agentTrends = Array.from(preprocessedData.agentMap.entries()).slice(0, 10).map(([agent, tickets]) => ({
        agent,
        performance_data: preprocessedData.timeSeriesData.map(point => ({
          date: point.date,
          tickets_handled: Math.round(tickets.length / preprocessedData.timeSeriesData.length),
          avg_csat: tickets.filter(t => t.csat_score).reduce((sum, t) => sum + (t.csat_score || 0), 0) / tickets.filter(t => t.csat_score).length || 4.0,
          avg_response_time: 3.5,
        })),
      }));

      // Prepare system metrics
      const systemMetrics = {
        overall_volume: timeSeriesData.map(d => ({ date: d.date, value: d.metrics.volume })),
        response_times: timeSeriesData.map(d => ({ date: d.date, value: d.metrics.avg_response_time })),
        customer_satisfaction: timeSeriesData.map(d => ({ date: d.date, value: d.metrics.avg_csat })),
        sla_performance: timeSeriesData.map(d => ({ date: d.date, value: 1 - d.metrics.sla_breach_rate })),
      };

      console.log(`[getTrendAnalysis] Processing ${timeSeriesData.length} time series points for ${input.analysisDepth} analysis`);

      const { output } = await prompt({
        time_series_data: timeSeriesData,
        category_trends: categoryTrends,
        agent_trends: agentTrends,
        system_metrics: systemMetrics,
        analysis_depth: input.analysisDepth,
        time_horizon: input.timeHorizon,
      });

      if (!output) {
        console.warn('[getTrendAnalysis] AI returned no data');
        return {
          summary: {
            total_trends_identified: 0,
            total_anomalies_detected: 0,
            total_patterns_found: 0,
            overall_health_score: 0.5,
            key_insights: [],
          },
          trends: [],
          anomalies: [],
          patterns: [],
          comparative_analysis: [],
          forecasting_insights: { next_30_days: [] },
          statistical_tests: [],
          model_confidence: 0,
          analysis_timestamp: new Date().toISOString(),
        };
      }

      const result = {
        ...output,
        analysis_timestamp: new Date().toISOString(),
      };

      console.log(`[getTrendAnalysis] Successfully generated trend analysis with ${output.trends.length} trends and ${output.anomalies.length} anomalies`);
      
      // Cache the result
      AnalyticsCache.setCachedAnalysis('trend-analysis', cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('[getTrendAnalysis] Error:', error);
      return {
        summary: {
          total_trends_identified: 0,
          total_anomalies_detected: 0,
          total_patterns_found: 0,
          overall_health_score: 0.5,
          key_insights: [],
        },
        trends: [],
        anomalies: [],
        patterns: [],
        comparative_analysis: [],
        forecasting_insights: { next_30_days: [] },
        statistical_tests: [],
        model_confidence: 0,
        analysis_timestamp: new Date().toISOString(),
      };
    }
  }
);