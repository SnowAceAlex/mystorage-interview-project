# Live Grounded-vs-Baseline Prompt Eval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static before/after mockup with a live path — ask a real question, get two real model answers (ungrounded vs. grounded system prompt), and a 15-question graded test set that reports the measured gap between them.

**Architecture:** A pure data/logic core (`prompts.ts`, `provider.ts`, `grader.ts`, `testset.ts`) with zero framework dependencies, wrapped by a minimal Node `http` server (`src/server/index.ts`) that the existing Vite React frontend talks to over `/api/ask` and `/api/eval`. The existing static transcript-audit evidence (`factCheck.ts`, `EvalPanel`) is untouched and stays below the new live demo.

**Tech Stack:** TypeScript, Vite, React 18, Node 22 built-ins (`http`, `process.loadEnvFile`, global `fetch`), Node's built-in test runner (`node:test` via `tsx --test`), `concurrently` (new devDependency, dev orchestration only). No API framework, no `dotenv`, no test framework beyond `node:test`.

## Global Constraints

- No network calls to stow.mystorage.vn from this app, ever.
- Never fabricate a MyStorage figure, a score, or an eval result — in code, README, or UI.
- `BASELINE_SYSTEM_PROMPT` must be labelled, in a code comment and in the UI, as a reconstruction of an ungrounded assistant — not MyStorage's real system prompt (unavailable to this project).
- Every surface that can show mock output (CLI eval, `/api/ask`, `/api/eval`, the UI) must visibly warn when `PROVIDER=mock`. Mock output must never be the only thing shown unlabelled, and never feeds README/FINDINGS content or a reported score.
- `npm run typecheck` (`tsc --noEmit`) must stay clean after every task.
- The Gemini API key must never reach the client — all model calls happen server-side.
- Reuse `parseAmounts` / `statesAmount` from `src/lib/factCheck.ts` in `grader.ts`; do not write a second number parser.
- Env loading uses Node's built-in `process.loadEnvFile('.env')` (Node 22) — no `dotenv` dependency.
- `.env*` stays gitignored (already true; verify, don't relax).

---

### Task 1: Extend groundTruth.ts with the facts the testset needs

**Files:**
- Modify: `src/data/groundTruth.ts`

**Interfaces:**
- Consumes: nothing new (existing `ADVERTISED_PRICES`, `PROTECTION_PLANS`, `SOURCE`, `formatVnd`, `planFor` are untouched).
- Produces: `CompanyFact` type, `COMPANY_FACTS: CompanyFact[]`, `UNIT_SIZE_RANGE: { min: number; max: number; unit: string; quote: string }`, `WINE_STORAGE: { tempLow: number; tempHigh: number; humidityLow: number; humidityHigh: number; quote: string }` — all consumed by `prompts.ts` (Task 2) and `testset.ts` (Task 4).

- [ ] **Step 1: Append the new exports to `src/data/groundTruth.ts`**

Add this block at the end of the file, after `formatVnd`. Every `quote` is copied verbatim from `llms.txt` (repo root, already fetched from `https://mystorage.vn/llms.txt`, verified 2026-09-13):

```ts
export type CompanyFact = {
  key: string
  label: string
  value: string
  quote: string
}

/** Company facts a customer might ask about directly, copied from llms.txt. */
export const COMPANY_FACTS: CompanyFact[] = [
  {
    key: 'founded',
    label: 'Năm thành lập & quản lý',
    value: 'Thành lập năm 2019, dưới sự quản lý của đội ngũ Mỹ và Đức.',
    quote:
      'Founded 2019, under US and German management; official member of the Self Storage Association of Asia (SSAA) and the American Chamber of Commerce in Vietnam.',
  },
  {
    key: 'headquarters',
    label: 'Trụ sở chính',
    value: '375 Võ Nguyên Giáp, Phường An Khánh, Thành phố Thủ Đức, TP. Hồ Chí Minh.',
    quote: 'Headquarters: 375 Vo Nguyen Giap Street, An Khanh Ward, Thu Duc City, Ho Chi Minh City, Vietnam.',
  },
  {
    key: 'phone',
    label: 'Số điện thoại',
    value: '028 7770 0117 (+84 28 7770 0117)',
    quote: 'Phone: 028 7770 0117 (+84 28 7770 0117). Email: hello@mystorage.vn.',
  },
  {
    key: 'reply-time',
    label: 'Thời gian phản hồi',
    value: 'Hỗ trợ Thứ Hai–Thứ Bảy, 9h–18h (Chủ nhật hỗ trợ từ xa); phản hồi trong khoảng 2 giờ trong giờ làm việc.',
    quote:
      'Support hours: Monday–Saturday, 9am–6pm (remote support on Sundays); typical reply time is 2 hours during business hours.',
  },
  {
    key: 'reviews',
    label: 'Đánh giá khách hàng',
    value: 'Hơn 650 đánh giá 5 sao từ khách hàng đã xác thực trên Google.',
    quote: '650+ five-star reviews from verified customers on Google.',
  },
  {
    key: 'locations-count',
    label: 'Số lượng cơ sở',
    value: '8 cơ sở tại TP.HCM và Đồng Nai.',
    quote:
      'MyStorage is a self-storage and full-service storage company in Ho Chi Minh City, Vietnam, founded in 2019 under US and German management, with 8 facilities across HCMC and Dong Nai.',
  },
  {
    key: 'languages',
    label: 'Ngôn ngữ website',
    value: 'Tiếng Anh, Tiếng Việt, Tiếng Hàn, Tiếng Nhật.',
    quote: 'What languages is the MyStorage website available in? A: English, Vietnamese, Korean, and Japanese.',
  },
  {
    key: 'booking',
    label: 'Cách đặt kho',
    value: 'Đặt online tại booking.mystorage.vn, hoặc liên hệ qua điện thoại/email/messenger.',
    quote: 'Booking: https://booking.mystorage.vn/en/book?step=service — book online, or contact by phone/email/messenger.',
  },
  {
    key: 'self-vs-full-service',
    label: 'Khác biệt Self Storage và Full Service Storage',
    value:
      'Self Storage: khách tự ra vào kho riêng bất cứ lúc nào. Full Service: nhân viên MyStorage lấy, lưu trữ và trả đồ, khách không cần đến kho.',
    quote:
      "Self Storage gives customers a private unit they can access directly and independently, any time. Full Service Storage is pickup-and-delivery: MyStorage staff retrieve, store, and return items, so the customer never has to visit a facility themselves.",
  },
]

/** Self-storage unit size range, from the Self Storage service page and Size Guide. */
export const UNIT_SIZE_RANGE = {
  min: 1,
  max: 23,
  unit: 'CBM',
  quote: 'Private, air-conditioned self-storage units from 1–23 CBM with 24/7 access; 480+ units across HCMC.',
}

/** Wine storage climate spec, from the Wine Storage page. */
export const WINE_STORAGE = {
  tempLow: 12,
  tempHigh: 15,
  humidityLow: 60,
  humidityHigh: 70,
  quote: 'Wine Storage: Climate-controlled at 12–15°C and 60–70% humidity, 24/7 access.',
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/groundTruth.ts
git commit -m "$(cat <<'EOF'
Extend groundTruth.ts with company facts, unit sizes, wine storage spec

Everything the new prompt testset needs beyond prices and protection
plans, copied verbatim from llms.txt with source quotes attached.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: prompts.ts — baseline and grounded system prompts

**Files:**
- Create: `src/lib/prompts.ts`
- Test: `src/lib/prompts.test.ts`

**Interfaces:**
- Consumes: `ADVERTISED_PRICES`, `PROTECTION_PLANS`, `SOURCE`, `formatVnd` from `../data/groundTruth` (existing), `COMPANY_FACTS`, `UNIT_SIZE_RANGE`, `WINE_STORAGE` from Task 1.
- Produces: `BASELINE_SYSTEM_PROMPT: string`, `groundedSystemPrompt(): string` — consumed by `provider.ts` callers in Tasks 7 and 8, and by the frontend's honesty copy in Task 9.

- [ ] **Step 1: Write the failing test**

Create `src/lib/prompts.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/lib/prompts.test.ts`
Expected: FAIL — `Cannot find module './prompts'`.

- [ ] **Step 3: Write `src/lib/prompts.ts`**

```ts
import {
  ADVERTISED_PRICES,
  COMPANY_FACTS,
  PROTECTION_PLANS,
  SOURCE,
  UNIT_SIZE_RANGE,
  WINE_STORAGE,
  formatVnd,
} from '../data/groundTruth'

/**
 * A RECONSTRUCTION of a plausible ungrounded MyStorage assistant prompt —
 * NOT the real stow.mystorage.vn system prompt, which this project has no
 * access to. It exists to demonstrate the class of error ungrounded
 * prompting produces, not to reproduce their assistant.
 */
export const BASELINE_SYSTEM_PROMPT = `Bạn là trợ lý ảo của MyStorage, một công ty lưu trữ kho tự quản (self storage) và lưu trữ trọn gói (full-service storage) tại Việt Nam.

Vai trò của bạn:
- Trả lời câu hỏi của khách hàng về dịch vụ lưu trữ một cách thân thiện, chuyên nghiệp và ngắn gọn.
- Ưu tiên trả lời bằng tiếng Việt trừ khi khách hàng hỏi bằng tiếng Anh, thì trả lời bằng tiếng Anh.
- Xưng "em", gọi khách là "anh/chị".
- Nếu không chắc chắn về một dịch vụ hoặc mức giá, vẫn cố gắng đưa ra câu trả lời hữu ích nhất có thể dựa trên hiểu biết chung về ngành lưu trữ.`

function serializeFactsBlock(): string {
  const prices = ADVERTISED_PRICES.map(
    (price) => `- ${price.service}: từ ${formatVnd(price.floor)}/${price.unit === 'VNĐ/giờ' ? 'giờ' : 'tháng'}`,
  ).join('\n')

  const plans = PROTECTION_PLANS.map((plan) => {
    const cap = `bồi thường tối đa ${formatVnd(plan.cap)}`
    const perCbm = plan.perCbm ? `, ${formatVnd(plan.perCbm)}/m³` : ''
    return `- ${plan.tier} (${plan.price}): ${cap}${perCbm}`
  }).join('\n')

  const facts = COMPANY_FACTS.map((fact) => `- ${fact.label}: ${fact.value}`).join('\n')

  return `## Bảng giá dịch vụ (nguồn: ${SOURCE.label}, xác minh ${SOURCE.verifiedAt})
${prices}

## Hạn mức các gói bảo vệ (Protection Plan)
${plans}

## Kích thước kho
Kho tự quản có kích thước từ ${UNIT_SIZE_RANGE.min} đến ${UNIT_SIZE_RANGE.max} ${UNIT_SIZE_RANGE.unit}.

## Kho lưu trữ rượu vang
Nhiệt độ duy trì ${WINE_STORAGE.tempLow}–${WINE_STORAGE.tempHigh}°C, độ ẩm ${WINE_STORAGE.humidityLow}–${WINE_STORAGE.humidityHigh}%.

## Thông tin công ty
${facts}

## Dịch vụ KHÔNG cung cấp
MyStorage không nhận lưu trữ ô tô. Kho chỉ dành cho đồ gia dụng, nội thất, hành lý, hồ sơ và hàng hóa kinh doanh, để đảm bảo tiêu chuẩn phòng cháy chữa cháy (PCCC).`
}

/**
 * Same role and tone as the baseline, plus every figure the assistant is
 * allowed to state and an explicit instruction not to estimate beyond it.
 */
export function groundedSystemPrompt(): string {
  return `${BASELINE_SYSTEM_PROMPT}

Dưới đây là toàn bộ số liệu bạn được phép sử dụng. QUY TẮC BẮT BUỘC: chỉ nêu một con số nếu nó xuất hiện trong bảng dưới đây. Nếu khách hỏi một con số không có trong bảng, hãy nói rõ là bạn không có thông tin đó thay vì ước tính hoặc suy đoán.

${serializeFactsBlock()}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/lib/prompts.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/prompts.ts src/lib/prompts.test.ts
git commit -m "$(cat <<'EOF'
Add baseline and grounded system prompts

BASELINE_SYSTEM_PROMPT is a labelled reconstruction with no MyStorage
data. groundedSystemPrompt() adds a facts block serialized from
groundTruth.ts plus a rule against stating anything not in it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: grader.ts — score an answer against an expectation

**Files:**
- Create: `src/lib/grader.ts`
- Test: `src/lib/grader.test.ts`

**Interfaces:**
- Consumes: `parseAmounts`, `statesAmount` from `./factCheck` (existing), `ADVERTISED_PRICES`, `PROTECTION_PLANS` from `../data/groundTruth` (existing).
- Produces: `type AmountKind = 'price' | 'ceiling'`, `type Expectation = { id: string; question: string; requiredAmounts?: number[]; amountKind?: AmountKind; requiredStrings?: string[]; mustDecline?: boolean }`, `type GradeResult = { passed: boolean; missing: string[]; contradictions: string[] }`, `grade(answer: string, expectation: Expectation): GradeResult` — consumed by `testset.ts` (Task 4, via `Expectation`), `server/index.ts` (Task 7), `runPromptEval.ts` (Task 8), and the frontend (Task 9).

- [ ] **Step 1: Write the failing test**

Create `src/lib/grader.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/lib/grader.test.ts`
Expected: FAIL — `Cannot find module './grader'`.

- [ ] **Step 3: Write `src/lib/grader.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/lib/grader.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/grader.ts src/lib/grader.test.ts
git commit -m "$(cat <<'EOF'
Add grader.ts to score answers against machine-checkable expectations

Reuses parseAmounts/statesAmount from factCheck.ts. Contradictions are
drawn from real groundTruth values only — never an invented number.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: testset.ts — 15 graded questions

**Files:**
- Create: `src/data/testset.ts`
- Test: `src/data/testset.test.ts`

**Interfaces:**
- Consumes: `Expectation` type from `../lib/grader` (Task 3).
- Produces: `TESTSET: Expectation[]` (exactly 15 entries, unique `id`s) — consumed by `server/index.ts` (Task 7) and `runPromptEval.ts` (Task 8).

- [ ] **Step 1: Write the failing test**

Create `src/data/testset.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/data/testset.test.ts`
Expected: FAIL — `Cannot find module './testset'`.

- [ ] **Step 3: Write `src/data/testset.ts`**

```ts
/**
 * 15 questions, every expectation traceable to llms.txt (repo root,
 * fetched from https://mystorage.vn/llms.txt) or src/data/groundTruth.ts.
 * No fact here is invented — see grader.ts for how each is checked.
 */

import type { Expectation } from '../lib/grader'

export const TESTSET: Expectation[] = [
  {
    id: 'ac-floor-price',
    question: 'Storage máy lạnh giá bao nhiêu/tháng?',
    requiredAmounts: [559_000],
    amountKind: 'price',
  },
  {
    id: 'luggage-hourly-rate',
    question: 'Gửi hành lý theo giờ giá bao nhiêu?',
    requiredAmounts: [54_000],
    amountKind: 'price',
  },
  {
    id: 'protection-ceilings',
    question: 'Các gói bảo vệ Cơ bản, Silver, Gold, Platinum có hạn mức bồi thường bao nhiêu?',
    requiredAmounts: [10_000_000, 25_000_000, 50_000_000, 100_000_000],
    amountKind: 'ceiling',
  },
  {
    id: 'declared-value-20m',
    question: 'Tôi khai báo giá trị đồ đạc khoảng 20.000.000 VNĐ thì nên chọn gói bảo vệ nào?',
    requiredAmounts: [25_000_000],
    requiredStrings: ['Silver'],
    amountKind: 'ceiling',
  },
  {
    id: 'unit-size-range',
    question: 'Kho tự quản có những kích thước nào?',
    requiredStrings: ['1', '23', 'CBM'],
  },
  {
    id: 'wine-storage-spec',
    question: 'Kho lưu trữ rượu vang duy trì nhiệt độ và độ ẩm bao nhiêu?',
    requiredStrings: ['12', '15', '60', '70'],
  },
  {
    id: 'out-of-scope-car',
    question: 'Tôi gửi xe ô tô của tôi được không nhỉ?',
    mustDecline: true,
  },
  {
    id: 'company-founded',
    question: 'MyStorage thành lập năm nào và ai quản lý?',
    requiredStrings: ['2019'],
  },
  {
    id: 'company-headquarters',
    question: 'Trụ sở chính của MyStorage ở đâu?',
    requiredStrings: ['375'],
  },
  {
    id: 'company-phone',
    question: 'Số điện thoại liên hệ của MyStorage là gì?',
    requiredStrings: ['7770 0117'],
  },
  {
    id: 'company-reply-time',
    question: 'MyStorage phản hồi khách hàng trong khoảng thời gian bao lâu?',
    requiredStrings: ['2 giờ'],
  },
  {
    id: 'company-reviews',
    question: 'MyStorage có bao nhiêu đánh giá 5 sao trên Google?',
    requiredStrings: ['650'],
  },
  {
    id: 'booking-method',
    question: 'Làm sao để đặt kho lưu trữ tại MyStorage?',
    requiredStrings: ['booking.mystorage.vn'],
  },
  {
    id: 'languages-supported',
    question: 'Website MyStorage hỗ trợ những ngôn ngữ nào?',
    requiredStrings: ['Hàn', 'Nhật'],
  },
  {
    id: 'self-vs-full-service',
    question: 'Sự khác biệt giữa Self Storage và Full Service Storage là gì?',
    requiredStrings: ['nhân viên'],
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/data/testset.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/testset.ts src/data/testset.test.ts
git commit -m "$(cat <<'EOF'
Add 15-question graded testset

Covers AC/luggage pricing, all four protection ceilings, the correct
plan for a 20M declared value, unit sizes, wine storage spec, one
out-of-scope decline, and 5+ company facts — every expectation traces
to llms.txt or groundTruth.ts.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: concurrency.ts — small in-house concurrency limiter

**Files:**
- Create: `src/lib/concurrency.ts`
- Test: `src/lib/concurrency.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]>` — consumed by `server/index.ts` (Task 7) and `runPromptEval.ts` (Task 8) to cap concurrent Gemini calls at ~4.

- [ ] **Step 1: Write the failing test**

Create `src/lib/concurrency.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/lib/concurrency.test.ts`
Expected: FAIL — `Cannot find module './concurrency'`.

- [ ] **Step 3: Write `src/lib/concurrency.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/lib/concurrency.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/concurrency.ts src/lib/concurrency.test.ts
git commit -m "$(cat <<'EOF'
Add mapWithConcurrency helper

Small in-house concurrency limiter so the eval endpoint and CLI can
cap concurrent Gemini calls (~4) without a dependency.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: provider.ts — ask() over Gemini REST, mock mode, model listing

**Files:**
- Create: `src/lib/loadEnv.ts`
- Create: `src/lib/provider.ts`
- Create: `src/scripts/listModels.ts`
- Modify: `package.json` (add `models` script)

**Interfaces:**
- Consumes: `process.env.PROVIDER`, `process.env.GEMINI_API_KEY`, `process.env.GEMINI_MODEL`.
- Produces: `type AskFn = (systemPrompt: string, question: string) => Promise<string>`, `ask: AskFn`, `isMockProvider(): boolean` — consumed by `server/index.ts` (Task 7) and `runPromptEval.ts` (Task 8).

- [ ] **Step 1: Write `src/lib/loadEnv.ts`**

```ts
/**
 * Loads .env into process.env before anything reads GEMINI_API_KEY /
 * GEMINI_MODEL / PROVIDER. Uses Node's built-in loader (Node >=20.6) —
 * no dotenv dependency. Must be imported before any process.env read.
 */
try {
  process.loadEnvFile('.env')
} catch {
  // .env is optional — PROVIDER=mock and CI runs don't need one.
}
```

- [ ] **Step 2: Write `src/lib/provider.ts`**

```ts
/**
 * ask() is the one place this app talks to a model. PROVIDER selects the
 * backend; everything else in the app is provider-agnostic.
 */
import './loadEnv'

export type AskFn = (systemPrompt: string, question: string) => Promise<string>

const PROVIDER = process.env.PROVIDER ?? 'gemini'
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

const MOCK_WARNING = '⚠️  MOCK PROVIDER — not real results, wiring test only  ⚠️'

/** Mock answers are for wiring tests only — never a source for README/FINDINGS/scores. */
function mockAnswer(systemPrompt: string, question: string): string {
  console.warn(MOCK_WARNING)
  const grounded = systemPrompt.includes('QUY TắC BẮT BUỘC')
  return grounded
    ? `[MOCK-GROUNDED] Đây là câu trả lời giả lập cho: "${question}"`
    : `[MOCK-BASELINE] Đây là câu trả lời giả lập cho: "${question}"`
}

async function geminiAnswer(systemPrompt: string, question: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Copy .env.example to .env and add your key, or set PROVIDER=mock.')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${body}`)
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
  if (!text) throw new Error(`Gemini returned no text. Raw response: ${JSON.stringify(data)}`)
  return text
}

export function isMockProvider(): boolean {
  return PROVIDER === 'mock'
}

export const ask: AskFn =
  PROVIDER === 'mock' ? async (systemPrompt, question) => mockAnswer(systemPrompt, question) : geminiAnswer
```

Note: the two Vietnamese strings above use explicit `\u` escapes for "QUY TẮC BẮT BUỘC", "Đây là câu trả lời giả lập cho", and the warning emoji/wording — this avoids any editor/encoding ambiguity when the file is created. Write them as literal UTF-8 Vietnamese text instead if your editor round-trips UTF-8 reliably; either is correct, they must just match the literal text `QUY TẮC BẮT BUỘC` that appears in `groundedSystemPrompt()` (Task 2).

- [ ] **Step 3: Write `src/scripts/listModels.ts`**

```ts
/**
 * Lists the Gemini models the configured GEMINI_API_KEY can access, so a
 * wrong GEMINI_MODEL is a one-command debug.
 *
 *   npm run models
 */
import '../lib/loadEnv'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.')
  process.exit(1)
}

const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
if (!response.ok) {
  console.error(`Gemini API error ${response.status}: ${await response.text()}`)
  process.exit(1)
}

const data = (await response.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] }
for (const model of data.models ?? []) {
  const methods = (model.supportedGenerationMethods ?? []).join(', ')
  console.log(`${model.name}  [${methods}]`)
}
```

- [ ] **Step 4: Add the `models` script to `package.json`**

In `package.json`, in `"scripts"`, add (after `"eval"`):

```json
    "models": "tsx src/scripts/listModels.ts",
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manually verify the mock path (no API key needed)**

Run (Git Bash / POSIX shell):
```bash
PROVIDER=mock npx tsx -e "import('./src/lib/provider.ts').then(async (m) => console.log(await m.ask('test', 'hello')))"
```
Expected: prints the MOCK warning to stderr and `[MOCK-BASELINE] ...` to stdout.

- [ ] **Step 7: Manually verify `npm run models` against the real key**

Run: `npm run models`
Expected: a list of `models/...` names with `[generateContent, ...]` methods. If `GEMINI_MODEL` (default `gemini-2.0-flash`) doesn't appear in the list, note it — Task 11's verification pass depends on a working model name.

- [ ] **Step 8: Commit**

```bash
git add src/lib/loadEnv.ts src/lib/provider.ts src/scripts/listModels.ts package.json
git commit -m "$(cat <<'EOF'
Add provider.ts: ask() over Gemini REST, mock mode, model listing

PROVIDER=gemini|mock (default gemini). Gemini via plain REST, no SDK.
Mock is wiring-test-only and always prints a loud warning. npm run
models lists what the configured key can access.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: server/index.ts — /api/ask, /api/eval, static serving

**Files:**
- Create: `src/server/index.ts`
- Modify: `package.json` (add `start` script)

**Interfaces:**
- Consumes: `ask`, `isMockProvider` from `../lib/provider` (Task 6); `BASELINE_SYSTEM_PROMPT`, `groundedSystemPrompt` from `../lib/prompts` (Task 2); `grade` from `../lib/grader` (Task 3); `TESTSET` from `../data/testset` (Task 4); `mapWithConcurrency` from `../lib/concurrency` (Task 5).
- Produces: an HTTP server on `process.env.PORT ?? 8787` — `POST /api/ask {question: string}` → `{baseline: {answer, grade}, grounded: {answer, grade}, mock}`; `POST /api/eval` → `{rows, totals: {baseline, grounded, total}, mock}`; serves `dist/` for everything else. Consumed by the frontend (Task 9) via `fetch('/api/ask' | '/api/eval')`.

- [ ] **Step 1: Write `src/server/index.ts`**

```ts
import { createServer, type IncomingMessage } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { ask, isMockProvider } from '../lib/provider'
import { BASELINE_SYSTEM_PROMPT, groundedSystemPrompt } from '../lib/prompts'
import { grade } from '../lib/grader'
import { TESTSET } from '../data/testset'
import { mapWithConcurrency } from '../lib/concurrency'

const PORT = Number(process.env.PORT ?? 8787)
const DIST_DIR = join(process.cwd(), 'dist')

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf-8')
  return raw ? JSON.parse(raw) : {}
}

function matchExpectation(question: string) {
  return TESTSET.find((expectation) => expectation.question === question)
}

async function answerBoth(question: string) {
  const [baselineAnswer, groundedAnswer] = await Promise.all([
    ask(BASELINE_SYSTEM_PROMPT, question),
    ask(groundedSystemPrompt(), question),
  ])
  const expectation = matchExpectation(question)
  return {
    baseline: { answer: baselineAnswer, grade: expectation ? grade(baselineAnswer, expectation) : null },
    grounded: { answer: groundedAnswer, grade: expectation ? grade(groundedAnswer, expectation) : null },
    mock: isMockProvider(),
  }
}

async function runEval() {
  const rows = await mapWithConcurrency(TESTSET, 4, async (expectation) => {
    const [baselineAnswer, groundedAnswer] = await Promise.all([
      ask(BASELINE_SYSTEM_PROMPT, expectation.question),
      ask(groundedSystemPrompt(), expectation.question),
    ])
    return {
      id: expectation.id,
      question: expectation.question,
      baseline: { answer: baselineAnswer, grade: grade(baselineAnswer, expectation) },
      grounded: { answer: groundedAnswer, grade: grade(groundedAnswer, expectation) },
    }
  })

  const totals = {
    baseline: rows.filter((row) => row.baseline.grade.passed).length,
    grounded: rows.filter((row) => row.grounded.grade.passed).length,
    total: rows.length,
  }

  return { rows, totals, mock: isMockProvider() }
}

async function serveStatic(pathname: string): Promise<{ body: Buffer; type: string } | undefined> {
  const filePath = join(DIST_DIR, pathname === '/' ? 'index.html' : pathname)
  try {
    const body = await readFile(filePath)
    return { body, type: CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream' }
  } catch {
    try {
      const body = await readFile(join(DIST_DIR, 'index.html'))
      return { body, type: CONTENT_TYPES['.html'] }
    } catch {
      return undefined
    }
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

    if (req.method === 'POST' && url.pathname === '/api/ask') {
      const body = (await readJsonBody(req)) as { question?: string }
      if (!body.question) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'question is required' }))
        return
      }
      const result = await answerBoth(body.question)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/eval') {
      const result = await runEval()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
      return
    }

    const file = await serveStatic(url.pathname)
    if (file) {
      res.writeHead(200, { 'Content-Type': file.type })
      res.end(file.body)
      return
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
  }
})

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}${isMockProvider() ? ' (PROVIDER=mock)' : ''}`)
})
```

- [ ] **Step 2: Add the `start` script to `package.json`**

In `"scripts"`, add (after `"preview"`):

```json
    "start": "tsx src/server/index.ts",
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify the server with PROVIDER=mock**

Run in one terminal: `PROVIDER=mock npm start`
Expected: `Server listening on http://localhost:8787 (PROVIDER=mock)`.

In another terminal:
```bash
curl -s -X POST http://localhost:8787/api/ask -H "Content-Type: application/json" -d '{"question":"Storage máy lạnh giá bao nhiêu/tháng?"}'
```
Expected: JSON with `baseline.answer` starting `[MOCK-BASELINE]`, `grounded.answer` starting `[MOCK-GROUNDED]`, both `grade` non-null (the question matches `ac-floor-price` in the testset), `mock: true`.

```bash
curl -s -X POST http://localhost:8787/api/eval
```
Expected: JSON with `rows.length === 15` and `totals.total === 15`. Stop the server (Ctrl+C) once verified.

- [ ] **Step 5: Commit**

```bash
git add src/server/index.ts package.json
git commit -m "$(cat <<'EOF'
Add API server: POST /api/ask, POST /api/eval, static dist/ serving

Built-in http, no framework. Concurrency-limited eval endpoint. The
Gemini key never leaves the server — only answers and grades do.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: runPromptEval.ts CLI + rename the transcript eval script

**Files:**
- Create: `src/evals/runPromptEval.ts`
- Modify: `package.json` (rename `eval` script, add `eval:transcript`)

**Interfaces:**
- Consumes: `ask`, `isMockProvider` from `../lib/provider` (Task 6); `BASELINE_SYSTEM_PROMPT`, `groundedSystemPrompt` from `../lib/prompts` (Task 2); `grade` from `../lib/grader` (Task 3); `TESTSET` from `../data/testset` (Task 4); `mapWithConcurrency` from `../lib/concurrency` (Task 5).
- Produces: a CLI (`npm run eval`) that prints a per-question table and two totals, exit code non-zero unless every grounded question passes.

- [ ] **Step 1: Write `src/evals/runPromptEval.ts`**

```ts
/**
 * Runs the 15-question test set through both the baseline and grounded
 * system prompts and prints a per-question table plus two totals.
 *
 *   npm run eval
 *
 * Exit code is non-zero unless every grounded-prompt answer passes, so
 * this can sit in CI the same way npm run eval:transcript does.
 */

import { ask, isMockProvider } from '../lib/provider'
import { BASELINE_SYSTEM_PROMPT, groundedSystemPrompt } from '../lib/prompts'
import { grade } from '../lib/grader'
import { TESTSET } from '../data/testset'
import { mapWithConcurrency } from '../lib/concurrency'

const color = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
}

async function main() {
  if (isMockProvider()) {
    console.log(
      `${color.yellow}${color.bold}⚠️  PROVIDER=mock — kết quả dưới đây KHÔNG phải câu trả lời thật.${color.reset}\n`,
    )
  }

  const rows = await mapWithConcurrency(TESTSET, 4, async (expectation) => {
    const [baselineAnswer, groundedAnswer] = await Promise.all([
      ask(BASELINE_SYSTEM_PROMPT, expectation.question),
      ask(groundedSystemPrompt(), expectation.question),
    ])
    return {
      expectation,
      baseline: grade(baselineAnswer, expectation),
      grounded: grade(groundedAnswer, expectation),
    }
  })

  for (const row of rows) {
    const b = row.baseline.passed ? `${color.green}PASS${color.reset}` : `${color.red}FAIL${color.reset}`
    const g = row.grounded.passed ? `${color.green}PASS${color.reset}` : `${color.red}FAIL${color.reset}`
    console.log(row.expectation.id)
    console.log(
      `  ${color.dim}ungrounded${color.reset} ${b}` +
        (row.baseline.passed ? '' : ` — ${[...row.baseline.missing, ...row.baseline.contradictions].join('; ')}`),
    )
    console.log(
      `  ${color.dim}grounded  ${color.reset} ${g}` +
        (row.grounded.passed ? '' : ` — ${[...row.grounded.missing, ...row.grounded.contradictions].join('; ')}`),
    )
  }

  const baselineTotal = rows.filter((row) => row.baseline.passed).length
  const groundedTotal = rows.filter((row) => row.grounded.passed).length

  console.log(
    `\n${color.bold}ungrounded ${baselineTotal}/${rows.length}${color.reset}  vs  ${color.bold}grounded ${groundedTotal}/${rows.length}${color.reset}\n`,
  )

  process.exit(groundedTotal === rows.length ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

- [ ] **Step 2: Update `package.json` scripts**

Change:
```json
    "eval": "tsx src/evals/run.ts",
```
to:
```json
    "eval": "tsx src/evals/runPromptEval.ts",
    "eval:transcript": "tsx src/evals/run.ts",
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify with PROVIDER=mock**

Run: `PROVIDER=mock npm run eval`
Expected: the mock warning banner, 15 question blocks each showing `ungrounded` and `grounded` PASS/FAIL, a final `ungrounded X/15 vs grounded Y/15` line. Exit code non-zero is fine here — mock answers aren't designed to pass the grader, this step is only checking the pipeline runs end to end.

Run: `npm run eval:transcript`
Expected: unchanged from before this plan — `1/7 đạt` against the captured transcript (this is the pre-existing check; confirms the rename didn't break it).

- [ ] **Step 5: Commit**

```bash
git add src/evals/runPromptEval.ts package.json
git commit -m "$(cat <<'EOF'
Add prompt testset CLI runner, rename old eval to eval:transcript

npm run eval now runs the 15-question testset through both prompts.
npm run eval:transcript keeps running the original transcript checks.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Frontend — ask box, score table, ProtectionPlanCard wiring

**Files:**
- Create: `src/components/Chat.tsx`
- Create: `src/components/AskPanel.tsx`
- Create: `src/components/EvalRunner.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: `GradeResult` type from `../lib/grader` (Task 3); `ProtectionPlanCard` (existing, unmodified); the `/api/ask` and `/api/eval` JSON shapes produced by Task 7.
- Produces: `Bubble`, `ColumnLabel` React components (`Chat.tsx`, replacing the ones currently inlined in `App.tsx`); default-exported `AskPanel`, `EvalRunner` components, rendered from `App.tsx`.

- [ ] **Step 1: Extract shared chat components into `src/components/Chat.tsx`**

```tsx
import type { ReactNode } from 'react'

export function Bubble({ role, children }: { role: 'user' | 'assistant'; children: ReactNode }) {
  return <div className={role === 'user' ? 'bubble user' : 'bubble'}>{children}</div>
}

export function ColumnLabel({ tone, children }: { tone: 'bad' | 'good'; children: ReactNode }) {
  return (
    <div className="column-label">
      <span className={tone === 'good' ? 'dot good' : 'dot'} />
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Remove the inlined `Bubble`/`ColumnLabel` from `src/App.tsx` and import from `Chat.tsx`**

Replace lines 1–23 of `src/App.tsx` (the import block through the end of the inlined `ColumnLabel` function) with:

```tsx
import AskPanel from './components/AskPanel'
import EvalRunner from './components/EvalRunner'
import EvalPanel from './components/EvalPanel'
import PricingFactCard from './components/PricingFactCard'
import ProtectionPlanCard from './components/ProtectionPlanCard'
import { Bubble, ColumnLabel } from './components/Chat'
import { AUDIT_TRANSCRIPT } from './data/transcript'
import { SOURCE } from './data/groundTruth'
import { airConditionedQuotes } from './lib/factCheck'

const lowestAcQuote = airConditionedQuotes(AUDIT_TRANSCRIPT)[0] ?? 0
```

- [ ] **Step 3: Write `src/components/AskPanel.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { Bubble, ColumnLabel } from './Chat'
import ProtectionPlanCard from './ProtectionPlanCard'
import type { GradeResult } from '../lib/grader'

const PROTECTION_KEYWORDS = /silver|gold|platinum|bảo hiểm|bảo vệ|protection|insurance/i

type SideResult = { answer: string; grade: GradeResult | null }
type AskResponse = { baseline: SideResult; grounded: SideResult; mock: boolean }

function GradeChips({ grade }: { grade: GradeResult | null }) {
  if (!grade) return null
  if (grade.passed) return <span className="pill pass">PASS</span>
  return (
    <div className="check-head">
      <span className="pill">FAIL</span>
      {[...grade.missing, ...grade.contradictions].map((item) => (
        <span key={item} className="severity">
          {item}
        </span>
      ))}
    </div>
  )
}

export default function AskPanel() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<AskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (!response.ok) throw new Error(`Server trả lỗi ${response.status}`)
      setResult((await response.json()) as AskResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const showProtectionCard = PROTECTION_KEYWORDS.test(question)

  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">Demo trực tiếp</span>
        <h2>Hỏi một câu, xem hai câu trả lời</h2>
        <p>
          Cùng một câu hỏi, gửi tới cùng một model với hai system prompt khác nhau: một không có dữ
          liệu gì (bản tái tạo của tôi cho một trợ lý chưa được "ground" — không phải prompt thật của
          MyStorage, tôi không có quyền truy cập vào đó), một có bảng số liệu từ <code>groundTruth.ts</code>.
        </p>
      </div>

      {result?.mock && (
        <div className="notice">
          <span>MOCK PROVIDER — đây không phải câu trả lời thật từ model, chỉ để kiểm tra kết nối.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="askbox">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="VD: Gói bảo hiểm Silver bồi thường tối đa bao nhiêu?"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Đang hỏi…' : 'Hỏi'}
        </button>
      </form>

      {error && <div className="notice">{error}</div>}

      {result && (
        <div className="compare">
          <div>
            <ColumnLabel tone="bad">Ungrounded</ColumnLabel>
            <Bubble role="assistant">
              <p>{result.baseline.answer}</p>
              <GradeChips grade={result.baseline.grade} />
            </Bubble>
          </div>
          <div>
            <ColumnLabel tone="good">Grounded</ColumnLabel>
            <div className="thread">
              <Bubble role="assistant">
                <p>{result.grounded.answer}</p>
                <GradeChips grade={result.grounded.grade} />
              </Bubble>
              {showProtectionCard && <ProtectionPlanCard />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/EvalRunner.tsx`**

```tsx
import { useState } from 'react'
import type { GradeResult } from '../lib/grader'

type EvalRow = {
  id: string
  question: string
  baseline: { answer: string; grade: GradeResult }
  grounded: { answer: string; grade: GradeResult }
}

type EvalResponse = {
  rows: EvalRow[]
  totals: { baseline: number; grounded: number; total: number }
  mock: boolean
}

export default function EvalRunner() {
  const [result, setResult] = useState<EvalResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runEval() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/eval', { method: 'POST' })
      if (!response.ok) throw new Error(`Server trả lỗi ${response.status}`)
      setResult((await response.json()) as EvalResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">Bộ câu hỏi chấm điểm</span>
        <h2>Chạy 15 câu hỏi qua cả hai prompt</h2>
        <p>
          Mỗi câu có một expectation máy kiểm tra được — số phải nêu đúng, chuỗi phải xuất hiện, hoặc
          phải từ chối. Điểm số dưới đây là kết quả chạy thật, không phải số bịa.
        </p>
      </div>

      <button type="button" onClick={runEval} disabled={loading}>
        {loading ? 'Đang chạy…' : 'Chạy test set'}
      </button>

      {error && <div className="notice">{error}</div>}

      {result?.mock && (
        <div className="notice">
          <span>MOCK PROVIDER — điểm số dưới đây không phải kết quả thật, chỉ để kiểm tra kết nối.</span>
        </div>
      )}

      {result && (
        <>
          <div className="score">
            <strong>
              {result.totals.baseline}/{result.totals.total}
            </strong>
            <span>ungrounded</span>
            <strong>
              {result.totals.grounded}/{result.totals.total}
            </strong>
            <span>grounded</span>
          </div>

          <div className="checks">
            {result.rows.map((row) => (
              <details key={row.id} className={row.grounded.grade.passed ? 'check passed' : 'check'}>
                <summary className="check-head">
                  <span className={row.baseline.grade.passed ? 'pill pass' : 'pill'}>
                    ungrounded {row.baseline.grade.passed ? 'PASS' : 'FAIL'}
                  </span>
                  <span className={row.grounded.grade.passed ? 'pill pass' : 'pill'}>
                    grounded {row.grounded.grade.passed ? 'PASS' : 'FAIL'}
                  </span>
                  <h3>{row.question}</h3>
                </summary>
                <dl>
                  <dt>Ungrounded</dt>
                  <dd>{row.baseline.answer}</dd>
                  <dt>Grounded</dt>
                  <dd>{row.grounded.answer}</dd>
                  {row.grounded.grade.missing.length + row.grounded.grade.contradictions.length > 0 && (
                    <>
                      <dt>Vấn đề (grounded)</dt>
                      <dd>{[...row.grounded.grade.missing, ...row.grounded.grade.contradictions].join('; ')}</dd>
                    </>
                  )}
                </dl>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Insert `<AskPanel />` and `<EvalRunner />` into `App.tsx`, between the "Chẩn đoán" section and the "Sửa lỗi 1" section**

Find this line in `src/App.tsx` (end of the "Chẩn đoán" section, immediately before the "Sửa lỗi 1" `<section>`):

```tsx
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Sửa lỗi 1</span>
```

Replace with:

```tsx
      </section>

      <AskPanel />
      <EvalRunner />

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Sửa lỗi 1</span>
```

- [ ] **Step 6: Add the dev proxy to `vite.config.ts`**

Replace the full contents of `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PORT = process.env.PORT ?? 8787

// base: './' keeps asset URLs relative so the built app can be served from any
// sub-path (static host, preview environment, or a plain file server).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': `http://localhost:${PORT}`,
    },
  },
})
```

- [ ] **Step 7: Add styles for the ask box, buttons, and expandable eval rows to `src/styles.css`**

Append at the end of `src/styles.css`:

```css
/* ---------- live demo ---------- */

.askbox {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.askbox input {
  flex: 1;
  min-width: 240px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 10px 14px;
}

.askbox input:focus {
  outline: 2px solid var(--accent);
  outline-offset: -1px;
}

button {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: var(--radius);
  padding: 10px 18px;
  cursor: pointer;
  align-self: flex-start;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}

details.check summary {
  list-style: none;
  cursor: pointer;
}

details.check summary::-webkit-details-marker {
  display: none;
}

details.check summary h3 {
  width: 100%;
}
```

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Manually verify in the browser with PROVIDER=mock**

Run in one terminal: `PROVIDER=mock npm start`
Run in another: `npx vite`
Open the printed local URL. Expected:
- The "Demo trực tiếp" section renders with an input and a "Hỏi" button, above the existing "Sửa lỗi 1" static section.
- Typing a question and clicking "Hỏi" shows two bubbles (`[MOCK-BASELINE]` / `[MOCK-GROUNDED]`) and a "MOCK PROVIDER" notice.
- Typing something containing "Silver" shows a `ProtectionPlanCard` under the grounded bubble.
- Clicking "Chạy test set" shows a score line and 15 expandable rows, each with a "MOCK PROVIDER" notice.
- The existing static before/after sections and the transcript `EvalPanel` below are unchanged.

Stop both processes once verified.

- [ ] **Step 10: Commit**

```bash
git add src/components/Chat.tsx src/components/AskPanel.tsx src/components/EvalRunner.tsx src/App.tsx src/styles.css vite.config.ts
git commit -m "$(cat <<'EOF'
Wire the live ask box and test-set runner into the frontend

Extracts Bubble/ColumnLabel into components/Chat.tsx so AskPanel can
reuse them. Existing static sections and the transcript EvalPanel are
untouched, just pushed below the new live demo.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Dev orchestration, env example, README

**Files:**
- Modify: `package.json` (add `concurrently` devDependency, `dev`/`test` scripts)
- Create: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Consumes: every script defined in Tasks 6–8 (`models`, `start`, `eval`, `eval:transcript`).
- Produces: `npm run dev` (Vite + server together), `npm run test` (all `node:test` suites), a documented `.env.example`, and a README with a blank Results section.

- [ ] **Step 1: Add `concurrently` and update scripts in `package.json`**

In `"devDependencies"`, add:
```json
    "concurrently": "^9.0.0",
```

In `"scripts"`, replace:
```json
    "dev": "vite",
```
with:
```json
    "dev": "concurrently -k -n vite,server \"vite\" \"tsx watch src/server/index.ts\"",
    "test": "tsx --test src/lib/prompts.test.ts src/lib/grader.test.ts src/lib/concurrency.test.ts src/data/testset.test.ts",
```

(Leave `build`, `start`, `preview`, `typecheck`, `eval`, `eval:transcript`, `models` as already set by earlier tasks.)

- [ ] **Step 2: Install the new dependency**

Run: `npm install`
Expected: `concurrently` added to `package-lock.json`, install succeeds.

- [ ] **Step 3: Create `.env.example`**

```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
PROVIDER=gemini
PORT=8787
```

- [ ] **Step 4: Verify `.env` is still gitignored**

Run: `git check-ignore -v .env`
Expected: prints `.gitignore:5:.env	.env` (or similar) confirming it's ignored. If this prints nothing, stop and fix `.gitignore` before continuing — a leaked API key is not a task to fold into a later commit.

- [ ] **Step 5: Update `README.md`**

Replace the `## Run it` section:

```markdown
## Run it

```bash
npm install
cp .env.example .env   # then add your GEMINI_API_KEY
npm run dev            # Vite + API server, live ask box + test set
npm run eval            # 15-question graded testset, both prompts, exits non-zero on failure
npm run eval:transcript # the six findings as deterministic checks over the captured transcript
npm run build && npm start  # production build, single port
```

`PROVIDER=mock npm run eval` runs the whole pipeline without a real API key — useful for
checking the wiring, never for a real score (every mock answer is labelled `[MOCK-...]`).
`npm run models` lists the Gemini models your key can access, for debugging `GEMINI_MODEL`.
```

Add a row to the `## What's here` table (after the `factCheck.ts` row):

```markdown
| `src/lib/prompts.ts` | The two system prompts under test: an ungrounded reconstruction and the same prompt plus a facts block from `groundTruth.ts`. |
| `src/lib/provider.ts` | `ask()` over the Gemini REST API (or a labelled mock for wiring tests). |
| `src/lib/grader.ts` | Scores an answer against a machine-checkable expectation — reuses `factCheck.ts`'s number parsing. |
| `src/data/testset.ts` | 15 questions with expectations, every one traceable to `llms.txt` or `groundTruth.ts`. |
| `src/server/index.ts` | `POST /api/ask`, `POST /api/eval`, serves the built frontend. The API key never reaches the client. |
```

Add, directly under the existing honesty blockquote near the top:

```markdown
> The "ungrounded" prompt in the live demo is my own reconstruction of a plausible MyStorage
> assistant prompt — not MyStorage's real system prompt, which I don't have access to. The claim
> under test is "ungrounded prompting produces this class of error and grounding measurably fixes
> it," not "here is their prompt."
```

Add a new section before `## Notes`:

```markdown
## Results

<!-- TODO (Vinh): fill this in from a real `npm run eval` run with your own GEMINI_API_KEY.
     Paste the final "ungrounded X/15 vs grounded Y/15" line and a sentence on what still
     fails, if anything. Do not write a number you haven't actually observed. -->
```

- [ ] **Step 6: Typecheck and run the full test suite**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm test`
Expected: all suites PASS (prompts: 3, grader: 6, concurrency: 2, testset: 2 — 13 tests total).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.example README.md
git commit -m "$(cat <<'EOF'
Wire npm run dev to Vite + server, add .env.example, update README

concurrently runs Vite and the API server together in dev. README now
documents the live demo and leaves a Results section blank for a real
npm run eval run.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: End-to-end verification

**Files:** none (verification only; fix forward in the relevant task's files if something fails).

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full unit test suite**

Run: `npm test`
Expected: all 13 tests PASS.

- [ ] **Step 3: Mock end-to-end eval**

Run: `PROVIDER=mock npm run eval`
Expected: mock warning banner, 15 rows, a final totals line. Runs to completion without throwing.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: `dist/` produced, no build errors.

- [ ] **Step 5: Single-port production serve, mock mode**

Run: `PROVIDER=mock npm start`
Open `http://localhost:8787` in a browser (or `curl -s http://localhost:8787/ | head -20`).
Expected: the built app loads from the same port the API is on.
Stop the server once verified.

- [ ] **Step 6: Real Gemini run — requires the GEMINI_API_KEY already in `.env`**

Run: `npm run models` — confirm `GEMINI_MODEL` (default `gemini-2.0-flash`) appears in the list; if not, set `GEMINI_MODEL` in `.env` to one that does.

Run: `npm run eval`
Expected: prints two real totals (`ungrounded X/15 vs grounded Y/15`) and a per-question table. This is the number that goes in README's Results section — do not write it there until you've actually seen it print.

- [ ] **Step 7: Ask-box acceptance check**

Run: `npm run dev`, open the app, type exactly `Gói bảo hiểm Silver bồi thường tối đa bao nhiêu?` into the ask box, click "Hỏi".
Expected: two different answers; the grounded one contains the substring `25.000.000`.

- [ ] **Step 8: Report results back**

Summarize for the user: the real `npm run eval` totals from Step 6, and whether Step 7's acceptance check passed. Do not edit README's Results section yourself with numbers the user hasn't seen — hand them the observed numbers so they can paste them in themselves, per the spec's "no score you have not actually observed" constraint applying to what ends up in a document they'll submit.
