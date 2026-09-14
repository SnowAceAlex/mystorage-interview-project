/**
 * Scores one model answer against one machine-checkable expectation.
 *
 * Contradiction detection is intentionally narrow: it only flags a REAL
 * MyStorage figure of the same kind (another price, another protection
 * ceiling) stated where a different one was required. It never invents a
 * number to check against, and it cannot detect every way an answer could
 * be wrong — it is a deterministic heuristic, the same tradeoff factCheck.ts
 * makes over the transcript.
 */

import { parseAmounts, statesAmount } from './factCheck'
import { ADVERTISED_PRICES, PROTECTION_PLANS } from '../data/groundTruth'

export type AmountKind = 'price' | 'ceiling'

export type Expectation = {
  id: string
  question: string
  /** Amounts (VNĐ) that must appear somewhere in the answer. */
  requiredAmounts?: number[]
  /** Which groundTruth bucket contradictions are drawn from. */
  amountKind?: AmountKind
  /** Substrings that must appear, case-insensitively. */
  requiredStrings?: string[]
  /** True for out-of-scope requests that must be declined, not answered. */
  mustDecline?: boolean
}

export type GradeResult = {
  passed: boolean
  missing: string[]
  contradictions: string[]
}

const DECLINE_PATTERN = /không hỗ trợ|chưa hỗ trợ|not support|do not offer|cannot store|can't store/i

function amountsForKind(kind: AmountKind): number[] {
  if (kind === 'price') return ADVERTISED_PRICES.map((price) => price.floor)
  return PROTECTION_PLANS.map((plan) => plan.cap)
}

export function grade(answer: string, expectation: Expectation): GradeResult {
  const missing: string[] = []
  const contradictions: string[] = []

  for (const amount of expectation.requiredAmounts ?? []) {
    if (!statesAmount(answer, amount)) missing.push(`amount ${amount}`)
  }

  for (const needle of expectation.requiredStrings ?? []) {
    if (!answer.toLowerCase().includes(needle.toLowerCase())) missing.push(`string "${needle}"`)
  }

  if (expectation.amountKind) {
    const required = new Set(expectation.requiredAmounts ?? [])
    const distractors = amountsForKind(expectation.amountKind).filter((amount) => !required.has(amount))
    const stated = new Set(parseAmounts(answer))
    for (const distractor of distractors) {
      if (stated.has(distractor)) contradictions.push(`stated ${distractor} instead of the correct figure`)
    }
  }

  if (expectation.mustDecline) {
    const declined = DECLINE_PATTERN.test(answer)
    const invented = parseAmounts(answer).length > 0
    if (!declined) missing.push('a decline')
    if (invented) contradictions.push('invented a price for an out-of-scope request')
  }

  return { passed: missing.length === 0 && contradictions.length === 0, missing, contradictions }
}
