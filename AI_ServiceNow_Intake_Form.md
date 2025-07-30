# SignalCX – AI ServiceNow Intake Form

## Project Information

1. **What is your AI Use Case?**
   AI-powered support ticket analytics, predictive insights, automated ticket categorization, sentiment analysis, team performance optimization, and intelligent ticket generation for training/demo purposes.

2. **Please provide any links to documentation, code repositories, JIRA projects, etc.**
   - Repository: Local development environment
   - Documentation: `/docs/ARCHITECTURE.md`, `/docs/blueprint.md`
   - API Documentation: Built-in Genkit AI flows documentation

3. **Purpose of Ticket?**
   Production deployment of SignalCX - AI-powered support analytics platform for customer service teams.

4. **Are you using a specific Model(s)?**
   - Primary: Google Gemini 2.0 Flash (via Genkit AI)
   - Secondary: Claude (Anthropic) for multi-agent optimization
   - Tertiary: GPT models (OpenAI) for specialized tasks
   - Model selection based on task complexity and performance requirements

5. **Are you training a model?**
   No custom model training. Using pre-trained models via API calls with structured prompts and Zod schema validation.

6. **What is the associated risk level of this project? (see AI Risk Taxonomy)**
   Medium Risk - Processing customer support data with PII scrubbing, business analytics, no autonomous decision-making.

7. **Is there a third party contract involved?**
   Yes - Google AI Platform, Anthropic Claude API, OpenAI API, Supabase (database), Zendesk API integration.

8. **What are the terms of the third party?**
   Standard API usage agreements with Google, Anthropic, and OpenAI. Data processing agreements with Supabase. Zendesk API terms for ticket integration.

9. **Does eBay have a legal basis for processing this data?**
   N/A - This is not an eBay project. For customer organizations: Legitimate business interest for support analytics and team optimization.

10. **What team owns this project? (see Infohub assignments at the Dedicated Team level)**
    Independent development project - would require assignment to appropriate internal team upon adoption.

11. **How is the end user access governed/enforced? Are there necessary RBAC checks in place?**
    5-tier role-based access control (readonly → agent → manager → org_admin → super_admin) with Supabase authentication and Google OAuth integration.

12. **How are the internal applications/services authenticated?**
    - Supabase authentication with JWT tokens
    - Google OAuth for user login
    - API key authentication for AI services
    - SMTP authentication for email services

13. **Which zone is this application deployed in?**
    Currently local development. Production deployment would require zone assignment based on organizational requirements.

14. **What are you doing to ensure inputs meet the required format?**
    - Zod schema validation for all AI flows
    - TypeScript strict mode enforcement
    - Input sanitization and PII scrubbing (`src/lib/pii-scrubber.ts`)
    - Structured JSON output with error handling

15. **Is the data set from an external source?**
    Yes - Zendesk API for live ticket data, AI-generated synthetic data for demo mode.

16. **What license is associated with this data set?**
    - Zendesk data: Subject to customer's Zendesk license agreement
    - Generated data: Proprietary synthetic data created by AI models

17. **What is the jurisdiction that this data is sourced from?**
    Variable - depends on customer's Zendesk instance location and data residency requirements.

18. **Is the dataset diverse, representative and fit for the intended purpose, consistent with eBay's policies?**
    N/A for eBay policies. Dataset includes diverse ticket types, priorities, and customer scenarios appropriate for support analytics.

19. **Is Personal Information a part of the data set?**
    Yes - customer names, email addresses in support tickets. PII scrubbing implemented to anonymize sensitive data.

20. **What is the table/file storage location for the data sets?**
    - Supabase PostgreSQL database
    - Tables: `generated_tickets`, `tickets`, `conversations`, `users`, `organizations`
    - Location: Supabase cloud infrastructure

21. **Does the purpose of use for the data require maintaining data for legal purposes?**
    Yes - audit logs maintained for compliance (`audit_logs` table), retention policies configurable per organization.

22. **What are the data elements used for training the model or used as input?**
    - Ticket metadata (ID, status, priority, category)
    - Customer interaction text (anonymized)
    - Agent performance metrics
    - Resolution timeframes
    - Sentiment indicators

23. **Is there a clear understanding of the ultimate purpose for the use of the dataset in connection with the LLM development?**
    Yes - Support analytics, performance optimization, predictive insights, and automated categorization for customer service improvement.

24. **Is the model from an external source? Include links**
    Yes:
    - Google Gemini: https://ai.google.dev/
    - Anthropic Claude: https://www.anthropic.com/
    - OpenAI GPT: https://openai.com/

25. **What license is associated with this model?**
    - Google Gemini: Google AI Platform Terms of Service
    - Anthropic Claude: Anthropic API Terms
    - OpenAI: OpenAI API Terms of Use

26. **If this is a pre-trained model, what is the jurisdiction that this data is sourced from?**
    - Google: Global training data, US-based processing
    - Anthropic: Global training data, US-based processing  
    - OpenAI: Global training data, US-based processing

27. **What is the storage location for the model?**
    Models accessed via API - no local storage. Model weights hosted by respective providers (Google, Anthropic, OpenAI).