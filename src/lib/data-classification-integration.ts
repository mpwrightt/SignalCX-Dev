/**
 * Data Classification Integration Examples
 * Demonstrates how to integrate the data classification system with existing services
 */

import {
  DataClassification,
  classifyContent,
  canAccessClassification,
  redactSensitiveData
} from './data-classification';
import {
  classifyTicket,
  classifyUserProfile,
  classifyAgentProfile,
  filterTicketsByClassification,
  redactTicketData,
  validateClassificationCompliance,
  generateClassificationReport
} from './data-classification-service';
import {
  validateClassificationAssignment,
  validateDataAccess,
  enforceClassificationRules,
  createClassificationAudit
} from './data-classification-validator';
import {
  hasDataClassificationAccess,
  filterByClassification,
  validateClassifiedDataAccess
} from './rbac-service';
import {
  logDataClassificationEvent,
  logClassifiedDataAccess,
  logClassificationViolation,
  logPiiDetectionEvent
} from './audit-service';
import type { AuthenticatedUser, Ticket, UserProfile, AgentProfile } from './types';

/**
 * Enhanced Zendesk Service with Data Classification
 * Demonstrates how to integrate classification with data retrieval
 */
export class ClassificationAwareDataService {
  
  /**
   * Get tickets with automatic classification and access control
   */
  async getTicketsWithClassification(
    user: AuthenticatedUser | null,
    tickets: Ticket[]
  ): Promise<{
    accessibleTickets: Ticket[];
    classificationStats: any;
    complianceReport: any;
  }> {
    // Step 1: Classify all tickets
    const classifiedTickets = tickets.map(ticket => classifyTicket(ticket, 'system'));
    
    // Step 2: Filter based on user access permissions
    const accessibleTickets = filterTicketsByClassification(user, classifiedTickets);
    
    // Step 3: Redact sensitive data from accessible tickets
    const redactedTickets = accessibleTickets.map(ticket => 
      redactTicketData(user, ticket)
    );
    
    // Step 4: Log access to classified data
    for (const ticket of accessibleTickets) {
      if (ticket.classification) {
        await logClassifiedDataAccess(
          user,
          'Ticket',
          ticket.id.toString(),
          ticket.classification.level as any,
          'read'
        );
      }
    }
    
    // Step 5: Generate classification statistics
    const classificationStats = this.generateTicketClassificationStats(classifiedTickets);
    
    // Step 6: Validate compliance
    const complianceReport = validateClassificationCompliance(classifiedTickets);
    
    return {
      accessibleTickets: redactedTickets,
      classificationStats,
      complianceReport
    };
  }

  /**
   * Create or update ticket with classification validation
   */
  async createOrUpdateTicket(
    user: AuthenticatedUser | null,
    ticketData: Partial<Ticket>,
    isUpdate: boolean = false,
    existingTicket?: Ticket
  ): Promise<{
    success: boolean;
    ticket?: Ticket;
    violations: any[];
    classificationApplied?: DataClassification;
  }> {
    let violations: any[] = [];
    
    // Step 1: Apply automatic classification
    const classifiedTicket = classifyTicket(ticketData as Ticket, user?.id || 'system');
    
    // Step 2: Validate classification if this is an update
    if (isUpdate && existingTicket) {
      const enforcementResult = enforceClassificationRules(
        existingTicket,
        classifiedTicket,
        user
      );
      
      if (!enforcementResult.allowed) {
        violations = enforcementResult.violations;
        
        // Log violation
        await logClassificationViolation(
          user,
          'unauthorized_modification',
          'Ticket',
          classifiedTicket.id.toString(),
          'Attempted to modify classified ticket without permission'
        );
        
        return {
          success: false,
          violations,
          ticket: enforcementResult.enforcedData
        };
      }
    }

    // Step 3: Validate user access to the classification level
    if (classifiedTicket.classification) {
      const accessValidation = validateDataAccess(
        user,
        classifiedTicket,
        isUpdate ? 'write' : 'write'
      );
      
      if (!accessValidation.valid) {
        violations.push(...accessValidation.errors);
        return {
          success: false,
          violations,
          ticket: classifiedTicket
        };
      }
    }

    // Step 4: Log the classification event
    if (classifiedTicket.classification) {
      const action = isUpdate ? 'DATA_RECLASSIFIED' : 'DATA_CLASSIFIED';
      await logDataClassificationEvent(
        user,
        action,
        'Ticket',
        classifiedTicket.id.toString(),
        classifiedTicket.classification.level,
        classifiedTicket.classification.reason,
        'system',
        existingTicket?.classification?.level as any,
        classifiedTicket.classification.detectedPii
      );
    }

    return {
      success: true,
      ticket: classifiedTicket,
      violations,
      classificationApplied: classifiedTicket.classification?.level
    };
  }

  /**
   * Export data with classification compliance checks
   */
  async exportData(
    user: AuthenticatedUser | null,
    data: (Ticket | UserProfile | AgentProfile)[],
    format: 'csv' | 'json' | 'pdf' = 'json'
  ): Promise<{
    success: boolean;
    exportData?: any[];
    restrictions: string[];
    complianceWarnings: string[];
  }> {
    const restrictions: string[] = [];
    const complianceWarnings: string[] = [];
    const exportData: any[] = [];

    for (const item of data) {
      // Check if user can export this data
      const classification = item.classification?.level || DataClassification.INTERNAL;
      
      if (!canAccessClassification(user, classification, item.organizationId)) {
        const itemId = (item as any).id || 'unknown';
        restrictions.push(`Cannot export ${item.constructor.name} ${itemId}: insufficient permissions`);
        continue;
      }

      // Special restrictions for restricted data
      if (classification === DataClassification.RESTRICTED) {
        if (!user?.permissions.includes('data.access_restricted')) {
          restrictions.push(`Cannot export RESTRICTED data: special permissions required`);
          continue;
        }
        
        complianceWarnings.push('Exporting RESTRICTED data - ensure compliance with data handling policies');
      }

      // Redact sensitive data if necessary
      const redactedItem = redactSensitiveData(user, item, classification);
      exportData.push(redactedItem);

      // Log the export
      const itemId = (item as any).id || 'unknown';
      await logClassifiedDataAccess(
        user,
        item.constructor.name,
        String(itemId),
        classification as any,
        'export'
      );
    }

    return {
      success: exportData.length > 0,
      exportData,
      restrictions,
      complianceWarnings
    };
  }

  /**
   * Bulk classify data
   */
  async bulkClassifyData(
    user: AuthenticatedUser | null,
    data: any[],
    dataType: string
  ): Promise<{
    classified: number;
    violations: number;
    piiDetected: number;
    results: any[];
  }> {
    let classified = 0;
    let violations = 0;
    let piiDetected = 0;
    const results = [];

    for (const item of data) {
      try {
        // Determine classification
        const content = this.extractContentForClassification(item);
        const { classification, detectedPii, reason } = classifyContent(content);
        
        // Validate classification assignment
        const validation = validateClassificationAssignment(item, classification, user);
        
        if (!validation.valid) {
          violations++;
          const itemId = (item as any).id || 'unknown';
          results.push({
            id: itemId,
            success: false,
            errors: validation.errors,
            warnings: validation.warnings
          });
          continue;
        }

        // Apply classification
        item.classification = {
          level: classification,
          reason,
          detectedPii,
          lastClassified: new Date().toISOString(),
          classifiedBy: user?.id || 'system'
        };

        classified++;
        if (detectedPii && detectedPii.length > 0) {
          piiDetected++;
          
          // Log PII detection
          const itemId = (item as any).id || 'unknown';
          await logPiiDetectionEvent(
            user,
            dataType,
            String(itemId),
            detectedPii,
            'automatic'
          );
        }

        // Log classification
        const itemId = (item as any).id || 'unknown';
        await logDataClassificationEvent(
          user,
          'AUTOMATIC_CLASSIFICATION_APPLIED',
          dataType,
          String(itemId),
          classification as any,
          reason,
          'automatic',
          undefined,
          detectedPii
        );

        results.push({
          id: itemId,
          success: true,
          classification,
          piiDetected: detectedPii,
          warnings: validation.warnings
        });

      } catch (error) {
        violations++;
        const itemId = (item as any).id || 'unknown';
        results.push({
          id: itemId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      classified,
      violations,
      piiDetected,
      results
    };
  }

  /**
   * Generate comprehensive classification report
   */
  async generateComplianceReport(
    tickets: Ticket[],
    userProfiles: UserProfile[] = [],
    agentProfiles: AgentProfile[] = []
  ): Promise<{
    overview: any;
    detailedReport: any;
    recommendations: string[];
    complianceScore: number;
  }> {
    // Generate classification report
    const report = generateClassificationReport(tickets, userProfiles, agentProfiles);
    
    // Validate compliance
    const allData = [...tickets, ...userProfiles, ...agentProfiles];
    const compliance = validateClassificationCompliance(allData);
    
    // Calculate compliance score
    const totalItems = allData.length;
    const compliantItems = totalItems - compliance.issues.length;
    const complianceScore = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100;
    
    // Enhanced recommendations
    const recommendations = [
      ...report.recommendations,
      ...compliance.recommendations
    ];
    
    if (complianceScore < 95) {
      recommendations.push('Implement automated classification workflows to improve compliance');
    }
    
    if (Object.values(report.piiTypes).some(count => count > 0)) {
      recommendations.push('Consider implementing additional PII protection measures');
    }

    return {
      overview: {
        totalItems,
        complianceScore,
        classificationDistribution: report.distribution,
        piiDetectionSummary: report.piiTypes
      },
      detailedReport: {
        ...report,
        complianceValidation: compliance
      },
      recommendations: Array.from(new Set(recommendations)), // Remove duplicates
      complianceScore
    };
  }

  // Helper methods

  private generateTicketClassificationStats(tickets: Ticket[]) {
    const stats = {
      total: tickets.length,
      classified: 0,
      byLevel: {
        [DataClassification.PUBLIC]: 0,
        [DataClassification.INTERNAL]: 0,
        [DataClassification.CONFIDENTIAL]: 0,
        [DataClassification.RESTRICTED]: 0
      },
      piiDetected: 0,
      autoClassified: 0
    };

    tickets.forEach(ticket => {
      if (ticket.classification) {
        stats.classified++;
        stats.byLevel[ticket.classification.level]++;
        
        if (ticket.classification.detectedPii?.length) {
          stats.piiDetected++;
        }
        
        if (ticket.classification.classifiedBy === 'system') {
          stats.autoClassified++;
        }
      }
    });

    return stats;
  }

  private extractContentForClassification(item: any): string {
    // Extract all text content from various types of objects
    const textFields = [];
    
    if (typeof item === 'string') {
      return item;
    }
    
    if (typeof item === 'object') {
      // Common text fields
      if (item.subject) textFields.push(item.subject);
      if (item.description) textFields.push(item.description);
      if (item.name) textFields.push(item.name);
      if (item.email) textFields.push(item.email);
      
      // Conversation content
      if (item.conversation && Array.isArray(item.conversation)) {
        textFields.push(...item.conversation.map((c: any) => c.message));
      }
      
      // Tags
      if (item.tags && Array.isArray(item.tags)) {
        textFields.push(...item.tags);
      }
    }
    
    return textFields.join(' ');
  }
}

/**
 * Middleware function for API routes to enforce classification
 */
export function withClassificationMiddleware(
  handler: (req: any, res: any, user: AuthenticatedUser) => Promise<any>
) {
  return async (req: any, res: any) => {
    try {
      const user = req.user as AuthenticatedUser; // Assume auth middleware sets this
      
      // Check if this endpoint handles classified data
      const handlesClassifiedData = req.path.includes('/tickets') || 
                                   req.path.includes('/profiles') ||
                                   req.path.includes('/analytics');
      
      if (handlesClassifiedData) {
        // Log data access attempt
        await logClassifiedDataAccess(
          user,
          'API_Endpoint',
          req.path,
          DataClassification.INTERNAL as any,
          req.method.toLowerCase() as any
        );
      }
      
      return handler(req, res, user);
      
    } catch (error) {
      console.error('Classification middleware error:', error);
      throw error;
    }
  };
}

/**
 * Example usage patterns
 */
export const DataClassificationExamples = {
  
  // Classify a new ticket
  async classifyNewTicket(ticketData: Partial<Ticket>, user: AuthenticatedUser) {
    const service = new ClassificationAwareDataService();
    return service.createOrUpdateTicket(user, ticketData, false);
  },
  
  // Bulk process tickets with classification
  async processTicketBatch(tickets: Ticket[], user: AuthenticatedUser) {
    const service = new ClassificationAwareDataService();
    return service.bulkClassifyData(user, tickets, 'Ticket');
  },
  
  // Generate compliance dashboard data
  async getComplianceDashboard(
    tickets: Ticket[],
    profiles: UserProfile[],
    user: AuthenticatedUser
  ) {
    const service = new ClassificationAwareDataService();
    return service.generateComplianceReport(tickets, profiles);
  },
  
  // Export data with classification checks
  async exportTicketsSecurely(tickets: Ticket[], user: AuthenticatedUser) {
    const service = new ClassificationAwareDataService();
    return service.exportData(user, tickets, 'json');
  }
};