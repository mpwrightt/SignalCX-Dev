
'use client';

import * as React from 'react';

export type LogEntry = {
  id: number;
  timestamp: Date;
  type: 'sent' | 'received' | 'error';
  flow: string;
  model?: string;
  agent?: string;
  duration?: number;
  data: any;
};

type DiagnosticsContextType = {
  logs: LogEntry[];
  logEvent: (type: LogEntry['type'], flow: string, data: any, options?: { model?: string; agent?: string; duration?: number }) => void;
  clearLogs: () => void;
};

const DiagnosticsContext = React.createContext<DiagnosticsContextType | undefined>(undefined);

let logIdCounter = 0;

export function DiagnosticsProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);

  const logEvent = React.useCallback((type: LogEntry['type'], flow: string, data: any, options?: { model?: string; agent?: string; duration?: number }) => {
    const newLog: LogEntry = {
      id: logIdCounter++,
      timestamp: new Date(),
      type,
      flow,
      model: options?.model,
      agent: options?.agent,
      duration: options?.duration,
      data: data instanceof Error ? { message: data.message, stack: data.stack } : data,
    };
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 100)); // Keep last 100 logs
  }, []);

  const clearLogs = React.useCallback(() => {
    setLogs([]);
  }, []);

  const value = { logs, logEvent, clearLogs };

  return React.createElement(DiagnosticsContext.Provider, { value }, children);
}

export function useDiagnostics() {
  const context = React.useContext(DiagnosticsContext);
  if (context === undefined) {
    throw new Error('useDiagnostics must be used within a DiagnosticsProvider');
  }
  return context;
}
