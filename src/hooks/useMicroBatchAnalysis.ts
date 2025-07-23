
'use client';

import { useState, useCallback, useRef } from 'react';
import { useDiagnostics } from './use-diagnostics';

interface MicroBatchConfig {
  batchSize: number;
  maxConcurrent: number;
  delayMs: number;
}

interface MicroBatchResult<T> {
  data: T;
  batchIndex: number;
  totalBatches: number;
  progress: number;
  isComplete: boolean;
}

export function useMicroBatchAnalysis<T, R>() {
  const { logEvent } = useDiagnostics();
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  const processMicroBatches = useCallback(async (
    items: T[],
    processor: (batch: T[], batchIndex: number) => Promise<R[]>,
    config: MicroBatchConfig = { batchSize: 5, maxConcurrent: 3, delayMs: 100 },
    onBatchComplete?: (result: MicroBatchResult<R[]>) => void
  ): Promise<R[]> => {
    if (items.length === 0) return [];

    setIsProcessing(true);
    setProgress(0);
    abortController.current = new AbortController();

    try {
      const batches: T[][] = [];
      for (let i = 0; i < items.length; i += config.batchSize) {
        batches.push(items.slice(i, i + config.batchSize));
      }

      const totalBatches = batches.length;
      const results: R[] = [];
      let completedBatches = 0;

      console.log(`[MicroBatchAnalysis] Processing ${items.length} items in ${totalBatches} batches`);
      logEvent('sent', 'micro-batch-start', { 
        totalItems: items.length, 
        totalBatches, 
        batchSize: config.batchSize,
        maxConcurrent: config.maxConcurrent
      });

      // Process batches in parallel with controlled concurrency
      const processNextBatch = async (batchIndex: number): Promise<void> => {
        if (abortController.current?.signal.aborted) {
          throw new Error('Processing aborted');
        }

        try {
          const batch = batches[batchIndex];
          const batchResult = await processor(batch, batchIndex);
          
          results.push(...batchResult);
          completedBatches++;
          
          const currentProgress = (completedBatches / totalBatches) * 100;
          setProgress(currentProgress);

          const batchComplete: MicroBatchResult<R[]> = {
            data: batchResult,
            batchIndex,
            totalBatches,
            progress: currentProgress,
            isComplete: completedBatches === totalBatches
          };

          if (onBatchComplete) {
            onBatchComplete(batchComplete);
          }

          logEvent('received', 'micro-batch-complete', {
            batchIndex,
            batchSize: batch.length,
            resultCount: batchResult.length,
            progress: currentProgress
          });

          // Small delay to prevent overwhelming the system
          if (config.delayMs > 0 && completedBatches < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, config.delayMs));
          }
        } catch (error) {
          logEvent('error', 'micro-batch-error', { batchIndex, error });
          console.error(`[MicroBatchAnalysis] Batch ${batchIndex} failed:`, error);
          // Continue with other batches even if one fails
        }
      };

      // Create worker pool for concurrent processing
      const workers: Promise<void>[] = [];
      const batchQueue = Array.from({ length: totalBatches }, (_, i) => i);

      while (batchQueue.length > 0 || workers.length > 0) {
        // Start new workers up to maxConcurrent
        while (workers.length < config.maxConcurrent && batchQueue.length > 0) {
          const batchIndex = batchQueue.shift()!;
          const worker = processNextBatch(batchIndex);
          workers.push(worker);
        }

        // Wait for at least one worker to complete
        if (workers.length > 0) {
          await Promise.race(workers);
          // Remove completed workers
          for (let i = workers.length - 1; i >= 0; i--) {
            const worker = workers[i];
            if (await Promise.race([worker.then(() => true), Promise.resolve(false)])) {
              workers.splice(i, 1);
            }
          }
        }
      }

      console.log(`[MicroBatchAnalysis] Completed processing ${results.length} items`);
      logEvent('received', 'micro-batch-end', { 
        totalResults: results.length, 
        successRate: (completedBatches / totalBatches) * 100 
      });

      return results;
    } catch (error) {
      logEvent('error', 'micro-batch-analysis', error);
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
      abortController.current = null;
    }
  }, [logEvent]);

  const abort = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  return {
    processMicroBatches,
    progress,
    isProcessing,
    abort
  };
}
