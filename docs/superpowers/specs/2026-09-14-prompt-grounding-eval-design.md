# Design: measured before/after for grounded prompting

**Date:** 2026-09-14
**Status:** approved for implementation

## Problem

The repo's current "fix" (`ProtectionPlanCard`, `PricingFactCard`) is a static React component. It
illustrates what a grounded answer would look like but never actually asks a model anything, so
there is no evidence the fix works — only a mockup of one.

## Goal

Add a live path: ask a real question, get two real model answers side by side (one from an
ungrounded system prompt, one from the same prompt plus MyStorage's published facts), and a
15-question test set that scores both paths and reports the gap. The existing static
transcript-audit evidence (the six findings, `factCheck.ts`, `EvalPanel`) stays as-is, underneath
the new live demo.

## Non-goals

- Reproducing MyStorage's actual system prompt (we don't have it — see Honesty below).
- Any network call to stow.mystorage.vn / the live assistant. The audit was one manual
  conversation; this repo doesn't automate traffic at their product.
- Rate limiting, auth, or multi-turn conversation in the new ask box — single question in, single
  answer out, on click.
- Editing `src/lib/factCheck.ts`'s number parsing — `grader.ts` reuses it rather than duplicating.

## Architecture

```
src/lib/prompts.ts        BASELINE_SYSTEM_PROMPT, groundedSystemPrompt()
src/lib/provider.ts        ask(systemPrompt, question) -> Promise<string>, PROVIDER=gemini|mock
src/lib/grader.ts          grade(answer, expectation) -> { passed, missing[], contradictions[] }
src/data/testset.ts         15 questions + expectations, traceable to llms.txt
src/data/groundTruth.ts    (extended) additional facts pulled from llms.txt
src/server/index.ts        POST /api/ask, POST /api/eval, serves dist/ in prod
src/App.tsx + components    ask box, score table, existing transcript audit kept below
```

### Prompts (`src/lib/prompts.ts`)

- `BASELINE_SYSTEM_PROMPT`: role + tone + Vietnamese-first instruction, no MyStorage data of any
  kind. Explicitly labelled in a comment as a reconstruction, not the real prompt.
- `groundedSystemPrompt()`: same prompt + a facts block serialized from `groundTruth.ts` (prices,
  ceilings, unit sizes, wine storage spec, company facts) + an explicit rule: state a figure only
  if it's in the block; otherwise say it's not available rather than estimate.

### Provider (`src/lib/provider.ts`)

- `ask(systemPrompt, question)`. `PROVIDER` env var selects `gemini` (default) or `mock`.
- Gemini: plain REST to `generativelanguage.googleapis.com`, key from `GEMINI_API_KEY`, model from
  `GEMINI_MODEL` (default `gemini-2.0-flash`). No SDK dependency.
- Mock: canned strings for wiring tests only. Every call prints a loud console warning, and the
  server/CLI propagate a `mock: true` flag so the UI and eval output also show the warning — mock
  output must never be the only thing on screen unlabelled.
- `npm run models` hits the Gemini `models.list` REST endpoint with the configured key and prints
  what's accessible, so a wrong `GEMINI_MODEL` is a one-command debug.
- Env loading via Node's built-in `process.loadEnvFile('.env')` (Node 22, no `dotenv` dependency).

### Grader (`src/lib/grader.ts`)

Expectation shape:

```ts
type Expectation = {
  id: string
  question: string
  requiredAmounts?: number[]
  amountKind?: 'price' | 'ceiling'   // which groundTruth bucket contradictions are drawn from
  requiredStrings?: string[]
  mustDecline?: boolean
}
```

- `missing`: required amounts (via `statesAmount`, reused from `factCheck.ts`) or required strings
  not found in the answer.
- `contradictions`: for expectations with `amountKind`, every *other* real value in that
  groundTruth bucket (e.g. `amountKind: 'price'` → all `ADVERTISED_PRICES` floors) that appears in
  the answer instead of/alongside the correct one. This never invents a number to check against —
  it only flags real MyStorage figures used in the wrong place, which is the actual failure mode
  the audit found (right kind of number, wrong value).
- `mustDecline`: passes when the answer matches a decline pattern (reusing the phrasing from
  `factCheck.ts`'s `checkOutOfScopeDeclined`) and states no amount at all.

### Testset (`src/data/testset.ts`)

15 questions, every expectation traceable to `llms.txt` (already fetched, at repo root) or the
existing `groundTruth.ts`. Extends `groundTruth.ts` with whatever additional facts are needed
(unit size range, wine storage spec, company facts), each with its source quote, matching the
existing file's convention.

Required coverage, mapped to spec requirements:

1. Air-conditioned floor price (559,000 VNĐ/tháng)
2. Luggage hourly rate (54,000 VNĐ/giờ)
3. All four protection ceilings in one question (10M / 25M / 50M / 100M) — one question, not four,
   to leave room in the 15-question budget for the rest of the required coverage
4. Correct plan for a 20,000,000 VNĐ declared value (expects "Silver" + 25,000,000)
5. Unit size range (1–23 CBM)
6. Wine storage temperature/humidity (12–15°C, 60–70%)
7. Out-of-scope request: car storage (`mustDecline: true`)
8–11. Four company facts (founding year/management, HQ address, phone, support hours or review
   count/SSAA membership)
12–15. Additional grounded questions using remaining llms.txt content (e.g. furniture storage
   price, self storage vs full service difference, booking URL, languages) to round out to 15.

### Server (`src/server/index.ts`)

- Built-in `http`, no framework.
- `POST /api/ask {question}` → `{ baseline: {answer, grade}, grounded: {answer, grade} }`. Grading
  only applies when the question matches a testset expectation; ad-hoc questions get answers
  without a grade.
- `POST /api/eval` → runs all 15 questions through both prompts, concurrency ~4 (small in-house
  limiter, no dependency), returns per-question results + totals.
- Serves `dist/` when present (production); the API key never reaches the client.

### Frontend

- New "ask box" section: text input → two answer columns (baseline / grounded), pass/fail chips
  per expectation when the question matches the testset, mock warning banner when `PROVIDER=mock`.
- `ProtectionPlanCard` renders under the grounded answer when the question matches protection-plan
  keywords (Silver/Gold/Platinum/bảo hiểm/bảo vệ/protection/insurance).
- "Run test set" button → score table (baseline X/15 vs grounded Y/15), rows expandable to show
  missing/contradicted items per question.
- Existing transcript-audit section (`EvalPanel`, the six findings) stays below, unchanged, as the
  original evidence.
- Honesty notice in the UI, not just the README: the baseline prompt is a reconstruction, not
  MyStorage's real system prompt.

### Scripts / docs

- `npm run eval` → new prompt test set CLI runner (new file, e.g. `src/evals/runPromptEval.ts`).
- `npm run eval:transcript` → renamed from today's `npm run eval` (same file, `src/evals/run.ts`).
- `npm run dev` → `concurrently` runs Vite (proxying `/api`) + the Node server.
- `npm run build && npm start` → single port, server serves `dist/` + API.
- `npm run models` → lists Gemini models the configured key can access.
- `.env.example` with `GEMINI_API_KEY`, `GEMINI_MODEL`, `PROVIDER`, `PORT`. `.env*` already
  gitignored.
- README gets a Results section left blank for a real run; no score is written that wasn't
  observed.

## Honesty constraints (carried over from the brief, restated so they're not lost)

- `BASELINE_SYSTEM_PROMPT` is explicitly labelled, in code comments, the README, and the UI, as a
  reconstruction of an ungrounded assistant — not MyStorage's real prompt, which isn't available.
  The claim under test is "ungrounded prompting produces this class of error and grounding
  measurably fixes it," not "here is their prompt."
- No fabricated MyStorage figure, score, or eval result, anywhere — code, README, or UI.
- No network call to stow.mystorage.vn from this app.

## Testing approach

- `npm run typecheck` clean throughout.
- `PROVIDER=mock npm run eval` exercises the full pipeline (testset → provider → grader → CLI
  report) without hitting the network, prints the mock warning, used to verify wiring only.
- Manual verification with a real `GEMINI_API_KEY`: `npm run eval` prints two totals and a
  per-question table; the ask box returns two different answers for the Silver protection
  question, with 25.000.000 present in the grounded one.
- No unit tests are added for `grader.ts` beyond what's implied by running the real testset — the
  testset itself, run against mock and then real answers, is the test.
