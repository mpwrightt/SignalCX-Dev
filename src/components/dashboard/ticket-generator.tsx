'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Wand2, 
  Trash2, 
  BarChart3, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Ticket,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { generateZendeskTickets, generateTicketsByScenario, generateDemoTickets } from '@/ai/flows/generate-zendesk-tickets';
import { generatedTicketService } from '@/lib/generated-ticket-service';
import type { TicketAnalytics } from '@/lib/generated-ticket-service';

// Utility function to calculate date ranges
function getDateRange(range: GenerationConfig['dateRange']) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        from: yesterday,
        to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'last_week':
      const lastWeekEnd = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeekStart = new Date(lastWeekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
      return {
        from: lastWeekStart,
        to: lastWeekEnd
      };
    
    case 'this_month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from: monthStart,
        to: now
      };
    
    case 'last_month':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from: lastMonthStart,
        to: lastMonthEnd
      };
    
    case 'this_year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return {
        from: yearStart,
        to: now
      };
    
    case 'last_year':
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      return {
        from: lastYearStart,
        to: lastYearEnd
      };
    
    default:
      return {
        from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: today
      };
  }
}

interface GenerationConfig {
  count: number;
  scenario: 'mixed' | 'billing' | 'technical' | 'shipping' | 'refunds' | 'account';
  channel: 'web' | 'email' | 'chat' | 'api';
  urgency: 'balanced' | 'mostly_normal' | 'escalated';
  dateRange: 'today' | 'yesterday' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year';
}

export function TicketGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [lastGeneration, setLastGeneration] = useState<{
    count: number;
    scenario: string;
    timestamp: string;
  } | null>(null);

  // Form state
  const [config, setConfig] = useState<GenerationConfig>({
    count: 10,
    scenario: 'mixed',
    channel: 'email',
    urgency: 'balanced',
    dateRange: 'last_week'
  });

  // Load analytics on mount
  React.useEffect(() => {
    if (user?.organizationId) {
      loadAnalytics();
    }
  }, [user?.organizationId]);

  const loadAnalytics = async () => {
    if (!user?.organizationId) return;
    
    setIsLoadingAnalytics(true);
    try {
      const data = await generatedTicketService.getTicketAnalytics(user.organizationId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket analytics',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleGenerate = async () => {
    if (!user?.organizationId) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Calculate date range
      const dateRange = getDateRange(config.dateRange);
      const dateFrom = dateRange.from.toISOString();
      const dateTo = dateRange.to.toISOString();

      const result = await generateZendeskTickets({
        organization_id: user.organizationId,
        count: config.count,
        scenario: config.scenario,
        via_channel: config.channel,
        urgency_distribution: config.urgency,
        date_from: dateFrom,
        date_to: dateTo,
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setLastGeneration({
        count: result.tickets.length,
        scenario: config.scenario,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Success',
        description: `Generated ${result.tickets.length} ${config.scenario} tickets`,
      });

      // Reload analytics
      await loadAnalytics();

    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleQuickGenerate = async (scenario: GenerationConfig['scenario'], count: number) => {
    if (!user?.organizationId) return;

    setIsGenerating(true);
    try {
      // Use current date range setting for quick generation
      const dateRange = getDateRange(config.dateRange);
      const dateFrom = dateRange.from.toISOString();
      const dateTo = dateRange.to.toISOString();

      const result = await generateTicketsByScenario(
        user.organizationId, 
        scenario, 
        count,
        dateFrom,
        dateTo
      );
      
      toast({
        title: 'Success',
        description: `Generated ${result.tickets.length} ${scenario} tickets`,
      });

      await loadAnalytics();
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDemo = async () => {
    if (!user?.organizationId) return;

    setIsGenerating(true);
    try {
      // Use current date range setting for demo generation
      const dateRange = getDateRange(config.dateRange);
      const dateFrom = dateRange.from.toISOString();
      const dateTo = dateRange.to.toISOString();

      const result = await generateZendeskTickets({
        organization_id: user.organizationId,
        count: 25,
        scenario: 'mixed',
        via_channel: 'web',
        urgency_distribution: 'mostly_normal',
        date_from: dateFrom,
        date_to: dateTo,
      });
      
      toast({
        title: 'Demo Data Generated',
        description: `Created ${result.tickets.length} sample tickets for testing`,
      });

      await loadAnalytics();
    } catch (error) {
      toast({
        title: 'Demo Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAll = async () => {
    if (!user?.organizationId) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete all generated tickets? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    setIsClearing(true);
    try {
      await generatedTicketService.clearTickets(user.organizationId);
      
      toast({
        title: 'Success',
        description: 'All generated tickets have been cleared',
      });

      await loadAnalytics();
    } catch (error) {
      toast({
        title: 'Clear Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getScenarioDescription = (scenario: string) => {
    const descriptions: Record<string, string> = {
      'mixed': 'Variety of support issues across all categories',
      'billing': 'Payment issues, subscription problems, refund requests',
      'technical': 'Software bugs, login issues, feature problems',
      'shipping': 'Delivery problems, damaged items, tracking issues',
      'refunds': 'Return requests, dissatisfaction, cancellations',
      'account': 'Profile issues, password resets, access problems'
    };
    return descriptions[scenario] || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-600" />
            AI Ticket Generator
          </h2>
          <p className="text-muted-foreground">Generate realistic support tickets for demo and testing</p>
        </div>
        
        {analytics && (
          <Badge variant="outline" className="text-sm">
            {analytics.totalTickets} tickets generated
          </Badge>
        )}
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">
            <Ticket className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Generate tickets instantly with predefined settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleGenerateDemo()}
                  disabled={isGenerating}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Ticket className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Demo Dataset</div>
                    <div className="text-xs text-muted-foreground">25 mixed tickets</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleQuickGenerate('billing', 15)}
                  disabled={isGenerating}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <AlertCircle className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Billing Issues</div>
                    <div className="text-xs text-muted-foreground">15 billing tickets</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleQuickGenerate('technical', 20)}
                  disabled={isGenerating}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <RefreshCw className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Technical Issues</div>
                    <div className="text-xs text-muted-foreground">20 tech tickets</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Generation */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Generation</CardTitle>
              <CardDescription>
                Configure specific parameters for ticket generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="count">Number of Tickets</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    value={config.count}
                    onChange={(e) => setConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scenario">Scenario</Label>
                  <Select
                    value={config.scenario}
                    onValueChange={(value: GenerationConfig['scenario']) => 
                      setConfig(prev => ({ ...prev, scenario: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed Issues</SelectItem>
                      <SelectItem value="billing">Billing Problems</SelectItem>
                      <SelectItem value="technical">Technical Issues</SelectItem>
                      <SelectItem value="shipping">Shipping Problems</SelectItem>
                      <SelectItem value="refunds">Refund Requests</SelectItem>
                      <SelectItem value="account">Account Issues</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {getScenarioDescription(config.scenario)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel">Submission Channel</Label>
                  <Select
                    value={config.channel}
                    onValueChange={(value: GenerationConfig['channel']) => 
                      setConfig(prev => ({ ...prev, channel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="web">Web Form</SelectItem>
                      <SelectItem value="chat">Live Chat</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Priority Distribution</Label>
                  <Select
                    value={config.urgency}
                    onValueChange={(value: GenerationConfig['urgency']) => 
                      setConfig(prev => ({ ...prev, urgency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced (realistic mix)</SelectItem>
                      <SelectItem value="mostly_normal">Mostly Normal (typical day)</SelectItem>
                      <SelectItem value="escalated">Escalated (crisis mode)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select
                    value={config.dateRange}
                    onValueChange={(value: GenerationConfig['dateRange']) => 
                      setConfig(prev => ({ ...prev, dateRange: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last_week">Last Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Tickets will be generated with timestamps within this date range
                  </p>
                </div>
              </div>

              {isGenerating && generationProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating tickets...</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} />
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Tickets'}
                </Button>

                <Button
                  onClick={handleClearAll}
                  disabled={isGenerating || isClearing || !analytics?.totalTickets}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isClearing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {lastGeneration && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Successfully generated {lastGeneration.count} {lastGeneration.scenario} tickets at{' '}
                {new Date(lastGeneration.timestamp).toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {isLoadingAnalytics ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading analytics...</span>
              </CardContent>
            </Card>
          ) : analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalTickets}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.averageResponseTime.toFixed(1)}h
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">By Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {Object.entries(analytics.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">By Priority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {Object.entries(analytics.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between text-sm">
                      <span className="capitalize">{priority}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tickets generated yet</p>
                <p className="text-sm text-muted-foreground">Generate some tickets to see analytics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}