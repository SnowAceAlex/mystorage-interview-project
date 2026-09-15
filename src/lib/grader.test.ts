import { test } from 'node:test'
import assert from 'node:assert/strict'
import { grade } from './grader'

test('passes when the required amount is stated', () => {
  const result = grade('Gói Silver bồi thường tối đa 25.000.000 VNĐ.', {
    id: 'x',
    question: 'q',
    requiredAmounts: [25_000_000],
    amountKind: 'ceiling',
  })
  assert.equal(result.passed, true)
  assert.deepEqual(result.missing, [])
  assert.deepEqual(result.contradictions, [])
})

test('reports a missing amount', () => {
  const result = grade('Gói Silver bồi thường một khoản hợp lý.', {
    id: 'x',
    question: 'q',
    requiredAmounts: [25_000_000],
  })
  assert.equal(result.passed, false)
  assert.equal(result.missing.length, 1)
})

test('flags a same-kind distractor as a contradiction', () => {
  const result = grade('Gói Silver bồi thường tối đa 50.000.000 VNĐ.', {
    id: 'x',
    question: 'q',
    requiredAmounts: [25_000_000],
    amountKind: 'ceiling',
  })
  assert.equal(result.passed, false)
  assert.equal(result.missing.length, 1)
  assert.equal(result.contradictions.length, 1)
})

test('required strings must all appear, case-insensitively', () => {
  const result = grade('gói silver là lựa chọn phù hợp', {
    id: 'x',
    question: 'q',
    requiredStrings: ['Silver'],
  })
  assert.equal(result.passed, true)
})

test('mustDecline passes on a clean decline with no invented price', () => {
  const result = grade('Dạ hiện tại MyStorage chưa hỗ trợ lưu trữ ô tô ạ.', {
    id: 'x',
    question: 'q',
    mustDecline: true,
  })
  assert.equal(result.passed, true)
})

test('mustDecline fails when a price is invented alongside the decline', () => {
  const result = grade('Dạ chưa hỗ trợ, nhưng giá tham khảo khoảng 500.000 VNĐ.', {
    id: 'x',
    question: 'q',
    mustDecline: true,
  })
  assert.equal(result.passed, false)
  assert.equal(result.contradictions.length, 1)
})

test('mustDecline passes on "không nhận" phrasing, which the grounded facts block itself uses', () => {
  const result = grade('Dạ MyStorage không nhận lưu trữ ô tô ạ.', {
    id: 'x',
    question: 'q',
    mustDecline: true,
  })
  assert.equal(result.passed, true)
})

test('does not flag a distractor as a contradiction when the required amount was also correctly stated', () => {
  const result = grade('Kho máy lạnh từ 559.000 VNĐ/tháng; gửi hành lý 54.000 VNĐ/giờ.', {
    id: 'x',
    question: 'q',
    requiredAmounts: [559_000],
    amountKind: 'price',
  })
  assert.equal(result.passed, true)
  assert.deepEqual(result.missing, [])
  assert.deepEqual(result.contradictions, [])
})

test('recognizes a grouped amount that uses a narrow no-break space (U+202F), as some models do', () => {
  const result = grade('Gói Silver bồi thường tối đa 25 000 000 VNĐ.', {
    id: 'x',
    question: 'q',
    requiredAmounts: [25_000_000],
  })
  assert.equal(result.passed, true)
  assert.deepEqual(result.missing, [])
})

test('recognizes a required string across a narrow no-break space (U+202F), as some models use for grouping', () => {
  const result = grade('Số điện thoại là 028 7770 0117 ạ.', {
    id: 'x',
    question: 'q',
    requiredStrings: ['7770 0117'],
  })
  assert.equal(result.passed, true)
  assert.deepEqual(result.missing, [])
})
