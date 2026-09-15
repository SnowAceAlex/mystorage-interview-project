/**
 * Fact checks that run over a captured assistant transcript.
 *
 * Every check compares what the assistant said against src/data/groundTruth.ts
 * (the company's own published figures). Nothing here calls a model or a
 * network: the checks are deterministic, so the same transcript always produces
 * the same report and a regression shows up in CI rather than in a customer
 * conversation.
 */

import { ADVERTISED_PRICES, PROTECTION_PLANS, formatVnd } from '../data/groundTruth'
import type { Transcript, Turn } from '../data/transcript'

export type Severity = 'high' | 'medium' | 'low'

export type CheckResult = {
  id: string
  title: string
  severity: Severity
  passed: boolean
  /** What the published source of truth says. */
  expected: string
  /** What the assistant actually said. */
  observed: string
  /** Why a customer or the business cares. */
  impact: string
}

/**
 * Collapses Unicode space variants (non-breaking, narrow no-break, etc.) to a
 * plain space. Different models format grouped numbers with different space
 * characters (e.g. U+202F narrow no-break space) — without this, a correct
 * answer fails to match purely because of which space character a model chose.
 */
export function normalizeSpaces(text: string): string {
  return text.replace(/[  -   　]/g, ' ')
}

/** Amounts written as 1.634.000 VNĐ / 1,418,000 VND / 10 000 000 VNĐ (space-grouped). */
const GROUPED_AMOUNT = /(\d{1,3}(?:[., ]\d{3})+)\s*(?:VN[ĐD]|VND|đ)/gi
/** Amounts written as "20 triệu". */
const MILLIONS_AMOUNT = /(\d+(?:[.,]\d+)?)\s*triệu/gi
/** Temperature ranges such as 24–28°C. */
const TEMP_RANGE = /(\d{1,2})\s*[–—-]\s*(\d{1,2})\s*°\s*C/g

export function parseAmounts(text: string): number[] {
  const normalized = normalizeSpaces(text)
  const amounts: number[] = []
  for (const [, digits] of normalized.matchAll(GROUPED_AMOUNT)) {
    amounts.push(Number(digits.replace(/[., ]/g, '')))
  }
  for (const [, digits] of normalized.matchAll(MILLIONS_AMOUNT)) {
    amounts.push(Math.round(Number(digits.replace(',', '.')) * 1_000_000))
  }
  return amounts
}

/** True when the assistant stated this exact amount, in any format it uses. */
export function statesAmount(text: string, amount: number): boolean {
  return parseAmounts(text).includes(amount)
}

/**
 * Air-conditioned storage lines only. "Non-AC" lines quote a different product
 * and must not be folded into the climate-controlled comparison.
 */
function isAirConditionedLine(line: string): boolean {
  if (/non-?\s*ac/i.test(line)) return false
  return /máy lạnh/i.test(line) || /air[-\s]?condition/i.test(line) || /\bAC\b/.test(line)
}

function assistantLines(transcript: Transcript): string[] {
  return transcript.turns
    .filter((turn) => turn.role === 'assistant')
    .flatMap((turn) => turn.text.split('\n'))
}

function answerTo(
  transcript: Transcript,
  matches: (text: string) => boolean,
): { question: Turn; answer: Turn | undefined } | undefined {
  const index = transcript.turns.findIndex((turn) => turn.role === 'user' && matches(turn.text))
  if (index === -1) return undefined
  const next = transcript.turns[index + 1]
  return { question: transcript.turns[index], answer: next?.role === 'assistant' ? next : undefined }
}

/** Every climate-controlled price the assistant quoted, lowest first. */
export function airConditionedQuotes(transcript: Transcript): number[] {
  const quotes = assistantLines(transcript)
    .filter(isAirConditionedLine)
    .flatMap(parseAmounts)
    .filter((amount) => amount > 10_000)
  return [...new Set(quotes)].sort((a, b) => a - b)
}

/**
 * The assistant quotes prices above the floor the website advertises, without
 * ever reconciling the two. The customer arrives having seen "from 559,000".
 */
function checkAdvertisedFloor(transcript: Transcript): CheckResult {
  const advertised = ADVERTISED_PRICES.find((price) => price.key === 'air-conditioned')!
  const quoted = airConditionedQuotes(transcript)
  const lowest = quoted.length ? Math.min(...quoted) : undefined
  const passed = lowest !== undefined && lowest <= advertised.floor
  const gap = lowest === undefined ? 0 : Math.round(((lowest - advertised.floor) / advertised.floor) * 100)

  return {
    id: 'advertised-floor',
    title: 'Giá thấp nhất trong chat khớp với giá "từ" đang quảng cáo',
    severity: 'high',
    passed,
    expected: `${formatVnd(advertised.floor)}/tháng — ${advertised.quote}`,
    observed:
      lowest === undefined
        ? 'Không tìm thấy báo giá kho máy lạnh nào trong hội thoại.'
        : `Thấp nhất ${formatVnd(lowest)}/tháng (cao hơn ${gap}%); các mức khác: ${quoted
            .map(formatVnd)
            .join(', ')}.`,
    impact:
      'Khách đọc "từ 559.000" trên website rồi được báo giá cao hơn 39% ngay câu hỏi đầu tiên. Hoặc trang web sai, hoặc trợ lý bỏ sót gói rẻ nhất — cả hai đều làm hỏng niềm tin đúng lúc khách đang so giá.',
  }
}

/** A published figure the customer asked for directly must appear in the answer. */
function checkLuggageRateDisclosed(transcript: Transcript): CheckResult {
  const advertised = ADVERTISED_PRICES.find((price) => price.key === 'luggage')!
  const exchange = answerTo(transcript, (text) => /hành lý/i.test(text) && /giá|bao nhiêu|giờ/i.test(text))
  const answer = exchange?.answer?.text ?? ''
  const passed = statesAmount(answer, advertised.floor)

  return {
    id: 'luggage-rate-disclosed',
    title: 'Hỏi thẳng giá theo giờ thì phải nhận được con số',
    severity: 'medium',
    passed,
    expected: `${formatVnd(advertised.floor)}/giờ — ${advertised.quote}`,
    observed: passed
      ? 'Câu trả lời có nêu mức giá theo giờ.'
      : 'Không có con số nào; trợ lý chuyển hướng sang link booking.mystorage.vn/vi/autolocker.',
    impact:
      'Con số này đã công bố công khai. Bắt khách bấm thêm một link để biết giá là rào cản không cần thiết ngay ở bước khách đang cân nhắc.',
  }
}

/** Protection ceilings are public; the assistant should state them. */
function checkProtectionCapsDisclosed(transcript: Transcript): CheckResult {
  const upgraded = PROTECTION_PLANS.filter((plan) => plan.tier !== 'Cơ bản')
  const protectionTurns = transcript.turns.filter(
    (turn) => turn.role === 'assistant' && /(Silver|Gold|Platinum|bảo vệ|bảo hiểm)/i.test(turn.text),
  )
  const disclosed = upgraded.filter((plan) =>
    protectionTurns.some((turn) => statesAmount(turn.text, plan.cap)),
  )
  const passed = disclosed.length === upgraded.length

  return {
    id: 'protection-caps-disclosed',
    title: 'Hạn mức bồi thường từng gói được nêu bằng số',
    severity: 'high',
    passed,
    expected: upgraded.map((plan) => `${plan.tier} ${formatVnd(plan.cap)}`).join(' · '),
    observed: passed
      ? 'Đã nêu đủ hạn mức các gói nâng cao.'
      : `Nêu được ${disclosed.length}/${upgraded.length} hạn mức. Trợ lý mô tả bằng chữ: "các mốc hàng chục hay hàng trăm triệu đồng".`,
    impact:
      'Đây là số tiền được bồi thường khi mất mát. Khách không thể tự kiểm chứng gói nào đủ cho tài sản của mình, dù chính FAQ của công ty đã công bố các mốc này.',
  }
}

/** A "fully covered" promise has to come with the ceiling it refers to. */
function checkCoverageClaimBacked(transcript: Transcript): CheckResult {
  const claimTurn = transcript.turns.find(
    (turn) => turn.role === 'assistant' && /bao quát trọn vẹn|trọn vẹn giá trị|fully cover/i.test(turn.text),
  )
  const tier = claimTurn ? PROTECTION_PLANS.find((plan) => new RegExp(plan.tier, 'i').test(claimTurn.text)) : undefined
  const passed = !claimTurn || (!!tier && statesAmount(claimTurn.text, tier.cap))

  return {
    id: 'coverage-claim-backed',
    title: 'Khẳng định "bao quát trọn vẹn" phải kèm hạn mức của gói',
    severity: 'high',
    passed,
    expected: tier
      ? `Khuyến nghị ${tier.tier} thì phải nêu hạn mức ${formatVnd(tier.cap)}.`
      : 'Mọi khẳng định về phạm vi bảo vệ đều kèm hạn mức.',
    observed: passed
      ? 'Khẳng định có kèm hạn mức.'
      : `Khuyến nghị ${tier?.tier ?? 'một gói'} và khẳng định "bao quát trọn vẹn giá trị khai báo" mà không nêu mức trần ${
          tier ? formatVnd(tier.cap) : ''
        }.`,
    impact:
      'Khách khai 20 triệu, sát trần 25 triệu của gói Silver. Thêm một món đồ nữa là vượt hạn mức mà khách không hề biết mình đang ở đâu so với ngưỡng.',
  }
}

/** The same spec must not change between two turns of one conversation. */
function checkSpecConsistency(transcript: Transcript): CheckResult {
  const ranges = new Set<string>()
  for (const line of assistantLines(transcript)) {
    if (!isAirConditionedLine(line)) continue
    for (const [, low, high] of line.matchAll(TEMP_RANGE)) ranges.add(`${low}–${high}°C`)
  }
  const passed = ranges.size <= 1

  return {
    id: 'spec-consistency',
    title: 'Thông số kho máy lạnh nhất quán trong cùng hội thoại',
    severity: 'low',
    passed,
    expected: 'Một dải nhiệt độ duy nhất cho kho máy lạnh.',
    observed: passed
      ? `Nhất quán: ${[...ranges].join(', ') || 'không nêu'}.`
      : `${ranges.size} dải khác nhau trong cùng một hội thoại: ${[...ranges].join(' vs ')}.`,
    impact:
      'Chi tiết nhỏ nhưng khách lưu rượu, nhạc cụ hay đồ điện tử sẽ đọc kỹ con số này; hai câu trả lời lệch nhau làm giảm độ tin cậy của mọi con số còn lại.',
  }
}

/** Every question the customer asks gets an answer. */
function checkNoDroppedQuestion(transcript: Transcript): CheckResult {
  const dropped = transcript.turns.filter(
    (turn, index) => turn.role === 'user' && transcript.turns[index + 1]?.role === 'user',
  )
  const passed = dropped.length === 0

  return {
    id: 'no-dropped-question',
    title: 'Không bỏ sót câu hỏi khi khách gửi liên tiếp',
    severity: 'high',
    passed,
    expected: 'Mỗi lượt hỏi của khách đều được trả lời.',
    observed: passed
      ? 'Không có câu hỏi nào bị bỏ sót.'
      : `${dropped.length} câu bị bỏ qua hoàn toàn: ${dropped.map((turn) => `"${turn.text}"`).join(', ')}.`,
    impact:
      'Hỏi giá tất cả chi nhánh là tín hiệu mua hàng rõ ràng nhất trong cả hội thoại. Trợ lý trả lời câu sau và không bao giờ quay lại câu trước — lead đi thẳng vào khoảng trống.',
  }
}

/** Out-of-scope requests must be declined, not invented. */
function checkOutOfScopeDeclined(transcript: Transcript): CheckResult {
  const exchange = answerTo(transcript, (text) => /ô tô|xe hơi|\bcar\b/i.test(text))
  const answer = exchange?.answer?.text ?? ''
  const declined = /chưa hỗ trợ|không hỗ trợ|not support|do not offer/i.test(answer)
  const quotedPrice = parseAmounts(answer).length > 0

  return {
    id: 'out-of-scope-declined',
    title: 'Dịch vụ không có thì từ chối, không bịa',
    severity: 'medium',
    passed: declined && !quotedPrice,
    expected: 'Lưu trữ ô tô không nằm trong danh mục dịch vụ đã công bố.',
    observed: declined
      ? 'Từ chối đúng, không báo giá, và gợi ý tiếp phương án thay thế.'
      : 'Không từ chối rõ ràng.',
    impact: 'Trường hợp này trợ lý xử lý tốt — giữ nguyên hành vi này khi sửa các lỗi còn lại.',
  }
}

export function runChecks(transcript: Transcript): CheckResult[] {
  return [
    checkAdvertisedFloor(transcript),
    checkNoDroppedQuestion(transcript),
    checkProtectionCapsDisclosed(transcript),
    checkCoverageClaimBacked(transcript),
    checkLuggageRateDisclosed(transcript),
    checkSpecConsistency(transcript),
    checkOutOfScopeDeclined(transcript),
  ]
}
