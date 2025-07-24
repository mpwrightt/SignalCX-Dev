import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Brain } from 'lucide-react';

export function AdvancedAnalyticsHeader({
  analysisMode,
  setAnalysisMode,
  loading,
  runAIAnalysis,
  setCachedAnalyticsForKey,
  cacheKey,
  AnalyticsCache,
  AnalyticsPreprocessor,
  aiFlowOptimizer
}: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        Advanced Analytics
      </h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Standard</span>
          <Switch
            checked={analysisMode === 'agentic'}
            onCheckedChange={(checked) => setAnalysisMode(checked ? 'agentic' : 'standard')}
            disabled={loading}
          />
          <span className="text-sm font-medium">AI Analyst</span>
        </div>
        <Button onClick={() => {
          setCachedAnalyticsForKey(cacheKey, null);
          AnalyticsCache.clearAllAnalyticsCache();
          AnalyticsPreprocessor.clearCache();
          aiFlowOptimizer.clearCache();
          setTimeout(() => {
            runAIAnalysis();
          }, 200);
        }} disabled={loading} variant="outline" className="shadow-sm">
          {loading ? <span className="animate-spin">⏳</span> : <span>✨</span>}
          Refresh Analysis
        </Button>
      </div>
    </div>
  );
} 