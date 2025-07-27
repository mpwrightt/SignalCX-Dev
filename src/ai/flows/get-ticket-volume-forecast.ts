'use server';

/**
 * @fileOverview Comprehensive ticket volume forecasting with seasonal analysis
 * 
 * This flow provides:
 * - Daily, weekly, and monthly volume predictions
 * - Seasonal trend analysis
 * - Confidence intervals and uncertainty ranges
 * - Peak time identification
 * - Category-specific forecasting
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ProcessedAnalyticsData } from '@/lib/analytics-preprocessor';
import { AnalyticsPreprocessor } from '@/lib/analytics-preprocessor';
import { AnalyticsCache } from '@/lib/advanced-analytics-cache';
import { scrubPii } from '@/lib/pii-scrubber';

const TicketVolumeInputSchema = z.object({
  tickets: z.array(z.object({
    id: z.number(),
    subject: z.string(),
    created_at: z.string(),
    status: z.string(),
    category: z.string(),
    priority: z.string().nullable(),
    assignee: z.string().optional(),
  })).optional(),
  preprocessedData: z.any().optional(),
  forecastDays: z.number().default(30),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  includeSeasonality: z.boolean().default(true),
  includeCategories: z.boolean().default(true),
});

export type TicketVolumeInput = z.infer<typeof TicketVolumeInputSchema>;

const VolumeDataPointSchema = z.object({
  date: z.string().describe("Date in ISO format"),
  predicted_volume: z.number().describe("Predicted ticket volume"),
  confidence_lower: z.number().describe("Lower bound of confidence interval"),
  confidence_upper: z.number().describe("Upper bound of confidence interval"),
  confidence_score: z.number().min(0).max(1).describe("Confidence in prediction"),
  category_breakdown: z.record(z.number()).optional().describe("Volume by category"),
  factors: z.array(z.string()).describe("Key factors influencing this prediction"),
});

const SeasonalPatternSchema = z.object({
  pattern_type: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  peak_periods: z.array(z.string()).describe("When peaks typically occur"),
  low_periods: z.array(z.string()).describe("When volumes are typically low"),
  seasonal_factor: z.number().describe("Strength of seasonal effect (0-1)"),
  description: z.string().describe("Human-readable description of the pattern"),
});

const CapacityRecommendationSchema = z.object({
  date: z.string(),
  recommended_agents: z.number().describe("Recommended number of agents"),
  workload_factor: z.number().describe("Expected workload intensity (0-2)"),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  actions: z.array(z.string()).describe("Recommended actions for this period"),
});

const TicketVolumeForecastOutputSchema = z.object({
  forecast_data: z.array(VolumeDataPointSchema),
  seasonal_patterns: z.array(SeasonalPatternSchema),
  capacity_recommendations: z.array(CapacityRecommendationSchema),
  overall_trend: z.enum(['increasing', 'decreasing', 'stable', 'volatile']),
  trend_strength: z.number().min(0).max(1).describe("Strength of the trend"),
  risk_factors: z.array(z.string()).describe("Factors that could impact predictions"),
  business_insights: z.array(z.string()).describe("Key business insights from the forecast"),
  model_confidence: z.number().min(0).max(1).describe("Overall model confidence"),
});

export type TicketVolumeForecastOutput = z.infer<typeof TicketVolumeForecastOutputSchema>;

const prompt = ai.definePrompt({
  name: 'ticketVolumeForecastPrompt',
  input: { 
    schema: z.object({
      historical_data: z.array(z.object({
        date: z.string(),
        volume: z.number(),
        categories: z.record(z.number()),
        day_of_week: z.string(),
        week_of_year: z.number(),
        month: z.string(),
      })),
      recent_trends: z.object({
        weekly_change: z.number(),
        monthly_change: z.number(),
        category_shifts: z.record(z.number()),
      }),
      forecast_days: z.number(),
      granularity: z.string(),
    })
  },
  output: { schema: TicketVolumeForecastOutputSchema },
  prompt: `You are an expert data scientist specializing in time series forecasting for customer support operations.

Analyze the historical ticket volume data to create comprehensive forecasts that include:

1. **Volume Predictions**: For each future time period, predict ticket volumes with confidence intervals
2. **Seasonal Analysis**: Identify daily, weekly, and monthly patterns
3. **Capacity Planning**: Recommend staffing levels based on predicted workload
4. **Risk Assessment**: Identify periods of high risk and recommend mitigation
5. **Business Insights**: Provide actionable insights for operations planning

Consider these factors:
- Historical volume patterns and trends
- Day-of-week and seasonal effects  
- Category distribution changes
- Recent trend momentum
- Business calendar considerations (holidays, launches, etc.)

HISTORICAL DATA:
{{#each historical_data}}
Date: {{this.date}}, Volume: {{this.volume}}, Day: {{this.day_of_week}}, Week: {{this.week_of_year}}
Categories: {{#each this.categories}}{{@key}}: {{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}

RECENT TRENDS:
- Weekly change: {{recent_trends.weekly_change}}%
- Monthly change: {{recent_trends.monthly_change}}%
- Category shifts: {{#each recent_trends.category_shifts}}{{@key}}: {{this}}%{{#unless @last}}, {{/unless}}{{/each}}

FORECAST REQUIREMENTS:
- Forecast period: {{forecast_days}} days
- Granularity: {{granularity}}
- Include confidence intervals (80% confidence level)
- Provide capacity recommendations
- Identify risk periods and mitigation strategies

Focus on providing actionable insights that help with:
- Resource planning and scheduling
- Proactive capacity management
- Risk mitigation planning
- Business impact assessment`,
});

export const getTicketVolumeForecast = ai.defineFlow(
  {
    name: 'getTicketVolumeForecast',
    inputSchema: TicketVolumeInputSchema,
    outputSchema: TicketVolumeForecastOutputSchema,
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
        console.log('[getTicketVolumeForecast] No tickets or preprocessed data provided');
        return {
          forecast_data: [],
          seasonal_patterns: [],
          capacity_recommendations: [],
          overall_trend: 'stable' as const,
          trend_strength: 0,
          risk_factors: [],
          business_insights: [],
          model_confidence: 0,
        };
      }

      // Generate cache key
      const cacheKey = `volume-forecast-${preprocessedData.ticketStats.totalTickets}-${input.forecastDays}-${input.granularity}`;
      
      // Check cache
      const cached = AnalyticsCache.getCachedAnalysis('volume-forecast', cacheKey);
      if (cached) {
        console.log('[getTicketVolumeForecast] Using cached forecast');
        return cached;
      }

      // Prepare historical data for analysis
      const historicalData = preprocessedData.timeSeriesData.map(point => {
        const date = new Date(point.date);
        return {
          date: point.date,
          volume: point.count,
          categories: point.categories || {},
          day_of_week: date.toLocaleDateString('en-US', { weekday: 'long' }),
          week_of_year: Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          month: date.toLocaleDateString('en-US', { month: 'long' }),
        };
      });

      // Calculate recent trends
      const recentTrends = {
        weekly_change: preprocessedData.trendAnalysis.weeklyGrowthRate || 0,
        monthly_change: preprocessedData.trendAnalysis.monthlyGrowthRate || 0,
        category_shifts: preprocessedData.categoryDistribution,
      };

      console.log(`[getTicketVolumeForecast] Processing ${historicalData.length} historical data points for ${input.forecastDays} day forecast`);

      const { output } = await prompt({
        historical_data: historicalData,
        recent_trends: recentTrends,
        forecast_days: input.forecastDays,
        granularity: input.granularity,
      });

      if (!output) {
        console.warn('[getTicketVolumeForecast] AI returned no data');
        return {
          forecast_data: [],
          seasonal_patterns: [],
          capacity_recommendations: [],
          overall_trend: 'stable' as const,
          trend_strength: 0,
          risk_factors: [],
          business_insights: [],
          model_confidence: 0,
        };
      }

      console.log(`[getTicketVolumeForecast] Successfully generated forecast with ${output.forecast_data.length} data points`);
      
      // Cache the result
      AnalyticsCache.setCachedAnalysis('volume-forecast', cacheKey, output);
      
      return output;
    } catch (error) {
      console.error('[getTicketVolumeForecast] Error:', error);
      return {
        forecast_data: [],
        seasonal_patterns: [],
        capacity_recommendations: [],
        overall_trend: 'stable' as const,
        trend_strength: 0,
        risk_factors: [],
        business_insights: [],
        model_confidence: 0,
      };
    }
  }
);