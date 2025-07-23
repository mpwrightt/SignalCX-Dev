# Contributing to SignalCX

Thank you for your interest in contributing! This document outlines the process for setting up your environment, following coding conventions, and adding new features to the application.

## Getting Started

Before you begin, please ensure you have followed the complete setup instructions in the [Local Development Guide](./LOCAL_DEVELOPMENT.md). This includes installing dependencies and setting up your `.env` file with a Google AI API key.

## Coding Conventions

*   **TypeScript:** The entire project is written in TypeScript. Please use appropriate types and aim for type safety.
*   **Component Structure:** Follow the existing patterns for creating React components. Use functional components with hooks.
*   **File Naming:** Use kebab-case for file names (e.g., `ticket-conversation-sheet.tsx`).
*   **Code Formatting:** While not enforced by a pre-commit hook, please try to maintain a consistent code style with the rest of the project.

## Adding a New Component

1.  **Use ShadCN First:** If your new component can be built from a [ShadCN UI](https://ui.shadcn.com/) primitive, use the ShadCN CLI to add the base component first:
    ```bash
    npx shadcn-ui@latest add <component-name>
    ```
2.  **Create Your Component:** Create your new component file in `src/components/`.
3.  **Compose:** Build your component by composing the necessary ShadCN UI primitives or other existing components.
4.  **Export:** Export your new component from the file.

## Adding a New AI Flow

All AI logic resides in `src/ai/flows`. To add a new flow (e.g., to extract a new piece of information from a ticket):

1.  **Create the Flow File:** Create a new file, such as `src/ai/flows/my-new-flow.ts`.
2.  **Add to Genkit Dev Server:** Import your new file in `src/ai/dev.ts` so the Genkit development server will load it. This is a critical step for the flow to be recognized by the system.
    ```typescript
    // src/ai/dev.ts
    import '@/ai/flows/my-new-flow.ts';
    // ... other imports
    ```
3.  **Define the Flow:** Inside your new file, follow the standard pattern:
    *   Add `'use server';` to the top.
    *   Define input and output schemas using `zod`.
    *   Define a prompt with `ai.definePrompt`, passing your schemas and a Handlebars template.
    *   Define the flow with `ai.defineFlow`.
    *   Create and export an `async` wrapper function that your frontend code will call.

    You can use `src/ai/flows/summarize-ticket.ts` as a template for a simple flow.

## Submitting Changes

When your changes are complete:

1.  **Test Your Changes:** Run the test suite to ensure you haven't introduced any regressions.
    ```bash
    npm test
    ```
2.  **Commit Your Code:** Write a clear and descriptive commit message explaining the purpose of your changes.

Thank you for helping to improve SignalCX!
