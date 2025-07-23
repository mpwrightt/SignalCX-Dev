
'use client';

import * as React from "react";
import { Monitor, Trash2 } from "lucide-react";

import { useDiagnostics } from "@/hooks/use-diagnostics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { LogEntry } from "@/hooks/use-diagnostics";

const LogList = ({ logs }: { logs: LogEntry[] }) => {
  if (logs.length === 0) {
    return <p className="text-sm text-center text-muted-foreground p-8">No logs of this type yet.</p>;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {logs.map(log => (
        <AccordionItem value={`log-${log.id}`} key={log.id}>
          <AccordionTrigger>
            <div className="flex justify-between items-center w-full pr-4">
              <div className="flex flex-col items-start">
                <span className="font-mono text-sm">{log.flow}</span>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {log.agent && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Agent: {log.agent}</span>}
                  {log.model && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Model: {log.model}</span>}
                  {log.duration && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">{log.duration}ms</span>}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{log.timestamp.toLocaleTimeString()}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <pre className="mt-2 w-full rounded-md bg-muted p-4 text-xs overflow-auto">
                {JSON.stringify(log.data, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export const DiagnosticsView = () => {
  const { logs, clearLogs } = useDiagnostics();

  const sentLogs = React.useMemo(() => logs.filter(l => l.type === 'sent'), [logs]);
  const receivedLogs = React.useMemo(() => logs.filter(l => l.type === 'received'), [logs]);
  const errorLogs = React.useMemo(() => logs.filter(l => l.type === 'error'), [logs]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Diagnostics Viewer</CardTitle>
          <CardDescription>Inspect data sent to and received from AI flows, and view any errors.</CardDescription>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Logs
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all diagnostic logs from the current session. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearLogs}>Clear Logs</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sent">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sent">Sent ({sentLogs.length})</TabsTrigger>
            <TabsTrigger value="received">Received ({receivedLogs.length})</TabsTrigger>
            <TabsTrigger value="errors">Errors ({errorLogs.length})</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[60vh] mt-4 border rounded-md">
            <TabsContent value="sent" className="m-0 p-2">
                <LogList logs={sentLogs} />
            </TabsContent>
            <TabsContent value="received" className="m-0 p-2">
                <LogList logs={receivedLogs} />
            </TabsContent>
            <TabsContent value="errors" className="m-0 p-2">
                <LogList logs={errorLogs} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};
