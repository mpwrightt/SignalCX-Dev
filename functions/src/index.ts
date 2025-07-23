
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { genkitClient } from "./genkit";

admin.initializeApp();

/**
 * Cloud Function to process a micro-batch of up to 5 tickets.
 * This function is triggered when a new job document is created in Firestore.
 * It streams analysis results back to the client in real-time.
 */
export const processBatch = functions
  .region("us-central1")
  .runWith({ memory: "512MB", maxInstances: 100, timeoutSeconds: 60 })
  .firestore.document("jobs/{jobId}")
  .onCreate(async (snap, context) => {
    const { jobId } = context.params;
    const jobData = snap.data();

    if (!jobData || !jobData.ticketIds || !jobData.payloads) {
      console.error(`[${jobId}] - Invalid job data. Missing ticketIds or payloads.`);
      await snap.ref.update({ status: "error", error: "Invalid job data." });
      return;
    }

    const { ticketIds, payloads } = jobData;
    console.log(`[${jobId}] - Starting processing for ${ticketIds.length} tickets.`);

    try {
      await snap.ref.update({ status: "streaming" });

      const startTime = Date.now();
      const stream = await genkitClient.stream({
        flow: "multiTicketFlow",
        input: payloads,
        batchMode: "independent",
        stream: true,
      });

      for await (const chunk of stream) {
        // chunk should be: { ticketIndex: number, text: string }
        if (chunk.ticketIndex === undefined || !chunk.text) continue;

        const ticketId = ticketIds[chunk.ticketIndex];
        await snap.ref.collection("chunks").add({
          ticketId,
          text: chunk.text,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      const streamEndTime = Date.now();
      console.log(`[${jobId}] - Chunk streaming completed in ${streamEndTime - startTime}ms.`);


      const fullMap = await stream.getFullMap(); // { [ticketIndex]: fullText }
      const summaryMap = Object.fromEntries(
        ticketIds.map((id: string, idx: number) => [id, fullMap[idx] || ""])
      );

      await snap.ref.update({ summaryMap, status: "done" });
      const finalEndTime = Date.now();
      console.log(`[${jobId}] - Job finalized in ${finalEndTime - startTime}ms.`);

    } catch (error) {
      console.error(`[${jobId}] - An error occurred during processing:`, error);
      await snap.ref.update({ status: "error", error: (error as Error).message });
    }
  });
