/**
 * @fileOverview A simple service for scrubbing Personally Identifiable Information (PII) from text.
 * NOTE: This is a basic implementation using regular expressions. For production systems,
 * consider using a dedicated PII detection service like the Google Cloud Data Loss Prevention (DLP) API
 * for more robust and accurate redaction.
 */

// Simple regex for email addresses
const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
// Simple regex for North American phone numbers
const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

/**
 * Scrubs common PII from a given text string.
 * @param text The input text to scrub.
 * @returns The text with PII replaced by placeholders.
 */
export function scrubPii(text: string): string {
  if (!text) return '';
  let scrubbedText = text;
  scrubbedText = scrubbedText.replace(emailRegex, '[REDACTED_EMAIL]');
  scrubbedText = scrubbedText.replace(phoneRegex, '[REDACTED_PHONE]');
  
  // NOTE ON NAME REDACTION:
  // Redacting names with regular expressions is notoriously unreliable due to the vast
  // diversity of names. A more robust and recommended approach for structured data
  // is pseudonymization, where real names are replaced with anonymous, temporary IDs
  // (e.g., "John Doe" becomes "Agent_1"). This allows the AI to process the data
  // without seeing the PII, and the application can map the ID back to the real name
  // after receiving the AI's response. See `src/ai/flows/get-coaching-insights.ts`
  // for a working example of this technique.
  return scrubbedText;
}
