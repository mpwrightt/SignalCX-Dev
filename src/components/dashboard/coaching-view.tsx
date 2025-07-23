
'use client';

import * as React from "react";
import { GraduationCap } from "lucide-react";

import type { AnalyzedTicket, CoachingInsight } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AIPlaceholder } from "./ai-placeholder";

export const CoachingView = ({
  tickets,
  isAnalyzed,
  insights,
  onTicketSelect,
}: {
  tickets: AnalyzedTicket[];
  isAnalyzed: boolean;
  insights: CoachingInsight[];
  onTicketSelect: (ticket: AnalyzedTicket) => void;
}) => {

  const handleTicketClick = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if(ticket) {
      onTicketSelect(ticket);
    }
  };
  
  if (insights.length === 0) {
    return (
      <AIPlaceholder
        pageName="Manager Coaching"
        isAnalyzed={isAnalyzed}
        Icon={GraduationCap}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Manager Coaching Dashboard</CardTitle>
          <CardDescription>AI-generated insights to help coach your support agents and improve team performance.</CardDescription>
        </CardHeader>
      </Card>
      {insights.map((insight, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <Avatar>
              <AvatarImage data-ai-hint="profile avatar" src={`https://placehold.co/64x64.png`} />
              <AvatarFallback>{insight.agentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>{insight.insightType === 'Positive' ? 'Praise & Recognition' : 'Coaching Opportunity'}</CardTitle>
              <CardDescription>
                For <span className="font-semibold text-primary">{insight.agentName}</span> regarding <span className="font-semibold text-primary">{insight.category}</span> tickets.
              </CardDescription>
            </div>
            <Badge variant={insight.insightType === 'Positive' ? 'default' : 'destructive'} className={cn(insight.insightType === 'Positive' && 'bg-green-600/80')}>{insight.insightType}</Badge>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{insight.description}</p>
            <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Related Tickets</h4>
            <div className="flex gap-2">
              {insight.exampleTicketIds.map(id => (
                <Button key={id} variant="outline" size="sm" onClick={() => handleTicketClick(id)}>#{id}</Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
