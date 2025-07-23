
'use client';

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalyzedTicket, UserProfile } from "@/lib/types";
import { ClientDate } from "@/components/client-date";

export const UserManagementView = ({
  tickets,
  loading,
  onUserSelect,
}: {
  tickets: AnalyzedTicket[];
  loading: boolean;
  onUserSelect: (user: UserProfile) => void;
}) => {
  const users: UserProfile[] = React.useMemo(() => {
    const userMap = new Map<string, {
      tickets: AnalyzedTicket[],
      totalTickets: number,
      csatScores: number[],
      sentiments: Record<'Positive' | 'Neutral' | 'Negative', number>,
    }>();

    tickets.forEach(ticket => {
      if (!userMap.has(ticket.requester)) {
        userMap.set(ticket.requester, { tickets: [], totalTickets: 0, csatScores: [], sentiments: { Positive: 0, Neutral: 0, Negative: 0 } });
      }
      const userData = userMap.get(ticket.requester)!;
      userData.tickets.push(ticket);
      userData.totalTickets += 1;
      if (ticket.csat_score) {
        userData.csatScores.push(ticket.csat_score);
      }
      if (ticket.sentiment) {
        userData.sentiments[ticket.sentiment]++;
      }
    });

    return Array.from(userMap.entries()).map(([name, data]) => {
      const avgCsat = data.csatScores.length > 0
        ? (data.csatScores.reduce((a, b) => a + b, 0) / data.csatScores.length).toFixed(1)
        : 'N/A';
      
      const lastContact = data.tickets.reduce((latest, ticket) => {
        return new Date(ticket.created_at) > new Date(latest) ? ticket.created_at : latest;
      }, data.tickets[0]?.created_at || new Date().toISOString());

      return {
        name,
        email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
        totalTickets: data.totalTickets,
        avgCsat,
        lastContact,
        tickets: data.tickets.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        sentiments: data.sentiments,
      };
    }).sort((a, b) => b.totalTickets - a.totalTickets);
  }, [tickets]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Overview</CardTitle>
        <CardDescription>A list of all users and their support history.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Total Tickets</TableHead>
              <TableHead>Avg. CSAT (1-5)</TableHead>
              <TableHead>Last Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`user-skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                </TableRow>
              ))
            ) : (
              users.map(user => (
                <TableRow key={user.name} onClick={() => onUserSelect(user)} className="cursor-pointer">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.totalTickets}</TableCell>
                  <TableCell>{user.avgCsat}</TableCell>
                  <TableCell><ClientDate dateString={user.lastContact} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
