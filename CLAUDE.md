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

### Task Master AI Integration
When using Task Master AI with MCP integration, these additional API keys may be configured:
- `PERPLEXITY_API_KEY` - For research-backed task analysis (highly recommended)
- `XAI_API_KEY` - For Grok models (optional)
- `OPENROUTER_API_KEY` - For multiple model access (optional)
- `MISTRAL_API_KEY` - For Mistral models (optional)

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

## Current Project Status

### Completed Features (9/20 tasks - 45%)
- Project repository setup and infrastructure
- Supabase authentication with Google OAuth
- Role-based access control system (5-tier hierarchy)
- Team management with email invitations
- Multi-agent AI analysis system
- Supabase data management integration
- Advanced analytics dashboard with real-time updates
- Dual data modes (Demo/Enterprise) implementation
- AI ticket generation system

### High Priority Pending Tasks
- **Task #7**: Predictive Forecasting (Complexity: 8/10)
- **Task #8**: Sentiment Analysis Integration (Complexity: 7/10)
- **Task #9**: Risk Assessment Feature (Complexity: 8/10)
- **Task #15**: PII Scrubbing Implementation (Complexity: 9/10 - Highest)
- **Task #18**: Real-time Metrics Dashboard (Complexity: 8/10)

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

## Error Handling

### File Size and Token Limitations
- When you try to analyze a file that exceeds the token size. Here is an example:
  - Error: File content (30473 tokens) exceeds maximum allowed tokens (25000). Please use offset and limit parameters to read specific portions of the file, or use the GrepTool to search for specific content.

### Task Master Common Issues
- **Claude Code API Errors**: If Task Master fails with Claude Code provider, switch to OpenAI: `task-master models --set-main gpt-4o`
- **MCP Connection Issues**: Verify `.mcp.json` configuration includes all required API keys
- **Task Sync Issues**: Use `task-master generate` to regenerate task markdown files
- **Dependency Validation**: Run `task-master validate-dependencies` to check for circular references

## Important Notes

### Development Workflow
- Always run both servers during development (Next.js + Genkit)
- AI flows use structured JSON output with Zod schemas
- PII scrubbing is implemented in `src/lib/pii-scrubber.ts`
- Authentication is production-ready with Supabase
- Single-page app design with mode-based rendering
- Multi-agent route optimized with Gemini 2.0 Flash as primary model (`/api/multi-agent`)

### Task Master Integration
- Project includes comprehensive Task Master AI setup with 20 main tasks and 100 subtasks
- Use MCP tools for task management: `mcp__task-master-ai__*` functions
- Task complexity analysis completed - 4 high-complexity tasks identified (scores 8-9)
- Tasks.json located at `.taskmaster/tasks/tasks.json` with detailed implementation tracking
- Use `task-master next` or MCP `next_task` to find next available work item

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

### Task Master Enhanced Workflow
When working with Task Master tasks:
1. **Check Tasks**: Use `mcp__task-master-ai__next_task` to find next work item
2. **Review Details**: Use `mcp__task-master-ai__get_task` with task ID for full context
3. **Update Progress**: Use `mcp__task-master-ai__update_subtask` to log implementation notes
4. **Mark Complete**: Use `mcp__task-master-ai__set_task_status` when finished
5. **Export Progress**: README.md is auto-maintained with current task status

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

[... rest of the existing content remains the same ...]

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
