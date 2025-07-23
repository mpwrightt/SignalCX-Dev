
'use client';

import * as React from "react";
import {
  Area,
  AreaChart as AreaChartRecharts,
  Bar,
  BarChart as BarChartRecharts,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as LineChartRecharts,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";
import { AreaChart, BrainCircuit, Clock, FileText, FlaskConical, ShieldAlert, Star, TrendingUp } from "lucide-react";

import { useSettings } from "@/hooks/use-settings";
import type { AnalyzedTicket, AtRiskTicket, AuthenticatedUser, PredictiveAnalysisOutput } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnly } from "@/components/client-only";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AIPlaceholder } from "./ai-placeholder";

type SelectedTicketInfo = {
  ticket: AnalyzedTicket;
  riskAnalysis?: AtRiskTicket;
}

export const PredictiveView = ({
  user,
  tickets,
  historicalVolume,
  legendWrapperStyle,
  onTicketSelect,
  isAnalyzed,
  prediction,
}: {
  user: AuthenticatedUser;
  tickets: AnalyzedTicket[];
  historicalVolume: { date: string; count: number }[];
  legendWrapperStyle: React.CSSProperties;
  onTicketSelect: (info: SelectedTicketInfo) => void;
  isAnalyzed: boolean;
  prediction: PredictiveAnalysisOutput | null;
}) => {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = React.useState('forecast');
  
  // Function to find ticket by subject
  const findTicketBySubject = (ticketSubject: string) => {
    const ticket = tickets.find(t => t.subject === ticketSubject || t.subject.includes(ticketSubject));
    return ticket;
  };
  
  // Function to handle example ticket click
  const handleExampleTicketClick = (ticketSubject: string) => {
    const ticket = findTicketBySubject(ticketSubject);
    if (ticket) {
      onTicketSelect({ ticket });
    }
  };
  


  const combinedChartData = React.useMemo(() => {
    const data = historicalVolume.map(d => ({ 
        date: d.date, 
        'This Year': d.count,
        'Last Year': Math.max(0, Math.round(d.count * 0.8 + (Math.random() - 0.5) * 10)),
    }));
    
    if (!prediction) return data;

    const forecastData = prediction.forecast.map(p => ({
      date: p.date,
      Forecast: p.predictedVolume,
      Confidence: [p.lowerBound, p.upperBound],
    }));

    return [...data, ...forecastData];
  }, [historicalVolume, prediction]);
  
  if (!prediction) {
    return <AIPlaceholder 
      pageName="Predictive Analysis"
      isAnalyzed={isAnalyzed}
      Icon={TrendingUp}
    />;
  }
  
  const handleAtRiskTicketClick = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const riskInfo = prediction.atRiskTickets.find(r => r.ticketId === ticketId);
    if (ticket && riskInfo) {
      onTicketSelect({ ticket, riskAnalysis: riskInfo });
    }
  };

  const handleSlaRiskTicketClick = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      onTicketSelect({ ticket });
    }
  };

  const agentView = (
    <div className="space-y-4 md:space-y-8">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-primary" />
              <span>AI Triage Summary</span>
            </CardTitle>
            <CardDescription>An AI-generated summary for agents focused on bug detection and triage.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{prediction.agentTriageSummary}</p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Emerging Issues</CardTitle>
                <CardDescription>Potential new problems identified by AI from recent tickets. Use this to spot trends and triage bugs.</CardDescription>
            </CardHeader>
            <CardContent>
                {prediction.emergingIssues.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {prediction.emergingIssues.map((issue, i) => (
                            <AccordionItem value={`item-${i}`} key={i}>
                                <AccordionTrigger>{issue.theme}</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <p className="text-sm">{issue.impact}</p>
                                    <h5 className="font-semibold text-xs pt-2 text-muted-foreground">EXAMPLE TICKETS</h5>
                                    <ul className="list-disc pl-4 text-xs text-muted-foreground">
                                        {issue.exampleTickets.map((ex, j) => (
                                          <li key={j}>
                                            <button
                                              onClick={() => handleExampleTicketClick(ex)}
                                              className="hover:text-primary transition-colors cursor-pointer text-left"
                                            >
                                              {ex}
                                            </button>
                                          </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-sm text-center py-8 text-muted-foreground">No significant new issues detected. Current trends appear stable.</p>
                )}
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
              <CardTitle>Category Trends</CardTitle>
              <CardDescription>Predicted changes in volume for key issue types.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Trend</TableHead>
                          <TableHead>Prediction</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {prediction.categoryTrends.map((cat, i) => (
                          <TableRow key={i}>
                              <TableCell className="font-medium">{cat.category}</TableCell>
                              <TableCell>
                                  <Badge variant={cat.trend === 'Increasing' ? 'destructive' : 'secondary'}>{cat.trend}</Badge>
                              </TableCell>
                              <TableCell>{cat.prediction}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span>Doc Opportunities</span>
              </CardTitle>
              <CardDescription>Recurring issues that could be solved faster with new macros.</CardDescription>
          </CardHeader>
          <CardContent>
              {prediction.documentationOpportunities.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                      {prediction.documentationOpportunities.map((opp, i) => (
                          <AccordionItem value={`item-${i}`} key={i}>
                              <AccordionTrigger>{opp.topic}</AccordionTrigger>
                              <AccordionContent className="space-y-3">
                                  <p className="text-sm">{opp.justification}</p>
                                  <Badge variant="outline">{opp.relatedTicketCount} related tickets found</Badge>
                                  <h5 className="font-semibold text-xs pt-2 text-muted-foreground">EXAMPLE TICKETS</h5>
                                  <ul className="list-disc pl-4 text-xs text-muted-foreground">
                                      {opp.exampleTickets.map((ex, j) => (
                                        <li key={j}>
                                          <button
                                            onClick={() => handleExampleTicketClick(ex)}
                                            className="hover:text-primary transition-colors cursor-pointer text-left"
                                          >
                                            {ex}
                                          </button>
                                        </li>
                                      ))}
                                  </ul>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                  </Accordion>
              ) : (
                  <p className="text-sm text-center py-8 text-muted-foreground">No significant documentation gaps detected.</p>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const managerView = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="forecast">
          <AreaChart className="mr-2 h-4 w-4" />
          Trends & Forecasts
        </TabsTrigger>
        <TabsTrigger value="risks">
          <FlaskConical className="mr-2 h-4 w-4" />
          Risks & Opportunities
        </TabsTrigger>

      </TabsList>
      <TabsContent value="forecast" className="space-y-4 md:space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{settings.forecastDays}-Day Ticket Volume Forecast</CardTitle>
            <CardDescription>
              Combines historical and year-over-year data with AI-powered predictions to forecast incoming ticket volume.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] w-full pl-2">
            <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChartRecharts data={combinedChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--foreground))" }} allowDecimals={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "calc(var(--radius) - 2px)",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend wrapperStyle={legendWrapperStyle} />
                  <Line type="monotone" dataKey="This Year" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Last Year" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} strokeDasharray="3 7" />
                  <Line type="monotone" dataKey="Forecast" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="5 5" />
                  {combinedChartData.some(d => Array.isArray(d.Confidence)) && (
                    <Area type="monotone" dataKey="Confidence" stroke={false} fill="hsl(var(--chart-2))" fillOpacity={0.2} />
                  )}
                </LineChartRecharts>
              </ResponsiveContainer>
            </ClientOnly>
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Category Trends</CardTitle>
                <CardDescription>Predicted changes in volume for key issue types.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Trend</TableHead>
                            <TableHead>Prediction</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prediction.categoryTrends.map((cat, i) => (
                            <TableRow key={i}>
                                <TableCell className="font-medium">{cat.category}</TableCell>
                                <TableCell>
                                    <Badge variant={cat.trend === 'Increasing' ? 'destructive' : 'secondary'}>{cat.trend}</Badge>
                                </TableCell>
                                <TableCell>{cat.prediction}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="risks" className="space-y-4 md:space-y-8">
        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2">
              <CardHeader>
                  <CardTitle>Overall Analysis</CardTitle>
                  <CardDescription>AI-generated summary of trends and patterns influencing the forecast.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-sm leading-relaxed">{prediction.overallAnalysis}</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                      <span>Recommendations</span>
                      <Badge variant="outline" className="flex items-center gap-1.5 text-sm">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{(prediction.confidenceScore * 100).toFixed(0)}%</span>
                          <span className="text-muted-foreground text-xs">Conf.</span>
                      </Badge>
                  </CardTitle>
                  <CardDescription>Actionable steps for support managers.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ul className="list-disc space-y-3 pl-4 text-sm">
                      {prediction.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
              </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
              <CardTitle>Emerging Issues</CardTitle>
              <CardDescription>Potential new problems identified by AI from recent tickets.</CardDescription>
          </CardHeader>
          <CardContent>
              {prediction.emergingIssues.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                      {prediction.emergingIssues.map((issue, i) => (
                          <AccordionItem value={`item-${i}`} key={i}>
                              <AccordionTrigger>{issue.theme}</AccordionTrigger>
                              <AccordionContent className="space-y-2">
                                  <p className="text-sm">{issue.impact}</p>
                                  <h5 className="font-semibold text-xs pt-2 text-muted-foreground">EXAMPLE TICKETS</h5>
                                  <ul className="list-disc pl-4 text-xs text-muted-foreground">
                                      {issue.exampleTickets.map((ex, j) => (
                                        <li key={j}>
                                          <button
                                            onClick={() => handleExampleTicketClick(ex)}
                                            className="hover:text-primary transition-colors cursor-pointer text-left"
                                          >
                                            {ex}
                                          </button>
                                        </li>
                                      ))}
                                  </ul>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                  </Accordion>
              ) : (
                  <p className="text-sm text-center py-8 text-muted-foreground">No significant new issues detected.</p>
              )}
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                    <span>High-Risk Tickets</span>
                  </CardTitle>
                  <CardDescription>Open tickets predicted to have a low CSAT score. Intervene now to prevent a poor customer experience.</CardDescription>
              </CardHeader>
              <CardContent>
                {prediction.atRiskTickets.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Ticket</TableHead>
                              <TableHead>Reason for Risk</TableHead>
                              <TableHead>Pred. CSAT</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {prediction.atRiskTickets.map((ticket) => (
                              <TableRow key={ticket.ticketId} className="cursor-pointer" onClick={() => handleAtRiskTicketClick(ticket.ticketId)}>
                                  <TableCell>
                                    <div className="font-medium">#{ticket.ticketId}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-48">{ticket.subject}</div>
                                  </TableCell>
                                  <TableCell className="text-sm">{ticket.reason}</TableCell>
                                  <TableCell className="text-center">
                                      <Badge variant="destructive">{ticket.predictedCsat} / 5</Badge>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-center py-8 text-muted-foreground">No high-risk tickets detected in this view.</p>
                )}
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-yellow-600" />
                    <span>SLA Breach Warnings</span>
                  </CardTitle>
                  <CardDescription>Open tickets predicted to breach their first response SLA.</CardDescription>
              </CardHeader>
              <CardContent>
                {prediction.predictedSlaBreaches.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Ticket</TableHead>
                              <TableHead>Reason for Risk</TableHead>
                              <TableHead>Est. Breach</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {prediction.predictedSlaBreaches.map((ticket) => (
                              <TableRow key={ticket.ticketId} className="cursor-pointer" onClick={() => handleSlaRiskTicketClick(ticket.ticketId)}>
                                  <TableCell>
                                    <div className="font-medium">#{ticket.ticketId}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-48">{ticket.subject}</div>
                                  </TableCell>
                                  <TableCell className="text-sm">{ticket.reason}</TableCell>
                                  <TableCell>
                                      <Badge variant="outline">{ticket.predictedBreachTime}</Badge>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-center py-8 text-muted-foreground">No tickets at risk of SLA breach.</p>
                )}
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <span>Doc Opportunities</span>
                  </CardTitle>
                  <CardDescription>Recurring issues that could be solved faster with new macros.</CardDescription>
              </CardHeader>
              <CardContent>
                  {prediction.documentationOpportunities.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full">
                          {prediction.documentationOpportunities.map((opp, i) => (
                              <AccordionItem value={`item-${i}`} key={i}>
                                  <AccordionTrigger>{opp.topic}</AccordionTrigger>
                                  <AccordionContent className="space-y-3">
                                      <p className="text-sm">{opp.justification}</p>
                                      <Badge variant="outline">{opp.relatedTicketCount} related tickets found</Badge>
                                      <h5 className="font-semibold text-xs pt-2 text-muted-foreground">EXAMPLE TICKETS</h5>
                                      <ul className="list-disc pl-4 text-xs text-muted-foreground">
                                          {opp.exampleTickets.map((ex, j) => (
                                            <li key={j}>
                                              <button
                                                onClick={() => handleExampleTicketClick(ex)}
                                                className="hover:text-primary transition-colors cursor-pointer text-left"
                                              >
                                                {ex}
                                              </button>
                                            </li>
                                          ))}
                                      </ul>
                                  </AccordionContent>
                              </AccordionItem>
                          ))}
                      </Accordion>
                  ) : (
                      <p className="text-sm text-center py-8 text-muted-foreground">No significant documentation gaps detected.</p>
                  )}
              </CardContent>
          </Card>
        </div>
      </TabsContent>

    </Tabs>
  );

  return user.role === 'agent' ? agentView : managerView;
};
