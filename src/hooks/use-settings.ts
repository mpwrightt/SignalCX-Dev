
'use client';

import * as React from 'react';
import { z } from 'zod';
import type { DashboardComponentConfig } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { logAuditEvent } from '@/lib/audit-service';

const dashboardComponentSchema = z.object({
  id: z.string(),
  label: z.string(),
  visible: z.boolean().default(true),
  type: z.enum(['kpi', 'chart', 'summary']),
  tab: z.enum(['snapshot', 'trends']),
  width: z.enum(['full', 'half']),
});

export const settingsSchema = z.object({
  ticketFetchLimit: z.coerce.number().min(20).max(1000).default(20),
  forecastDays: z.coerce.number().min(3).max(30).default(7),
  slaResponseHours: z.coerce.number().min(1).max(168).default(24),
  defaultPageOnLoad: z.enum(["dashboard", "explorer", "predictive", "users", "agents", "coaching", "clustering", "social", "ai-search"]).default("dashboard"),
  enableCompactMode: z.boolean().default(false),
  defaultDashboardTab: z.enum(["snapshot", "trends"]).default("snapshot"),
  defaultTicketSort: z.enum(["created_at", "id", "subject", "assignee", "sentiment", "status"]).default("created_at"),
  defaultTicketSortDirection: z.enum(["ascending", "descending"]).default("descending"),
  testTicketCount: z.coerce.number().min(1).max(10).default(5),
  enableAgenticMode: z.boolean().default(false),
  // New agent tier metrics settings
  agentTierMetrics: z.object({
    tier1: z.object({
      targetTicketsPerWeek: z.coerce.number().min(1).max(1000).default(50),
      targetHoursPerWeek: z.coerce.number().min(1).max(168).default(40),
    }),
    tier2: z.object({
      targetTicketsPerWeek: z.coerce.number().min(1).max(1000).default(75),
      targetHoursPerWeek: z.coerce.number().min(1).max(168).default(40),
    }),
    tier3: z.object({
      targetTicketsPerWeek: z.coerce.number().min(1).max(1000).default(100),
      targetHoursPerWeek: z.coerce.number().min(1).max(168).default(40),
    }),
  }).default({
    tier1: { targetTicketsPerWeek: 50, targetHoursPerWeek: 40 },
    tier2: { targetTicketsPerWeek: 75, targetHoursPerWeek: 40 },
    tier3: { targetTicketsPerWeek: 100, targetHoursPerWeek: 40 },
  }),
  dashboardComponents: z.array(dashboardComponentSchema).default([
    // Snapshot KPIs
    { id: 'kpi-tickets-in-view', label: 'Tickets in View', visible: true, type: 'kpi', tab: 'snapshot', width: 'half' },
    { id: 'kpi-open-tickets', label: 'Open Tickets', visible: true, type: 'kpi', tab: 'snapshot', width: 'half' },
    { id: 'kpi-negative-sentiment', label: 'Negative Sentiment', visible: true, type: 'kpi', tab: 'snapshot', width: 'half' },
    { id: 'kpi-csat', label: 'CSAT', visible: true, type: 'kpi', tab: 'snapshot', width: 'half' },
    { id: 'kpi-fcr', label: 'First Contact Resolution', visible: false, type: 'kpi', tab: 'snapshot', width: 'half' },
    { id: 'kpi-sla-attainment', label: 'SLA Attainment', visible: false, type: 'kpi', tab: 'snapshot', width: 'half' },
    { id: 'kpi-avg-first-response', label: 'Avg. First Response Time', visible: true, type: 'kpi', tab: 'snapshot', width: 'half' },
    { id: 'kpi-avg-resolution', label: 'Avg. Resolution Time', visible: true, type: 'kpi', tab: 'snapshot', width: 'half' },
    { id: 'kpi-backlog', label: 'Estimated Backlog (Days)', visible: true, type: 'kpi', tab: 'snapshot', width: 'half' },
    // Snapshot Charts
    { id: 'chart-top-categories', label: 'Top 5 Issue Categories Chart', visible: true, type: 'chart', tab: 'snapshot', width: 'full' },
    { id: 'summary-agent-leaderboard', label: 'Agent Leaderboard', visible: true, type: 'summary', tab: 'snapshot', width: 'full' },
    { id: 'chart-sentiment-breakdown', label: 'Sentiment Breakdown Chart', visible: true, type: 'chart', tab: 'snapshot', width: 'half' },
    { id: 'chart-priority-breakdown', label: 'Priority Breakdown Chart', visible: false, type: 'chart', tab: 'snapshot', width: 'half' },
    { id: 'chart-unsolved-by-age', label: 'Unsolved Tickets by Age Chart', visible: false, type: 'chart', tab: 'snapshot', width: 'half' },
    // Trends Components
    { id: 'chart-ticket-volume', label: 'Ticket Volume Over Time Chart', visible: true, type: 'chart', tab: 'trends', width: 'full' },
    { id: 'chart-sentiment-over-time', label: 'Sentiment Over Time Chart', visible: true, type: 'chart', tab: 'trends', width: 'full' },
    { id: 'summary-automated-trend', label: 'Automated Trend Summary', visible: true, type: 'summary', tab: 'trends', width: 'half' },
    { id: 'chart-top-tags', label: 'Top 5 Tags Chart', visible: true, type: 'chart', tab: 'trends', width: 'half' },
  ]),
});

export type Settings = z.infer<typeof settingsSchema>;

const SETTINGS_KEY = 'signalcx-settings';

const defaultSettings = settingsSchema.parse({});

type SettingsContextType = {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
  isLoaded: boolean;
};

const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    try {
      const storedSettings = window.localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Merge with defaults to ensure new settings are not missing
        let mergedSettings = { ...defaultSettings, ...parsed };

        const defaultComponentIds = new Set(defaultSettings.dashboardComponents.map(c => c.id));
        
        // Filter out any stored components that are no longer in the default list (i.e., deprecated)
        let storedComponents = (parsed.dashboardComponents || []) as DashboardComponentConfig[];
        storedComponents = storedComponents.filter(c => defaultComponentIds.has(c.id));
        const storedComponentIds = new Set(storedComponents.map(c => c.id));

        // Add any new components from the default list that aren't in the stored list
        const newComponentsFromDefault = defaultSettings.dashboardComponents.filter(c => !storedComponentIds.has(c.id));
        
        const finalComponents = [...storedComponents, ...newComponentsFromDefault];
        
        mergedSettings.dashboardComponents = finalComponents;
        
        const validatedSettings = settingsSchema.safeParse(mergedSettings);
        
        if (validatedSettings.success) {
          setSettings(validatedSettings.data);
        } else {
          // If validation fails, it might be due to an old format.
          // We can try to recover or just reset. Resetting is safer.
          console.warn("Settings validation failed, resetting to defaults.", validatedSettings.error);
          setSettings(defaultSettings);
          window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
        }
      } else {
        // No settings found, use defaults
         setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
      setSettings(defaultSettings);
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => {
      const changedKeys = Object.keys(newSettings).filter(
        (key) =>
          JSON.stringify(prevSettings[key as keyof Settings]) !==
          JSON.stringify(newSettings[key as keyof Settings])
      );
  
      if (changedKeys.length === 0) return prevSettings;
  
      const changes = changedKeys.reduce(
        (acc, key) => {
          acc[key] = {
            from: prevSettings[key as keyof Settings],
            to: newSettings[key as keyof Settings],
          };
          return acc;
        },
        {} as Record<string, { from: any; to: any }>
      );
  
      const updatedSettings = { ...prevSettings, ...newSettings };
  
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
        // Move audit logging to async to avoid setState during render
        if (user) {
          Promise.resolve().then(() => {
            logAuditEvent(user, 'SETTINGS_UPDATED', { changes }).catch(error => {
              console.error('Failed to log audit event:', error);
            });
          });
        }
      } catch (error) {
        console.error('Failed to save settings to localStorage', error);
      }
  
      return updatedSettings;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    } catch (error) {
      console.error('Failed to save settings to localStorage during reset', error);
    }
  };

  return React.createElement(
    SettingsContext.Provider,
    { value: { settings, updateSettings, resetSettings, isLoaded } },
    children
  );
}

export function useSettings() {
  const context = React.useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
