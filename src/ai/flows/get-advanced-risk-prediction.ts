'use server';

/**
 * @fileOverview Advanced risk prediction and business impact analysis
 * 
 * This flow provides:
 * - Multi-dimensional risk assessment
 * - Business impact predictions
 * - Early warning systems
 * - Mitigation recommendations
 * - Risk trend analysis
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ProcessedAnalyticsData } from '@/lib/analytics-preprocessor';
import { AnalyticsPreprocessor } from '@/lib/analytics-preprocessor';
import { AnalyticsCache } from '@/lib/advanced-analytics-cache';
import { scrubPii } from '@/lib/pii-scrubber';

const AdvancedRiskInputSchema = z.object({
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
    sla_breached: z.boolean().optional(),
    conversation: z.array(z.object({
      sender: z.enum(['customer', 'agent']),
      message: z.string(),
      timestamp: z.string(),
    })).optional(),
  })).optional(),
  preprocessedData: z.any().optional(),
  riskThreshold: z.number().min(0).max(1).default(0.7),
  includeBusinessImpact: z.boolean().default(true),
  forecastDays: z.number().default(14),
});

export type AdvancedRiskInput = z.infer<typeof AdvancedRiskInputSchema>;

const RiskFactorSchema = z.object({
  factor_type: z.enum(['operational', 'customer', 'agent', 'system', 'business']),
  factor_name: z.string().describe("Name of the risk factor"),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  probability: z.number().min(0).max(1).describe("Probability of occurrence"),
  impact_score: z.number().min(0).max(10).describe("Potential impact score"),
  description: z.string().describe("Detailed description of the risk"),
  indicators: z.array(z.string()).describe("Observable indicators of this risk"),
  mitigation_actions: z.array(z.string()).describe("Recommended mitigation actions"),
  timeline: z.string().describe("Expected timeline for risk materialization"),
});

const BusinessImpactSchema = z.object({
  metric_name: z.string().describe("Business metric affected"),
  current_value: z.number().describe("Current metric value"),
  predicted_value: z.number().describe("Predicted value if risks materialize"),
  impact_percentage: z.number().describe("Percentage change in metric"),
  financial_impact: z.number().optional().describe("Estimated financial impact"),
  confidence: z.number().min(0).max(1).describe("Confidence in prediction"),
  time_horizon: z.string().describe("When impact is expected"),
});

const EarlyWarningSchema = z.object({
  warning_type: z.enum(['sla_breach', 'customer_churn', 'agent_burnout', 'system_overload', 'quality_decline']),
  alert_level: z.enum(['info', 'warning', 'critical', 'emergency']),
  probability: z.number().min(0).max(1).describe("Probability of event occurring"),
  time_to_event: z.string().describe("Estimated time until event"),
  affected_entities: z.array(z.string()).describe("Tickets, agents, or systems affected"),
  recommended_actions: z.array(z.string()).describe("Immediate actions to take"),
  escalation_path: z.string().describe("Who should be notified"),
});

const RiskTrendSchema = z.object({
  risk_category: z.string(),
  trend_direction: z.enum(['improving', 'stable', 'deteriorating', 'volatile']),
  trend_strength: z.number().min(0).max(1).describe("Strength of trend"),
  key_drivers: z.array(z.string()).describe("Primary drivers of the trend"),
  prediction_horizon: z.string().describe("How far into future trend is valid"),
});

const AdvancedRiskOutputSchema = z.object({
  overall_risk_score: z.number().min(0).max(1).describe("Overall risk assessment score"),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  risk_factors: z.array(RiskFactorSchema),
  business_impacts: z.array(BusinessImpactSchema),
  early_warnings: z.array(EarlyWarningSchema),
  risk_trends: z.array(RiskTrendSchema),
  mitigation_priority: z.array(z.object({
    action: z.string(),
    priority: z.enum(['immediate', 'urgent', 'high', 'medium', 'low']),
    impact: z.string(),
    effort: z.string(),
  })),
  risk_heatmap: z.array(z.object({
    category: z.string(),
    probability: z.number(),
    impact: z.number(),
    risk_score: z.number(),
  })),
  model_confidence: z.number().min(0).max(1),
  last_updated: z.string(),
});

export type AdvancedRiskOutput = z.infer<typeof AdvancedRiskOutputSchema>;

const prompt = ai.definePrompt({
  name: 'advancedRiskPredictionPrompt',
  input: { 
    schema: z.object({
      ticket_analysis: z.object({
        total_tickets: z.number(),
        open_tickets: z.number(),
        overdue_tickets: z.number(),
        high_priority_tickets: z.number(),
        avg_response_time: z.number(),
        avg_resolution_time: z.number(),
        sla_breach_rate: z.number(),
        customer_satisfaction: z.number(),
        agent_utilization: z.number(),
      }),
      pattern_analysis: z.object({
        volume_trends: z.array(z.object({
          period: z.string(),
          change: z.number(),
        })),
        category_shifts: z.record(z.number()),
        agent_performance_trends: z.array(z.object({
          agent: z.string(),
          trend: z.string(),
          metrics: z.record(z.number()),
        })),
        escalation_patterns: z.array(z.string()),
      }),
      risk_indicators: z.array(z.object({
        indicator: z.string(),
        value: z.number(),
        threshold: z.number(),
        status: z.string(),
      })),
      forecast_days: z.number(),
    })
  },
  output: { schema: AdvancedRiskOutputSchema },
  prompt: `You are an expert risk analyst specializing in customer support operations and business impact assessment.

Analyze the comprehensive ticket and operational data to identify risks, predict business impacts, and provide early warning alerts.

CURRENT SITUATION:
- Total Tickets: {{ticket_analysis.total_tickets}}
- Open Tickets: {{ticket_analysis.open_tickets}}
- Overdue Tickets: {{ticket_analysis.overdue_tickets}}
- High Priority: {{ticket_analysis.high_priority_tickets}}
- Avg Response Time: {{ticket_analysis.avg_response_time}} hours
- Avg Resolution Time: {{ticket_analysis.avg_resolution_time}} hours
- SLA Breach Rate: {{ticket_analysis.sla_breach_rate}}%
- Customer Satisfaction: {{ticket_analysis.customer_satisfaction}}/5
- Agent Utilization: {{ticket_analysis.agent_utilization}}%

VOLUME TRENDS:
{{#each pattern_analysis.volume_trends}}
- {{this.period}}: {{this.change}}% change
{{/each}}

CATEGORY SHIFTS:
{{#each pattern_analysis.category_shifts}}
- {{@key}}: {{this}}% change
{{/each}}

AGENT PERFORMANCE TRENDS:
{{#each pattern_analysis.agent_performance_trends}}
- {{this.agent}}: {{this.trend}} trend
{{/each}}

RISK INDICATORS:
{{#each risk_indicators}}
- {{this.indicator}}: {{this.value}} (threshold: {{this.threshold}}) - {{this.status}}
{{/each}}

ANALYSIS REQUIREMENTS:

1. **Risk Assessment**: Identify and categorize all operational, customer, agent, system, and business risks
2. **Business Impact**: Quantify potential impacts on key metrics (CSAT, resolution time, costs, revenue)
3. **Early Warnings**: Generate alerts for imminent issues requiring immediate attention
4. **Risk Trends**: Analyze how risks are evolving over time
5. **Mitigation Strategy**: Prioritize actions based on impact and effort required

Focus on:
- Proactive risk identification (before issues become critical)
- Quantifiable business impact predictions
- Actionable mitigation recommendations
- Clear escalation paths and timelines
- Data-driven confidence assessments

Forecast horizon: {{forecast_days}} days`,
});

export const getAdvancedRiskPrediction = ai.defineFlow(
  {
    name: 'getAdvancedRiskPrediction',
    inputSchema: AdvancedRiskInputSchema,
    outputSchema: AdvancedRiskOutputSchema,
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
          conversation: ticket.conversation?.map(conv => ({
            ...conv,
            message: scrubPii(conv.message),
          })),
        }));
        preprocessedData = AnalyticsPreprocessor.preprocess(scrubbedTickets);
      } else {
        console.log('[getAdvancedRiskPrediction] No tickets or preprocessed data provided');
        return {
          overall_risk_score: 0,
          risk_level: 'low' as const,
          risk_factors: [],
          business_impacts: [],
          early_warnings: [],
          risk_trends: [],
          mitigation_priority: [],
          risk_heatmap: [],
          model_confidence: 0,
          last_updated: new Date().toISOString(),
        };
      }

      // Generate cache key
      const cacheKey = `advanced-risk-${preprocessedData.ticketStats.totalTickets}-${input.riskThreshold}-${input.forecastDays}`;
      
      // Check cache
      const cached = AnalyticsCache.getCachedAnalysis('advanced-risk', cacheKey);
      if (cached) {
        console.log('[getAdvancedRiskPrediction] Using cached risk analysis');
        return { ...cached, last_updated: new Date().toISOString() };
      }

      // Prepare analysis data
      const ticketAnalysis = {
        total_tickets: preprocessedData.ticketStats.totalTickets,
        open_tickets: preprocessedData.ticketStats.openTickets,
        overdue_tickets: preprocessedData.ticketStats.overdueTickets || 0,
        high_priority_tickets: preprocessedData.ticketStats.highPriorityTickets || 0,
        avg_response_time: preprocessedData.performanceMetrics.avgResponseTime || 0,
        avg_resolution_time: preprocessedData.performanceMetrics.avgResolutionTime || 0,
        sla_breach_rate: (preprocessedData.ticketStats.slaBreaches / preprocessedData.ticketStats.totalTickets) * 100 || 0,
        customer_satisfaction: preprocessedData.performanceMetrics.avgCsat || 0,
        agent_utilization: preprocessedData.performanceMetrics.agentUtilization || 0,
      };

      const patternAnalysis = {
        volume_trends: [
          { period: 'Last 7 days', change: preprocessedData.trendAnalysis.weeklyGrowthRate || 0 },
          { period: 'Last 30 days', change: preprocessedData.trendAnalysis.monthlyGrowthRate || 0 },
        ],
        category_shifts: preprocessedData.categoryDistribution,
        agent_performance_trends: Array.from(preprocessedData.agentMap.entries()).map(([agent, tickets]) => ({
          agent,
          trend: 'stable',
          metrics: {
            ticket_count: tickets.length,
            avg_csat: tickets.filter(t => t.csat_score).reduce((sum, t) => sum + (t.csat_score || 0), 0) / tickets.filter(t => t.csat_score).length || 0,
          },
        })),
        escalation_patterns: ['High priority escalations increasing', 'Customer complaint escalations'],
      };

      const riskIndicators = [
        { indicator: 'SLA Breach Rate', value: ticketAnalysis.sla_breach_rate, threshold: 15, status: ticketAnalysis.sla_breach_rate > 15 ? 'critical' : 'normal' },
        { indicator: 'Response Time', value: ticketAnalysis.avg_response_time, threshold: 4, status: ticketAnalysis.avg_response_time > 4 ? 'warning' : 'normal' },
        { indicator: 'Customer Satisfaction', value: ticketAnalysis.customer_satisfaction, threshold: 3.5, status: ticketAnalysis.customer_satisfaction < 3.5 ? 'critical' : 'normal' },
        { indicator: 'Agent Utilization', value: ticketAnalysis.agent_utilization, threshold: 90, status: ticketAnalysis.agent_utilization > 90 ? 'warning' : 'normal' },
      ];

      console.log(`[getAdvancedRiskPrediction] Analyzing ${preprocessedData.ticketStats.totalTickets} tickets for risk assessment`);

      const { output } = await prompt({
        ticket_analysis: ticketAnalysis,
        pattern_analysis: patternAnalysis,
        risk_indicators: riskIndicators,
        forecast_days: input.forecastDays,
      });

      if (!output) {
        console.warn('[getAdvancedRiskPrediction] AI returned no data');
        return {
          overall_risk_score: 0,
          risk_level: 'low' as const,
          risk_factors: [],
          business_impacts: [],
          early_warnings: [],
          risk_trends: [],
          mitigation_priority: [],
          risk_heatmap: [],
          model_confidence: 0,
          last_updated: new Date().toISOString(),
        };
      }

      const result = {
        ...output,
        last_updated: new Date().toISOString(),
      };

      console.log(`[getAdvancedRiskPrediction] Successfully generated risk analysis with ${output.risk_factors.length} risk factors`);
      
      // Cache the result
      AnalyticsCache.setCachedAnalysis('advanced-risk', cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('[getAdvancedRiskPrediction] Error:', error);
      return {
        overall_risk_score: 0,
        risk_level: 'low' as const,
        risk_factors: [],
        business_impacts: [],
        early_warnings: [],
        risk_trends: [],
        mitigation_priority: [],
        risk_heatmap: [],
        model_confidence: 0,
        last_updated: new Date().toISOString(),
      };
    }
  }
);