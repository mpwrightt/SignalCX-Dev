# Data Classification System Guide

This guide explains how to use the comprehensive data classification system implemented in SignalCX that aligns with eBay's Data Handling Policy.

## Overview

The data classification system provides:

- **4 Classification Levels**: Public, Internal, Confidential, Restricted
- **Automatic PII Detection**: Identifies and classifies personal information
- **Access Control Integration**: Works with existing RBAC system
- **Audit Logging**: Comprehensive tracking of data access and modifications
- **Compliance Validation**: Ensures adherence to data handling policies

## Classification Levels

### 1. Public (Level 1)
- **Description**: Publicly available information
- **Access**: All authenticated users
- **Examples**: Marketing materials, public documentation
- **Retention**: 7 years, no automatic deletion
- **Encryption**: Not required

### 2. Internal (Level 2)
- **Description**: Internal company information
- **Access**: Agent role and above
- **Examples**: Internal tickets, company communications
- **Retention**: 5 years, automatic deletion
- **Encryption**: Not required

### 3. Confidential (Level 3)
- **Description**: Sensitive business information
- **Access**: Manager role and above
- **Examples**: Financial data, strategic information
- **Retention**: 3 years, automatic deletion
- **Encryption**: Required

### 4. Restricted (Level 4)
- **Description**: Highly sensitive information with PII
- **Access**: Org admin role and above
- **Examples**: Personal data, payment information
- **Retention**: 1 year, automatic deletion
- **Encryption**: Required

## Quick Start

### 1. Basic Classification

```typescript
import { classifyTicket, classifyUserProfile } from '@/lib/data-classification-service';

// Automatically classify a ticket
const classifiedTicket = classifyTicket(ticket, 'system');

// Automatically classify a user profile
const classifiedProfile = classifyUserProfile(userProfile, 'system');
```

### 2. Access Control

```typescript
import { filterTicketsByClassification } from '@/lib/data-classification-service';
import { canAccessClassification } from '@/lib/data-classification';

// Filter tickets based on user permissions
const accessibleTickets = filterTicketsByClassification(user, tickets);

// Check if user can access specific classification
const canAccess = canAccessClassification(user, DataClassification.CONFIDENTIAL);
```

### 3. Data Validation

```typescript
import { validateDataAccess, validateClassificationAssignment } from '@/lib/data-classification-validator';

// Validate user access to data
const accessValidation = validateDataAccess(user, data, 'read');

// Validate classification assignment
const classificationValidation = validateClassificationAssignment(data, DataClassification.RESTRICTED, user);
```

## API Reference

### Core Functions

#### `classifyContent(content: string)`
Automatically classifies text content based on PII detection and keywords.

```typescript
const { classification, detectedPii, reason } = classifyContent("John Doe's email is john@example.com");
// Returns: { classification: "restricted", detectedPii: ["email", "name"], reason: "PII detected: email, name" }
```

#### `canAccessClassification(user, classification, organizationId?)`
Checks if a user can access data with a specific classification level.

```typescript
const canAccess = canAccessClassification(user, DataClassification.CONFIDENTIAL, "org-123");
```

#### `redactSensitiveData(user, data, classification)`
Redacts sensitive information based on user permissions and data classification.

```typescript
const redactedData = redactSensitiveData(user, data, DataClassification.RESTRICTED);
```

### Service Functions

#### `filterTicketsByClassification(user, tickets)`
Filters an array of tickets based on user's classification access permissions.

#### `validateClassificationCompliance(data[])`
Validates data against compliance requirements and retention policies.

#### `generateClassificationReport(tickets, userProfiles?, agentProfiles?)`
Generates comprehensive classification and compliance report.

### Validation Functions

#### `validateClassificationAssignment(data, proposedClassification, user)`
Validates if a proposed classification is appropriate for the data and user.

#### `enforceClassificationRules(originalData, modifiedData, user)`
Enforces classification rules during data modifications.

### Audit Functions

#### `logDataClassificationEvent(user, action, dataType, dataId, classificationLevel, reason)`
Logs data classification events for audit trails.

#### `logClassifiedDataAccess(user, dataType, dataId, classificationLevel, operation)`
Logs access to classified data for audit trails.

## Integration Examples

### 1. Enhanced Ticket Service

```typescript
import { ClassificationAwareDataService } from '@/lib/data-classification-integration';

const service = new ClassificationAwareDataService();

// Get tickets with automatic classification
const { accessibleTickets, classificationStats } = await service.getTicketsWithClassification(user, tickets);

// Create ticket with classification
const result = await service.createOrUpdateTicket(user, ticketData);
```

### 2. API Middleware

```typescript
import { withClassificationMiddleware } from '@/lib/data-classification-integration';

export const GET = withClassificationMiddleware(async (req, res, user) => {
  // Your API logic here
  // Classification access and audit logging is handled automatically
});
```

### 3. Bulk Processing

```typescript
const service = new ClassificationAwareDataService();

// Bulk classify data
const result = await service.bulkClassifyData(user, data, 'Ticket');
console.log(`Classified: ${result.classified}, PII Detected: ${result.piiDetected}`);
```

## RBAC Integration

The classification system extends the existing RBAC system with new permissions:

### New Permissions
- `data.classify` - Can classify data
- `data.declassify` - Can declassify data  
- `data.access_restricted` - Can access restricted data
- `data.access_confidential` - Can access confidential data

### Permission Mapping by Role

| Role | Public | Internal | Confidential | Restricted | Classify | Declassify |
|------|--------|----------|--------------|------------|----------|------------|
| readonly | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| agent | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| manager | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| org_admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| super_admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Audit Logging

The system provides comprehensive audit logging for:

- Data classification events
- Access to classified data
- Classification violations
- PII detection
- Retention policy violations

### Example Audit Events

```typescript
// Log data classification
await logDataClassificationEvent(user, 'DATA_CLASSIFIED', 'Ticket', '123', 'restricted', 'PII detected');

// Log data access
await logClassifiedDataAccess(user, 'Ticket', '123', 'confidential', 'read');

// Log violation
await logClassificationViolation(user, 'unauthorized_access', 'Ticket', '123', 'Attempted access without permission');
```

## PII Detection

The system automatically detects various types of PII:

- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- IP addresses
- Names (basic pattern)
- Addresses
- Dates of birth
- Passport numbers
- Driver license numbers

### Custom PII Patterns

You can extend PII detection by adding patterns to `PII_PATTERNS`:

```typescript
import { PII_PATTERNS, PiiType } from '@/lib/data-classification';

// Add custom pattern
PII_PATTERNS[PiiType.CUSTOM] = /your-pattern-here/g;
```

## Compliance Features

### Retention Policies

Each classification level has automatic retention policies:

- **Public**: 7 years, manual deletion
- **Internal**: 5 years, automatic deletion
- **Confidential**: 3 years, automatic deletion
- **Restricted**: 1 year, automatic deletion

### Compliance Validation

```typescript
import { validateRetentionCompliance } from '@/lib/data-classification-validator';

const compliance = validateRetentionCompliance(data);
if (!compliance.valid) {
  console.log('Compliance issues:', compliance.issues);
  console.log('Recommendations:', compliance.recommendations);
}
```

### Classification Reports

```typescript
import { generateClassificationReport } from '@/lib/data-classification-service';

const report = generateClassificationReport(tickets, userProfiles, agentProfiles);
console.log(`Compliance Score: ${report.summary.compliance}%`);
console.log('Distribution:', report.distribution);
console.log('PII Types:', report.piiTypes);
```

## Best Practices

### 1. Always Classify New Data
```typescript
// Good: Classify immediately when creating data
const ticket = classifyTicket(newTicketData, user.id);

// Bad: Store unclassified data
// database.save(newTicketData);
```

### 2. Check Access Before Operations
```typescript
// Good: Validate access first
if (canAccessClassification(user, data.classification.level)) {
  // Perform operation
}

// Bad: Assume access is allowed
// performOperation(data);
```

### 3. Use Redaction for Display
```typescript
// Good: Redact sensitive data for display
const displayData = redactTicketData(user, ticket);

// Bad: Show raw sensitive data
// return ticket;
```

### 4. Log All Classification Events
```typescript
// Good: Log classification changes
await logDataClassificationEvent(user, 'DATA_CLASSIFIED', 'Ticket', ticketId, classification, reason);

// Bad: Silent classification changes
// ticket.classification = newClassification;
```

### 5. Validate Compliance Regularly
```typescript
// Good: Regular compliance checks
const compliance = validateClassificationCompliance(allData);
if (!compliance.compliant) {
  handleComplianceIssues(compliance.issues);
}
```

## Troubleshooting

### Common Issues

1. **Classification Not Applied**
   - Check if content contains detectable patterns
   - Verify user has classification permissions
   - Review classification keywords

2. **Access Denied**
   - Verify user role and permissions
   - Check organization membership
   - Confirm classification level requirements

3. **PII Not Detected**
   - Review PII patterns in `PII_PATTERNS`
   - Check if content format matches patterns
   - Consider adding custom patterns

4. **Compliance Violations**
   - Review retention policies
   - Check data age against retention periods
   - Validate classification assignments

### Debug Mode

Enable debug logging to troubleshoot classification issues:

```typescript
// Set environment variable
process.env.CLASSIFICATION_DEBUG = 'true';

// Or enable programmatically
import { enableClassificationDebug } from '@/lib/data-classification';
enableClassificationDebug(true);
```

## Migration Guide

### Existing Data

To migrate existing data to the classification system:

1. **Backup Data**
   ```bash
   npm run backup:data
   ```

2. **Run Classification Migration**
   ```typescript
   import { ClassificationAwareDataService } from '@/lib/data-classification-integration';
   
   const service = new ClassificationAwareDataService();
   await service.bulkClassifyData(systemUser, existingData, 'Ticket');
   ```

3. **Validate Results**
   ```typescript
   const report = generateClassificationReport(tickets);
   console.log(`Migration completed: ${report.summary.compliance}% compliant`);
   ```

### Code Updates

Update existing code to use classification-aware functions:

```typescript
// Before
const tickets = await getTickets();

// After
const service = new ClassificationAwareDataService();
const { accessibleTickets } = await service.getTicketsWithClassification(user, tickets);
```

## Performance Considerations

### Caching

Classification results can be cached to improve performance:

```typescript
import { LRUCache } from 'lru-cache';

const classificationCache = new LRUCache<string, DataClassification>({
  max: 1000,
  ttl: 1000 * 60 * 60 // 1 hour
});
```

### Batch Processing

Use batch operations for large datasets:

```typescript
// Process in batches of 100
const batchSize = 100;
for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);
  await service.bulkClassifyData(user, batch, dataType);
}
```

### Async Operations

Use async operations for non-critical tasks:

```typescript
// Fire and forget audit logging
logDataClassificationEvent(user, action, dataType, dataId, classification, reason)
  .catch(error => console.error('Audit logging failed:', error));
```

## Security Considerations

1. **Encryption**: Restricted and confidential data requires encryption at rest and in transit
2. **Access Logging**: All access to classified data is logged for audit trails
3. **Role Validation**: Regular validation of user roles and permissions
4. **Data Minimization**: Only collect and retain necessary data
5. **Privacy by Design**: Classification applied by default to new data

## Support

For questions or issues with the data classification system:

1. Check the troubleshooting section above
2. Review audit logs for classification events
3. Validate user permissions and role assignments
4. Ensure compliance with retention policies
5. Contact the development team for advanced support

## Version History

- **v1.0**: Initial implementation with 4 classification levels
- **v1.1**: Added PII detection and automatic classification
- **v1.2**: Enhanced audit logging and compliance validation
- **v1.3**: Integrated with existing RBAC system
- **v1.4**: Added batch processing and performance optimizations