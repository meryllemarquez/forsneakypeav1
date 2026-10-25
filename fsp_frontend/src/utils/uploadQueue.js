// Small helpers for the multi-photo upload: a bounded worker pool and a gentle retry.

/** Runs worker(item) over items with at most `limit` running at once. Workers handle their own errors. */
export async function runPool(items, worker, limit = 3) {
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await worker(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
}

export const isCanceled = (err) =>
  err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';

/** True for failures that may go away on their own: no response (network), 408, 429 and 5xx. */
export function isTransient(err) {
  if (isCanceled(err)) return false;
  const status = err?.response?.status;
  if (!status) return true;
  return status === 408 || status === 429 || status >= 500;
}

/** Calls fn(); on a transient failure waits `delay` ms and tries once more. */
export async function withRetry(fn, { retries = 1, delay = 1500 } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isTransient(err)) throw err;
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
