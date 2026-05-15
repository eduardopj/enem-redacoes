import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { writeLog } from './logger.js';

const CONCURRENCY = Number(process.env.OPENAI_QUEUE_CONCURRENCY ?? 3);
const MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES ?? 3);
const MAX_QUEUE_SIZE = Number(process.env.OPENAI_MAX_QUEUE_SIZE ?? 20);

export const correctionQueue = new PQueue({ concurrency: CONCURRENCY });

/**
 * Enqueue an OpenAI correction call with concurrency control and retry.
 * Retries on 429 (rate limit) and 5xx errors with exponential backoff.
 * Rejects immediately if queue is full.
 */
export async function enqueueCorrection(requestId, fn) {
  if (correctionQueue.size >= MAX_QUEUE_SIZE) {
    throw Object.assign(
      new Error('Muitas correções em andamento. Aguarde alguns instantes e tente novamente.'),
      { code: 'QUEUE_FULL', httpStatus: 503 }
    );
  }

  return correctionQueue.add(() =>
    pRetry(fn, {
      retries: MAX_RETRIES,
      factor: 2,
      minTimeout: 2_000,
      maxTimeout: 30_000,
      randomize: true,
      shouldRetry({ error }) {
        const status = error.status ?? error.httpStatus;
        // Only retry rate-limit (429) and server errors (5xx); abort on client errors
        return !status || status === 429 || status >= 500;
      },
      onFailedAttempt({ error, attemptNumber, retriesLeft }) {
        writeLog('warn', 'correction_retry', {
          requestId,
          attempt: attemptNumber,
          retriesLeft,
          status: error.status,
          error: error.message,
        });
      },
    })
  );
}

export function getQueueStats() {
  return {
    waiting: correctionQueue.size,
    running: correctionQueue.pending,
    concurrency: CONCURRENCY,
  };
}
