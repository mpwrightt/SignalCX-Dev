# SignalCX – RAI (Responsible AI) Assessment Questions

## RAI Assessment Responses

### 1. Does this use case build upon an already RAI-approved use case? If yes, please provide a link to the prior approval and explain the differences between the two.

**Answer:** No, this is a new use case. SignalCX is an independent AI-powered support analytics platform that has not been previously submitted for RAI approval. This is the initial assessment for this use case.

### 2. Does the AI either use (i.e., annotation, training, testing, interactive use) data or generate information that includes the mention or signification of personal identity characteristics?

**Answer:** Yes, the AI processes customer support ticket data that may contain:
- Customer names and contact information
- Demographic indicators in support interactions
- Language preferences and communication patterns
- Geographic location data from ticket metadata

**Mitigation:** PII scrubbing is implemented (`src/lib/pii-scrubber.ts`) to anonymize personal identifiers before AI processing.

### 3. Does the AI create or augment services for certain groups of people (e.g., buying or selling platforms, eBay employee services)?

**Answer:** Yes, SignalCX specifically serves customer support teams and organizations that use Zendesk or similar ticketing systems. The platform augments services for:
- Customer support agents
- Support managers and team leads
- Organization administrators
- End customers (indirectly through improved support quality)

### 4. Is the availability of the AI going to be limited to only certain groups of people or users (e.g., an assistant that can only interact in English)?

**Answer:** Yes, there are several limitations:
- **Language:** Currently English-only processing (AI models primarily trained on English)
- **Access Control:** Role-based access with 5-tier permission system
- **Technical Requirements:** Requires Zendesk integration or compatible ticketing system
- **Authentication:** Requires Google OAuth account for access

### 5. Does the AI decide which types of content or experiences to generate for different people, or direct users to specific types of content?

**Answer:** Yes, the AI personalizes experiences based on user roles and organizational context:
- Different dashboard views for agents vs. managers vs. administrators
- Role-based analytics and insights presentation
- Customized recommendations based on team performance data
- Selective data exposure based on permission levels

### 6. Does the AI assist users with tasks, such as searching/finding things, writing, reading, or summarizing something?

**Answer:** Yes, SignalCX provides extensive task assistance:
- **Summarizing:** Ticket content analysis and trend summarization
- **Reading:** Automated sentiment analysis and content categorization
- **Searching:** Intelligent ticket filtering and pattern recognition
- **Writing:** Automated report generation and insight documentation
- **Analysis:** Predictive analytics for support metrics and team performance

### 7. Is the AI going to be monitoring or making judgments about user behavior, sentiment, or emotions?

**Answer:** Yes, the AI monitors and analyzes:
- **Customer Sentiment:** Analyzes customer emotions in support tickets
- **Agent Performance:** Evaluates response times, resolution rates, and interaction quality
- **Behavioral Patterns:** Identifies trends in ticket handling and team productivity
- **Emotional Context:** Processes emotional indicators in customer communications

**Safeguards:** All monitoring is for operational improvement, not punitive action. Human oversight maintained for all judgments.

### 8. Is the AI going to be used for biometric data processing (e.g., facial recognition)?

**Answer:** No, SignalCX does not process any biometric data. The system works exclusively with text-based support ticket data and metadata.

### 9. Does the use of AI require people to do new or different types of tasks, to support the functioning of the AI?

**Answer:** Minimal new tasks required:
- **Setup:** Initial configuration of AI flows and organizational settings
- **Maintenance:** Periodic review of AI-generated insights and recommendations
- **Training:** Basic user training on dashboard interpretation
- **Data Quality:** Ensuring clean ticket data input for optimal AI performance

The system is designed to integrate into existing workflows with minimal disruption.

### 10. Does the use of AI automate or replace human effort?

**Answer:** Yes, SignalCX automates several manual processes:
- **Automated Ticket Categorization:** Replaces manual ticket tagging
- **Performance Analytics:** Automates report generation previously done manually
- **Trend Identification:** Replaces manual pattern recognition in support data
- **Predictive Insights:** Automates forecasting that required manual analysis

**Human Role:** Humans remain in control for decision-making, strategy, and customer interaction. AI augments rather than replaces human judgment.

### 11. If the AI doesn't work as expected, will disruptions impact services or capabilities that people expect or rely on?

**Answer:** Limited impact due to system design:
- **Fallback Mechanisms:** Manual processes remain available if AI fails
- **Non-Critical Path:** AI provides insights and analytics but doesn't control core ticketing functions
- **Graceful Degradation:** System continues basic functionality without AI enhancement

**Potential Impacts:**
- Loss of automated insights and analytics
- Reduced efficiency in ticket categorization
- Manual effort required for performance reporting

### 12. Please provide a link to the live demo and/or a recorded version. Ensure it is accessible to the RAI team (IDs: mtahaei, joseyoung).

**Answer:** Currently in local development environment. Live demo not yet available.

**Development Status:**
- Local environment running on `localhost:9002`
- Requires dual server setup (Next.js + Genkit AI)
- Demo mode available with AI-generated sample data

**For RAI Team Access:**
To provide access for assessment, we would need to:
1. Deploy to staging environment
2. Create guest accounts for mtahaei and joseyoung
3. Provide demo organization with sample data
4. Schedule live demonstration session

**Alternative:** Screen recording demonstration can be prepared showing:
- User interface and role-based access
- AI analytics and insights generation
- PII scrubbing capabilities
- Multi-agent AI processing workflows

## Risk Mitigation Summary

- **PII Protection:** Built-in scrubbing and anonymization
- **Access Control:** Comprehensive RBAC system
- **Human Oversight:** All AI recommendations require human review
- **Audit Trail:** Complete logging of AI decisions and user actions
- **Fallback Systems:** Manual processes available if AI fails
- **Data Security:** Encrypted storage and transmission
- **Compliance:** Organization-scoped data isolation