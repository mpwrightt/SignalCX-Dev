# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start Next.js development server (runs on port 9002)
- `npm run genkit:dev` - Start Genkit AI flows server (required for AI features)
- `npm run genkit:watch` - Start Genkit server with file watching
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint to check code quality
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run Jest tests
- `npm run migrate:supabase` - Run Supabase migration scripts
- `npm run validate:migration` - Validate migration integrity

## Key Architecture Points

### Dual Server Setup
This project requires TWO servers running simultaneously:
1. **Next.js App** (`npm run dev`) - Main web application
2. **Genkit Server** (`npm run genkit:dev`) - AI flows and processing

### AI Flow Structure
All AI functionality is in `src/ai/flows/`. Each flow follows this pattern:
- Uses `'use server'` directive for Next.js Server Actions
- Defines input/output schemas with Zod
- Uses `ai.definePrompt` and `ai.defineFlow` from Genkit
- Exports async wrapper functions callable from frontend

### Data Modes
The app has two data modes controlled by `settings.appMode`:
- **Demo Mode**: Uses AI-generated tickets stored in Supabase (`generated_tickets` table)
- **Enterprise Mode**: Real Zendesk API integration with Supabase backend

### State Management
Uses React Context for global state:
- `AuthProvider` (use-auth.ts) - User authentication with Supabase
- `SettingsProvider` (use-settings.ts) - App settings in localStorage  
- `DiagnosticsProvider` (use-diagnostics.ts) - AI flow debugging

### UI Components
Built on ShadCN UI components in `src/components/ui/`. Custom components compose these base components with purple branding (#8b5cf6).

## File Structure Highlights

### Core Application
- `src/ai/` - All Genkit AI flows and configuration
- `src/app/page.tsx` - Main application component (single-page app)
- `src/components/dashboard/` - Dashboard view components
- `src/lib/types.ts` - Core TypeScript type definitions
- `src/lib/zendesk-service.ts` - Data fetching (mock/live)
- `src/lib/generated-ticket-service.ts` - AI ticket generation and management
- `src/hooks/` - Custom React hooks

### Team Management System
- `src/components/dashboard/team-management.tsx` - Complete team management interface
- `src/lib/team-service.ts` - Supabase service layer for team operations
- `src/app/api/send-invitation/route.ts` - Email invitation API
- `src/app/accept-invitation/page.tsx` - Invitation acceptance flow

### Authentication & Security
- `src/lib/auth-service-enhanced.ts` - Supabase authentication with Google OAuth
- `src/lib/rbac-service.ts` - Role-based access control
- `src/lib/supabase-config.ts` - Supabase configuration

## Testing

- Jest with React Testing Library
- Test files use `.test.tsx` extension  
- Setup file: `jest.setup.ts`
- Path alias: `@/` maps to `src/`
- Transform configuration handles ESM modules (lucide-react, @genkit-ai)
- Coverage provider: v8
- Test environment: jsdom

## Environment Variables

Required in `.env`:
- `GOOGLE_API_KEY` - Google AI API key (required)
- `ANTHROPIC_API_KEY` - For Claude models in multi-agent optimization (optional)
- `OPENAI_API_KEY` - For GPT models in multi-agent optimization (optional)

### Supabase Configuration (required for production)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous public key

### Email System Configuration
- `SMTP_EMAIL` - Gmail address for sending invitations
- `SMTP_PASSWORD` - Gmail app password (16 characters, no spaces)
- `NEXT_PUBLIC_APP_URL` - Application URL for invitation links

### Zendesk Integration (optional)
- `ZENDESK_SUBDOMAIN` - For live Zendesk integration
- `ZENDESK_EMAIL` - For live Zendesk integration  
- `ZENDESK_API_TOKEN` - For live Zendesk integration

### Additional Services (optional)
- `GOOGLE_SEARCH_API_KEY` - For social intelligence features
- `GOOGLE_SEARCH_ENGINE_ID` - For social intelligence features
- `CACHE_SERVICE_URL` - Optional custom caching service
- `CACHE_SERVICE_API_KEY` - Optional custom caching service

### Bootstrap Admin
- `NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL` - Email to automatically make org_admin on first login

## Production Features
refactor files once code reaches 200-300 lines

### Team Management System
- **Role-Based Access Control**: 5 role hierarchy (readonly → agent → manager → org_admin → super_admin)
- **Email Invitations**: Professional HTML templates with SMTP integration
- **Three-Tab Interface**: Team Members, Pending Invitations, Revoked Invitations
- **User Management**: Activate/deactivate, role changes, comprehensive validation
- **Supabase Integration**: Real-time data with PostgreSQL backend

### Authentication & Security
- **Supabase Authentication**: Google OAuth integration
- **Single-Company Security**: RLS disabled for simplified database operations
- **Application-Layer Security**: Organization-scoped data through application logic
- **Session Management**: Secure token handling with automatic expiration
- **PII Scrubbing**: Built-in PII detection and scrubbing for sensitive data

### AI & Analytics
- **Multi-Agent System**: Parallel AI processing with multiple models
- **Performance Monitoring**: Built-in AI model selection and timing
- **Structured Output**: All AI flows use Zod schemas for type safety
- **Real-Time Analytics**: Live dashboard updates with predictive insights
- **Chunked Ticket Generation**: AI generates tickets in chunks (8 per batch) with retry logic
- **Database Duplicate Prevention**: Post-generation duplicate checking prevents ID conflicts

## Important Notes

### Development Workflow
- Always run both servers during development (Next.js + Genkit)
- AI flows use structured JSON output with Zod schemas
- PII scrubbing is implemented in `src/lib/pii-scrubber.ts`
- Authentication is production-ready with Supabase
- Single-page app design with mode-based rendering
- Multi-agent route optimized with Gemini 2.0 Flash as primary model (`/api/multi-agent`)

### Code Quality
- ESLint and Prettier configurations for consistent formatting
- TypeScript strict mode enforced
- Production-ready error handling and validation
- Comprehensive test coverage for critical paths
- Security headers configured in Next.js (XSS, MIME, Frame protection)
- Server external packages configured for Genkit AI

### Core Workflow
**Research → Plan → Implement → Validate**

Start every feature with: "Let me research the codebase and create a plan before implementing."

1. **Research** - Understand existing patterns and architecture
2. **Plan** - Propose approach and verify with user
3. **Implement** - Build with tests and error handling
4. **Validate** - ALWAYS run formatters, linters, and tests after implementation

### Code Organization Principles
- Keep functions small and focused
- If you need comments to explain sections, split into functions
- Group related functionality into clear packages
- Prefer many small files over few large ones

### Architecture Principles
This is always a feature branch approach:
- Delete old code completely - no deprecation needed
- No versioned names (processV2, handleNew, ClientOld)
- No migration code unless explicitly requested
- No "removed code" comments - just delete it

Prefer explicit over implicit:
- Clear function names over clever abstractions
- Obvious data flow over hidden magic
- Direct dependencies over service locators

### Maximize Efficiency
- **Parallel operations**: Run multiple searches, reads, and greps in single messages
- **Multiple agents**: Split complex tasks - one for tests, one for implementation
- **Batch similar work**: Group related file edits together

## TypeScript/React Development Standards

### Required Patterns
- Use TypeScript strict mode - explicit types prevent bugs
- React hooks for state management - no class components
- Early returns to reduce nesting - flat code is readable
- Delete old code when replacing - no versioned functions
- Proper error boundaries and error handling
- Zod schemas for validation and type safety

### Problem Solving Strategy
- **When stuck**: Stop. The simple solution is usually correct.
- **When uncertain**: "Let me think hard about this architecture."
- **When choosing**: "I see approach A (simple) vs B (flexible). Which do you prefer?"

User feedback prevents over-engineering. When uncertain about implementation, stop and ask for guidance.

### Testing Strategy
Match testing approach to code complexity:
- **Complex business logic**: Write tests first (TDD)
- **Simple CRUD operations**: Write code first, then tests  
- **React components**: Focus on behavior, not implementation
- **AI flows**: Test input/output schemas and error handling

### Security & Performance
- Always validate all inputs and scrub PII
- Handle authentication properly with Supabase
- Performance rule: Measure before optimizing. No guessing.

### Progress Tracking
- Use TodoWrite tool for task management
- Clear naming in all code
- Focus on maintainable solutions over clever abstractions

## ARCHITECTURE

```
.
├── src
│   ├── app/                    # Next.js App Router: pages, layouts, and API routes
│   │   ├── api/               # API routes
│   │   │   ├── send-invitation/ # Email invitation API
│   │   │   ├── test-email/    # SMTP testing endpoint
│   │   │   └── multi-agent/   # Multi-agent AI processing
│   │   ├── login/             # Login page component
│   │   ├── accept-invitation/ # Invitation acceptance flow
│   │   ├── globals.css        # Global styles and ShadCN theme variables
│   │   ├── layout.tsx         # Root layout for the application
│   │   └── page.tsx           # Main application component (Dashboard, Explorer, etc.)
│   │
│   ├── ai/                    # All Genkit-related code
│   │   ├── flows/             # Individual AI flows (summarize, predict, ticket generation)
│   │   │   ├── generate-zendesk-tickets.ts # Chunked AI ticket generation
│   │   │   ├── fetch-and-analyze-tickets.ts # Main data fetching flow
│   │   │   └── (20+ other specialized AI flows)
│   │   ├── genkit.ts          # Genkit configuration and initialization
│   │   └── dev.ts             # Entry point for the Genkit development server
│   │
│   ├── components/            # Reusable React components
│   │   ├── ui/                # Unmodified ShadCN UI components
│   │   └── dashboard/         # Dashboard-specific components
│   │       ├── team-management.tsx # Complete team management system
│   │       ├── advanced-analytics-view.tsx
│   │       └── (other dashboard components)
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-auth.ts        # Supabase authentication and session state
│   │   ├── use-settings.ts    # Application settings via localStorage
│   │   ├── use-toast.ts       # UI notifications
│   │   └── use-diagnostics.ts # AI flow debugging
│   │
│   └── lib/                   # Shared utilities, services, and type definitions
│       ├── auth-service-enhanced.ts # Supabase authentication logic
│       ├── team-service.ts    # Team management Supabase operations
│       ├── rbac-service.ts    # Role-based access control
│       ├── supabase-config.ts # Supabase configuration and client setup
│       ├── supabase-service.ts # Core Supabase database operations
│       ├── generated-ticket-service.ts # AI ticket generation management
│       ├── audit-service.ts   # Server-side audit event logging
│       ├── mock-data.ts       # Mock data templates for demo mode
│       ├── types.ts           # Core TypeScript type definitions
│       ├── zendesk-service.ts # Data fetching (mock/live)
│       ├── agent-service.ts   # Agent performance and analytics
│       ├── cache-service.ts   # Caching layer for performance optimization
│       └── pii-scrubber.ts    # PII detection and scrubbing utilities
│
├── supabase/                 # Supabase configuration and migrations
│   ├── migrations/           # Database migration files
│   └── config.toml           # Supabase configuration
├── .env                      # Environment variables
├── next.config.ts            # Next.js configuration
└── tsconfig.json             # TypeScript configuration
```

## Team Management System Details

### User Roles Hierarchy
1. **readonly** - View dashboards and reports
2. **agent** - Handle tickets + basic analytics
3. **manager** - Team oversight + advanced reports
4. **org_admin** - Full organization control + user management
5. **super_admin** - Global system administration

### Role Permissions
- **Users**: read/write/delete based on role hierarchy
- **Tickets**: read/write based on organization scope
- **Analytics**: read/write with role restrictions
- **AI Features**: read/write with role restrictions
- **Settings**: org_admin and above can modify
- **Audit Logs**: manager and above can read

### Email Invitation Flow
1. **Invite Creation**: Org admin creates invitation via Team Management
2. **Email Sending**: Professional HTML template sent via SMTP
3. **Token Security**: Unique tokens with 7-day expiration
4. **Acceptance**: User clicks link → Google OAuth → automatic role assignment
5. **Database Updates**: Invitation marked as accepted, user becomes active

### Supabase Tables
- **users**: User profiles with roles and permissions
- **organizations**: Multi-tenant organization data
- **invitations**: Pending/revoked invitations with tokens
- **audit_logs**: Complete activity tracking
- **settings**: Organization-specific configuration
- **generated_tickets**: AI-generated Zendesk tickets for demo mode
- **tickets**: Live ticket data from Zendesk integration
- **conversations**: Ticket conversation threads

## AI Ticket Generation System

### Architecture
The `generate-zendesk-tickets.ts` flow uses a sophisticated chunked generation approach:

1. **Dynamic ID Management**: Queries database for highest existing ticket ID to prevent duplicates
2. **Chunked Processing**: Splits large requests (>8 tickets) into smaller batches
3. **Retry Logic**: Exponential backoff with 3 retries for API failures
4. **JSON Recovery**: Automatic parsing and repair of malformed AI responses
5. **Database Validation**: Post-generation duplicate checking and filtering
6. **Rate Limiting**: 1-1.5 second delays between chunks to respect API limits

### Key Features
- **Scalable**: Supports up to 200 tickets per generation request
- **Reliable**: Handles Google AI API failures gracefully
- **Sequential IDs**: Maintains proper ticket numbering across chunks
- **Organization Scoped**: All tickets are properly isolated by organization

### Usage Pattern
```typescript
// Generate tickets with automatic chunking and error handling
const result = await generateZendeskTickets({
  count: 50,
  scenario: 'mixed',
  organization_id: orgId
});
```

## Important Reminders

- **Email System**: Uses Gmail SMTP - app password must be 16 characters without spaces
- **Supabase**: Uses PostgreSQL with JSONB queries for ticket data  
- **Security**: All operations are organization-scoped with role validation
- **UI Theme**: Purple branding (#8b5cf6) throughout the application
- **Error Handling**: Comprehensive validation with user-friendly toast notifications
- **Performance**: Real-time updates with optimistic UI patterns
- **Database Migration**: Supabase replaces Firebase - migration scripts available
- **Project Name**: SignalCX - AI-Powered Support Ticket Analytics & Team Management Platform
- **Port Configuration**: Next.js runs on port 9002, Genkit UI on port 4000