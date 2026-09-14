import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BASELINE_SYSTEM_PROMPT, groundedSystemPrompt } from './prompts'

test('baseline prompt states no MyStorage figures', () => {
  assert.equal(/\d{3},?\d{3}/.test(BASELINE_SYSTEM_PROMPT), false)
})

test('grounded prompt includes the published protection ceilings', () => {
  const prompt = groundedSystemPrompt()
  assert.match(prompt, /25\.000\.000/)
  assert.match(prompt, /50\.000\.000/)
  assert.match(prompt, /100\.000\.000/)
})

test('grounded prompt instructs the model not to estimate beyond the facts block', () => {
  const prompt = groundedSystemPrompt()
  assert.match(prompt, /không có thông tin/)
})
