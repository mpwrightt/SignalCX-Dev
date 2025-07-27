'use server';

/**
 * @fileOverview Comprehensive ticket volume forecasting with confidence intervals and seasonal analysis
 * 
 * This flow provides multi-dimensional ticket volume predictions including:
 * - Daily, weekly, and monthly forecasts
 * - Confidence intervals and uncertainty ranges
 * - Seasonal pattern detection
 * - Category-specific volume predictions
 * - Peak time identification
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ProcessedAnalyticsData } from '@/lib/analytics-preprocessor';
import { AnalyticsPreprocessor } from '@/lib/analytics-preprocessor';
import { AnalyticsCache } from '@/lib/advanced-analytics-cache';

const TicketVolumeInputSchema = z.object({
  tickets: z.array(z.any()).optional(),
  preprocessedData: z.any().optional(),
  forecastHorizon: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  lookAheadDays: z.number().min(1).max(90).default(30),
  includeSeasonality: z.boolean().default(true),
  includeCategoryBreakdown: z.boolean().default(true),
});

export type TicketVolumeInput = z.infer<typeof TicketVolumeInputSchema>;

const VolumeDataPointSchema = z.object({
  period: z.string().describe("Time period (e.g., 'Week 1', 'Jan 2025')"),
  predicted: z.number().describe("Predicted ticket volume"),
  confidenceInterval: z.object({
    lower: z.number().describe("Lower bound of 95% confidence interval"),
    upper: z.number().describe("Upper bound of 95% confidence interval"),
  }),
  confidence: z.number().min(0).max(1).describe("Prediction confidence (0-1)"),
  variance: z.number().describe("Expected variance in predictions"),
});

const CategoryVolumeSchema = z.object({
  category: z.string(),
  currentVolume: z.number(),
  predictedVolume: z.number(),
  growthRate: z.number().describe("Percentage growth/decline expected"),
  confidence: z.number().min(0).max(1),
  riskFactors: z.array(z.string()),
});

const SeasonalPatternSchema = z.object({
  pattern: z.enum(['weekly', 'monthly', 'quarterly', 'none']),
  peakPeriods: z.array(z.string()).describe("Identified peak periods"),
  lowPeriods: z.array(z.string()).describe("Identified low periods"),
  cyclicalFactors: z.array(z.string()).describe("Factors driving cyclical patterns"),
  amplitude: z.number().describe("Strength of seasonal variation (0-1)"),
});

const TicketVolumeForecastOutputSchema = z.object({
  summary: z.object({
    totalPredictedVolume: z.number(),
    averageDailyVolume: z.number(),
    expectedGrowthRate: z.number().describe("Overall growth rate percentage"),
    overallConfidence: z.number().min(0).max(1),
    riskLevel: z.enum(['low', 'medium', 'high']),
  }),
  volumeForecasts: z.array(VolumeDataPointSchema),
  categoryBreakdown: z.array(CategoryVolumeSchema),
  seasonalAnalysis: SeasonalPatternSchema,
  peakAnalysis: z.object({
    predictedPeakDays: z.array(z.string()),
    peakVolumeIncrease: z.number().describe("Percentage increase during peaks"),
    peakDuration: z.string().describe("Typical duration of peak periods"),
    recommendations: z.array(z.string()),
  }),
  riskFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    probability: z.number().min(0).max(1),
    mitigation: z.string(),
  })),
  recommendations: z.array(z.string()).describe("Strategic recommendations based on forecasts"),
});

export type TicketVolumeForecastOutput = z.infer<typeof TicketVolumeForecastOutputSchema>;

const volumeForecastPrompt = ai.definePrompt({
  name: 'ticketVolumeForecastPrompt',
  input: {
    schema: z.object({
      ticketData: z.object({
        totalTickets: z.number(),
        timeRange: z.object({
          startDate: z.string(),
          endDate: z.string(),
          daysSpanned: z.number(),
        }),
        dailyVolumes: z.array(z.object({
          date: z.string(),
          count: z.number(),
          dayOfWeek: z.string(),
        })),
        categoryDistribution: z.record(z.number()),
        recentTrends: z.object({
          lastWeekAvg: z.number(),
          twoWeeksAgoAvg: z.number(),
          monthAgoAvg: z.number(),
        }),
      }),
      forecastParams: z.object({
        horizon: z.string(),
        lookAheadDays: z.number(),
        includeSeasonality: z.boolean(),
        includeCategoryBreakdown: z.boolean(),
      }),
    })
  },
  output: { schema: TicketVolumeForecastOutputSchema },
  prompt: `You are an expert data scientist specializing in time series forecasting and support ticket analytics.

Analyze the provided ticket volume data to generate comprehensive forecasts with confidence intervals.

**Analysis Framework:**
1. **Historical Pattern Analysis**: Identify trends, seasonality, and cyclical patterns
2. **Volume Trend Modeling**: Calculate growth rates and trajectory projections
3. **Confidence Estimation**: Provide realistic confidence intervals based on historical variance
4. **Risk Assessment**: Identify factors that could impact volume predictions
5. **Peak Period Prediction**: Forecast high-volume periods and their characteristics

**Key Considerations:**
- Use historical variance to calculate realistic confidence intervals
- Consider day-of-week and seasonal patterns
- Account for business cycles and external factors
- Provide actionable recommendations for capacity planning
- Include uncertainty quantification for all predictions

**Ticket Volume Data:**
Total Tickets: {{ticketData.totalTickets}}
Date Range: {{ticketData.timeRange.startDate}} to {{ticketData.timeRange.endDate}} ({{ticketData.timeRange.daysSpanned}} days)

**Recent Trends:**
- Last Week Average: {{ticketData.recentTrends.lastWeekAvg}} tickets/day
- Two Weeks Ago: {{ticketData.recentTrends.twoWeeksAgoAvg}} tickets/day  
- Month Ago: {{ticketData.recentTrends.monthAgoAvg}} tickets/day

**Daily Volume Pattern:**
{{#each ticketData.dailyVolumes}}
{{this.date}} ({{this.dayOfWeek}}): {{this.count}} tickets
{{/each}}

**Category Distribution:**
{{#each ticketData.categoryDistribution}}
{{@key}}: {{this}} tickets
{{/each}}

**Forecast Requirements:**
- Horizon: {{forecastParams.horizon}}
- Look-ahead: {{forecastParams.lookAheadDays}} days
- Include Seasonality: {{forecastParams.includeSeasonality}}
- Category Breakdown: {{forecastParams.includeCategoryBreakdown}}

Generate detailed volume forecasts with confidence intervals, seasonal analysis, and strategic recommendations.`,
});

export async function getTicketVolumeForecasts(input: TicketVolumeInput): Promise<TicketVolumeForecastOutput> {
  return ticketVolumeForecastFlow(input);
}

const ticketVolumeForecastFlow = ai.defineFlow(
  {
    name: 'ticketVolumeForecastFlow',
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
        preprocessedData = AnalyticsPreprocessor.preprocess(input.tickets || []);
      } else {
        console.log('[ticketVolumeForecastFlow] No tickets or preprocessed data provided');
        return createEmptyForecast();
      }

      // Generate cache key for this forecast request
      const cacheKey = `volume-forecast-${preprocessedData.ticketStats.totalTickets}-${input.forecastHorizon}-${input.lookAheadDays}`;
      
      // Check cache first
      const cached = AnalyticsCache.getCachedAnalysis('volume_forecast', cacheKey);
      if (cached) {
        console.log('[ticketVolumeForecastFlow] Using cached forecast');
        return cached;
      }

      // Prepare time series data
      const timeSeriesData = prepareTimeSeriesData(preprocessedData);
      
      if (timeSeriesData.dailyVolumes.length === 0) {
        console.log('[ticketVolumeForecastFlow] Insufficient historical data for forecasting');
        return createEmptyForecast();
      }

      // Calculate recent trends
      const recentTrends = calculateRecentTrends(timeSeriesData.dailyVolumes);

      // Prepare data for AI analysis
      const ticketData = {
        totalTickets: preprocessedData.ticketStats.totalTickets,
        timeRange: {
          startDate: preprocessedData.timeRanges.oldestTicket,
          endDate: preprocessedData.timeRanges.newestTicket,
          daysSpanned: preprocessedData.timeRanges.dateRange,
        },
        dailyVolumes: timeSeriesData.dailyVolumes.slice(-30), // Last 30 days for analysis
        categoryDistribution: preprocessedData.ticketStats.categoryCounts,
        recentTrends,
      };

      const forecastParams = {
        horizon: input.forecastHorizon,
        lookAheadDays: input.lookAheadDays,
        includeSeasonality: input.includeSeasonality,
        includeCategoryBreakdown: input.includeCategoryBreakdown,
      };

      console.log(`[ticketVolumeForecastFlow] Generating ${input.forecastHorizon} forecast for ${input.lookAheadDays} days`);

      const { output } = await volumeForecastPrompt({ ticketData, forecastParams });

      if (!output) {
        console.warn('[ticketVolumeForecastFlow] AI model returned no forecast data');
        return createEmptyForecast();
      }

      // Cache the result
      AnalyticsCache.setCachedAnalysis('volume_forecast', cacheKey, output);

      console.log(`[ticketVolumeForecastFlow] Successfully generated volume forecast with ${output.volumeForecasts.length} data points`);
      return output;

    } catch (error) {
      console.error('[ticketVolumeForecastFlow] Error generating forecast:', error);
      return createEmptyForecast();
    }
  }
);

function prepareTimeSeriesData(data: ProcessedAnalyticsData) {
  const ticketsByDate = new Map<string, number>();
  
  // Group tickets by date
  data.scrubbedTickets.forEach(ticket => {
    const date = ticket.created_at.split('T')[0]; // Get date part
    ticketsByDate.set(date, (ticketsByDate.get(date) || 0) + 1);
  });

  // Convert to sorted array
  const dailyVolumes = Array.from(ticketsByDate.entries())
    .map(([date, count]) => ({
      date,
      count,
      dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { dailyVolumes };
}

function calculateRecentTrends(dailyVolumes: Array<{ date: string; count: number }>) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const lastWeekTickets = dailyVolumes.filter(d => new Date(d.date) >= oneWeekAgo);
  const twoWeeksAgoTickets = dailyVolumes.filter(d => {
    const date = new Date(d.date);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  });
  const monthAgoTickets = dailyVolumes.filter(d => {
    const date = new Date(d.date);
    return date >= oneMonthAgo && date < twoWeeksAgo;
  });

  return {
    lastWeekAvg: lastWeekTickets.length > 0 
      ? Math.round(lastWeekTickets.reduce((sum, d) => sum + d.count, 0) / lastWeekTickets.length)
      : 0,
    twoWeeksAgoAvg: twoWeeksAgoTickets.length > 0
      ? Math.round(twoWeeksAgoTickets.reduce((sum, d) => sum + d.count, 0) / twoWeeksAgoTickets.length)
      : 0,
    monthAgoAvg: monthAgoTickets.length > 0
      ? Math.round(monthAgoTickets.reduce((sum, d) => sum + d.count, 0) / monthAgoTickets.length)
      : 0,
  };
}

function createEmptyForecast(): TicketVolumeForecastOutput {
  return {
    summary: {
      totalPredictedVolume: 0,
      averageDailyVolume: 0,
      expectedGrowthRate: 0,
      overallConfidence: 0,
      riskLevel: 'low',
    },
    volumeForecasts: [],
    categoryBreakdown: [],
    seasonalAnalysis: {
      pattern: 'none',
      peakPeriods: [],
      lowPeriods: [],
      cyclicalFactors: [],
      amplitude: 0,
    },
    peakAnalysis: {
      predictedPeakDays: [],
      peakVolumeIncrease: 0,
      peakDuration: 'Unknown',
      recommendations: [],
    },
    riskFactors: [],
    recommendations: [],
  };
}