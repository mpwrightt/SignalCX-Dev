/**
 * Data Classification Validation and Enforcement Utilities
 * Provides validation, enforcement, and compliance checking for data classification
 */

import {
  DataClassification,
  ClassificationMetadata,
  PiiType,
  DATA_HANDLING_POLICIES,
  PII_PATTERNS,
  requiresAuditLogging,
  requiresEncryption
} from './data-classification';
import type { AuthenticatedUser, Ticket, UserProfile, AgentProfile } from './types';
import { validateClassifiedDataAccess } from './rbac-service';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion: string;
}

export interface ClassificationAuditEntry {
  timestamp: string;
  userId: string;
  action: 'classify' | 'declassify' | 'access' | 'modify' | 'export';
  dataType: string;
  dataId: string;
  classification: DataClassification;
  previousClassification?: DataClassification;
  reason: string;
  organizationId?: string;
}

/**
 * Validate classification assignment
 */
export function validateClassificationAssignment(
  data: any,
  proposedClassification: DataClassification,
  user: AuthenticatedUser | null
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const recommendations: string[] = [];

  // Check if user has permission to classify data
  if (!user || !user.permissions.includes('data.classify')) {
    errors.push({
      field: 'user',
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'User does not have permission to classify data',
      severity: 'critical'
    });
  }

  // Validate classification level against content
  const contentValidation = validateContentClassification(data, proposedClassification);
  if (!contentValidation.valid) {
    errors.push(...contentValidation.errors);
    warnings.push(...contentValidation.warnings);
  }

  // Check for over-classification
  const suggestedClassification = suggestOptimalClassification(data);
  if (isOverClassified(proposedClassification, suggestedClassification)) {
    warnings.push({
      field: 'classification',
      code: 'OVER_CLASSIFICATION',
      message: `Data may be over-classified. Suggested: ${suggestedClassification}`,
      suggestion: `Consider using ${suggestedClassification} classification instead`
    });
  }

  // Check for under-classification
  if (isUnderClassified(proposedClassification, suggestedClassification)) {
    errors.push({
      field: 'classification',
      code: 'UNDER_CLASSIFICATION',
      message: `Data appears to be under-classified. Minimum suggested: ${suggestedClassification}`,
      severity: 'high'
    });
  }

  // Add recommendations
  if (proposedClassification === DataClassification.RESTRICTED) {
    recommendations.push('Ensure data encryption is enabled for restricted data');
    recommendations.push('Implement additional access controls and monitoring');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
}

/**
 * Validate content against proposed classification
 */
export function validateContentClassification(
  data: any,
  classification: DataClassification
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const recommendations: string[] = [];

  // Extract text content for analysis
  const content = extractTextContent(data);
  
  // Check for PII patterns
  const detectedPii = detectPiiInContent(content);
  
  if (detectedPii.length > 0 && classification !== DataClassification.RESTRICTED) {
    errors.push({
      field: 'content',
      code: 'PII_DETECTED',
      message: `PII detected (${detectedPii.join(', ')}) but classification is not RESTRICTED`,
      severity: 'critical'
    });
    recommendations.push('All data containing PII must be classified as RESTRICTED');
  }

  // Check for classification keywords mismatch
  const keywordClassification = classifyByKeywords(content);
  if (keywordClassification && isClassificationMismatch(classification, keywordClassification)) {
    warnings.push({
      field: 'content',
      code: 'KEYWORD_MISMATCH',
      message: `Content suggests ${keywordClassification} classification`,
      suggestion: `Review content for keywords indicating ${keywordClassification} level`
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
}

/**
 * Validate data access attempt
 */
export function validateDataAccess(
  user: AuthenticatedUser | null,
  data: any,
  operation: 'read' | 'write' | 'delete' | 'export'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const recommendations: string[] = [];

  if (!data.classification) {
    warnings.push({
      field: 'data',
      code: 'UNCLASSIFIED_DATA',
      message: 'Data is not classified - applying default INTERNAL level',
      suggestion: 'Classify data to ensure proper access controls'
    });
  }

  const classification = data.classification?.level || DataClassification.INTERNAL;
  const accessValidation = validateClassifiedDataAccess(
    user,
    classification,
    data.organizationId
  );

  if (!accessValidation.allowed) {
    errors.push({
      field: 'access',
      code: 'ACCESS_DENIED',
      message: accessValidation.reason || 'Access denied',
      severity: 'critical'
    });
  }

  // Check operation-specific requirements
  if (operation === 'export' && classification === DataClassification.RESTRICTED) {
    if (!user?.permissions.includes('data.access_restricted')) {
      errors.push({
        field: 'operation',
        code: 'EXPORT_RESTRICTED',
        message: 'Cannot export RESTRICTED data without special permissions',
        severity: 'critical'
      });
    }
    recommendations.push('Export of restricted data requires additional approvals');
  }

  if (operation === 'write' && classification === DataClassification.CONFIDENTIAL) {
    recommendations.push('Modifications to confidential data should be logged and reviewed');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
}

/**
 * Validate data retention compliance
 */
export function validateRetentionCompliance(data: any[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const recommendations: string[] = [];

  data.forEach((item, index) => {
    if (!item.classification) {
      warnings.push({
        field: `item[${index}]`,
        code: 'NO_RETENTION_POLICY',
        message: 'Item has no classification or retention policy',
        suggestion: 'Classify data to apply appropriate retention policies'
      });
      return;
    }

    const classification = item.classification as ClassificationMetadata;
    const policy = DATA_HANDLING_POLICIES[classification.level];
    
    if (!policy.retentionPolicy) {
      errors.push({
        field: `item[${index}]`,
        code: 'MISSING_RETENTION_POLICY',
        message: 'Classification level missing retention policy',
        severity: 'medium'
      });
      return;
    }

    // Check if data is past retention period
    const classificationDate = new Date(classification.lastClassified);
    const retentionEnd = new Date(
      classificationDate.getTime() + policy.retentionPolicy.retentionPeriodDays * 24 * 60 * 60 * 1000
    );

    if (new Date() > retentionEnd) {
      if (policy.retentionPolicy.automaticDeletion) {
        errors.push({
          field: `item[${index}]`,
          code: 'RETENTION_EXPIRED',
          message: `Data past retention period (${policy.retentionPolicy.retentionPeriodDays} days)`,
          severity: 'high'
        });
        recommendations.push('Review and delete or archive expired data');
      } else {
        warnings.push({
          field: `item[${index}]`,
          code: 'RETENTION_REVIEW_NEEDED',
          message: 'Data retention period expired - review needed',
          suggestion: 'Manually review data for continued retention necessity'
        });
      }
    }

    // Check if approaching retention limit (within 30 days)
    const thirtyDaysBeforeExpiry = new Date(retentionEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (new Date() > thirtyDaysBeforeExpiry && new Date() <= retentionEnd) {
      warnings.push({
        field: `item[${index}]`,
        code: 'RETENTION_EXPIRING',
        message: 'Data retention period expiring within 30 days',
        suggestion: 'Prepare for data archival or deletion'
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
}

/**
 * Enforce classification rules on data modification
 */
export function enforceClassificationRules<T extends { classification?: ClassificationMetadata }>(
  originalData: T,
  modifiedData: T,
  user: AuthenticatedUser | null
): {
  allowed: boolean;
  enforcedData: T;
  violations: ValidationError[];
} {
  const violations: ValidationError[] = [];
  let enforcedData = { ...modifiedData };

  // Check if user can modify classified data
  if (originalData.classification) {
    const accessValidation = validateDataAccess(user, originalData, 'write');
    if (!accessValidation.valid) {
      violations.push(...accessValidation.errors);
      return {
        allowed: false,
        enforcedData: originalData,
        violations
      };
    }
  }

  // Prevent unauthorized classification changes
  if (originalData.classification && modifiedData.classification) {
    const originalLevel = originalData.classification.level;
    const newLevel = modifiedData.classification.level;
    
    if (originalLevel !== newLevel) {
      // Check if user can reclassify
      const canClassify = user?.permissions.includes('data.classify');
      const canDeclassify = user?.permissions.includes('data.declassify');
      
      const isUpgrading = isHigherClassification(newLevel, originalLevel);
      const isDowngrading = isHigherClassification(originalLevel, newLevel);
      
      if (isUpgrading && !canClassify) {
        violations.push({
          field: 'classification',
          code: 'UNAUTHORIZED_CLASSIFICATION_UPGRADE',
          message: 'User cannot upgrade data classification',
          severity: 'critical'
        });
        enforcedData.classification = originalData.classification;
      }
      
      if (isDowngrading && !canDeclassify) {
        violations.push({
          field: 'classification',
          code: 'UNAUTHORIZED_DECLASSIFICATION',
          message: 'User cannot downgrade data classification',
          severity: 'critical'
        });
        enforcedData.classification = originalData.classification;
      }
    }
  }

  return {
    allowed: violations.length === 0,
    enforcedData,
    violations
  };
}

/**
 * Create audit entry for classification action
 */
export function createClassificationAudit(
  user: AuthenticatedUser | null,
  action: ClassificationAuditEntry['action'],
  dataType: string,
  dataId: string,
  classification: DataClassification,
  reason: string,
  previousClassification?: DataClassification,
  organizationId?: string
): ClassificationAuditEntry {
  return {
    timestamp: new Date().toISOString(),
    userId: user?.id || 'anonymous',
    action,
    dataType,
    dataId,
    classification,
    previousClassification,
    reason,
    organizationId
  };
}

// Helper functions

function extractTextContent(data: any): string {
  if (typeof data === 'string') {
    return data;
  }
  
  if (typeof data === 'object') {
    return Object.values(data)
      .filter(value => typeof value === 'string')
      .join(' ');
  }
  
  return String(data);
}

function detectPiiInContent(content: string): PiiType[] {
  const detected: PiiType[] = [];
  
  for (const [piiType, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(content)) {
      detected.push(piiType as PiiType);
    }
  }
  
  return detected;
}

function classifyByKeywords(content: string): DataClassification | null {
  const contentLower = content.toLowerCase();
  
  // Check in order of sensitivity (most sensitive first)
  const classificationOrder = [
    DataClassification.RESTRICTED,
    DataClassification.CONFIDENTIAL,
    DataClassification.INTERNAL,
    DataClassification.PUBLIC
  ];
  
  for (const classification of classificationOrder) {
    const keywords = {
      [DataClassification.RESTRICTED]: ['restricted', 'secret', 'pii', 'sensitive'],
      [DataClassification.CONFIDENTIAL]: ['confidential', 'proprietary', 'financial'],
      [DataClassification.INTERNAL]: ['internal', 'company', 'employee'],
      [DataClassification.PUBLIC]: ['public', 'marketing', 'press']
    }[classification];
    
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      return classification;
    }
  }
  
  return null;
}

function suggestOptimalClassification(data: any): DataClassification {
  const content = extractTextContent(data);
  const detectedPii = detectPiiInContent(content);
  
  if (detectedPii.length > 0) {
    return DataClassification.RESTRICTED;
  }
  
  const keywordClassification = classifyByKeywords(content);
  return keywordClassification || DataClassification.INTERNAL;
}

function isOverClassified(actual: DataClassification, suggested: DataClassification): boolean {
  const levels = {
    [DataClassification.PUBLIC]: 1,
    [DataClassification.INTERNAL]: 2,
    [DataClassification.CONFIDENTIAL]: 3,
    [DataClassification.RESTRICTED]: 4
  };
  
  return levels[actual] > levels[suggested];
}

function isUnderClassified(actual: DataClassification, suggested: DataClassification): boolean {
  const levels = {
    [DataClassification.PUBLIC]: 1,
    [DataClassification.INTERNAL]: 2,
    [DataClassification.CONFIDENTIAL]: 3,
    [DataClassification.RESTRICTED]: 4
  };
  
  return levels[actual] < levels[suggested];
}

function isClassificationMismatch(actual: DataClassification, suggested: DataClassification): boolean {
  return actual !== suggested;
}

function isHigherClassification(level1: DataClassification, level2: DataClassification): boolean {
  const levels = {
    [DataClassification.PUBLIC]: 1,
    [DataClassification.INTERNAL]: 2,
    [DataClassification.CONFIDENTIAL]: 3,
    [DataClassification.RESTRICTED]: 4
  };
  
  return levels[level1] > levels[level2];
}