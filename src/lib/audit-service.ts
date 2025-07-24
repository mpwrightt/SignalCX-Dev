
'use server';

import type { AuthenticatedUser } from './types';

// Core audit actions
export type AuditAction = 
  // Authentication & Access
  | 'USER_LOGIN'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'SESSION_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  
  // User Management
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'ROLE_CHANGED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  
  // Data Access & Operations
  | 'TICKET_VIEWED'
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_DELETED'
  | 'TICKETS_BULK_ACCESSED'
  | 'AGENT_PROFILE_VIEWED'
  | 'USER_PROFILE_VIEWED'
  | 'DATA_EXPORTED'
  | 'DATA_IMPORTED'
  | 'SEARCH_PERFORMED'
  | 'FILTER_APPLIED'
  
  // AI & Processing
  | 'AI_FLOW_EXECUTED'
  | 'AI_FLOW_FAILED'
  | 'MULTI_AGENT_PROCESSING_STARTED'
  | 'MULTI_AGENT_PROCESSING_COMPLETED'
  | 'AI_MODEL_SWITCHED'
  | 'BATCH_PROCESSING_STARTED'
  | 'BATCH_PROCESSING_COMPLETED'
  
  // Privacy & PII
  | 'PII_DETECTED'
  | 'PII_SCRUBBED'
  | 'PII_ACCESSED'
  | 'DATA_ANONYMIZED'
  | 'DATA_PSEUDONYMIZED'
  | 'SENSITIVE_DATA_ACCESSED'
  | 'PRIVACY_POLICY_VIOLATION'
  
  // Data Classification
  | 'DATA_CLASSIFIED'
  | 'DATA_DECLASSIFIED'
  | 'DATA_RECLASSIFIED'
  | 'CLASSIFICATION_VALIDATION_FAILED'
  | 'RESTRICTED_DATA_ACCESSED'
  | 'CONFIDENTIAL_DATA_ACCESSED'
  | 'CLASSIFICATION_VIOLATION'
  | 'RETENTION_POLICY_VIOLATED'
  | 'CLASSIFICATION_COMPLIANCE_CHECK'
  | 'AUTOMATIC_CLASSIFICATION_APPLIED'
  
  // System & Configuration
  | 'SETTINGS_UPDATED'
  | 'CACHE_CLEARED'
  | 'AGENT_TIER_UPDATED'
  | 'TEST_TICKETS_GENERATED'
  | 'TEST_TICKETS_CLEARED'
  | 'SYSTEM_CONFIG_CHANGED'
  | 'BACKUP_CREATED'
  | 'BACKUP_RESTORED'
  
  // Security & Compliance
  | 'SECURITY_POLICY_VIOLATION'
  | 'COMPLIANCE_CHECK_PERFORMED'
  | 'AUDIT_LOG_ACCESSED'
  | 'SUSPICIOUS_ACTIVITY_DETECTED'
  | 'DATA_BREACH_DETECTED'
  | 'VULNERABILITY_DETECTED';

// Data sensitivity classification
export type DataSensitivity = 'public' | 'internal' | 'confidential' | 'restricted' | 'highly_sensitive';

// Event categories for better organization
export type AuditCategory = 
  | 'authentication'
  | 'authorization' 
  | 'data_access'
  | 'data_modification'
  | 'ai_processing'
  | 'privacy'
  | 'security'
  | 'system'
  | 'compliance';

// Structured metadata schemas for different event types
export interface BaseAuditMetadata {
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  requestId?: string;
  correlationId?: string;
  duration?: number;
  success?: boolean;
  errorMessage?: string;
  resourceId?: string;
  resourceType?: string;
  dataSensitivity?: DataSensitivity;
  complianceContext?: string[];
  // Allow additional properties for backward compatibility
  [key: string]: any;
}

export interface AIFlowMetadata extends BaseAuditMetadata {
  flowName: string;
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  processingTimeMs?: number;
  piiDetected?: boolean;
  dataScrubbingApplied?: boolean;
  confidenceScore?: number;
  agentType?: string;
  batchSize?: number;
}

export interface DataAccessMetadata extends BaseAuditMetadata {
  recordCount?: number;
  queryParameters?: Record<string, any>;
  filterCriteria?: Record<string, any>;
  dataFields?: string[];
  accessPattern?: 'individual' | 'bulk' | 'batch' | 'streaming';
  exportFormat?: string;
  retentionPolicy?: string;
}

export interface PrivacyMetadata extends BaseAuditMetadata {
  piiTypes?: string[];
  scrubMethod?: 'redaction' | 'masking' | 'pseudonymization' | 'anonymization';
  originalFieldCount?: number;
  scrubbedFieldCount?: number;
  retainedFields?: string[];
  lawfulBasis?: string;
  dataSubjectId?: string;
  consentStatus?: 'granted' | 'withdrawn' | 'not_required';
}

export interface SecurityMetadata extends BaseAuditMetadata {
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  securityContext?: string[];
  violationType?: string;
  remediationAction?: string;
  alertTriggered?: boolean;
  additionalContext?: Record<string, any>;
}

export interface ClassificationMetadata extends BaseAuditMetadata {
  dataType: string;
  dataId: string;
  classificationLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  previousClassificationLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  piiTypes?: string[];
  detectionMethod: 'manual' | 'automatic' | 'system';
  classificationReason: string;
  validationResult?: 'passed' | 'failed' | 'warning';
  retentionPolicyApplied?: string;
  complianceRequirements?: string[];
}

export interface AuditEvent {
  // Core event information
  timestamp: string;
  eventId: string;
  userId: string;
  userName: string;
  userRole: 'super_admin' | 'org_admin' | 'manager' | 'agent' | 'readonly' | 'anonymous';
  organizationId?: string;
  
  // Event classification
  action: AuditAction;
  category: AuditCategory;
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Contextual information
  source: 'web' | 'api' | 'system' | 'batch';
  environment: 'development' | 'staging' | 'production';
  
  // Metadata (typed based on event category)
  metadata: BaseAuditMetadata | AIFlowMetadata | DataAccessMetadata | PrivacyMetadata | SecurityMetadata | ClassificationMetadata;
  
  // Legacy details field for backward compatibility
  details: Record<string, any>;
  
  // Retention and compliance
  retentionDate?: string;
  complianceFlags?: string[];
  archived?: boolean;
}

// Retention policies based on event categories and sensitivity
export interface RetentionPolicy {
  category: AuditCategory;
  sensitivity: DataSensitivity;
  retentionDays: number;
  archiveAfterDays?: number;
  requiresCompliance?: boolean;
}

const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  { category: 'authentication', sensitivity: 'internal', retentionDays: 90 },
  { category: 'authorization', sensitivity: 'internal', retentionDays: 365 },
  { category: 'data_access', sensitivity: 'confidential', retentionDays: 2555, requiresCompliance: true }, // 7 years
  { category: 'ai_processing', sensitivity: 'confidential', retentionDays: 1095, requiresCompliance: true }, // 3 years
  { category: 'privacy', sensitivity: 'highly_sensitive', retentionDays: 2555, requiresCompliance: true }, // 7 years
  { category: 'security', sensitivity: 'highly_sensitive', retentionDays: 2555, requiresCompliance: true }, // 7 years
  { category: 'compliance', sensitivity: 'highly_sensitive', retentionDays: 2555, requiresCompliance: true }, // 7 years
  { category: 'system', sensitivity: 'internal', retentionDays: 365 },
  { category: 'data_modification', sensitivity: 'confidential', retentionDays: 1095, requiresCompliance: true }, // 3 years
];

/**
 * Categorizes an audit action into its appropriate category
 */
function categorizeAction(action: AuditAction): AuditCategory {
  const actionCategories: Record<string, AuditCategory> = {
    // Authentication
    'USER_LOGIN': 'authentication',
    'USER_LOGIN_FAILED': 'authentication',
    'USER_LOGOUT': 'authentication',
    'SESSION_EXPIRED': 'authentication',
    
    // Authorization
    'PERMISSION_DENIED': 'authorization',
    'UNAUTHORIZED_ACCESS_ATTEMPT': 'authorization',
    'ROLE_CHANGED': 'authorization',
    'PERMISSION_GRANTED': 'authorization',
    'PERMISSION_REVOKED': 'authorization',
    
    // Data Access
    'TICKET_VIEWED': 'data_access',
    'AGENT_PROFILE_VIEWED': 'data_access',
    'USER_PROFILE_VIEWED': 'data_access',
    'TICKETS_BULK_ACCESSED': 'data_access',
    'SEARCH_PERFORMED': 'data_access',
    'DATA_EXPORTED': 'data_access',
    'SENSITIVE_DATA_ACCESSED': 'data_access',
    
    // Data Modification
    'TICKET_CREATED': 'data_modification',
    'TICKET_UPDATED': 'data_modification',
    'TICKET_DELETED': 'data_modification',
    'USER_CREATED': 'data_modification',
    'USER_UPDATED': 'data_modification',
    'USER_DELETED': 'data_modification',
    'DATA_IMPORTED': 'data_modification',
    
    // AI Processing
    'AI_FLOW_EXECUTED': 'ai_processing',
    'AI_FLOW_FAILED': 'ai_processing',
    'MULTI_AGENT_PROCESSING_STARTED': 'ai_processing',
    'MULTI_AGENT_PROCESSING_COMPLETED': 'ai_processing',
    'BATCH_PROCESSING_STARTED': 'ai_processing',
    'BATCH_PROCESSING_COMPLETED': 'ai_processing',
    
    // Privacy
    'PII_DETECTED': 'privacy',
    'PII_SCRUBBED': 'privacy',
    'PII_ACCESSED': 'privacy',
    'DATA_ANONYMIZED': 'privacy',
    'DATA_PSEUDONYMIZED': 'privacy',
    'PRIVACY_POLICY_VIOLATION': 'privacy',
    
    // Security
    'SECURITY_POLICY_VIOLATION': 'security',
    'SUSPICIOUS_ACTIVITY_DETECTED': 'security',
    'DATA_BREACH_DETECTED': 'security',
    'VULNERABILITY_DETECTED': 'security',
    
    // System
    'SETTINGS_UPDATED': 'system',
    'CACHE_CLEARED': 'system',
    'SYSTEM_CONFIG_CHANGED': 'system',
    'BACKUP_CREATED': 'system',
    'BACKUP_RESTORED': 'system',
    
    // Compliance
    'COMPLIANCE_CHECK_PERFORMED': 'compliance',
    'AUDIT_LOG_ACCESSED': 'compliance',
    
    // Data Classification
    'DATA_CLASSIFIED': 'compliance',
    'DATA_DECLASSIFIED': 'compliance',
    'DATA_RECLASSIFIED': 'compliance',
    'CLASSIFICATION_VALIDATION_FAILED': 'compliance',
    'RESTRICTED_DATA_ACCESSED': 'data_access',
    'CONFIDENTIAL_DATA_ACCESSED': 'data_access',
    'CLASSIFICATION_VIOLATION': 'security',
    'RETENTION_POLICY_VIOLATED': 'compliance',
    'CLASSIFICATION_COMPLIANCE_CHECK': 'compliance',
    'AUTOMATIC_CLASSIFICATION_APPLIED': 'system',
  };
  
  return actionCategories[action] || 'system';
}

/**
 * Determines the severity level of an audit event
 */
function determineSeverity(action: AuditAction, metadata?: any): 'info' | 'warning' | 'error' | 'critical' {
  const criticalActions = [
    'DATA_BREACH_DETECTED',
    'UNAUTHORIZED_ACCESS_ATTEMPT',
    'PRIVACY_POLICY_VIOLATION',
    'SECURITY_POLICY_VIOLATION',
    'VULNERABILITY_DETECTED',
    'CLASSIFICATION_VIOLATION',
    'RETENTION_POLICY_VIOLATED'
  ];
  
  const errorActions = [
    'USER_LOGIN_FAILED',
    'AI_FLOW_FAILED',
    'PERMISSION_DENIED',
    'CLASSIFICATION_VALIDATION_FAILED'
  ];
  
  const warningActions = [
    'SESSION_EXPIRED',
    'PII_DETECTED',
    'SUSPICIOUS_ACTIVITY_DETECTED',
    'SENSITIVE_DATA_ACCESSED',
    'RESTRICTED_DATA_ACCESSED',
    'CONFIDENTIAL_DATA_ACCESSED'
  ];
  
  if (criticalActions.includes(action)) return 'critical';
  if (errorActions.includes(action)) return 'error';
  if (warningActions.includes(action)) return 'warning';
  
  return 'info';
}

/**
 * Calculates retention date based on category and sensitivity
 */
function calculateRetentionDate(category: AuditCategory, sensitivity: DataSensitivity): string {
  const policy = DEFAULT_RETENTION_POLICIES.find(p => 
    p.category === category && p.sensitivity === sensitivity
  ) || DEFAULT_RETENTION_POLICIES.find(p => p.category === category) 
     || { retentionDays: 365 };
  
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + policy.retentionDays);
  return retentionDate.toISOString();
}

/**
 * Validates audit event data
 */
function validateAuditEvent(event: Partial<AuditEvent>): string[] {
  const errors: string[] = [];
  
  if (!event.userId) errors.push('userId is required');
  if (!event.action) errors.push('action is required');
  if (!event.timestamp) errors.push('timestamp is required');
  if (!event.category) errors.push('category is required');
  if (!event.severity) errors.push('severity is required');
  
  // Validate metadata based on category
  if (event.category === 'ai_processing' && event.metadata) {
    const aiMetadata = event.metadata as AIFlowMetadata;
    if (!aiMetadata.flowName) errors.push('flowName is required for AI processing events');
  }
  
  if (event.category === 'privacy' && event.metadata) {
    const privacyMetadata = event.metadata as PrivacyMetadata;
    if (!privacyMetadata.piiTypes || privacyMetadata.piiTypes.length === 0) {
      errors.push('piiTypes is required for privacy events');
    }
  }
  
  return errors;
}

/**
 * Enhanced audit event logging with comprehensive metadata and validation
 * @param user The user performing the action
 * @param action The type of action performed
 * @param metadata Structured metadata based on event category
 * @param details Additional context (legacy compatibility)
 * @param options Additional options for the audit event
 */
export async function logAuditEvent(
  user: AuthenticatedUser | null,
  action: AuditAction,
  metadata: BaseAuditMetadata | AIFlowMetadata | DataAccessMetadata | PrivacyMetadata | SecurityMetadata | ClassificationMetadata = {},
  details: Record<string, any> = {},
  options: {
    severity?: 'info' | 'warning' | 'error' | 'critical';
    source?: 'web' | 'api' | 'system' | 'batch';
    correlationId?: string;
    dataSensitivity?: DataSensitivity;
  } = {}
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  
  try {
    const category = categorizeAction(action);
    const severity = options.severity || determineSeverity(action, metadata);
    const dataSensitivity = options.dataSensitivity || metadata.dataSensitivity || 'internal';
    const eventId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const event: AuditEvent = {
      // Core event information
      timestamp: new Date().toISOString(),
      eventId,
      userId: user?.id || 'anonymous',
      userName: user?.name || 'anonymous',
      userRole: user?.role || 'anonymous',
      organizationId: user?.organizationId,
      
      // Event classification
      action,
      category,
      severity,
      
      // Contextual information
      source: options.source || 'web',
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development',
      
      // Enhanced metadata
      metadata: {
        ...metadata,
        correlationId: options.correlationId,
        dataSensitivity,
      },
      
      // Legacy details for backward compatibility
      details,
      
      // Retention and compliance
      retentionDate: calculateRetentionDate(category, dataSensitivity),
      complianceFlags: category === 'privacy' || category === 'security' ? ['GDPR', 'eBay_DHP'] : undefined,
      archived: false,
    };
    
    // Validate the event
    const validationErrors = validateAuditEvent(event);
    if (validationErrors.length > 0) {
      console.error(`[AUDIT_VALIDATION_ERROR]: ${JSON.stringify({ eventId, errors: validationErrors })}`);
      return { success: false, errors: validationErrors };
    }
    
    // In a real system, this would be:
    // await db.collection('audit_logs').add(event);
    // await loggingService.log(event);
    // await bigQuery.insert('audit_logs', event);
    console.log(`[AUDIT_EVENT]: ${JSON.stringify(event, null, 2)}`);
    
    return { success: true, eventId };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[AUDIT_ERROR]: Failed to log audit event for action ${action}: ${errorMessage}`);
    return { success: false, errors: [errorMessage] };
  }
}

/**
 * Log data classification event
 */
export async function logDataClassificationEvent(
  user: AuthenticatedUser | null,
  action: 'DATA_CLASSIFIED' | 'DATA_DECLASSIFIED' | 'DATA_RECLASSIFIED' | 'AUTOMATIC_CLASSIFICATION_APPLIED',
  dataType: string,
  dataId: string,
  classificationLevel: 'public' | 'internal' | 'confidential' | 'restricted',
  reason: string,
  detectionMethod: 'manual' | 'automatic' | 'system' = 'manual',
  previousLevel?: 'public' | 'internal' | 'confidential' | 'restricted',
  piiTypes?: string[]
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const metadata: ClassificationMetadata = {
    dataType,
    dataId,
    classificationLevel,
    previousClassificationLevel: previousLevel,
    piiTypes,
    detectionMethod,
    classificationReason: reason,
    dataSensitivity: classificationLevel === 'restricted' ? 'highly_sensitive' : 
                      classificationLevel === 'confidential' ? 'confidential' : 'internal'
  };

  return logAuditEvent(user, action, metadata, {
    dataType,
    dataId,
    classification: classificationLevel,
    previousClassification: previousLevel,
    reason,
    piiDetected: piiTypes && piiTypes.length > 0
  });
}

/**
 * Log classified data access event
 */
export async function logClassifiedDataAccess(
  user: AuthenticatedUser | null,
  dataType: string,
  dataId: string,
  classificationLevel: 'public' | 'internal' | 'confidential' | 'restricted',
  operation: 'read' | 'export' | 'modify' = 'read'
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const action = classificationLevel === 'restricted' ? 'RESTRICTED_DATA_ACCESSED' :
                 classificationLevel === 'confidential' ? 'CONFIDENTIAL_DATA_ACCESSED' :
                 'SENSITIVE_DATA_ACCESSED';

  const metadata: DataAccessMetadata = {
    resourceType: dataType,
    resourceId: dataId,
    accessPattern: 'individual',
    dataSensitivity: classificationLevel === 'restricted' ? 'highly_sensitive' : 
                      classificationLevel === 'confidential' ? 'confidential' : 'internal'
  };

  return logAuditEvent(user, action, metadata, {
    dataType,
    dataId,
    classification: classificationLevel,
    operation
  });
}

/**
 * Log classification violation event
 */
export async function logClassificationViolation(
  user: AuthenticatedUser | null,
  violationType: string,
  dataType: string,
  dataId: string,
  details: string
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const metadata: SecurityMetadata = {
    threatLevel: 'high',
    violationType,
    securityContext: ['data_classification'],
    additionalContext: { dataType, dataId, details },
    dataSensitivity: 'highly_sensitive'
  };

  return logAuditEvent(user, 'CLASSIFICATION_VIOLATION', metadata, {
    violationType,
    dataType,
    dataId,
    details
  }, { severity: 'critical' });
}

/**
 * Log retention policy violation event
 */
export async function logRetentionPolicyViolation(
  user: AuthenticatedUser | null,
  dataType: string,
  dataId: string,
  retentionPeriodDays: number,
  currentAge: number
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const metadata: SecurityMetadata = {
    threatLevel: 'medium',
    violationType: 'retention_policy_violation',
    securityContext: ['data_retention'],
    additionalContext: { 
      dataType, 
      dataId, 
      retentionPeriodDays, 
      currentAge,
      daysOverdue: currentAge - retentionPeriodDays
    },
    dataSensitivity: 'confidential'
  };

  return logAuditEvent(user, 'RETENTION_POLICY_VIOLATED', metadata, {
    dataType,
    dataId,
    retentionPeriodDays,
    currentAge,
    violation: 'Data retained beyond policy limits'
  }, { severity: 'critical' });
}

/**
 * Log PII detection event during classification
 */
export async function logPiiDetectionEvent(
  user: AuthenticatedUser | null,
  dataType: string,
  dataId: string,
  detectedPiiTypes: string[],
  detectionMethod: 'automatic' | 'manual' = 'automatic'
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const metadata: PrivacyMetadata = {
    piiTypes: detectedPiiTypes,
    originalFieldCount: 1,
    scrubbedFieldCount: 0,
    lawfulBasis: 'legitimate_interest',
    dataSensitivity: 'highly_sensitive'
  };

  return logAuditEvent(user, 'PII_DETECTED', metadata, {
    dataType,
    dataId,
    piiTypes: detectedPiiTypes,
    detectionMethod,
    autoClassificationApplied: true
  }, { severity: 'warning' });
}

// Convenience functions for common audit scenarios

/**
 * Logs an AI flow execution event with comprehensive metadata
 */
export async function logAIFlowEvent(
  user: AuthenticatedUser | null,
  flowName: string,
  success: boolean,
  metadata: {
    modelUsed?: string;
    processingTimeMs?: number;
    inputTokens?: number;
    outputTokens?: number;
    piiDetected?: boolean;
    confidenceScore?: number;
    errorMessage?: string;
    batchSize?: number;
  } = {},
  correlationId?: string
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const action: AuditAction = success ? 'AI_FLOW_EXECUTED' : 'AI_FLOW_FAILED';
  
  const aiMetadata: AIFlowMetadata = {
    flowName,
    success,
    errorMessage: success ? undefined : metadata.errorMessage,
    modelUsed: metadata.modelUsed,
    processingTimeMs: metadata.processingTimeMs,
    inputTokens: metadata.inputTokens,
    outputTokens: metadata.outputTokens,
    piiDetected: metadata.piiDetected,
    dataScrubbingApplied: metadata.piiDetected,
    confidenceScore: metadata.confidenceScore,
    batchSize: metadata.batchSize,
    dataSensitivity: metadata.piiDetected ? 'highly_sensitive' : 'confidential',
  };
  
  return logAuditEvent(
    user,
    action,
    aiMetadata,
    { flowName, success, ...metadata },
    { 
      correlationId,
      dataSensitivity: metadata.piiDetected ? 'highly_sensitive' : 'confidential',
      source: 'system'
    }
  );
}

/**
 * Logs PII detection and scrubbing events
 */
export async function logPIIEvent(
  user: AuthenticatedUser | null,
  action: 'PII_DETECTED' | 'PII_SCRUBBED' | 'PII_ACCESSED',
  metadata: {
    piiTypes: string[];
    scrubMethod?: 'redaction' | 'masking' | 'pseudonymization' | 'anonymization';
    originalFieldCount?: number;
    scrubbedFieldCount?: number;
    dataSubjectId?: string;
    lawfulBasis?: string;
    resourceId?: string;
    resourceType?: string;
  },
  correlationId?: string
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const privacyMetadata: PrivacyMetadata = {
    piiTypes: metadata.piiTypes,
    scrubMethod: metadata.scrubMethod,
    originalFieldCount: metadata.originalFieldCount,
    scrubbedFieldCount: metadata.scrubbedFieldCount,
    dataSubjectId: metadata.dataSubjectId,
    lawfulBasis: metadata.lawfulBasis,
    resourceId: metadata.resourceId,
    resourceType: metadata.resourceType,
    dataSensitivity: 'highly_sensitive',
    complianceContext: ['GDPR', 'eBay_DHP'],
  };
  
  return logAuditEvent(
    user,
    action,
    privacyMetadata,
    metadata,
    {
      correlationId,
      dataSensitivity: 'highly_sensitive',
      severity: action === 'PII_DETECTED' ? 'warning' : 'info'
    }
  );
}

/**
 * Logs data access events with access pattern tracking
 */
export async function logDataAccessEvent(
  user: AuthenticatedUser | null,
  action: 'TICKET_VIEWED' | 'TICKETS_BULK_ACCESSED' | 'DATA_EXPORTED' | 'SENSITIVE_DATA_ACCESSED',
  metadata: {
    recordCount?: number;
    resourceIds?: string[];
    accessPattern?: 'individual' | 'bulk' | 'batch' | 'streaming';
    exportFormat?: string;
    queryParameters?: Record<string, any>;
    dataFields?: string[];
    containsSensitiveData?: boolean;
  },
  correlationId?: string
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const dataAccessMetadata: DataAccessMetadata = {
    recordCount: metadata.recordCount,
    accessPattern: metadata.accessPattern || 'individual',
    exportFormat: metadata.exportFormat,
    queryParameters: metadata.queryParameters,
    dataFields: metadata.dataFields,
    resourceId: metadata.resourceIds?.join(','),
    resourceType: 'ticket',
    dataSensitivity: metadata.containsSensitiveData ? 'confidential' : 'internal',
  };
  
  return logAuditEvent(
    user,
    action,
    dataAccessMetadata,
    metadata,
    {
      correlationId,
      dataSensitivity: metadata.containsSensitiveData ? 'confidential' : 'internal',
      severity: action === 'SENSITIVE_DATA_ACCESSED' ? 'warning' : 'info'
    }
  );
}

/**
 * Logs security-related events
 */
export async function logSecurityEvent(
  user: AuthenticatedUser | null,
  action: 'SECURITY_POLICY_VIOLATION' | 'SUSPICIOUS_ACTIVITY_DETECTED' | 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'VULNERABILITY_DETECTED',
  metadata: {
    threatLevel?: 'low' | 'medium' | 'high' | 'critical';
    violationType?: string;
    remediationAction?: string;
    alertTriggered?: boolean;
    ipAddress?: string;
    userAgent?: string;
    resourceAttempted?: string;
    additionalContext?: Record<string, any>;
  },
  correlationId?: string
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const securityMetadata: SecurityMetadata = {
    threatLevel: metadata.threatLevel || 'medium',
    violationType: metadata.violationType,
    remediationAction: metadata.remediationAction,
    alertTriggered: metadata.alertTriggered || true,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    resourceId: metadata.resourceAttempted,
    additionalContext: metadata.additionalContext,
    dataSensitivity: 'highly_sensitive',
    complianceContext: ['eBay_DHP', 'SOC2'],
  };
  
  return logAuditEvent(
    user,
    action,
    securityMetadata,
    metadata,
    {
      correlationId,
      dataSensitivity: 'highly_sensitive',
      severity: metadata.threatLevel === 'critical' ? 'critical' : 
               metadata.threatLevel === 'high' ? 'error' : 'warning'
    }
  );
}

/**
 * Logs multi-agent processing events with performance tracking
 */
export async function logMultiAgentEvent(
  user: AuthenticatedUser | null,
  action: 'MULTI_AGENT_PROCESSING_STARTED' | 'MULTI_AGENT_PROCESSING_COMPLETED',
  metadata: {
    agentTypes?: string[];
    modelsUsed?: Record<string, string>;
    totalDuration?: number;
    ticketCount?: number;
    processingTimeMs?: number;
    successfulAgents?: number;
    failedAgents?: number;
    errorMessage?: string;
  },
  correlationId?: string
): Promise<{ success: boolean; eventId?: string; errors?: string[] }> {
  const aiMetadata: AIFlowMetadata = {
    flowName: 'multi-agent-processing',
    agentType: metadata.agentTypes?.join(','),
    modelUsed: Object.values(metadata.modelsUsed || {}).join(','),
    processingTimeMs: metadata.processingTimeMs || metadata.totalDuration,
    batchSize: metadata.ticketCount,
    success: action === 'MULTI_AGENT_PROCESSING_COMPLETED' && !metadata.errorMessage,
    errorMessage: metadata.errorMessage,
    dataSensitivity: 'confidential',
  };
  
  return logAuditEvent(
    user,
    action,
    aiMetadata,
    metadata,
    {
      correlationId,
      dataSensitivity: 'confidential',
      source: 'api'
    }
  );
}

/**
 * Legacy compatibility function - maintains backward compatibility with existing code
 */
export async function logAuditEventLegacy(
  user: AuthenticatedUser | null,
  action: AuditAction,
  details: Record<string, any> = {}
): Promise<void> {
  await logAuditEvent(user, action, {}, details);
}
