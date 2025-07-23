# SignalCX Architecture

This document provides a detailed overview of the SignalCX application's architecture, including the technology stack, directory structure, data flow, and the new hybrid analytics approach.

## 1. Technology Stack

SignalCX is a modern full-stack TypeScript application built with the following core technologies:

*   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Generative AI:** [Google AI & Genkit](https://firebase.google.com/docs/genkit)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Charts:** [Recharts](https://recharts.org/)
*   **Testing:** [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)

## 2. Directory Structure

The project follows a standard Next.js App Router structure with some key organizational choices:

```
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
│       └── zendesk-service.ts # Handles fetching data (mock or live).
│
├── .env                    # Environment variables (Google AI Key).
├── next.config.ts          # Next.js configuration.
└── tsconfig.json           # TypeScript configuration.
```

## 3. Frontend Architecture

### State Management

Global state is managed using React Context, avoiding the need for a heavier state management library. This choice was made because the application's global state is relatively simple (user session, settings, diagnostics) and does not involve frequent, complex updates that would benefit from libraries like Redux or Zustand.

*   **`AuthProvider` (`use-auth.ts`):** Manages the currently logged-in user's state, handles login/logout logic, and controls access to authenticated routes. Session state is persisted in `sessionStorage` for security, ensuring it is cleared when the browser tab is closed.
*   **`SettingsProvider` (`use-settings.ts`):** Manages user-configurable application settings. Settings are persisted in `localStorage` for long-term persistence and are validated against a Zod schema to ensure data integrity.
*   **`DiagnosticsProvider` (`use-diagnostics.ts`):** A session-only context for capturing and displaying AI flow interactions for debugging purposes.

### Component Strategy

The UI is built on [ShadCN UI](https://ui.shadcn.com/), which provides unstyled, accessible base components. These are located in `src/components/ui`. This approach was chosen to allow for maximum design flexibility while leveraging pre-built, production-ready primitives.

Custom, application-specific components (e.g., `TicketConversationSheet`, `AgentProfileSheet`) are built by composing these base UI components. They reside directly in the `src/components` directory.

### Routing

The application uses the Next.js App Router. The entire authenticated experience is contained within the single `src/app/page.tsx` component, which acts as a controller, rendering different "modes" (Dashboard, Explorer, etc.) based on UI state rather than separate routes. This allows for a fast, single-page application feel while maintaining clean organization. This model was chosen to facilitate complex state sharing between views without prop-drilling or complex URL state management.

## 4. AI & Backend Architecture

### Hybrid Analytics: Deterministic and Agentic Flows

SignalCX now supports a hybrid analytics architecture:

- **Deterministic Batch Flows:** The original approach, where each analytics flow (performance, burnout, risk, etc.) is run in a controlled, batched, and predictable manner. These flows are orchestrated in the frontend and results are merged for the UI. This mode is fast, reliable, and easy to debug.
- **Agentic (AI Analyst Mode):** An LLM-powered agent (using Gemini) can call the same analytics flows as tools, reason about which to use, in what order, and why, and provide explanations for its process. This mode is adaptive, explainable, and extensible. Users can enable "AI Analyst Mode" via a toggle in the UI.
- **Tool Exposure:** All analytics flows are exposed as agent tools with clear names, descriptions, and input/output schemas, allowing the agent to call them as needed.
- **Logging:** All agent tool calls, inputs, outputs, and reasoning are logged for diagnostics and transparency.

### Genkit Flows

All generative AI functionality is handled by [Genkit](https://firebase.google.com/docs/genkit) flows, located in `src/ai/flows`. These are server-side TypeScript files that can be called from the frontend or by the agent.

A typical flow follows this pattern:
1.  **`'use server';`**: This Next.js directive marks the file as a Server Action module, allowing its exported functions to be securely called from client-side components without the need for a separate API layer.
2.  **Zod Schemas:** We define `input` and `output` shapes for the flow using `zod`. This ensures type safety between the client and server and provides a structured schema that instructs the LLM on how to format its JSON output.
3.  **Prompt Definition:** `ai.definePrompt` creates a prompt template. It takes the input schema, output schema, and a Handlebars-formatted prompt string. The output schema is crucial for enabling reliable JSON mode from the model.
4.  **Flow Definition:** `ai.defineFlow` wraps the prompt and any additional logic (like data pre-processing or PII scrubbing). This is the main unit of execution and is instrumented by Genkit for tracing and debugging.
5.  **Exported Function:** A simple `async` wrapper function is exported from the file. This is the function that the frontend components will import and call directly as if it were a local function.

### Agentic Workflow Integration

- The agentic workflow is implemented as a new Genkit flow (e.g., `agentic-analysis.ts`) that instantiates an agent, exposes all analytics flows as tools, and lets the agent reason about which to call.
- The agent uses Gemini as the LLM and can chain tool calls, adapt to results, and provide explanations.
- The UI provides a toggle for users to select between deterministic and agentic analysis modes.
- All agent tool calls and reasoning are logged and can be displayed in the Diagnostics view for transparency.

### Data Flow

The application has two data modes, controlled by `settings.appMode` in the user's settings.

1.  **Demo Mode:**
    *   `src/app/page.tsx` calls `fetchAndAnalyzeTickets('demo')`.
    *   This function calls `fetchMockTicketsForView` from `src/lib/zendesk-service.ts`.
    *   `fetchMockTicketsForView` generates realistic-looking but fake data using the templates in `src/lib/mock-data.ts`.
    *   The analysis (sentiment, category) is simulated with simple logic directly in `fetchAndAnalyzeTickets` for performance. AI analysis results are cached in `localStorage` to persist between sessions.

2.  **Live Mode (Architecture):**
    *   `src/app/page.tsx` calls `fetchAndAnalyzeTickets('live')`.
    *   This function calls `fetchLiveTicketsForView` from `src/lib/zendesk-service.ts`. **This is the placeholder for the real Zendesk API call.**
    *   The raw tickets returned from the API are then passed to the `batchAnalyzeTickets` Genkit flow for AI analysis. The application uses a client-side batching strategy in `page.tsx` to break down large numbers of tickets into smaller chunks, preventing server timeouts.
    *   The raw ticket data and the AI analysis results are merged and returned to the frontend.

This architecture ensures a clean separation between data fetching, AI processing, and frontend rendering, and makes the final integration of a live API straightforward.

## Multi-Agent Orchestration (LangChain + Gemini)

SignalCX now uses a robust multi-agent system for enterprise-scale ticket analytics. Each agent is a specialized LLM-powered analyst, orchestrated for maximum efficiency and insight:

### Agent Roles
- **Discovery Agent:** Scans all tickets for patterns, clusters, and anomalies.
- **Performance Agent:** Forecasts trends, benchmarks, and identifies improvement opportunities.
- **Risk Agent:** Identifies SLA risks, compliance issues, and burnout.
- **Coaching Agent:** Generates actionable coaching and quality insights.
- **Synthesis Agent:** Combines all findings into a strategic, executive-level report.
- **(Optional) Social Intelligence Agent:** Monitors social sentiment and public perception.
- **(Optional) Query Agent:** Answers direct user questions about the ticket dataset.

### Orchestration Flow
1. **Discovery Agent** runs first, mapping the data landscape.
2. **Performance, Risk, and Coaching Agents** run in parallel, each on their domain.
3. **Synthesis Agent** collects all outputs and generates a unified, actionable report.
4. **Social Intelligence and Query Agents** run as needed.

### Scalability
- All agents process tickets in batches and sample intelligently for large datasets.
- Agents and flows run in parallel for speed.
- Intermediate results are cached for repeated queries.

### API Endpoint
- The `/api/multi-agent` endpoint triggers the full multi-agent workflow.
- POST a JSON body with tickets and analysis goals; receive a comprehensive, multi-perspective analysis in response.
