/**
 * Fact checks that run over a captured assistant transcript.
 *
 * Every check compares what the assistant said against src/data/groundTruth.ts
 * (the company's own published figures). Nothing here calls a model or a
 * network: the checks are deterministic, so the same transcript always produces
 * the same report and a regression shows up in CI rather than in a customer
 * conversation.
 */

import { ADVERTISED_PRICES, PROTECTION_PLANS, TIER_KEY, formatVndFor, type ProtectionPlan } from '../data/groundTruth'
import type { Transcript, Turn } from '../data/transcript'
import { en as enMessages } from '../i18n/locales/en'
import { CHECK_COPY, type CheckCopy, type Locale } from './factCheck.copy'

export type { Locale } from './factCheck.copy'

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

type Format = {
  copy: CheckCopy
  money: (amount: number) => string
  tier: (plan: ProtectionPlan) => string
}

function formatFor(locale: Locale): Format {
  return {
    copy: CHECK_COPY[locale],
    money: (amount) => formatVndFor(amount, locale),
    tier: (plan) => (locale === 'vi' ? plan.tier : enMessages.plans.tiers[TIER_KEY[plan.tier]]),
  }
}

/**
 * The assistant quotes prices above the floor the website advertises, without
 * ever reconciling the two. The customer arrives having seen "from 559,000".
 */
function checkAdvertisedFloor(transcript: Transcript, { copy, money }: Format): CheckResult {
  const advertised = ADVERTISED_PRICES.find((price) => price.key === 'air-conditioned')!
  const quoted = airConditionedQuotes(transcript)
  const lowest = quoted.length ? Math.min(...quoted) : undefined
  const passed = lowest !== undefined && lowest <= advertised.floor
  const gap = lowest === undefined ? 0 : Math.round(((lowest - advertised.floor) / advertised.floor) * 100)
  const text = copy.advertisedFloor

  return {
    id: 'advertised-floor',
    title: text.title,
    severity: 'high',
    passed,
    expected: text.expected(money(advertised.floor), advertised.quote),
    observed:
      lowest === undefined ? text.observedNone : text.observed(money(lowest), gap, quoted.map(money).join(', ')),
    impact: text.impact,
  }
}

/** A published figure the customer asked for directly must appear in the answer. */
function checkLuggageRateDisclosed(transcript: Transcript, { copy, money }: Format): CheckResult {
  const advertised = ADVERTISED_PRICES.find((price) => price.key === 'luggage')!
  const exchange = answerTo(transcript, (text) => /hành lý/i.test(text) && /giá|bao nhiêu|giờ/i.test(text))
  const answer = exchange?.answer?.text ?? ''
  const passed = statesAmount(answer, advertised.floor)
  const text = copy.luggageRate

  return {
    id: 'luggage-rate-disclosed',
    title: text.title,
    severity: 'medium',
    passed,
    expected: text.expected(money(advertised.floor), advertised.quote),
    observed: passed ? text.observedPass : text.observedFail,
    impact: text.impact,
  }
}

/** Protection ceilings are public; the assistant should state them. */
function checkProtectionCapsDisclosed(transcript: Transcript, { copy, money, tier }: Format): CheckResult {
  const upgraded = PROTECTION_PLANS.filter((plan) => plan.tier !== 'Cơ bản')
  const protectionTurns = transcript.turns.filter(
    (turn) => turn.role === 'assistant' && /(Silver|Gold|Platinum|bảo vệ|bảo hiểm)/i.test(turn.text),
  )
  const disclosed = upgraded.filter((plan) =>
    protectionTurns.some((turn) => statesAmount(turn.text, plan.cap)),
  )
  const passed = disclosed.length === upgraded.length
  const text = copy.protectionCaps

  return {
    id: 'protection-caps-disclosed',
    title: text.title,
    severity: 'high',
    passed,
    expected: upgraded.map((plan) => `${tier(plan)} ${money(plan.cap)}`).join(' · '),
    observed: passed ? text.observedPass : text.observedFail(disclosed.length, upgraded.length),
    impact: text.impact,
  }
}

/** A "fully covered" promise has to come with the ceiling it refers to. */
function checkCoverageClaimBacked(transcript: Transcript, { copy, money, tier: tierName }: Format): CheckResult {
  const claimTurn = transcript.turns.find(
    (turn) => turn.role === 'assistant' && /bao quát trọn vẹn|trọn vẹn giá trị|fully cover/i.test(turn.text),
  )
  const tier = claimTurn ? PROTECTION_PLANS.find((plan) => new RegExp(plan.tier, 'i').test(claimTurn.text)) : undefined
  const passed = !claimTurn || (!!tier && statesAmount(claimTurn.text, tier.cap))
  const text = copy.coverageClaim

  return {
    id: 'coverage-claim-backed',
    title: text.title,
    severity: 'high',
    passed,
    expected: tier ? text.expectedTier(tierName(tier), money(tier.cap)) : text.expectedAny,
    observed: passed
      ? text.observedPass
      : text.observedFail(tier ? tierName(tier) : undefined, tier ? money(tier.cap) : ''),
    impact: text.impact,
  }
}

/** The same spec must not change between two turns of one conversation. */
function checkSpecConsistency(transcript: Transcript, { copy }: Format): CheckResult {
  const ranges = new Set<string>()
  for (const line of assistantLines(transcript)) {
    if (!isAirConditionedLine(line)) continue
    for (const [, low, high] of line.matchAll(TEMP_RANGE)) ranges.add(`${low}–${high}°C`)
  }
  const passed = ranges.size <= 1
  const text = copy.specConsistency

  return {
    id: 'spec-consistency',
    title: text.title,
    severity: 'low',
    passed,
    expected: text.expected,
    observed: passed
      ? text.observedPass([...ranges].join(', ') || copy.noneStated)
      : text.observedFail(ranges.size, [...ranges].join(' vs ')),
    impact: text.impact,
  }
}

/** Every question the customer asks gets an answer. */
function checkNoDroppedQuestion(transcript: Transcript, { copy }: Format): CheckResult {
  const dropped = transcript.turns.filter(
    (turn, index) => turn.role === 'user' && transcript.turns[index + 1]?.role === 'user',
  )
  const passed = dropped.length === 0
  const text = copy.droppedQuestion

  return {
    id: 'no-dropped-question',
    title: text.title,
    severity: 'high',
    passed,
    expected: text.expected,
    observed: passed
      ? text.observedPass
      : text.observedFail(dropped.length, dropped.map((turn) => `"${turn.text}"`).join(', ')),
    impact: text.impact,
  }
}

/** Out-of-scope requests must be declined, not invented. */
function checkOutOfScopeDeclined(transcript: Transcript, { copy }: Format): CheckResult {
  const exchange = answerTo(transcript, (text) => /ô tô|xe hơi|\bcar\b/i.test(text))
  const answer = exchange?.answer?.text ?? ''
  const declined = /chưa hỗ trợ|không hỗ trợ|not support|do not offer/i.test(answer)
  const quotedPrice = parseAmounts(answer).length > 0
  const text = copy.outOfScope

  return {
    id: 'out-of-scope-declined',
    title: text.title,
    severity: 'medium',
    passed: declined && !quotedPrice,
    expected: text.expected,
    observed: declined ? text.observedPass : text.observedFail,
    impact: text.impact,
  }
}

/** `locale` only changes the report wording; which checks pass never depends on it. */
export function runChecks(transcript: Transcript, locale: Locale = 'vi'): CheckResult[] {
  const format = formatFor(locale)
  return [
    checkAdvertisedFloor(transcript, format),
    checkNoDroppedQuestion(transcript, format),
    checkProtectionCapsDisclosed(transcript, format),
    checkCoverageClaimBacked(transcript, format),
    checkLuggageRateDisclosed(transcript, format),
    checkSpecConsistency(transcript, format),
    checkOutOfScopeDeclined(transcript, format),
  ]
}
