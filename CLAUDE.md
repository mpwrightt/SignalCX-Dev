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
- **Demo Mode**: Uses mock data from `src/lib/mock-data.ts`
- **Live Mode**: Placeholder for real Zendesk API integration

### State Management
Uses React Context for global state:
- `AuthProvider` (use-auth.ts) - User authentication
- `SettingsProvider` (use-settings.ts) - App settings in localStorage  
- `DiagnosticsProvider` (use-diagnostics.ts) - AI flow debugging

### UI Components
Built on ShadCN UI components in `src/components/ui/`. Custom components compose these base components.

## File Structure Highlights

- `src/ai/` - All Genkit AI flows and configuration
- `src/app/page.tsx` - Main application component (single-page app)
- `src/components/dashboard/` - Dashboard view components
- `src/lib/types.ts` - Core TypeScript type definitions
- `src/lib/zendesk-service.ts` - Data fetching (mock/live)
- `src/hooks/` - Custom React hooks (use-auth.ts, use-settings.ts, use-diagnostics.ts, use-toast.ts, useMicroBatchAnalysis.ts)

## Testing

- Jest with React Testing Library
- Test files use `.test.tsx` extension
- Setup file: `jest.setup.ts`
- Path alias: `@/` maps to `src/`

## Environment Variables

Required in `.env`:
- `GOOGLE_API_KEY` - Google AI API key (required)
- `ANTHROPIC_API_KEY` - For Claude models in multi-agent optimization (optional)
- `OPENAI_API_KEY` - For GPT models in multi-agent optimization (optional)
- `ZENDESK_SUBDOMAIN` - For live Zendesk integration (optional)
- `ZENDESK_EMAIL` - For live Zendesk integration (optional)  
- `ZENDESK_API_TOKEN` - For live Zendesk integration (optional)
- `GOOGLE_SEARCH_API_KEY` - For social intelligence features (optional)
- `GOOGLE_SEARCH_ENGINE_ID` - For social intelligence features (optional)
- `CACHE_SERVICE_URL` - Optional custom caching service (optional)
- `CACHE_SERVICE_API_KEY` - Optional custom caching service (optional)

## Important Notes

- Always run both servers during development
- AI flows use structured JSON output with Zod schemas
- PII scrubbing is implemented in `src/lib/pii-scrubber.ts`
- Authentication is simulated (not production-ready)
- Single-page app design with mode-based rendering
- Firebase/Firestore integration available for advanced features
- Multi-agent route optimized with Gemini 2.0 Flash as primary model for speed (`/api/multi-agent`)
- Performance monitoring built-in for AI model selection and timing
- Codebase has been cleaned and optimized (TypeScript errors reduced, dead code removed)
- ESLint and Prettier configurations added for consistent code formatting
- Do not execute tests, give the user the prompt so they can run the test. 

Core Workflow: Research → Plan → Implement → Validate
Start every feature with: "Let me research the codebase and create a plan before implementing."

Research - Understand existing patterns and architecture
Plan - Propose approach and verify with you
Implement - Build with tests and error handling
Validate - ALWAYS run formatters, linters, and tests after implementation
Code Organization
Keep functions small and focused:

If you need comments to explain sections, split into functions
Group related functionality into clear packages
Prefer many small files over few large ones
Architecture Principles
This is always a feature branch:

Delete old code completely - no deprecation needed
No versioned names (processV2, handleNew, ClientOld)
No migration code unless explicitly requested
No "removed code" comments - just delete it
Prefer explicit over implicit:

Clear function names over clever abstractions
Obvious data flow over hidden magic
Direct dependencies over service locators
Maximize Efficiency
Parallel operations: Run multiple searches, reads, and greps in single messages Multiple agents: Split complex tasks - one for tests, one for implementation Batch similar work: Group related file edits together

## TypeScript/React Development Standards

### Required Patterns
- Use TypeScript strict mode - explicit types prevent bugs
- React hooks for state management - no class components
- Early returns to reduce nesting - flat code is readable
- Delete old code when replacing - no versioned functions
- Proper error boundaries and error handling
- Zod schemas for validation and type safety

### Problem Solving  
When stuck: Stop. The simple solution is usually correct.

When uncertain: "Let me think hard about this architecture."

When choosing: "I see approach A (simple) vs B (flexible). Which do you prefer?"

Your redirects prevent over-engineering. When uncertain about implementation, stop and ask for guidance.

### Testing Strategy
Match testing approach to code complexity:
- Complex business logic: Write tests first (TDD)
- Simple CRUD operations: Write code first, then tests  
- React components: Focus on behavior, not implementation
- AI flows: Test input/output schemas and error handling

Always keep security in mind: Validate all inputs, scrub PII, handle authentication properly.

Performance rule: Measure before optimizing. No guessing.

Progress Tracking
TodoWrite for task management
Clear naming in all code
Focus on maintainable solutions over clever abstractions.

## ARCHITECTURE
.
├── src
│   ├── app/                # Next.js App Router: pages, layouts, and API routes.
│   │   ├── login/          # Login page component.
│   │   ├── globals.css     # Global styles and ShadCN theme variables.
│   │   ├── layout.tsx      # Root layout for the application.
│   │   └── page.tsx        # The main application component (Dashboard, Explorer, etc.).
│   │
│   ├── ai/                 # All Genkit-related code.
│   │   ├── flows/          # Individual AI flows (e.g., summarize, predict, agentic-analysis).
│   │   ├── genkit.ts       # Genkit configuration and initialization.
│   │   └── dev.ts          # Entry point for the Genkit development server.
│   │
│   ├── components/         # Reusable React components.
│   │   ├── ui/             # Unmodified ShadCN UI components.
│   │   └── (custom)/       # Custom components (e.g., TicketConversationSheet).
│   │
│   ├── hooks/              # Custom React hooks.
│   │   ├── use-auth.ts     # Handles user authentication and session state.
│   │   ├── use-settings.ts # Manages application settings via Local Storage.
│   │   └── use-toast.ts    # Manages UI notifications.
│   │
│   └── lib/                # Shared utilities, services, and type definitions.
│       ├── auth-service.ts # Simulates user authentication logic.
│       ├── audit-service.ts# Server-side logic for logging audit events.
│       ├── mock-data.ts    # Mock data templates for demo mode.
│       ├── types.ts        # Core TypeScript type definitions for the app.
│       ├── zendesk-service.ts # Handles fetching data (mock or live).
│       ├── agent-service.ts# Agent performance and analytics.
│       ├── cache-service.ts# Caching layer for performance optimization.
│       ├── pii-scrubber.ts # PII detection and scrubbing utilities.
│       └── firebase-config.ts # Firebase/Firestore configuration.
│
├── .env                    # Environment variables (Google AI Key).
├── next.config.ts          # Next.js configuration.
└── tsconfig.json           # TypeScript configuration.