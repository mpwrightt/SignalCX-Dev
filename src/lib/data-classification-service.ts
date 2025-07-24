/**
 * Data Classification Service
 * Provides utilities for classifying, validating, and handling data based on eBay's Data Handling Policy
 */

import {
  DataClassification,
  ClassificationMetadata,
  ClassifiedData,
  PiiType,
  classifyContent,
  createClassificationMetadata,
  canAccessClassification,
  redactSensitiveData,
  requiresAuditLogging,
  requiresEncryption,
  DATA_HANDLING_POLICIES,
  PII_PATTERNS,
  CLASSIFICATION_KEYWORDS
} from './data-classification';
import type { AuthenticatedUser, Ticket, UserProfile, AgentProfile } from './types';

/**
 * Automatically classify a ticket based on its content
 */
export function classifyTicket(ticket: Ticket, classifiedBy: string = 'system'): Ticket {
  // Combine all text content for analysis
  const allContent = [
    ticket.subject,
    ticket.description,
    ticket.requester,
    ...ticket.conversation.map(c => c.message),
    ...ticket.tags
  ].join(' ');

  const { classification, detectedPii, reason } = classifyContent(allContent);
  
  return {
    ...ticket,
    classification: createClassificationMetadata(classification, reason, classifiedBy, detectedPii)
  };
}

/**
 * Automatically classify a user profile based on its content
 */
export function classifyUserProfile(profile: UserProfile, classifiedBy: string = 'system'): UserProfile {
  // User profiles typically contain PII (email, name) so should be RESTRICTED by default
  const detectedPii: PiiType[] = [];
  
  // Check for email PII
  if (PII_PATTERNS[PiiType.EMAIL].test(profile.email)) {
    detectedPii.push(PiiType.EMAIL);
  }
  
  // Check for name PII
  if (PII_PATTERNS[PiiType.NAME].test(profile.name)) {
    detectedPii.push(PiiType.NAME);
  }

  const classification = detectedPii.length > 0 
    ? DataClassification.RESTRICTED 
    : DataClassification.CONFIDENTIAL;

  const reason = detectedPii.length > 0 
    ? `PII detected: ${detectedPii.join(', ')}`
    : 'User profile contains potentially sensitive information';

  return {
    ...profile,
    classification: createClassificationMetadata(classification, reason, classifiedBy, detectedPii)
  };
}

/**
 * Automatically classify an agent profile
 */
export function classifyAgentProfile(profile: AgentProfile, classifiedBy: string = 'system'): AgentProfile {
  // Agent profiles typically contain internal performance data
  const classification = DataClassification.CONFIDENTIAL;
  const reason = 'Agent performance data is confidential business information';

  return {
    ...profile,
    classification: createClassificationMetadata(classification, reason, classifiedBy)
  };
}

/**
 * Batch classify multiple tickets
 */
export function classifyTickets(tickets: Ticket[], classifiedBy: string = 'system'): Ticket[] {
  return tickets.map(ticket => classifyTicket(ticket, classifiedBy));
}

/**
 * Filter tickets based on user access permissions
 */
export function filterTicketsByClassification(
  user: AuthenticatedUser | null,
  tickets: Ticket[]
): Ticket[] {
  return tickets.filter(ticket => {
    if (!ticket.classification) {
      // Unclassified tickets default to INTERNAL level
      return canAccessClassification(user, DataClassification.INTERNAL, ticket.organizationId);
    }
    return canAccessClassification(user, ticket.classification.level, ticket.organizationId);
  });
}

/**
 * Redact ticket data based on user permissions
 */
export function redactTicketData(user: AuthenticatedUser | null, ticket: Ticket): Ticket {
  if (!ticket.classification) {
    return ticket;
  }

  if (canAccessClassification(user, ticket.classification.level, ticket.organizationId)) {
    return ticket;
  }

  // Create redacted version
  const redactedTicket = redactSensitiveData(user, ticket, ticket.classification.level);
  
  // Redact conversation messages
  const redactedConversation = ticket.conversation.map(msg => ({
    ...msg,
    message: redactSensitiveContent(msg.message)
  }));

  return {
    ...ticket,
    ...redactedTicket,
    conversation: redactedConversation
  } as Ticket;
}

/**
 * Redact sensitive content from a string
 */
export function redactSensitiveContent(content: string): string {
  let redacted = content;
  
  // Apply PII redaction patterns
  for (const [piiType, pattern] of Object.entries(PII_PATTERNS)) {
    redacted = redacted.replace(pattern, `[${piiType.toUpperCase()}_REDACTED]`);
  }
  
  return redacted;
}

/**
 * Check if a user can view specific data classification
 */
export function canUserViewClassification(
  user: AuthenticatedUser | null,
  classification: DataClassification,
  organizationId?: string
): boolean {
  return canAccessClassification(user, classification, organizationId);
}

/**
 * Get classification statistics for an organization
 */
export function getClassificationStats(tickets: Ticket[]): {
  total: number;
  byClassification: Record<DataClassification, number>;
  piiDetected: number;
  unclassified: number;
} {
  const stats = {
    total: tickets.length,
    byClassification: {
      [DataClassification.PUBLIC]: 0,
      [DataClassification.INTERNAL]: 0,
      [DataClassification.CONFIDENTIAL]: 0,
      [DataClassification.RESTRICTED]: 0
    },
    piiDetected: 0,
    unclassified: 0
  };

  tickets.forEach(ticket => {
    if (!ticket.classification) {
      stats.unclassified++;
      return;
    }

    stats.byClassification[ticket.classification.level]++;
    
    if (ticket.classification.detectedPii && ticket.classification.detectedPii.length > 0) {
      stats.piiDetected++;
    }
  });

  return stats;
}

/**
 * Validate data classification compliance
 */
export function validateClassificationCompliance(data: any[]): {
  compliant: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  let unclassifiedCount = 0;
  let restrictedWithoutEncryption = 0;
  let oldClassifications = 0;
  
  data.forEach((item, index) => {
    if (!item.classification) {
      unclassifiedCount++;
      return;
    }

    const classification = item.classification as ClassificationMetadata;
    
    // Check if classification is old (more than 90 days)
    const classificationDate = new Date(classification.lastClassified);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    if (classificationDate < ninetyDaysAgo) {
      oldClassifications++;
    }

    // Check if restricted data requires encryption
    if (classification.level === DataClassification.RESTRICTED) {
      if (!requiresEncryption(classification.level)) {
        restrictedWithoutEncryption++;
      }
    }
  });

  if (unclassifiedCount > 0) {
    issues.push(`${unclassifiedCount} items are unclassified`);
    recommendations.push('Run automatic classification on all unclassified data');
  }

  if (oldClassifications > 0) {
    issues.push(`${oldClassifications} items have outdated classifications (>90 days)`);
    recommendations.push('Re-classify items older than 90 days');
  }

  if (restrictedWithoutEncryption > 0) {
    issues.push(`${restrictedWithoutEncryption} restricted items may not be properly encrypted`);
    recommendations.push('Ensure all restricted data is encrypted at rest and in transit');
  }

  return {
    compliant: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Generate classification report
 */
export function generateClassificationReport(
  tickets: Ticket[],
  userProfiles: UserProfile[] = [],
  agentProfiles: AgentProfile[] = []
): {
  summary: {
    totalItems: number;
    classified: number;
    unclassified: number;
    compliance: number;
  };
  distribution: Record<DataClassification, number>;
  piiTypes: Record<PiiType, number>;
  recommendations: string[];
} {
  const allItems = [...tickets, ...userProfiles, ...agentProfiles];
  const totalItems = allItems.length;
  
  let classified = 0;
  const distribution: Record<DataClassification, number> = {
    [DataClassification.PUBLIC]: 0,
    [DataClassification.INTERNAL]: 0,
    [DataClassification.CONFIDENTIAL]: 0,
    [DataClassification.RESTRICTED]: 0
  };
  
  const piiTypes: Record<PiiType, number> = {
    [PiiType.EMAIL]: 0,
    [PiiType.PHONE]: 0,
    [PiiType.SSN]: 0,
    [PiiType.CREDIT_CARD]: 0,
    [PiiType.IP_ADDRESS]: 0,
    [PiiType.NAME]: 0,
    [PiiType.ADDRESS]: 0,
    [PiiType.DATE_OF_BIRTH]: 0,
    [PiiType.PASSPORT]: 0,
    [PiiType.DRIVER_LICENSE]: 0
  };

  allItems.forEach(item => {
    if (item.classification) {
      classified++;
      distribution[item.classification.level]++;
      
      if (item.classification.detectedPii) {
        item.classification.detectedPii.forEach(pii => {
          piiTypes[pii]++;
        });
      }
    }
  });

  const unclassified = totalItems - classified;
  const compliance = totalItems > 0 ? Math.round((classified / totalItems) * 100) : 100;

  const recommendations: string[] = [];
  
  if (compliance < 90) {
    recommendations.push('Classify remaining unclassified data to improve compliance');
  }
  
  if (distribution[DataClassification.RESTRICTED] > 0) {
    recommendations.push('Review restricted data for proper access controls and encryption');
  }
  
  if (Object.values(piiTypes).some(count => count > 0)) {
    recommendations.push('Implement additional PII protection measures for detected sensitive data');
  }

  return {
    summary: {
      totalItems,
      classified,
      unclassified,
      compliance
    },
    distribution,
    piiTypes,
    recommendations
  };
}

/**
 * Auto-classify data based on patterns and context
 */
export function autoClassifyBatch<T extends { classification?: ClassificationMetadata }>(
  items: T[],
  getContentFunction: (item: T) => string,
  classifiedBy: string = 'system'
): T[] {
  return items.map(item => {
    if (item.classification) {
      return item; // Already classified
    }

    const content = getContentFunction(item);
    const { classification, detectedPii, reason } = classifyContent(content);
    
    return {
      ...item,
      classification: createClassificationMetadata(classification, reason, classifiedBy, detectedPii)
    };
  });
}

/**
 * Check if user needs training for accessing certain classification levels
 */
export function getUserTrainingRequirements(
  user: AuthenticatedUser | null,
  requestedClassification: DataClassification
): {
  requiresTraining: boolean;
  missingTraining: string[];
  canAccess: boolean;
} {
  if (!user) {
    return {
      requiresTraining: true,
      missingTraining: ['User authentication required'],
      canAccess: false
    };
  }

  const policy = DATA_HANDLING_POLICIES[requestedClassification];
  const missingTraining: string[] = [];
  
  // Check for custom training requirements
  const trainingRequirements = policy.accessRequirements.filter(req => req.type === 'custom');
  
  trainingRequirements.forEach(requirement => {
    // In a real system, you would check against a training database
    // For now, we'll assume all users need PII training for restricted data
    if (requirement.value === 'pii_training' && requestedClassification === DataClassification.RESTRICTED) {
      missingTraining.push('PII Handling Training');
    }
  });

  const canAccess = canAccessClassification(user, requestedClassification);
  
  return {
    requiresTraining: missingTraining.length > 0,
    missingTraining,
    canAccess
  };
}

/**
 * Export classification data for compliance reporting
 */
export function exportClassificationData(items: any[]): {
  timestamp: string;
  version: string;
  summary: any;
  items: {
    id: string;
    type: string;
    classification: ClassificationMetadata | null;
    organizationId?: string;
  }[];
} {
  return {
    timestamp: new Date().toISOString(),
    version: '1.0',
    summary: generateClassificationReport(items),
    items: items.map((item, index) => ({
      id: item.id || `item-${index}`,
      type: item.constructor.name || 'unknown',
      classification: item.classification || null,
      organizationId: item.organizationId
    }))
  };
}