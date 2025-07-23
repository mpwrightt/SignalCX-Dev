
'use server';

/**
 * @fileOverview This file defines a Genkit flow to cluster Zendesk tickets.
 *
 * - clusterTickets - A function that groups tickets into thematic clusters.
 * - ClusterTicketsInput - The input type for the clusterTickets function.
 * - ClusterTicketsOutput - The return type for the clusterTickets function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {TicketCluster} from '@/lib/types';
import { scrubPii } from '@/lib/pii-scrubber';

const ClusterTicketsInputSchema = z.object({
  tickets: z.array(
    z.object({
      id: z.number(),
      subject: z.string(),
      category: z.string(),
    })
  ),
});
export type ClusterTicketsInput = z.infer<typeof ClusterTicketsInputSchema>;

const TicketClusterSchema = z.object({
  clusterId: z.number().describe("A unique ID for the cluster, starting from 1."),
  theme: z.string().describe("A short, descriptive theme for the cluster (e.g., 'Confusion over shipping times')."),
  ticketIds: z.array(z.number()).describe("An array of ticket IDs belonging to this cluster."),
  keywords: z.array(z.string()).describe("An array of 5-7 keywords that are representative of this cluster."),
});

const ClusterTicketsOutputSchema = z.object({
  clusters: z.array(TicketClusterSchema),
});

export type ClusterTicketsOutput = z.infer<typeof ClusterTicketsOutputSchema>;

export async function clusterTickets(input: ClusterTicketsInput): Promise<ClusterTicketsOutput> {
  return clusterTicketsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'clusterTicketsPrompt',
  input: {schema: ClusterTicketsInputSchema},
  output: {schema: ClusterTicketsOutputSchema},
  prompt: `You are an expert data scientist specializing in unsupervised text clustering.
Your task is to analyze the provided array of support tickets and group them into thematic clusters based on their subject and category.

For each cluster you identify, you must provide:
1.  A unique clusterId (starting from 1).
2.  A short, descriptive theme that summarizes the core issue of the cluster.
3.  A list of all ticket IDs that belong to the cluster.
4.  A list of 5-7 keywords that are representative of the cluster's theme.

Do not include tickets that do not fit into a clear thematic group. Aim to identify 2-5 significant clusters.

Here are the tickets to analyze:
{{#each tickets}}
---
Ticket ID: {{this.id}}
Subject: {{{this.subject}}}
Category: {{this.category}}
---
{{/each}}`,
});

const CLUSTER_BATCH_SIZE = 50;
const CLUSTER_ANALYSIS_TICKET_LIMIT = 200;

const clusterTicketsFlow = ai.defineFlow(
  {
    name: 'clusterTicketsFlow',
    inputSchema: ClusterTicketsInputSchema,
    outputSchema: ClusterTicketsOutputSchema,
  },
  async (input) => {
    const sampledTickets = [...input.tickets].slice(0, CLUSTER_ANALYSIS_TICKET_LIMIT);
    
    try {
      if (sampledTickets.length < 5) {
        console.log('[clusterTicketsFlow] Not enough tickets to form clusters. Returning empty array.');
        return { clusters: [] }; // Not enough data
      }

      // Scrub PII before sending to the model
      const scrubbedTickets = sampledTickets.map(ticket => ({
        ...ticket,
        subject: scrubPii(ticket.subject),
      }));
      console.log(`[clusterTicketsFlow] Starting batched analysis for ${scrubbedTickets.length} tickets in batches of ${CLUSTER_BATCH_SIZE}.`);

      // --- BATCHING LOGIC ---
      const batchPromises = [];
      for (let i = 0; i < scrubbedTickets.length; i += CLUSTER_BATCH_SIZE) {
        const batch = scrubbedTickets.slice(i, i + CLUSTER_BATCH_SIZE);
        batchPromises.push(prompt({ tickets: batch }));
      }
      
      const batchResults = await Promise.all(batchPromises);
      console.log(`[clusterTicketsFlow] All ${batchResults.length} clustering batches complete.`);

      // Combine and re-number cluster IDs
      const combinedClusters: TicketCluster[] = [];
      let globalClusterId = 1;
      for (const result of batchResults) {
        if (result.output?.clusters) {
          for (const cluster of result.output.clusters) {
            combinedClusters.push({
              ...cluster,
              clusterId: globalClusterId++, // Assign a new, unique ID
            });
          }
        }
      }

      if (combinedClusters.length === 0) {
        console.warn('[clusterTicketsFlow] AI model returned no clusters from any batch.');
        return { clusters: [] };
      }
      
      console.log(`[clusterTicketsFlow] Successfully generated ${combinedClusters.length} clusters from batched analysis.`);
      return { clusters: combinedClusters };

    } catch (error) {
      console.error("[clusterTicketsFlow] An unexpected error occurred during batched analysis:", error);
      // Return a valid, empty response to prevent the entire 'full analysis' from crashing.
      return { clusters: [] };
    }
  }
);
