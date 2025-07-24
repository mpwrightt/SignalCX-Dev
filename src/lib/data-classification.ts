/**
 * Data Classification Framework for SignalCX
 * Implements eBay's Data Handling Policy with 4 classification levels
 */

import type { UserRole, Permission, AuthenticatedUser } from './types';

// Data Classification Levels (aligned with eBay's policy)
export enum DataClassification {
  PUBLIC = 'public',           // Publicly available data
  INTERNAL = 'internal',       // Internal company data
  CONFIDENTIAL = 'confidential', // Sensitive business data
  RESTRICTED = 'restricted'    // Highly sensitive data (PII, financial, etc.)
}

// Data classification metadata interface
export interface ClassificationMetadata {
  level: DataClassification;
  reason: string;
  detectedPii?: PiiType[];
  lastClassified: string;
  classifiedBy: 'system' | 'user' | string;
  retentionPolicy?: RetentionPolicy;
  accessRequirements?: AccessRequirement[];
}

// PII (Personally Identifiable Information) types
export enum PiiType {
  EMAIL = 'email',
  PHONE = 'phone',
  SSN = 'ssn',
  CREDIT_CARD = 'credit_card',
  IP_ADDRESS = 'ip_address',
  NAME = 'name',
  ADDRESS = 'address',
  DATE_OF_BIRTH = 'date_of_birth',
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license'
}

// Data retention policies
export interface RetentionPolicy {
  retentionPeriodDays: number;
  automaticDeletion: boolean;
  archiveBeforeDeletion: boolean;
  legalHoldExempt: boolean;
}

// Access requirements for classified data
export interface AccessRequirement {
  type: 'role' | 'permission' | 'organization' | 'custom';
  value: string;
  description: string;
}

// Classification-aware data wrapper
export interface ClassifiedData<T = any> {
  data: T;
  classification: ClassificationMetadata;
  id?: string;
  organizationId?: string;
}

// Data handling policies by classification level
export const DATA_HANDLING_POLICIES: Record<DataClassification, {
  minimumRole: UserRole;
  requiredPermissions: Permission[];
  retentionPolicy: RetentionPolicy;
  accessRequirements: AccessRequirement[];
  allowCrossOrganization: boolean;
  requiresAuditLogging: boolean;
  requiresEncryption: boolean;
}> = {
  [DataClassification.PUBLIC]: {
    minimumRole: 'readonly',
    requiredPermissions: [],
    retentionPolicy: {
      retentionPeriodDays: 2555, // 7 years
      automaticDeletion: false,
      archiveBeforeDeletion: true,
      legalHoldExempt: true
    },
    accessRequirements: [],
    allowCrossOrganization: true,
    requiresAuditLogging: false,
    requiresEncryption: false
  },
  [DataClassification.INTERNAL]: {
    minimumRole: 'agent',
    requiredPermissions: ['tickets.read'],
    retentionPolicy: {
      retentionPeriodDays: 1825, // 5 years
      automaticDeletion: true,
      archiveBeforeDeletion: true,
      legalHoldExempt: false
    },
    accessRequirements: [
      { type: 'organization', value: 'same', description: 'Must be in same organization' }
    ],
    allowCrossOrganization: false,
    requiresAuditLogging: true,
    requiresEncryption: false
  },
  [DataClassification.CONFIDENTIAL]: {
    minimumRole: 'manager',
    requiredPermissions: ['analytics.read'],
    retentionPolicy: {
      retentionPeriodDays: 1095, // 3 years
      automaticDeletion: true,
      archiveBeforeDeletion: true,
      legalHoldExempt: false
    },
    accessRequirements: [
      { type: 'organization', value: 'same', description: 'Must be in same organization' },
      { type: 'role', value: 'manager+', description: 'Requires manager role or higher' }
    ],
    allowCrossOrganization: false,
    requiresAuditLogging: true,
    requiresEncryption: true
  },
  [DataClassification.RESTRICTED]: {
    minimumRole: 'org_admin',
    requiredPermissions: ['users.read', 'audit.read'],
    retentionPolicy: {
      retentionPeriodDays: 365, // 1 year
      automaticDeletion: true,
      archiveBeforeDeletion: true,
      legalHoldExempt: false
    },
    accessRequirements: [
      { type: 'organization', value: 'same', description: 'Must be in same organization' },
      { type: 'role', value: 'org_admin+', description: 'Requires org_admin role or higher' },
      { type: 'custom', value: 'pii_training', description: 'Must have completed PII training' }
    ],
    allowCrossOrganization: false,
    requiresAuditLogging: true,
    requiresEncryption: true
  }
};

// PII detection patterns
export const PII_PATTERNS: Record<PiiType, RegExp> = {
  [PiiType.EMAIL]: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  [PiiType.PHONE]: /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  [PiiType.SSN]: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  [PiiType.CREDIT_CARD]: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  [PiiType.IP_ADDRESS]: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  [PiiType.NAME]: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Simple name pattern
  [PiiType.ADDRESS]: /\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)/gi,
  [PiiType.DATE_OF_BIRTH]: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g,
  [PiiType.PASSPORT]: /\b[A-Z]{1,2}\d{6,9}\b/g,
  [PiiType.DRIVER_LICENSE]: /\b[A-Z]\d{7,8}\b/g
};

// Classification keywords for automatic detection
export const CLASSIFICATION_KEYWORDS: Record<DataClassification, string[]> = {
  [DataClassification.PUBLIC]: [
    'public', 'marketing', 'press release', 'website', 'blog', 'social media'
  ],
  [DataClassification.INTERNAL]: [
    'internal', 'company', 'employee', 'staff', 'meeting', 'project', 'team'
  ],
  [DataClassification.CONFIDENTIAL]: [
    'confidential', 'proprietary', 'strategy', 'financial', 'revenue', 'profit',
    'acquisition', 'partnership', 'contract', 'pricing', 'competitive'
  ],
  [DataClassification.RESTRICTED]: [
    'restricted', 'secret', 'classified', 'pii', 'personal', 'sensitive',
    'ssn', 'social security', 'credit card', 'password', 'private key'
  ]
};

// Role hierarchy for classification access
export const ROLE_HIERARCHY_LEVELS: Record<UserRole, number> = {
  readonly: 1,
  agent: 2,
  manager: 3,
  org_admin: 4,
  super_admin: 5
};

/**
 * Check if a user can access data with a specific classification
 */
export function canAccessClassification(
  user: AuthenticatedUser | null,
  classification: DataClassification,
  organizationId?: string
): boolean {
  if (!user || !user.isActive) {
    return false;
  }

  const policy = DATA_HANDLING_POLICIES[classification];
  
  // Check minimum role requirement
  const userLevel = ROLE_HIERARCHY_LEVELS[user.role];
  const minimumLevel = ROLE_HIERARCHY_LEVELS[policy.minimumRole];
  
  if (userLevel < minimumLevel) {
    return false;
  }

  // Check required permissions
  const hasRequiredPermissions = policy.requiredPermissions.every(
    permission => user.permissions.includes(permission)
  );
  
  if (!hasRequiredPermissions) {
    return false;
  }

  // Check organization access
  if (!policy.allowCrossOrganization && organizationId) {
    if (user.role !== 'super_admin' && user.organizationId !== organizationId) {
      return false;
    }
  }

  return true;
}

/**
 * Get the appropriate classification level for data content
 */
export function classifyContent(content: string): {
  classification: DataClassification;
  detectedPii: PiiType[];
  reason: string;
} {
  const detectedPii: PiiType[] = [];
  const contentLower = content.toLowerCase();

  // Check for PII patterns
  for (const [piiType, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(content)) {
      detectedPii.push(piiType as PiiType);
    }
  }

  // If PII is detected, classify as RESTRICTED
  if (detectedPii.length > 0) {
    return {
      classification: DataClassification.RESTRICTED,
      detectedPii,
      reason: `PII detected: ${detectedPii.join(', ')}`
    };
  }

  // Check classification keywords
  for (const [level, keywords] of Object.entries(CLASSIFICATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (contentLower.includes(keyword)) {
        return {
          classification: level as DataClassification,
          detectedPii,
          reason: `Keyword match: "${keyword}"`
        };
      }
    }
  }

  // Default to INTERNAL for business data
  return {
    classification: DataClassification.INTERNAL,
    detectedPii,
    reason: 'Default business data classification'
  };
}

/**
 * Create classification metadata
 */
export function createClassificationMetadata(
  classification: DataClassification,
  reason: string,
  classifiedBy: string = 'system',
  detectedPii?: PiiType[]
): ClassificationMetadata {
  const policy = DATA_HANDLING_POLICIES[classification];
  
  return {
    level: classification,
    reason,
    detectedPii,
    lastClassified: new Date().toISOString(),
    classifiedBy,
    retentionPolicy: policy.retentionPolicy,
    accessRequirements: policy.accessRequirements
  };
}

/**
 * Wrap data with classification
 */
export function classifyData<T>(
  data: T,
  classification: DataClassification,
  reason: string,
  classifiedBy: string = 'system',
  organizationId?: string,
  id?: string
): ClassifiedData<T> {
  return {
    data,
    classification: createClassificationMetadata(classification, reason, classifiedBy),
    organizationId,
    id
  };
}

/**
 * Filter classified data based on user access
 */
export function filterClassifiedData<T>(
  user: AuthenticatedUser | null,
  classifiedData: ClassifiedData<T>[]
): ClassifiedData<T>[] {
  return classifiedData.filter(item => 
    canAccessClassification(user, item.classification.level, item.organizationId)
  );
}

/**
 * Redact sensitive data based on classification and user access
 */
export function redactSensitiveData<T extends Record<string, any>>(
  user: AuthenticatedUser | null,
  data: T,
  classification: DataClassification
): Partial<T> {
  if (canAccessClassification(user, classification)) {
    return data;
  }

  // Create redacted version
  const redacted: Partial<T> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Redact PII patterns
      let redactedValue = value;
      for (const pattern of Object.values(PII_PATTERNS)) {
        redactedValue = redactedValue.replace(pattern, '[REDACTED]');
      }
      redacted[key as keyof T] = redactedValue as T[keyof T];
    } else if (key.toLowerCase().includes('email') || 
               key.toLowerCase().includes('phone') || 
               key.toLowerCase().includes('address')) {
      redacted[key as keyof T] = '[REDACTED]' as T[keyof T];
    } else {
      redacted[key as keyof T] = value;
    }
  }

  return redacted;
}

/**
 * Check if data requires encryption based on classification
 */
export function requiresEncryption(classification: DataClassification): boolean {
  return DATA_HANDLING_POLICIES[classification].requiresEncryption;
}

/**
 * Check if data access requires audit logging
 */
export function requiresAuditLogging(classification: DataClassification): boolean {
  return DATA_HANDLING_POLICIES[classification].requiresAuditLogging;
}

/**
 * Get classification display info
 */
export function getClassificationDisplay(classification: DataClassification): {
  label: string;
  color: string;
  icon: string;
  description: string;
} {
  const displays = {
    [DataClassification.PUBLIC]: {
      label: 'Public',
      color: 'green',
      icon: '🌍',
      description: 'Publicly available information'
    },
    [DataClassification.INTERNAL]: {
      label: 'Internal',
      color: 'blue',
      icon: '🏢',
      description: 'Internal company information'
    },
    [DataClassification.CONFIDENTIAL]: {
      label: 'Confidential',
      color: 'orange',
      icon: '🔒',
      description: 'Sensitive business information'
    },
    [DataClassification.RESTRICTED]: {
      label: 'Restricted',
      color: 'red',
      icon: '🚫',
      description: 'Highly sensitive information with PII'
    }
  };

  return displays[classification];
}