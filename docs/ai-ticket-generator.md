# 🎯 AI Ticket Generator

The AI Ticket Generator creates realistic synthetic support tickets that exactly match Zendesk's format for demo mode and testing purposes.

## ✨ Features

- **Realistic Content**: AI-generated tickets with authentic customer language and scenarios
- **Zendesk Format**: Perfect compliance with Zendesk ticket object schema
- **Multiple Scenarios**: Billing, technical, shipping, refunds, account issues, and mixed
- **Flexible Generation**: Configure count, priority distribution, and submission channels
- **Analytics Ready**: Generated tickets integrate seamlessly with existing analytics
- **Performance Optimized**: Fast generation with progress tracking

## 🚀 Quick Start

### 1. Database Setup

Run the Supabase migration to create the required table:

```sql
-- Run in Supabase Dashboard > SQL Editor
-- Copy contents from: supabase/migrations/003_generated_tickets.sql
```

### 2. Access the Generator

1. Navigate to the **AI Ticket Generator** in the left sidebar
2. Choose from **Quick Actions** or configure **Custom Generation**
3. Generate tickets instantly with realistic data

### 3. Quick Actions

- **Demo Dataset**: 25 mixed tickets for general testing
- **Billing Issues**: 15 billing-focused tickets 
- **Technical Issues**: 20 technical support tickets

## 🛠️ Configuration Options

### Generation Parameters

| Parameter | Options | Description |
|-----------|---------|-------------|
| **Count** | 1-100 | Number of tickets to generate |
| **Scenario** | mixed, billing, technical, shipping, refunds, account | Type of support issues |
| **Channel** | web, email, chat, api | How tickets were submitted |
| **Priority** | balanced, mostly_normal, escalated | Priority distribution pattern |

### Scenario Types

- **Mixed**: Variety of support issues across all categories
- **Billing**: Payment issues, subscription problems, refund requests
- **Technical**: Software bugs, login issues, feature problems  
- **Shipping**: Delivery problems, damaged items, tracking issues
- **Refunds**: Return requests, dissatisfaction, cancellations
- **Account**: Profile issues, password resets, access problems

### Priority Distributions

- **Balanced**: 10% urgent, 20% high, 50% normal, 20% low (realistic mix)
- **Mostly Normal**: 5% urgent, 10% high, 70% normal, 15% low (typical day)
- **Escalated**: 25% urgent, 35% high, 30% normal, 10% low (crisis mode)

## 📊 Analytics Integration

Generated tickets automatically integrate with your existing analytics:

- **Dashboard View**: Tickets appear in all dashboard metrics
- **Ticket Explorer**: Browse and filter generated tickets
- **Agent Performance**: Generated tickets affect agent metrics
- **Predictive Analysis**: Historical data for forecasting

### Accessing Generated Data

```typescript
import { generatedTicketService } from '@/lib/generated-ticket-service';

// Get all generated tickets
const tickets = await generatedTicketService.getTickets(organizationId);

// Get analytics
const analytics = await generatedTicketService.getTicketAnalytics(organizationId);

// Get tickets formatted for existing analytics
const analyticsTickets = await generatedTicketService.getTicketsForAnalytics(organizationId);
```

## 🔧 Advanced Usage

### Programmatic Generation

```typescript
import { generateZendeskTickets, generateTicketsByScenario, generateDemoTickets } from '@/ai/flows/generate-zendesk-tickets';

// Custom generation
const result = await generateZendeskTickets({
  organization_id: 'your-org-id',
  count: 50,
  scenario: 'technical',
  via_channel: 'email',
  urgency_distribution: 'escalated'
});

// Scenario-specific generation
const billingTickets = await generateTicketsByScenario('your-org-id', 'billing', 20);

// Quick demo data
const demoData = await generateDemoTickets('your-org-id');
```

### Database Queries

The generator creates a `ticket_analytics_view` for easy querying:

```sql
-- Get tickets by priority
SELECT priority, COUNT(*) 
FROM ticket_analytics_view 
WHERE organization_id = 'your-org-id'
GROUP BY priority;

-- Get recent high priority tickets
SELECT ticket_id, subject, priority, ticket_created_at
FROM ticket_analytics_view 
WHERE organization_id = 'your-org-id'
  AND priority IN ('high', 'urgent')
  AND ticket_created_at >= NOW() - INTERVAL '7 days'
ORDER BY ticket_created_at DESC;
```

## 🏗️ Architecture

### Components

- **Genkit Flow**: `src/ai/flows/generate-zendesk-tickets.ts` - Core AI generation logic
- **Service Layer**: `src/lib/generated-ticket-service.ts` - Database operations and utilities
- **UI Component**: `src/components/dashboard/ticket-generator.tsx` - User interface
- **Database**: `generated_tickets` table with JSONB storage and analytics view

### Data Flow

1. **User Input**: Configure generation parameters in UI
2. **AI Generation**: Genkit flow generates realistic tickets using Gemini
3. **Validation**: Tickets validated against Zendesk schema
4. **Storage**: Tickets stored in Supabase with metadata
5. **Analytics**: Data immediately available in dashboard views

## 🚨 Important Notes

### PII and Privacy

- **No Real PII**: All generated data is synthetic and safe for testing
- **Realistic Format**: Maintains authentic feel without privacy concerns
- **Organization Scoped**: All tickets are isolated by organization

### Performance

- **Batch Generation**: Efficiently generates up to 100 tickets at once
- **Progress Tracking**: Real-time progress updates during generation
- **Indexed Storage**: Optimized database queries with proper indexing

### Quality Assurance

- **Schema Validation**: All tickets validated against Zendesk format
- **Quality Scoring**: Generation metadata includes quality metrics
- **Realistic Content**: AI ensures authentic customer language and scenarios

## 🧹 Maintenance

### Clearing Generated Data

```typescript
// Clear all tickets for organization
await generatedTicketService.clearTickets(organizationId);

// Clear tickets by scenario
await generatedTicketService.clearTicketsByScenario(organizationId, 'billing');
```

### Monitoring

- **Generation Stats**: Track total generated, scenarios, and quality scores
- **Storage Usage**: Monitor JSONB storage and index performance
- **Integration Health**: Ensure generated tickets work with analytics

## 🎉 Tips for Best Results

1. **Start Small**: Generate 10-25 tickets first to test integration
2. **Mix Scenarios**: Use 'mixed' scenario for realistic variety
3. **Test Analytics**: Verify generated tickets appear in all dashboard views
4. **Monitor Performance**: Large generations may take 30-60 seconds
5. **Clear Regularly**: Remove test data to keep databases clean

The AI Ticket Generator provides production-ready synthetic data for comprehensive testing of your support analytics platform!