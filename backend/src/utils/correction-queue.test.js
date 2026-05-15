import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import PQueue from 'p-queue';
import pRetry from 'p-retry';

// Inline the same retry logic as correction-queue.js (without logger dependency)
function makeQueue(concurrency = 2, maxQueueSize = 3) {
  const queue = new PQueue({ concurrency });

  async function enqueue(requestId, fn) {
    if (queue.size >= maxQueueSize) {
      throw Object.assign(new Error('Queue full'), { code: 'QUEUE_FULL' });
    }
    return queue.add(() =>
      pRetry(fn, {
        retries: 2,
        factor: 2,
        minTimeout: 10,
        maxTimeout: 100,
        shouldRetry({ error }) {
          const status = error.status ?? error.httpStatus;
          return !status || status === 429 || status >= 500;
        },
      })
    );
  }

  return { queue, enqueue };
}

describe('correctionQueue — concurrency', () => {
  it('runs tasks concurrently up to the limit', async () => {
    const { enqueue } = makeQueue(2);
    let running = 0;
    let maxConcurrent = 0;

    const task = () =>
      new Promise((resolve) => {
        running++;
        maxConcurrent = Math.max(maxConcurrent, running);
        setTimeout(() => { running--; resolve('ok'); }, 30);
      });

    await Promise.all([enqueue('r1', task), enqueue('r2', task), enqueue('r3', task)]);
    assert.equal(maxConcurrent, 2, 'should never exceed concurrency=2');
  });
});

describe('correctionQueue — retry', () => {
  it('retries on 5xx and eventually succeeds', async () => {
    const { enqueue } = makeQueue(1);
    let attempts = 0;

    const result = await enqueue('r1', () => {
      attempts++;
      if (attempts < 3) {
        const err = new Error('Server error');
        err.status = 500;
        throw err;
      }
      return 'success';
    });

    assert.equal(result, 'success');
    assert.equal(attempts, 3);
  });

  it('does NOT retry on 400 bad request', async () => {
    const { enqueue } = makeQueue(1);
    let attempts = 0;

    await assert.rejects(
      () => enqueue('r1', () => {
        attempts++;
        const err = new Error('Bad request');
        err.status = 400;
        throw err;
      }),
      /Bad request/
    );

    assert.equal(attempts, 1, 'should not retry on 400');
  });

  it('retries on 429 rate limit', async () => {
    const { enqueue } = makeQueue(1);
    let attempts = 0;

    const result = await enqueue('r1', () => {
      attempts++;
      if (attempts < 2) {
        const err = new Error('Rate limited');
        err.status = 429;
        throw err;
      }
      return 'ok after rate limit';
    });

    assert.equal(result, 'ok after rate limit');
    assert.ok(attempts >= 2);
  });
});

describe('correctionQueue — backpressure', () => {
  it('rejects new tasks when queue is full', async () => {
    const { queue, enqueue } = makeQueue(1, 2);
    const slow = () => new Promise((r) => setTimeout(r, 200));

    // 1 running + 2 waiting = 3 total (queue.size starts counting waiting)
    enqueue('r1', slow).catch(() => {});
    enqueue('r2', slow).catch(() => {});
    enqueue('r3', slow).catch(() => {});

    // wait for queue to fill
    await new Promise((r) => setTimeout(r, 5));

    await assert.rejects(
      () => enqueue('r4', slow),
      /Queue full/
    );

    queue.clear();
  });
});
