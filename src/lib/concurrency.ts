/** Runs `items` through `worker` with at most `limit` in flight at once, preserving input order in the result. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  async function runNext(): Promise<void> {
    const index = cursor++
    if (index >= items.length) return
    results[index] = await worker(items[index])
    await runNext()
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runNext()))
  return results
}
