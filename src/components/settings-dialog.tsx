
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Trash2, HardDriveDownload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings, type Settings as SettingsFormValues, settingsSchema } from "@/hooks/use-settings";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { logAuditEvent } from "@/lib/audit-service";
import { generateTestTickets } from "@/lib/mock-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { generateRealisticTickets } from '@/ai/flows/generate-realistic-tickets';

const ANALYSIS_CACHE_KEY = 'signalcx-analysis-cache';

export function SettingsDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [testTicketCount, setTestTicketCount] = React.useState(0);
  const { toast } = useToast();
  const { settings, updateSettings, resetSettings, isLoaded } = useSettings();
  const { user, sessionMode } = useAuth();
  const isDemoMode = sessionMode === 'demo';
  const [activeTab, setActiveTab] = React.useState('general');

  // Local state for AI Ticket Generator tab
  const [aiTicketCount, setAiTicketCount] = React.useState(10);
  const [aiScenario, setAiScenario] = React.useState('SaaS platform support');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [aiGenResult, setAiGenResult] = React.useState<string | null>(null);
  const [aiClearResult, setAiClearResult] = React.useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  React.useEffect(() => {
    if (isLoaded) {
      form.reset(settings);
    }
  }, [isLoaded, settings, form, open]);

  React.useEffect(() => {
    if (open && typeof window !== 'undefined') {
      try {
        const storedTestTickets = localStorage.getItem('signalcx-test-tickets');
        if (storedTestTickets) {
          const testTickets = JSON.parse(storedTestTickets);
          setTestTicketCount(testTickets.length);
        } else {
          setTestTicketCount(0);
        }
      } catch (error) {
        console.error('Failed to load test ticket count:', error);
        setTestTicketCount(0);
      }
    }
  }, [open]);

  function onSubmit(data: SettingsFormValues) {
    updateSettings(data);
    setOpen(false);
    toast({
      title: "Settings Saved",
      description: "Your application settings have been updated.",
    });
  }

  const handleReset = () => {
    resetSettings();
    if (user) {
      logAuditEvent(user, 'SETTINGS_UPDATED', { details: 'Reset all settings to default' });
    }
    setOpen(false);
    toast({
      title: "Settings Reset",
      description: "Your settings have been restored to default.",
    });
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ANALYSIS_CACHE_KEY);
      if (user) {
        logAuditEvent(user, 'CACHE_CLEARED');
      }
      setOpen(false);
      toast({
        title: "Analysis Cache Cleared",
        description: "The AI analysis cache has been cleared. Refresh the page to see the changes.",
      });
      // Optionally, force a reload to reflect changes immediately
      window.location.reload();
    }
  };

  const handleGenerateTestTickets = () => {
    const count = form.getValues('testTicketCount');
    const testTickets = generateTestTickets(count);
    
    // Store test tickets in localStorage
    const existingTickets = JSON.parse(localStorage.getItem('signalcx-test-tickets') || '[]');
    const updatedTickets = [...existingTickets, ...testTickets];
    localStorage.setItem('signalcx-test-tickets', JSON.stringify(updatedTickets));
    
    if (user) {
      logAuditEvent(user, 'TEST_TICKETS_GENERATED', { count });
    }
    
    toast({
      title: "Test Tickets Generated",
      description: `${count} test tickets have been generated and added to your test data. Refresh the page to see them.`,
    });
    
    // Close the dialog so user can refresh
    setOpen(false);
  };

  const handleClearTestTickets = () => {
    localStorage.removeItem('signalcx-test-tickets');
    
    if (user) {
      logAuditEvent(user, 'TEST_TICKETS_CLEARED');
    }
    
    toast({
      title: "Test Tickets Cleared",
      description: "All test tickets have been removed from local storage. Refresh the page to see the changes.",
    });
    
    // Close the dialog so user can refresh
    setOpen(false);
  };

  // Handler for generating AI tickets
  const handleGenerateAiTickets = async () => {
    console.log('[DEBUG] Starting ticket generation...');
    console.log('[DEBUG] User:', user);
    
    if (!user?.organizationId) {
      setAiGenResult('No organization found. Please log in again.');
      return;
    }
    
    setIsGenerating(true);
    setAiGenResult(null);
    
    try {
      console.log('[DEBUG] Calling generateRealisticTickets with:', {
        count: aiTicketCount,
        organizationId: user.organizationId,
        scenario: aiScenario,
        complexity: 'moderate',
        includeConversations: true
      });
      
      const result = await generateRealisticTickets({
        count: aiTicketCount,
        organizationId: user.organizationId,
        scenario: aiScenario,
        complexity: 'moderate',
        includeConversations: true
      });
      
      console.log('[DEBUG] AI generation successful:', result);
      console.log('[DEBUG] AI ticket generation completed - storage not implemented');
      
      setAiGenResult(`Generated ${result.tickets.length} tickets successfully`);
    } catch (error) {
      console.error('[DEBUG] Error during ticket generation:', error);
      setAiGenResult(`Failed to generate tickets: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler for clearing AI tickets
  const handleClearAiTickets = async () => {
    if (!user?.organizationId) {
      setAiClearResult('No organization found. Please log in again.');
      return;
    }
    setIsGenerating(true);
    setAiClearResult(null);
    try {
      console.log('[DEBUG] Clear tickets not implemented - functionality removed during Firebase migration');
      setAiClearResult('Clear functionality not available after Firebase migration.');
    } catch (error) {
      setAiClearResult('Failed to clear tickets.');
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>
            Manage your application preferences and settings here.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            {isDemoMode && <TabsTrigger value="generator">AI Ticket Generator</TabsTrigger>}
          </TabsList>
          <TabsContent value="general">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <fieldset disabled={!isLoaded} className="space-y-4">
                    <ScrollArea className="h-[60vh] pr-6 mt-4">
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Data & Sync</h3>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="ticketFetchLimit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ticket Fetch Limit</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a limit" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="20">20 Tickets (Test)</SelectItem>
                                        <SelectItem value="50">50 Tickets</SelectItem>
                                        <SelectItem value="100">100 Tickets</SelectItem>
                                        <SelectItem value="250">250 Tickets</SelectItem>
                                        <SelectItem value="500">500 Tickets</SelectItem>
                                        <SelectItem value="1000">1000 Tickets</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Number of tickets to fetch per view.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                             <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300 text-xs">
                               <p>
                                  <strong>Note on API Keys:</strong> For security, your Google AI, Zendesk, and external Cache Service credentials must be configured in the <strong>.env</strong> file on the server. They are not configurable through this interface.
                               </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Predictive & SLA</h3>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="forecastDays"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Forecast Days</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="3" max="30" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                    </FormControl>
                                    <FormDescription>
                                      Days to forecast (3-30).
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="slaResponseHours"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>SLA Response Time</FormLabel>
                                      <FormControl>
                                        <Input type="number" min="1" max="168" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                      </FormControl>
                                    <FormDescription>
                                      Your target for first response (in hours).
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Agent Metrics</h3>
                            <Separator />
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-sm font-medium mb-3">Tier 1 Agents</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="agentTierMetrics.tier1.targetTicketsPerWeek"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Target Tickets per Week</FormLabel>
                                        <FormControl>
                                          <Input type="number" min="1" max="1000" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                        </FormControl>
                                        <FormDescription>
                                          Weekly ticket resolution target for Tier 1 agents.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="agentTierMetrics.tier1.targetHoursPerWeek"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Target Hours per Week</FormLabel>
                                        <FormControl>
                                          <Input type="number" min="1" max="168" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                        </FormControl>
                                        <FormDescription>
                                          Weekly hours target for Tier 1 agents.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-3">Tier 2 Agents</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="agentTierMetrics.tier2.targetTicketsPerWeek"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Target Tickets per Week</FormLabel>
                                        <FormControl>
                                          <Input type="number" min="1" max="1000" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                        </FormControl>
                                        <FormDescription>
                                          Weekly ticket resolution target for Tier 2 agents.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="agentTierMetrics.tier2.targetHoursPerWeek"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Target Hours per Week</FormLabel>
                                        <FormControl>
                                          <Input type="number" min="1" max="168" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                        </FormControl>
                                        <FormDescription>
                                          Weekly hours target for Tier 2 agents.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-3">Tier 3 Agents</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="agentTierMetrics.tier3.targetTicketsPerWeek"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Target Tickets per Week</FormLabel>
                                        <FormControl>
                                          <Input type="number" min="1" max="1000" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                        </FormControl>
                                        <FormDescription>
                                          Weekly ticket resolution target for Tier 3 agents.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="agentTierMetrics.tier3.targetHoursPerWeek"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Target Hours per Week</FormLabel>
                                        <FormControl>
                                          <Input type="number" min="1" max="168" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                        </FormControl>
                                        <FormDescription>
                                          Weekly hours target for Tier 3 agents.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">User Interface</h3>
                            <Separator />
                            <FormField
                              control={form.control}
                              name="enableAgenticMode"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">AI Analyst Mode</FormLabel>
                                    <FormDescription>
                                      Enable agentic AI analysis that intelligently selects and orchestrates analytics tools.
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="defaultPageOnLoad"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Default View</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a default view" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="dashboard">Dashboard</SelectItem>
                                      <SelectItem value="explorer">Ticket Explorer</SelectItem>
                                      <SelectItem value="clustering">Ticket Clustering</SelectItem>
                                      <SelectItem value="users">User Management</SelectItem>
                                      <SelectItem value="agents">Agent Performance</SelectItem>
                                      <SelectItem value="coaching">Manager Coaching</SelectItem>
                                      <SelectItem value="predictive">Predictive Analysis</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Choose which page to see when you first open the app.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                                control={form.control}
                                name="defaultDashboardTab"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Default Dashboard Tab</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a default tab" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="snapshot">Snapshot</SelectItem>
                                        <SelectItem value="trends">Trends</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Choose which tab to show by default on the Dashboard.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <FormField
                                    control={form.control}
                                    name="defaultTicketSort"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Default Sort Column</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select a column" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="created_at">Created Date</SelectItem>
                                            <SelectItem value="id">Ticket ID</SelectItem>
                                            <SelectItem value="subject">Subject</SelectItem>
                                            <SelectItem value="assignee">Assignee</SelectItem>
                                            <SelectItem value="sentiment">Sentiment</SelectItem>
                                            <SelectItem value="status">Status</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormDescription>
                                          Default column for sorting in the Ticket Explorer.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                   <FormField
                                    control={form.control}
                                    name="defaultTicketSortDirection"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Default Sort Direction</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select a direction" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="ascending">Ascending</SelectItem>
                                            <SelectItem value="descending">Descending</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormDescription>
                                          Default sort direction.
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                              </div>
                            <FormField
                              control={form.control}
                              name="enableCompactMode"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>Compact Mode</FormLabel>
                                    <FormDescription>
                                      Use a more condensed layout for tables to see more data.
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Testing & Development</h3>
                            <Separator />
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="testTicketCount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Test Ticket Count</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="1" 
                                          max="10" 
                                          {...field} 
                                          onChange={e => field.onChange(parseInt(e.target.value, 10))}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Number of test tickets to generate (1-10).
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex items-end gap-2">
                                  <Button 
                                    type="button" 
                                    onClick={handleGenerateTestTickets}
                                    className="flex-1"
                                  >
                                    Generate Test Tickets
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={handleClearTestTickets}
                                    className="flex-1"
                                  >
                                    Clear Test Data
                                  </Button>
                                </div>
                              </div>
                              <div className="rounded-md border border-blue-500/50 bg-blue-500/10 p-3 text-blue-800 dark:text-blue-300 text-xs">
                                <p>
                                  <strong>Test Data:</strong> Generated test tickets will be stored locally and can be used for testing the application features. Test tickets are separate from your live data and won't affect your actual analytics.
                                </p>
                                {testTicketCount > 0 && (
                                  <p className="mt-2 font-medium">
                                    Currently stored: {testTicketCount} test ticket{testTicketCount !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                    </ScrollArea>
                  
                  <DialogFooter>
                    <div className="flex items-center justify-start gap-2 w-full">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Reset All
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will reset all application settings to their original defaults. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">Reset Settings</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="ghost">
                            <HardDriveDownload className="mr-2 h-4 w-4" />
                            Clear Cache
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear AI Analysis Cache?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will clear all locally stored AI analysis results (sentiments, categories, summaries). You will need to re-run the analysis. This is useful for testing.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearCache}>Clear Cache & Reload</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={!isLoaded}>Save Changes</Button>
                  </DialogFooter>
                </fieldset>
              </form>
            </Form>
          </TabsContent>
          {isDemoMode && (
            <TabsContent value="generator">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">AI Ticket Generator</h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ai-ticket-count" className="block text-sm font-medium mb-1">Number of Tickets to Generate</label>
                    <input
                      id="ai-ticket-count"
                      type="number"
                      min={1}
                      max={50}
                      value={aiTicketCount}
                      onChange={e => setAiTicketCount(Number(e.target.value) || 1)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="ai-scenario" className="block text-sm font-medium mb-1">Scenario Context</label>
                    <select
                      id="ai-scenario"
                      value={aiScenario}
                      onChange={e => setAiScenario(e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="SaaS platform support">SaaS Platform Support</option>
                      <option value="E-commerce customer service">E-commerce Customer Service</option>
                      <option value="Financial services help desk">Financial Services Help Desk</option>
                      <option value="Technical API support">Technical API Support</option>
                      <option value="General customer support">General Customer Support</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2 col-span-2">
                    <Button type="button" onClick={handleGenerateAiTickets} disabled={isGenerating} className="flex-1">
                      {isGenerating ? 'Generating...' : 'Generate Tickets'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleClearAiTickets} disabled={isGenerating} className="flex-1">
                      Clear Generated Tickets
                    </Button>
                  </div>
                </div>
                {aiGenResult && <div className="text-green-700 dark:text-green-300 text-sm mt-2">{aiGenResult}</div>}
                {aiClearResult && <div className="text-blue-700 dark:text-blue-300 text-sm mt-2">{aiClearResult}</div>}
                <div className="rounded-md border border-blue-500/50 bg-blue-500/10 p-3 text-blue-800 dark:text-blue-300 text-xs mt-4">
                  <p>
                    <strong>Test Data:</strong> Generated tickets will be stored in Supabase and can be used for testing the application features. These tickets are separate from your live data and won't affect your actual analytics.
                  </p>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
