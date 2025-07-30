import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Heart, BarChart3, Shield, BrainCircuit, AlertTriangle } from 'lucide-react';
import { HeroMetricCard } from './HeroMetricCard';

export function AdvancedAnalyticsSummaryCards({
  performanceForecasts,
  burnoutIndicators,
  knowledgeGaps,
  slaPrediction,
  holisticAnalysis,
  prediction
}: any) {
  // Calculate metrics for hero cards
  const overallHealthScore = React.useMemo(() => {
    const factors = [
      performanceForecasts.length * 10, // More forecasts = better health
      100 - (burnoutIndicators.filter((b: any) => b.riskLevel === 'high' || b.riskLevel === 'critical').length * 20), // Less high-risk agents = better health
      100 - (knowledgeGaps.length * 15), // Fewer knowledge gaps = better health
      slaPrediction ? 100 - (slaPrediction.probability * 100) : 80 // Lower SLA breach risk = better health
    ];
    return Math.max(0, Math.min(100, factors.reduce((a, b) => a + b, 0) / factors.length));
  }, [performanceForecasts, burnoutIndicators, knowledgeGaps, slaPrediction]);

  const riskScore = React.useMemo(() => {
    const highRiskAgents = burnoutIndicators.filter((b: any) => b.riskLevel === 'high' || b.riskLevel === 'critical').length;
    const slaRisk = slaPrediction ? slaPrediction.probability * 100 : 0;
    return Math.min(100, (highRiskAgents * 25) + slaRisk);
  }, [burnoutIndicators, slaPrediction]);

  const [confidenceScore, setConfidenceScore] = React.useState(0);
  const [confidenceBreakdown, setConfidenceBreakdown] = React.useState({ historicalAccuracy: 0, dataVolume: 0, modelStability: 0 });

  React.useEffect(() => {
    const runForecastConfidenceAnalysis = async () => {
      const confidence = await getForecastConfidence({ historicalAccuracy: 95, dataVolume: 1000, modelStability: 99 });
      setConfidenceScore(confidence.confidenceScore);
      setConfidenceBreakdown(confidence.confidenceBreakdown);
    };

    runForecastConfidenceAnalysis();
  }, []);

  const [healthTrend, setHealthTrend] = React.useState(0);
  const [riskTrend, setRiskTrend] = React.useState(0);
  const [confidenceTrend, setConfidenceTrend] = React.useState(0);

  React.useEffect(() => {
    const runTrendAnalysis = async () => {
      const healthTrend = await getTrendAnalysis({ historicalData: [{ date: '2025-07-22', value: 80 }, { date: '2025-07-29', value: overallHealthScore }] });
      setHealthTrend(healthTrend.trend);

      const riskTrend = await getTrendAnalysis({ historicalData: [{ date: '2025-07-22', value: 30 }, { date: '2025-07-29', value: riskScore }] });
      setRiskTrend(riskTrend.trend);

      const confidenceTrend = await getTrendAnalysis({ historicalData: [{ date: '2025-07-22', value: 70 }, { date: '2025-07-29', value: confidenceScore }] });
      setConfidenceTrend(confidenceTrend.trend);
    };

    runTrendAnalysis();
  }, [overallHealthScore, riskScore, confidenceScore]);

  const [activeDrillDown, setActiveDrillDown] = React.useState<string | null>(null);

  const handleDrillDown = (view: string) => {
    setActiveDrillDown(view);
  };

  if (activeDrillDown === 'system-health') {
    return <SystemHealthDrillDownView />;
  }

  if (activeDrillDown === 'risk-level') {
    return <RiskLevelDrillDownView />;
  }

  if (activeDrillDown === 'forecast-confidence') {
    return <ForecastConfidenceDrillDownView confidenceBreakdown={confidenceBreakdown} />;
  }

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HeroMetricCard
          title="System Health"
          value={overallHealthScore}
          maxValue={100}
          trend={healthTrend}
          trendLabel="vs last week"
          icon={Heart}
          color="success"
          onClick={() => handleDrillDown('system-health')}
        />
        <HeroMetricCard
          title="Risk Level"
          value={riskScore}
          maxValue={100}
          trend={riskTrend}
          trendLabel="vs last week"
          icon={AlertTriangle}
          color="warning"
          onClick={() => handleDrillDown('risk-level')}
        />
        <HeroMetricCard
          title="Forecast Confidence"
          value={confidenceScore}
          maxValue={100}
          trend={confidenceTrend}
          trendLabel="vs last week"
          icon={BrainCircuit}
          color="primary"
          onClick={() => handleDrillDown('forecast-confidence')}
        />
      </div>

      {/* Secondary Metrics Grid */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Key Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-foreground mb-2">
                {performanceForecasts.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Target className="h-4 w-4" />
                Performance Forecasts
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-destructive mb-2">
                {burnoutIndicators.filter((b: any) => b.riskLevel === 'high' || b.riskLevel === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Heart className="h-4 w-4" />
                High Risk Agents
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-foreground mb-2">
                {knowledgeGaps.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Knowledge Gaps
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {slaPrediction ? Math.round(slaPrediction.probability * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Shield className="h-4 w-4" />
                SLA Breach Risk
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-emerald-600 mb-2">
                {burnoutIndicators.length - burnoutIndicators.filter((b: any) => b.riskLevel === 'high' || b.riskLevel === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Heart className="h-4 w-4" />
                Healthy Agents
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-primary mb-2">
                {Math.round(overallHealthScore)}%
              </div>
              <div className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Target className="h-4 w-4" />
                System Health
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 