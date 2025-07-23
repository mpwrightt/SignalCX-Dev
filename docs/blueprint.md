# **App Name**: Zendesk Analyzer

## Core Features:

- User Authentication: Secure authentication using Firebase Authentication.
- Zendesk Integration: Pull tickets from Zendesk API using a specified view ID. This operation occurs in Firebase Cloud Functions for security.
- Sentiment Analysis: Send ticket data to OpenAI's GPT API via a tool function for sentiment analysis (positive, neutral, negative).
- Issue Categorization: Categorize the issue (e.g., login, billing, shipping) by prompting OpenAI's GPT API via a tool function.
- Ticket Summarization: Generate a concise one-sentence summary and a paragraph-length detailed analysis using OpenAI.
- Dashboard Display: Display tickets in a filterable and sortable table, showing ticket ID, subject, sentiment, category, and summary.
- Chart Visualization: Visual representation of data using a pie chart for sentiment distribution and a bar chart for the top 5 issue categories.

## Style Guidelines:

- Primary color: Deep purple (#6750A4) to convey insights and analytics. This color choice aims to avoid cliches (e.g., blues for data or greens for money).
- Background color: Light lavender (#F2F0F9), providing a muted backdrop that lets the primary color pop, while keeping to a light theme as called for by the project description.
- Accent color: Blue-purple (#53499A), to highlight interactive elements, such as sortable columns in the dashboard, providing contrast against the lavender backdrop and harmonious continuation of the design.
- Body: 'Inter' (sans-serif) provides a neutral, clean readability to large quantities of tabular data; Headlines: 'Space Grotesk' (sans-serif) lends the application a high-tech look that harmonizes well with the AI component.
- Use simple, outline-style icons from a Material Design set to maintain a clean and professional look.
- Implement a responsive, grid-based layout to adapt to desktop and tablet screens, following Material Design principles.
- Subtle transition animations for dashboard updates and chart interactions to enhance user experience without being distracting.