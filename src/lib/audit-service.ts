
'use server';

import type { AuthenticatedUser } from './types';

export type AuditAction = 
  | 'USER_LOGIN'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'SETTINGS_UPDATED'
  | 'TICKET_VIEWED'
  | 'AGENT_PROFILE_VIEWED'
  | 'USER_PROFILE_VIEWED'
  | 'CACHE_CLEARED'
  | 'AGENT_TIER_UPDATED'
  | 'TEST_TICKETS_GENERATED'
  | 'TEST_TICKETS_CLEARED';

export interface AuditEvent {
  timestamp: string;
  userId: string;
  userName: string;
  userRole: 'super_admin' | 'org_admin' | 'manager' | 'agent' | 'readonly' | 'anonymous';
  action: AuditAction;
  details: Record<string, any>;
}

/**
 * Logs an audit event.
 * In a real enterprise application, this would write to a dedicated, immutable audit log
 * in a database (like Firestore, BigQuery, or a dedicated logging service like Datadog).
 * For this demo, we will log a structured JSON object to the server console.
 * @param user The user performing the action.
 * @param action The type of action performed.
 * @param details Additional context about the event.
 */
export async function logAuditEvent(
  user: AuthenticatedUser | null,
  action: AuditAction,
  details: Record<string, any> = {}
): Promise<void> {

  const event: AuditEvent = {
    timestamp: new Date().toISOString(),
    userId: user?.id || 'anonymous',
    userName: user?.name || 'anonymous',
    userRole: user?.role || 'anonymous',
    action,
    details,
  };

  // In a real system, this would be `await db.collection('audit_logs').add(event);`
  // or `await loggingService.log(event);`
  console.log(`[AUDIT_EVENT]: ${JSON.stringify(event)}`);
}
