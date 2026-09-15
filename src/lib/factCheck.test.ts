import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runChecks } from './factCheck'
import { AUDIT_TRANSCRIPT } from '../data/transcript'

test('locale changes wording only, never which checks pass', () => {
  const vi = runChecks(AUDIT_TRANSCRIPT, 'vi')
  const en = runChecks(AUDIT_TRANSCRIPT, 'en')
  const verdicts = (results: typeof vi) => results.map(({ id, passed, severity }) => ({ id, passed, severity }))
  assert.deepEqual(verdicts(en), verdicts(vi))
  for (const result of [...vi, ...en]) {
    for (const field of ['title', 'expected', 'observed', 'impact'] as const) {
      assert.ok(result[field].trim().length > 0, `${result.id}.${field} is empty`)
    }
  }
})

test('default locale keeps the Vietnamese report the CLI prints', () => {
  assert.deepEqual(runChecks(AUDIT_TRANSCRIPT), runChecks(AUDIT_TRANSCRIPT, 'vi'))
  assert.deepEqual(
    runChecks(AUDIT_TRANSCRIPT).map((result) => result.title),
    [
      'Giá thấp nhất trong chat khớp với giá "từ" đang quảng cáo',
      'Không bỏ sót câu hỏi khi khách gửi liên tiếp',
      'Hạn mức bồi thường từng gói được nêu bằng số',
      'Khẳng định "bao quát trọn vẹn" phải kèm hạn mức của gói',
      'Hỏi thẳng giá theo giờ thì phải nhận được con số',
      'Thông số kho máy lạnh nhất quán trong cùng hội thoại',
      'Dịch vụ không có thì từ chối, không bịa',
    ],
  )
})

test('English report formats money the English way', () => {
  const floor = runChecks(AUDIT_TRANSCRIPT, 'en').find((result) => result.id === 'advertised-floor')!
  assert.match(floor.expected, /^559,000 VND\/month — /)
})
