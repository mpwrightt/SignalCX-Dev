# Local Development Guide

This guide will walk you through setting up and running this project on your local machine.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## 1. Get API Keys

This project uses Google AI and Google Search. You will need API keys for both to run the application and use all its features.

### Google AI API Key (Required)

This is the primary key for all core generative AI features, including sentiment analysis, summarization, and predictive modeling.

1.  Visit the [Google AI Studio](https://aistudio.google.com/app/apikey) to generate an API key.
2.  Click **"Create API key"**.
3.  Copy the generated key. You will need it in the `.env` setup step.

---

### Google Search API Keys (for Social Intelligence)

This is required for the "Social Intelligence" feature to search the live web. Without these keys, this specific feature will not function, but the rest of the app will work.

#### Step 1: Get the API Key
1.  Go to the **[Google Cloud Console Credentials page](https://console.cloud.google.com/apis/credentials)**.
2.  Click **"+ CREATE CREDENTIALS"** and select **"API key"**.
3.  Copy the generated API key.
4.  Next, go to the **[Custom Search API Library page](https://console.cloud.google.com/apis/library/customsearch.googleapis.com)** and click **"Enable"** to activate the API for your project.

#### Step 2: Get the Search Engine ID
1.  Go to the **[Programmable Search Engine control panel](https://programmablesearchengine.google.com/controlpanel/all)**.
2.  Click **"Add"** to create a new search engine.
3.  Under "What to search?", make sure you select the option to **"Search the entire web"**.
4.  Give your search engine a name (e.g., "Zendesk Analyzer Search") and click **"Create"**.
5.  On the next page, copy the **"Search engine ID"**.

---

## 2. Set Up Environment Variables

The application uses a `.env` file to manage secret keys.

1.  If it doesn't already exist, create a file named `.env` in the root directory of the project.
2.  Open your new `.env` file and add your API keys. Replace the placeholder values with your actual credentials.

    ```
    # Google AI Key (Required)
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_KEY_HERE

    # Google Search API credentials for Social Intelligence feature (Optional)
    GOOGLE_SEARCH_API_KEY=YOUR_GOOGLE_SEARCH_API_KEY_HERE
    GOOGLE_SEARCH_ENGINE_ID=YOUR_SEARCH_ENGINE_ID_HERE
    ```

## 3. Install Dependencies

Open your terminal in the project's root directory and run the following command to install all the necessary packages:

```bash
npm install
```

## 4. Run the Development Servers

This project requires two separate processes to be running simultaneously in two different terminal windows for the AI features to work.

**Terminal 1: Start the Next.js App**

This command starts the main web application. By default, it runs on `http://localhost:9002`.

```bash
npm run dev
```

**Terminal 2: Start the Genkit AI Flows**

This command starts the Genkit server, which manages and executes all the AI functionality. It also launches the Genkit Developer UI, where you can inspect your AI flows, view traces of each call, and debug prompts in real-time.

```bash
npm run genkit:dev
```

With both servers running, you can now use the application.

---

## 5. Hybrid Analytics: Deterministic and Agentic Modes

SignalCX supports both deterministic batch analytics and agentic (AI Analyst Mode) analytics.

- **Deterministic Mode:** The default, fast, and reliable analytics using batched Genkit flows. No special configuration required.
- **Agentic Mode (AI Analyst Mode):** An LLM-powered agent (using Gemini) can call analytics flows as tools, reason about which to use, and provide explanations. Users can enable "AI Analyst Mode" via a toggle in the UI.
- **Tool Exposure:** All analytics flows are exposed as agent tools for the agentic workflow.
- **Logging:** All agent tool calls, inputs, outputs, and reasoning are logged for diagnostics and can be viewed in the Diagnostics tab.

### How to Test Both Modes

1. **Start both servers as above.**
2. **In the app UI, locate the analytics mode toggle** (usually in the main analytics or settings view).
3. **Switch between Standard and AI Analyst Mode** to compare deterministic and agentic analysis.
4. **Check the Diagnostics tab** to see logs of all AI flow calls, including agentic tool calls and reasoning.

### Additional Notes

- No extra dependencies are required for agentic mode if you are already using Genkit and Gemini.
- If you add new analytics flows, expose them as agent tools to make them available to the agentic workflow.
- For advanced agentic features, see the architecture and technical docs for extension points.
