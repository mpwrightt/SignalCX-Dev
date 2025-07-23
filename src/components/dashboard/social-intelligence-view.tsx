
'use client';

import * as React from "react";
import { BrainCircuit, Loader2, Rss } from "lucide-react";
import {
  Bar,
  BarChart as BarChartRecharts,
  Pie,
  PieChart as PieChartRecharts,
  ResponsiveContainer,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

import { useToast } from "@/hooks/use-toast";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { socialMediaIntelligence, type SocialMediaIntelligenceOutput } from "@/ai/flows/social-media-intelligence";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AIPlaceholder } from "./ai-placeholder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ClientOnly } from "../client-only";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import Link from "next/link";

const TCGPLAYER_PROMPTS_KEY = 'signalcx-social-prompts';

const defaultPrompts = [
  "What are the overall sentiment and fraud trends this week regarding TCGplayer across social media and blogs?",
  "Are there widespread complaints about recent 'Magic: The Gathering' releases that we should address proactively on Twitter?",
  "Find positive customer stories related to TCGplayer Direct that we could feature in a blog post.",
  "What is the public sentiment on Reddit about our new Pro Seller tools? Cross-reference with any internal tickets.",
  "Identify any tickets that could become a PR risk. Search for public discussion about these topics.",
  "Are there any content creators or influencers discussing shipping delays or card condition issues?",
];

const chartColors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "destructive"];

export const SocialIntelligenceView = ({
  isAnalyzed,
}: {
  isAnalyzed: boolean;
}) => {
  const { toast } = useToast();
  const { logEvent } = useDiagnostics();
  const [question, setQuestion] = React.useState("");
  const [analysisResult, setAnalysisResult] = React.useState<SocialMediaIntelligenceOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [prompts, setPrompts] = React.useState<string[]>(defaultPrompts);
  const [newPrompt, setNewPrompt] = React.useState("");

  const legendWrapperStyle = {
    backgroundColor: "hsl(var(--secondary))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    padding: "8px 12px",
  };
  
  const sentimentColors: Record<string, string> = {
    Positive: "hsl(var(--chart-2))",
    Neutral: "hsl(var(--chart-3))",
    Negative: "hsl(var(--chart-5))",
    Mixed: "hsl(var(--chart-4))",
  };

  React.useEffect(() => {
    try {
      const storedPrompts = window.localStorage.getItem(TCGPLAYER_PROMPTS_KEY);
      if (storedPrompts) {
        setPrompts(JSON.parse(storedPrompts));
      }
    } catch (error) {
      console.error("Failed to load prompts from localStorage", error);
    }
  }, []);

  React.useEffect(() => {
    if (JSON.stringify(prompts) === JSON.stringify(defaultPrompts)) return;
    
    try {
      window.localStorage.setItem(TCGPLAYER_PROMPTS_KEY, JSON.stringify(prompts));
    } catch (error) {
      console.error("Failed to save prompts to localStorage", error);
    }
  }, [prompts]);

  const handleAddPrompt = () => {
    if (newPrompt.trim() && !prompts.includes(newPrompt.trim())) {
      setPrompts(prev => [...prev, newPrompt.trim()]);
      setNewPrompt("");
    }
  };

  const handleQuestionSubmit = React.useCallback(async (currentQuestion: string) => {
    if (!currentQuestion.trim()) return;

    setIsLoading(true);
    setAnalysisResult(null);
    const flowName = 'socialMediaIntelligence';
    const input = { question: currentQuestion };
    try {
      logEvent('sent', flowName, input);
      const result = await socialMediaIntelligence(input);
      logEvent('received', flowName, result);
      setAnalysisResult(result);
    } catch (error) {
      logEvent('error', flowName, error);
      console.error("Social media intelligence analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "The AI could not gather and analyze web data. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [logEvent, toast]);

  if (!isAnalyzed) {
    return (
      <AIPlaceholder
        pageName="Social Intelligence"
        isAnalyzed={isAnalyzed}
        Icon={Rss}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Social Media Analysis</CardTitle>
          <CardDescription>
            Correlate internal support tickets with public web sentiment. Ask the AI to analyze your current ticket view and search social media (like Reddit, X) and news sites to uncover PR risks, identify influencer sentiment, and find positive customer stories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="e.g., 'What is the public sentiment about our new Pro Seller tools?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <Button onClick={() => handleQuestionSubmit(question)} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Public Sentiment
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Or try a saved prompt:</p>
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuestion(prompt);
                    handleQuestionSubmit(prompt);
                  }}
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
           <div className="space-y-2 pt-4">
            <Label htmlFor="new-prompt">Add a new prompt</Label>
            <div className="flex gap-2">
              <Input
                id="new-prompt"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Add your own prompt to the list..."
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPrompt();
                  }
                }}
              />
              <Button onClick={handleAddPrompt} disabled={isLoading || !newPrompt.trim()}>Add</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <h3 className="font-semibold">Analyzing...</h3>
                <p className="text-sm text-muted-foreground">The AI is searching the web and analyzing public sentiment...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisResult && !isLoading && (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-6 w-6" />
                    <span>AI Executive Summary</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {analysisResult.summary}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Public Sentiment</CardTitle>
                        <CardDescription>Sentiment distribution from web results.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                    {analysisResult.sentimentBreakdown.some(d => d.value > 0) ? (
                        <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChartRecharts>
                            <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                            <Pie data={analysisResult.sentimentBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={5} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">{`${(percent * 100).toFixed(0)}%`}</text>;
                            }}>
                                {analysisResult.sentimentBreakdown.map((entry) => <Cell key={entry.name} fill={sentimentColors[entry.name]} />)}
                            </Pie>
                            <Legend wrapperStyle={legendWrapperStyle} />
                            </PieChartRecharts>
                        </ResponsiveContainer>
                        </ClientOnly>
                    ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No sentiment data found</div>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Top 5 Discussion Themes</CardTitle>
                        <CardDescription>Most frequent topics from web results.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pl-2">
                    {analysisResult.topThemes.length > 0 ? (
                        <ClientOnly fallback={<Skeleton className="h-full w-full" />}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChartRecharts data={analysisResult.topThemes} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--foreground))" }} width={120} />
                            <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 2px)" }} itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                            <Bar dataKey="value" barSize={35} radius={[0, 4, 4, 0]}>
                                {analysisResult.topThemes.map((_entry, index) => <Cell key={`cell-${index}`} fill={`hsl(var(--${chartColors[index % chartColors.length]}))`}/>)}
                            </Bar>
                            </BarChartRecharts>
                        </ResponsiveContainer>
                        </ClientOnly>
                    ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground">No themes found</div>}
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Key Mentions</CardTitle>
                    <CardDescription>Representative posts and articles found on the web.</CardDescription>
                </CardHeader>
                <CardContent>
                    {analysisResult.keyMentions.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {analysisResult.keyMentions.map((mention, i) => (
                                <AccordionItem value={`item-${i}`} key={i}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-4 text-left">
                                            <Badge variant={mention.sentiment === 'Negative' ? 'destructive' : 'secondary'}>{mention.sentiment}</Badge>
                                            <span className="flex-1">From <span className="font-bold">{mention.author}</span> on <span className="font-bold">{mention.source}</span></span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3">
                                        <blockquote className="border-l-2 pl-4 italic">"{mention.snippet}"</blockquote>
                                        <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                            <Link href={mention.link} target="_blank" rel="noopener noreferrer">View Original Post</Link>
                                        </Button>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center p-8">No specific key mentions were identified by the AI.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
};
