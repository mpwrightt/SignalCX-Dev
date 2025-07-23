
'use client';

import * as React from "react";
import { BrainCircuit, Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import type { AnalyzedTicket } from "@/lib/types";
import { queryTickets, type QueryTicketsOutput } from "@/ai/flows/query-tickets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AIPlaceholder } from "./ai-placeholder";
import { FileSearch } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const AISearchView = ({
  tickets,
  isAnalyzed,
  onTicketSelect,
}: {
  tickets: AnalyzedTicket[];
  isAnalyzed: boolean;
  onTicketSelect: (info: { ticket: AnalyzedTicket }) => void;
}) => {
  const { toast } = useToast();
  const { logEvent } = useDiagnostics();
  const [question, setQuestion] = React.useState("");
  const [result, setResult] = React.useState<QueryTicketsOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const examplePrompts = [
    "Show me all open tickets assigned to Bruce Wayne.",
    "List all tickets with 'damaged' in the subject line.",
    "Summarize the issues reported by the user 'Olivia Johnson'.",
    "Are there any tickets created in the last 24 hours with a 'urgent' priority?",
  ];

  const handleQuestionSubmit = async (currentQuestion: string) => {
    if (!currentQuestion.trim()) return;

    setIsLoading(true);
    setResult(null);
    const flowName = 'queryTickets';
    const input = {
      tickets: tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        description: t.description,
        sentiment: t.sentiment || 'Neutral',
        category: t.category || 'Uncategorized',
        status: t.status,
        assignee: t.assignee,
        requester: t.requester,
        created_at: t.created_at,
      })),
      question: currentQuestion,
    };
    try {
      logEvent('sent', flowName, input);
      const queryResult = await queryTickets(input);
      logEvent('received', flowName, queryResult);
      setResult(queryResult);
    } catch (error) {
      logEvent('error', flowName, error);
      console.error("AI Search failed:", error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "The AI could not answer the question. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAnalyzed) {
    return (
      <AIPlaceholder
        pageName="AI Search"
        isAnalyzed={isAnalyzed}
        Icon={FileSearch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Search</CardTitle>
          <CardDescription>
            Ask a natural language question about the tickets in your current view. This tool is designed for support analysts to quickly find information and summarize ticket data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="e.g., 'List all tickets with a negative sentiment in the 'Billing' category.'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <Button onClick={() => handleQuestionSubmit(question)} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ask Question
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Or try an example:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, i) => (
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
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <h3 className="font-semibold">Analyzing...</h3>
                <p className="text-sm text-muted-foreground">The AI is reading through the tickets to find an answer.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-6 w-6" />
              <span>AI Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p>{result.answer}</p>
            </div>
            {result.foundTickets && result.foundTickets.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-foreground/90">Matching Tickets</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket ID</TableHead>
                          <TableHead>Subject</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.foundTickets.map(foundTicket => (
                          <TableRow
                            key={foundTicket.id}
                            className="cursor-pointer"
                            onClick={() => {
                              const fullTicket = tickets.find(t => t.id === foundTicket.id);
                              if (fullTicket) {
                                onTicketSelect({ ticket: fullTicket });
                              } else {
                                toast({
                                  variant: 'destructive',
                                  title: 'Ticket Not Found',
                                  description: `Ticket #${foundTicket.id} could not be found in the current view.`,
                                });
                              }
                            }}
                          >
                            <TableCell className="font-medium">#{foundTicket.id}</TableCell>
                            <TableCell>{foundTicket.subject}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
