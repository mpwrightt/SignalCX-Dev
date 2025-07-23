
"use client";

import * as React from "react";
import { Mail, Smile, Frown, Meh } from "lucide-react";

import type { AnalyzedTicket, UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientDate } from "./client-date";
import { Separator } from "./ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { logAuditEvent } from "@/lib/audit-service";

export function UserProfileSheet({
  user: profileUser,
  onOpenChange,
  onTicketSelect,
}: {
  user: UserProfile | null;
  onOpenChange: (open: boolean) => void;
  onTicketSelect: (info: { ticket: AnalyzedTicket }) => void;
}) {
  const { user: authUser } = useAuth();

  React.useEffect(() => {
    if (profileUser && authUser) {
        logAuditEvent(authUser, 'USER_PROFILE_VIEWED', {
            viewedUserId: profileUser.email,
            viewedUserName: profileUser.name,
        });
    }
  }, [profileUser, authUser]);

  if (!profileUser) {
    return null;
  }

  const getRequesterInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <Sheet open={!!profileUser} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0">
        <SheetHeader className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                data-ai-hint="profile avatar"
                src={`https://placehold.co/64x64.png`}
                alt={profileUser.name}
              />
              <AvatarFallback>{getRequesterInitials(profileUser.name)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-2xl font-headline">{profileUser.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{profileUser.email}</span>
              </SheetDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-4">
            <div className="text-left">
              <div className="font-bold text-lg">{profileUser.totalTickets}</div>
              <div className="text-xs text-muted-foreground">Total Tickets</div>
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">{profileUser.avgCsat}</div>
              <div className="text-xs text-muted-foreground">Avg. CSAT</div>
            </div>
            <div className="text-left">
               <div className="font-bold text-lg"><ClientDate dateString={profileUser.lastContact} /></div>
              <div className="text-xs text-muted-foreground">Last Contact</div>
            </div>
          </div>
        </SheetHeader>
        <div className="px-6 pb-4">
            <h4 className="text-sm font-semibold mb-2">Sentiment History</h4>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Smile className="h-5 w-5 text-green-500" />
                    <div>
                        <div className="font-bold text-lg">{profileUser.sentiments.Positive}</div>
                        <div className="text-xs text-muted-foreground">Positive</div>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Meh className="h-5 w-5 text-yellow-500" />
                    <div>
                        <div className="font-bold text-lg">{profileUser.sentiments.Neutral}</div>
                        <div className="text-xs text-muted-foreground">Neutral</div>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Frown className="h-5 w-5 text-red-500" />
                    <div>
                        <div className="font-bold text-lg">{profileUser.sentiments.Negative}</div>
                        <div className="text-xs text-muted-foreground">Negative</div>
                    </div>
                </div>
            </div>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-6">
            <h3 className="font-semibold mb-4 text-lg">Ticket History</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profileUser.tickets.map(ticket => (
                    <TableRow key={ticket.id} onClick={() => onTicketSelect({ ticket })} className="cursor-pointer">
                      <TableCell className="font-medium">#{ticket.id}</TableCell>
                      <TableCell className="max-w-[250px] truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{ticket.status}</Badge>
                      </TableCell>
                      <TableCell><ClientDate dateString={ticket.created_at} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
