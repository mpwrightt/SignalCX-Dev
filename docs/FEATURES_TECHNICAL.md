# SignalCX Feature Guide (Technical)

This document provides a detailed, granular breakdown of each major feature and view within the SignalCX application, written for a technical audience. It now includes details on the hybrid analytics architecture, supporting both deterministic and agentic (AI Analyst Mode) workflows.

## 1. Dashboard

The Dashboard is the primary landing page, offering a high-level, customizable overview of support operations. It is split into two tabs: **Snapshot** and **Trends**.

### How It Works

-   **State Management:** The dashboard's state, including the active tab and component layout, is managed within `src/app/page.tsx`. The `DashboardView` component (`src/components/dashboard/dashboard-view.tsx`) receives this state via props.
-   **Component-Driven Architecture:** Each Key Performance Indicator (KPI) and chart is a self-contained React component, rendered by `DashboardView`. This allows for modularity and easy customization.
-   **Drag-and-Drop Customization:** Reordering is handled by `dnd-kit`. The layout information, including component visibility and order, is persisted in `localStorage` via the `useSettings` hook (`src/hooks/use-settings.ts`). When the layout changes, `updateSettings` is called, which serializes the new component array to `localStorage`.
-   **AI Summary Generation:** The "Automated Trend Summary" on the Trends tab is triggered by a `React.useEffect` hook in `page.tsx` that monitors changes to the `dashboardFilteredTickets` array. When data changes, it calls the `summarizeTrends` Genkit flow (`src/ai/flows/summarize-trends.ts`), providing it with aggregated data (ticket counts, sentiment breakdown, etc.) derived using `React.useMemo`. The flow returns a `summary` string which is stored in state and passed to the dashboard.
-   **Hybrid Analytics Toggle:** Users can select between standard deterministic analysis and "AI Analyst Mode" (agentic analysis) via a toggle in the UI. In agentic mode, an LLM-powered agent orchestrates which analytics flows to call and provides reasoning for its choices.

## 2. Ticket Explorer

The Ticket Explorer is the main interface for viewing, filtering, and sorting raw ticket data.

### How It Works

-   **Data Fetching:** When a Zendesk view is selected from the dropdown, `page.tsx` triggers a `React.useEffect` hook. This calls the `fetchTickets` function (`src/ai/flows/fetch-and-analyze-tickets.ts`), which acts as a router, retrieving either mock data (`fetchMockTicketsForView`) or live data from the Zendesk API (`fetchLiveTicketsForView`).
-   **Client-Side Filtering & Sorting:** All filtering (by date, status, sentiment, etc.) and sorting is performed on the client-side within `page.tsx`. The results of date filtering, search term filtering, and final sorting are memoized using React's `useMemo` hooks for performance, preventing re-computation on every render.
-   **Batched AI Analysis:** Clicking "Analyze Sentiments & Categories" triggers the `handleRunAnalysis` function in `page.tsx`. This function batches the tickets (using a `BATCH_SIZE` constant) and sends them in parallel to the `batchAnalyzeTickets` Genkit flow (`src/ai/flows/batch-analyze-tickets.ts`) using `Promise.all`. Results are cached in `localStorage` keyed by ticket ID to avoid re-analysis.
-   **On-Demand Ticket Summaries:** Clicking on a ticket's subject line opens the `TicketConversationSheet` component (`src/components/ticket-conversation-sheet.tsx`). If the ticket doesn't have a pre-generated summary, this component calls the `getTicketSummary` Genkit flow (`src/ai/flows/get-ticket-summary.ts`) on-the-fly to generate one, which is then passed back up to `page.tsx` via a callback to update the central state.

## 3. AI Search

This view allows users to ask natural language questions about the tickets currently loaded in the Ticket Explorer.

### How It Works

-   **UI:** The `AISearchView` component (`src/components/dashboard/ai-search-view.tsx`) provides the text area for the user's question and displays the results.
-   **Genkit Flow:** When a question is submitted, the component calls the `queryTickets` Genkit flow (`src/ai/flows/query-tickets.ts`). It sends the user's question along with the full data for all tickets in the current view.
-   **Structured Output:** The AI flow is instructed via its output Zod schema to return a structured JSON object containing a natural-language `answer` and an optional array of `foundTickets` (containing `id` and `subject`). This allows the UI to render both the summary and a clickable list of relevant tickets without needing to parse the answer text.

## 4. Social Intelligence

This view uses AI to search the live web for public sentiment related to a user's query, correlating it with internal support data.

### How It Works

-   **Genkit Tool:** This feature relies on a Genkit Tool called `searchTheWeb` (`src/ai/tools/web-search.ts`). A "tool" is a function the LLM can decide to call. In this case, the tool uses the Google Custom Search API to perform live web searches.
-   **Orchestration Flow:** The `socialMediaIntelligence` flow (`src/ai/flows/social-media-intelligence.ts`) acts as the orchestrator. When called, it uses the `searchTheWeb` tool to gather data.
-   **Analysis and Summarization:** The results from the web search are then fed back into the Gemini model within the same flow. The AI then analyzes the content for sentiment, identifies key themes, extracts representative mentions, and returns this analysis as a structured JSON object (defined by a Zod schema) to the `SocialIntelligenceView` component for display.

## 5. Ticket Clustering

This view uses unsupervised AI to automatically group tickets into thematic clusters, helping to identify emerging issues that don't fit into predefined categories.

### How It Works

-   **Trigger:** This analysis is part of the "Run Full Analysis" process initiated from the dashboard header in `page.tsx`.
-   **Genkit Flow:** The `clusterTickets` flow (`src/ai/flows/cluster-tickets.ts`) is called with a sample of the most recent tickets. To optimize performance and reduce token load, it only receives the ticket `id`, `subject`, and `category` (not the full description).
-   **Unsupervised Clustering:** The prompt instructs the AI to act as a data scientist and perform unsupervised clustering, identifying themes and keywords for each group it discovers. The flow is batched to handle larger ticket volumes without timeouts.
-   **Visualization:** The `ClusteringView` component (`src/components/dashboard/clustering-view.tsx`) receives the cluster data and uses a 2D scatter plot (from the Recharts library) to create a visual representation of the ticket groupings.

## 6. Predictive Analysis & Risk Assessment

This view provides AI-driven forecasts and identifies at-risk tickets. It is a manager-focused view.

### How It Works

-   **Orchestration:** This is the most complex feature, orchestrated by the `handleRunFullAnalysis` function in `page.tsx`. It can run multiple AI flows in parallel (deterministic mode) or let the agentic workflow decide which flows to run (agentic mode).
-   **Holistic Summary:** It first calls `getHolisticAnalysis` (`src/ai/flows/get-holistic-analysis.ts`) with historical data and a small sample of recent tickets. This flow is responsible for the big-picture items, like the ticket volume forecast and high-level trend summaries.
-   **Batched Risk Identification:** Simultaneously, it calls the `batchIdentifyTicketRisks` flow (`src/ai/flows/batch-identify-ticket-risks.ts`) for batches of open tickets. This flow is highly optimized to identify tickets at risk of low CSAT or SLA breach based on their metadata (`subject`, `category`, `sentiment`, `priority`), without needing to process the entire ticket `description`, which significantly reduces token count and prevents timeouts.
-   **Agentic Analysis:** In "AI Analyst Mode," an LLM-powered agent can call any of the analytics flows as tools, reason about which to use, and provide explanations for its choices. The agentic workflow is implemented as a Genkit flow (e.g., `agentic-analysis.ts`) and uses Gemini as the LLM.
-   **UI Display:** The `PredictiveView` component (`src/components/dashboard/predictive-view.tsx`) receives the combined output from all these flows and renders the various charts and tables, such as the forecast chart, at-risk ticket lists, and documentation opportunities. In agentic mode, it also displays the agent's reasoning and tool usage.

## 7. Manager Coaching

This manager-only view provides AI-generated, actionable coaching insights for individual agents.

### How It Works

-   **Data Sampling:** As part of the "Run Full Analysis" process, the `getCoachingInsights` flow (`src/ai/flows/get-coaching-insights.ts`) is called. To ensure performance, it analyzes a sample of the 200 most recent tickets that have an assigned agent.
-   **PII Pseudonymization:** Before sending any data to the AI, the flow iterates through the tickets and builds two `Map` objects: one mapping real agent names to anonymous IDs (e.g., "Sarah Connor" -> "Agent_1") and another for reverse lookup. This is a critical privacy and security measure that ensures the AI never sees real employee names.
-   **Insight Generation:** The AI is prompted to act as an expert support manager. It analyzes the anonymized ticket data (category, sentiment, CSAT, etc.) to identify specific points of praise and opportunities for improvement for each anonymous agent ID.
-   **De-Anonymization & Display:** After the AI returns its insights (e.g., "Agent_1 is excellent at handling complex billing issues"), the flow uses the reverse-lookup `Map` to replace the anonymous IDs with the real agent names and returns the final data to the `CoachingView` component (`src/components/dashboard/coaching-view.tsx`) for display.

## 8. Diagnostics

This view provides a real-time log of all interactions with the AI, making it easy to debug and understand the application's behavior.

### How It Works

- **Centralized Hook:** A custom React hook, `useDiagnostics` (`src/hooks/use-diagnostics.ts`), creates a global context for logging that's available everywhere in the app.
- **Event Logging:** Every time an AI flow is called from the frontend (`page.tsx`), it uses the `logEvent` function provided by the hook to record the data being 'sent' to the AI, the 'received' response from the AI, or any 'error' that occurs. In agentic mode, all agent tool calls, inputs, outputs, and reasoning are also logged for transparency.
- **Tabbed View:** The `DiagnosticsView` component (`src/components/dashboard/diagnostics-view.tsx`) consumes this context and presents the logs in three distinct tabs. This allows users to easily inspect the raw JSON data for every AI call made during their session, including agentic analysis steps.

## 9. Agentic Workflow (AI Analyst Mode)

- **Agentic Flow:** The agentic workflow is implemented as a Genkit flow (e.g., `agentic-analysis.ts`) that instantiates an agent, exposes all analytics flows as tools, and lets the agent reason about which to call.
- **LLM:** The agent uses Gemini as the LLM and can chain tool calls, adapt to results, and provide explanations.
- **UI Toggle:** The UI provides a toggle for users to select between deterministic and agentic analysis modes.
- **Logging:** All agent tool calls and reasoning are logged and can be displayed in the Diagnostics view for transparency.
