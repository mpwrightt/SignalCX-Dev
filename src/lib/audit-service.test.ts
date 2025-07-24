/**
 * @fileOverview Tests for the audit logging system
 * Validates comprehensive audit event logging, metadata handling, and compliance features
 */

import { 
  logAuditEvent, 
  logAIFlowEvent, 
  logPIIEvent, 
  logDataAccessEvent, 
  logSecurityEvent, 
  logMultiAgentEvent,
  type AuditAction,
  type DataSensitivity,
  type AuditCategory 
} from './audit-service';
import type { AuthenticatedUser } from './types';

// Mock console to capture audit logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
let capturedLogs: string[] = [];
let capturedErrors: string[] = [];

beforeEach(() => {
  capturedLogs = [];
  capturedErrors = [];
  console.log = jest.fn((message: string) => {
    capturedLogs.push(message);
  });
  console.error = jest.fn((message: string) => {
    capturedErrors.push(message);
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

const mockUser: AuthenticatedUser = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'agent',
  avatar: 'test-avatar',
  organizationId: 'org-123',
  organizationName: 'Test Org',
  permissions: ['tickets.read', 'tickets.write'],
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  emailVerified: true
};

describe('Audit Service', () => {
  describe('Basic Audit Event Logging', () => {
    it('should log a basic audit event with proper structure', async () => {
      const result = await logAuditEvent(
        mockUser,
        'TICKET_VIEWED',
        { resourceId: 'ticket-123', resourceType: 'ticket' },
        { ticketId: 123 }
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(capturedLogs).toHaveLength(1);

      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.userId).toBe(mockUser.id);
      expect(loggedEvent.action).toBe('TICKET_VIEWED');
      expect(loggedEvent.category).toBe('data_access');
      expect(loggedEvent.severity).toBe('info');
      expect(loggedEvent.organizationId).toBe(mockUser.organizationId);
      expect(loggedEvent.metadata.resourceId).toBe('ticket-123');
    });

    it('should handle anonymous users correctly', async () => {
      const result = await logAuditEvent(
        null,
        'USER_LOGIN_FAILED',
        {},
        { error: 'Invalid credentials' }
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.userId).toBe('anonymous');
      expect(loggedEvent.userName).toBe('anonymous');
      expect(loggedEvent.userRole).toBe('anonymous');
    });

    it('should validate required fields and return errors for invalid events', async () => {
      // Mock an invalid event by directly calling the internal validation
      const result = await logAuditEvent(
        mockUser,
        'AI_FLOW_EXECUTED',
        {}, // Missing flowName for AI processing events
        {}
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('flowName is required for AI processing events');
      expect(capturedErrors).toHaveLength(1);
    });
  });

  describe('AI Flow Audit Logging', () => {
    it('should log successful AI flow execution with comprehensive metadata', async () => {
      const result = await logAIFlowEvent(
        mockUser,
        'get-ticket-summary',
        true,
        {
          modelUsed: 'gemini-2.0-flash',
          processingTimeMs: 1500,
          inputTokens: 100,
          outputTokens: 50,
          piiDetected: false,
          confidenceScore: 0.95
        },
        'correlation-123'
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.action).toBe('AI_FLOW_EXECUTED');
      expect(loggedEvent.category).toBe('ai_processing');
      expect(loggedEvent.metadata.flowName).toBe('get-ticket-summary');
      expect(loggedEvent.metadata.modelUsed).toBe('gemini-2.0-flash');
      expect(loggedEvent.metadata.piiDetected).toBe(false);
      expect(loggedEvent.metadata.correlationId).toBe('correlation-123');
    });

    it('should log failed AI flow execution with error details', async () => {
      const result = await logAIFlowEvent(
        mockUser,
        'get-ticket-summary',
        false,
        {
          errorMessage: 'Model timeout error',
          processingTimeMs: 30000
        }
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.action).toBe('AI_FLOW_FAILED');
      expect(loggedEvent.severity).toBe('error');
      expect(loggedEvent.metadata.errorMessage).toBe('Model timeout error');
    });
  });

  describe('PII Event Audit Logging', () => {
    it('should log PII detection with comprehensive metadata', async () => {
      const result = await logPIIEvent(
        mockUser,
        'PII_DETECTED',
        {
          piiTypes: ['email', 'phone'],
          originalFieldCount: 2,
          scrubbedFieldCount: 2,
          resourceId: 'ticket-456',
          resourceType: 'ticket'
        }
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.action).toBe('PII_DETECTED');
      expect(loggedEvent.category).toBe('privacy');
      expect(loggedEvent.severity).toBe('warning');
      expect(loggedEvent.metadata.piiTypes).toEqual(['email', 'phone']);
      expect(loggedEvent.metadata.dataSensitivity).toBe('highly_sensitive');
      expect(loggedEvent.complianceFlags).toContain('GDPR');
      expect(loggedEvent.complianceFlags).toContain('eBay_DHP');
    });

    it('should validate PII events require piiTypes', async () => {
      const result = await logPIIEvent(
        mockUser,
        'PII_DETECTED',
        {
          piiTypes: [], // Empty array should trigger validation error
          originalFieldCount: 0
        }
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('piiTypes is required for privacy events');
    });
  });

  describe('Data Access Audit Logging', () => {
    it('should log bulk data access with access pattern tracking', async () => {
      const result = await logDataAccessEvent(
        mockUser,
        'TICKETS_BULK_ACCESSED',
        {
          recordCount: 1000,
          accessPattern: 'batch',
          containsSensitiveData: true,
          dataFields: ['subject', 'description', 'requester'],
          queryParameters: { status: 'open', priority: 'high' }
        }
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.action).toBe('TICKETS_BULK_ACCESSED');
      expect(loggedEvent.category).toBe('data_access');
      expect(loggedEvent.metadata.recordCount).toBe(1000);
      expect(loggedEvent.metadata.accessPattern).toBe('batch');
      expect(loggedEvent.metadata.dataSensitivity).toBe('confidential');
    });

    it('should handle data export operations', async () => {
      const result = await logDataAccessEvent(
        mockUser,
        'DATA_EXPORTED',
        {
          recordCount: 500,
          accessPattern: 'bulk',
          exportFormat: 'CSV',
          containsSensitiveData: false
        }
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.action).toBe('DATA_EXPORTED');
      expect(loggedEvent.metadata.exportFormat).toBe('CSV');
      expect(loggedEvent.metadata.dataSensitivity).toBe('internal');
    });
  });

  describe('Security Event Audit Logging', () => {
    it('should log security violations with threat level assessment', async () => {
      const result = await logSecurityEvent(
        mockUser,
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        {
          threatLevel: 'high',
          violationType: 'privilege_escalation',
          resourceAttempted: '/admin/users',
          ipAddress: '192.168.1.100',
          additionalContext: { attemptedRole: 'super_admin' }
        }
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.action).toBe('UNAUTHORIZED_ACCESS_ATTEMPT');
      expect(loggedEvent.category).toBe('authorization');
      expect(loggedEvent.severity).toBe('error');
      expect(loggedEvent.metadata.threatLevel).toBe('high');
      expect(loggedEvent.metadata.ipAddress).toBe('192.168.1.100');
      expect(loggedEvent.metadata.dataSensitivity).toBe('highly_sensitive');
    });

    it('should determine severity based on threat level', async () => {
      // Critical threat level
      const criticalResult = await logAuditEvent(
        mockUser,
        'DATA_BREACH_DETECTED',
        { 
          threatLevel: 'critical',
          dataSensitivity: 'highly_sensitive' as DataSensitivity
        },
        {},
        { severity: 'critical' }
      );

      expect(criticalResult.success).toBe(true);
      const criticalEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(criticalEvent.severity).toBe('critical');

      // Low threat level
      const lowResult = await logSecurityEvent(
        mockUser,
        'SUSPICIOUS_ACTIVITY_DETECTED',
        { threatLevel: 'low' }
      );

      expect(lowResult.success).toBe(true);
      const lowEvent = JSON.parse(capturedLogs[1].replace('[AUDIT_EVENT]: ', ''));
      expect(lowEvent.severity).toBe('warning');
    });
  });

  describe('Multi-Agent Processing Audit Logging', () => {
    it('should log multi-agent processing with performance metrics', async () => {
      const result = await logMultiAgentEvent(
        mockUser,
        'MULTI_AGENT_PROCESSING_COMPLETED',
        {
          agentTypes: ['discovery', 'performance', 'risk'],
          modelsUsed: {
            discovery: 'gemini-2.0-flash',
            performance: 'gemini-1.5-pro',
            risk: 'claude-3.5-sonnet'
          },
          totalDuration: 5000,
          ticketCount: 100,
          successfulAgents: 3,
          failedAgents: 0
        }
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.action).toBe('MULTI_AGENT_PROCESSING_COMPLETED');
      expect(loggedEvent.category).toBe('ai_processing');
      expect(loggedEvent.metadata.flowName).toBe('multi-agent-processing');
      expect(loggedEvent.metadata.batchSize).toBe(100);
      expect(loggedEvent.metadata.processingTimeMs).toBe(5000);
    });
  });

  describe('Retention and Compliance', () => {
    it('should set appropriate retention dates based on category and sensitivity', async () => {
      // High sensitivity privacy event should have 7-year retention
      const privacyResult = await logPIIEvent(
        mockUser,
        'PII_DETECTED',
        { piiTypes: ['ssn'], originalFieldCount: 1 }
      );

      expect(privacyResult.success).toBe(true);
      const privacyEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      const retentionDate = new Date(privacyEvent.retentionDate);
      const currentDate = new Date();
      const daysDifference = Math.floor((retentionDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Should be approximately 7 years (2555 days)
      expect(daysDifference).toBeGreaterThan(2500);
      expect(daysDifference).toBeLessThan(2600);

      // Internal system event should have 1-year retention
      const systemResult = await logAuditEvent(
        mockUser,
        'CACHE_CLEARED',
        { dataSensitivity: 'internal' as DataSensitivity }
      );

      expect(systemResult.success).toBe(true);
      const systemEvent = JSON.parse(capturedLogs[1].replace('[AUDIT_EVENT]: ', ''));
      const systemRetentionDate = new Date(systemEvent.retentionDate);
      const systemDaysDifference = Math.floor((systemRetentionDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Should be approximately 1 year (365 days)
      expect(systemDaysDifference).toBeGreaterThan(360);
      expect(systemDaysDifference).toBeLessThan(370);
    });

    it('should set compliance flags for regulated event categories', async () => {
      const result = await logAuditEvent(
        mockUser,
        'DATA_BREACH_DETECTED',
        { 
          threatLevel: 'critical',
          dataSensitivity: 'highly_sensitive' as DataSensitivity
        },
        {},
        { severity: 'critical' }
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.complianceFlags).toContain('GDPR');
      expect(loggedEvent.complianceFlags).toContain('eBay_DHP');
    });
  });

  describe('Error Handling', () => {
    it('should handle and log audit service failures gracefully', async () => {
      // Our system gracefully handles undefined users by treating them as anonymous
      // Let's test a real validation error instead
      const result = await logAuditEvent(
        mockUser,
        'AI_FLOW_EXECUTED', // This requires flowName in metadata
        {}, // Missing required flowName
        {}
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('flowName is required for AI processing events');
      expect(capturedErrors).toHaveLength(1);
      expect(capturedErrors[0]).toContain('[AUDIT_VALIDATION_ERROR]');
    });

    it('should handle anonymous users as expected', async () => {
      // Test that undefined/null users are handled gracefully
      const result = await logAuditEvent(
        null,
        'TICKET_VIEWED',
        { resourceId: 'ticket-123' }
      );

      expect(result.success).toBe(true);
      const loggedEvent = JSON.parse(capturedLogs[0].replace('[AUDIT_EVENT]: ', ''));
      expect(loggedEvent.userId).toBe('anonymous');
      expect(loggedEvent.userName).toBe('anonymous');
      expect(loggedEvent.userRole).toBe('anonymous');
    });
  });
});