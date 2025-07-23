
"use client";

import * as React from "react";
import { Bot, User, BrainCircuit, ShieldAlert } from "lucide-react";

import type { AnalyzedTicket, TicketAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientDate } from "./client-date";
import { useAuth } from "@/hooks/use-auth";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { logAuditEvent } from "@/lib/audit-service";
import { getTicketSummary } from "@/ai/flows/get-ticket-summary";
import { Skeleton } from "./ui/skeleton";
import { getHighRiskTicketAnalysis } from "@/ai/flows/get-high-risk-ticket-analysis";

export function TicketConversationSheet({
  info,
  onOpenChange,
  onTicketUpdate,
}: {
  info: { ticket: AnalyzedTicket; riskAnalysis?: {
    predictedScore: number;
    riskFactors: string;
    deEscalationStrategy: string;
  } } | null;
  onOpenChange: (open: boolean) => void;
  onTicketUpdate: (ticketId: number, updates: Partial<AnalyzedTicket>) => void;
}) {
  const { user } = useAuth();
  const { logEvent } = useDiagnostics();
  const [summary, setSummary] = React.useState<string | undefined>(undefined);
  const [isSummaryLoading, setIsSummaryLoading] = React.useState(false);
  const [aiRiskAnalysis, setAiRiskAnalysis] = React.useState<null | {
    predictedScore: number;
    riskFactors: string;
    deEscalationStrategy: string;
  }>(null);
  const [isRiskAnalysisLoading, setIsRiskAnalysisLoading] = React.useState(false);
  
  const ticketId = info?.ticket?.id;

  React.useEffect(() => {
    if (info?.ticket) {
      setSummary(info.ticket.summary); 
      setIsSummaryLoading(false);

      if (!info.ticket.summary) {
        setIsSummaryLoading(true);

        const fullConversation = [
          { sender: 'customer' as const, message: info.ticket.description, timestamp: info.ticket.created_at },
          ...info.ticket.conversation,
        ];

        // Sort by timestamp to ensure correct order
        fullConversation.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const conversationForAI = fullConversation.map(({ sender, message }) => ({ sender, message }));

        const flowName = 'getTicketSummary';
        const input = { subject: info.ticket.subject, conversation: conversationForAI };
        logEvent('sent', flowName, input);
        getTicketSummary(input)
          .then(result => {
            logEvent('received', flowName, result);
            const newSummary = result.summary;
            const updates = { summary: newSummary };

            if (ticketId === info.ticket.id) {
              setSummary(newSummary);
              onTicketUpdate(info.ticket.id, updates);
            }
          })
          .catch(err => {
            logEvent('error', flowName, err);
            console.error("Failed to fetch summary", err);
            if (ticketId === info.ticket.id) {
              setSummary("AI summary could not be generated.");
            }
          })
          .finally(() => {
            if (ticketId === info.ticket.id) {
              setIsSummaryLoading(false);
            }
          });
      }
    }
  }, [ticketId, info, onTicketUpdate, logEvent]);

  React.useEffect(() => {
    if (info?.ticket && info.riskAnalysis) {
      setIsRiskAnalysisLoading(true);
      getHighRiskTicketAnalysis({
        id: info.ticket.id,
        subject: info.ticket.subject,
        description: info.ticket.description,
        created_at: info.ticket.created_at,
        sentiment: info.ticket.sentiment || 'Neutral',
        category: info.ticket.category || 'Uncategorized',
        priority: info.ticket.priority,
        status: info.ticket.status,
      })
        .then(result => setAiRiskAnalysis(result))
        .catch(() => setAiRiskAnalysis(null))
        .finally(() => setIsRiskAnalysisLoading(false));
    } else {
      setAiRiskAnalysis(null);
    }
  }, [info?.ticket, info?.riskAnalysis]);

  React.useEffect(() => {
    if (ticketId && user && info?.ticket?.subject) {
        logAuditEvent(user, 'TICKET_VIEWED', {
            ticketId: ticketId,
            subject: info.ticket.subject,
        });
    }
  }, [ticketId, user, info?.ticket?.subject]);

  if (!info?.ticket) {
    return null;
  }
  
  const { ticket, riskAnalysis } = info;

  const getRequesterInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  const fullConversation = [
      { sender: 'customer' as const, message: ticket.description, timestamp: ticket.created_at },
      ...ticket.conversation,
  ];
  fullConversation.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <Sheet open={!!info} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col p-0">
        <SheetHeader className="p-6">
          <SheetTitle className="truncate font-headline text-xl">
            {ticket.subject}
          </SheetTitle>
          <SheetDescription>
            Ticket #{ticket.id} from {ticket.requester}
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="secondary">{ticket.status}</Badge>
            {ticket.sentiment && (
                <Badge
                variant={
                    ticket.sentiment === "Positive"
                    ? "default"
                    : ticket.sentiment === "Negative"
                    ? "destructive"
                    : "secondary"
                }
                className={cn(ticket.sentiment === "Positive" && 'bg-green-600/80 text-white')}
                >
                {ticket.sentiment}
                </Badge>
            )}
            {ticket.category && <Badge variant="outline">{ticket.category}</Badge>}
            <Badge variant="outline">{ticket.priority} priority</Badge>
          </div>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {info?.riskAnalysis && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-6 w-6" />
                    <span>High-Risk Ticket Analysis</span>
                  </CardTitle>
                  <CardDescription className="text-destructive/90 pt-1">
                    This ticket is flagged by AI as having a high risk of a low CSAT score. <br />
                    Predicted Score: {isRiskAnalysisLoading ? (
                      <Badge variant="destructive" className="ml-1 animate-pulse">...</Badge>
                    ) : aiRiskAnalysis ? (
                      <Badge variant="destructive" className="ml-1">{aiRiskAnalysis.predictedScore} / 5</Badge>
                    ) : (
                      <Badge variant="destructive" className="ml-1">?</Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-foreground/90">Risk Factors</h4>
                    <p className="text-sm text-foreground/80">
                      {isRiskAnalysisLoading ? <span className="animate-pulse">Analyzing...</span> : aiRiskAnalysis ? aiRiskAnalysis.riskFactors : info.riskAnalysis.riskFactors}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-foreground/90">Suggested De-escalation Strategy</h4>
                    <p className="text-sm text-foreground/80">
                      {isRiskAnalysisLoading ? <span className="animate-pulse">Analyzing...</span> : aiRiskAnalysis ? aiRiskAnalysis.deEscalationStrategy : info.riskAnalysis.deEscalationStrategy}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {(isSummaryLoading || summary) && (
                <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <BrainCircuit className="h-4 w-4" />
                      <span>AI Summary</span>
                  </h4>
                  {isSummaryLoading ? (
                    <div className="space-y-2 pt-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/90">
                      {summary}
                    </p>
                  )}
                </div>
            )}
            
            {fullConversation.length > 0 && <Separator />}

            {fullConversation.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-4",
                  message.sender === "agent" && "flex-row-reverse"
                )}
              >
                <Avatar className="h-8 w-8">
                   <AvatarFallback>
                    {message.sender === 'customer' ? getRequesterInitials(ticket.requester) : <Bot />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "flex-1 space-y-2 rounded-lg p-3",
                    message.sender === "customer"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs text-muted-foreground/80">
                     <ClientDate dateString={message.timestamp} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
