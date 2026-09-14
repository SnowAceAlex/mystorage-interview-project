import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mapWithConcurrency } from './concurrency'

test('runs all items and preserves order', async () => {
  const result = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => n * 2)
  assert.deepEqual(result, [2, 4, 6, 8, 10])
})

test('never exceeds the concurrency limit', async () => {
  let active = 0
  let maxActive = 0
  await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (n) => {
    active++
    maxActive = Math.max(maxActive, active)
    await new Promise((resolve) => setTimeout(resolve, 10))
    active--
    return n
  })
  assert.ok(maxActive <= 2, `expected maxActive <= 2, got ${maxActive}`)
})
