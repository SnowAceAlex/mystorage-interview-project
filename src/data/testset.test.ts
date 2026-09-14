import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TESTSET } from './testset'

test('testset has exactly 15 questions with unique ids', () => {
  assert.equal(TESTSET.length, 15)
  const ids = new Set(TESTSET.map((item) => item.id))
  assert.equal(ids.size, 15)
})

test('every expectation has a non-empty question and at least one checkable condition', () => {
  for (const expectation of TESTSET) {
    assert.ok(expectation.question.trim().length > 0, `${expectation.id} has no question`)
    const hasCondition =
      (expectation.requiredAmounts?.length ?? 0) > 0 ||
      (expectation.requiredStrings?.length ?? 0) > 0 ||
      expectation.mustDecline === true
    assert.ok(hasCondition, `${expectation.id} has no machine-checkable expectation`)
  }
})
