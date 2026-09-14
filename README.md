# Grounded Answers

A prototype fix for **stow.mystorage.vn**, MyStorage's AI personal assistant, built for the
Product Engineering Intern (AI-Native) assignment.

The audit is in **[FINDINGS.md](./FINDINGS.md)**. The short version: four of the six defects I
found are one defect. The assistant states figures — prices, insurance ceilings, temperature
ranges — as free prose, so they drift from what the company publishes about itself. This repo
makes the numbers come from one file, and turns the findings into tests that fail a build.

> Independent prototype for a job application. Not affiliated with or endorsed by MyStorage.
> Reference data is copied from the company's public `llms.txt` (verified 2026-09-13).

> The "ungrounded" prompt in the live demo is my own reconstruction of a plausible MyStorage
> assistant prompt — not MyStorage's real system prompt, which I don't have access to. The claim
> under test is "ungrounded prompting produces this class of error and grounding measurably fixes
> it," not "here is their prompt."

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

## What's here

| Path | What it does |
| --- | --- |
| `src/data/groundTruth.ts` | Every figure the assistant may state, with its source and verification date. The single source of truth. |
| `src/data/transcript.ts` | The real audit conversation, verbatim, contact details redacted. The test fixture. |
| `src/lib/factCheck.ts` | Seven deterministic checks: advertised-price floor, dropped questions, ceiling disclosure, unsupported coverage claims, published-rate disclosure, spec consistency, out-of-scope handling. |
| `src/lib/prompts.ts` | The two system prompts under test: an ungrounded reconstruction and the same prompt plus a facts block from `groundTruth.ts`. |
| `src/lib/provider.ts` | `ask()` over the Gemini REST API (or a labelled mock for wiring tests). |
| `src/lib/grader.ts` | Scores an answer against a machine-checkable expectation — reuses `factCheck.ts`'s number parsing. |
| `src/data/testset.ts` | 15 questions with expectations, every one traceable to `llms.txt` or `groundTruth.ts`. |
| `src/server/index.ts` | `POST /api/ask`, `POST /api/eval`, serves the built frontend. The API key never reaches the client. |
| `src/evals/run.ts` | CLI runner for the checks (`npm run eval:transcript`). |
| `src/components/ProtectionPlanCard.tsx` | The fix for F3/F4 — renders ceilings and remaining headroom instead of describing them. |
| `src/components/PricingFactCard.tsx` | The fix for F1 — reconciles a quote against the advertised floor. |

## The idea in one paragraph

The assistant already renders structured cards for the Self Storage vs Valet comparison, so the
surface supports it. Extending that pattern to every factual answer means the model keeps doing
what it is good at — understanding the question, choosing tone, handling Vietnamese and English —
while figures are read from a file that a human updates when prices change. The eval closes the
loop: because the checks run over captured transcripts, a regression in the assistant's answers
fails CI instead of reaching a customer.

## Checks currently failing

`npm run eval` against the 2026-09-14 transcript: **1/7 pass, 4 high-severity failures.** Each
failure maps to a numbered finding in FINDINGS.md.

## Results

<!-- TODO (Vinh): fill this in from a real `npm run eval` run with your own GEMINI_API_KEY.
     Paste the final "ungrounded X/15 vs grounded Y/15" line and a sentence on what still
     fails, if anything. Do not write a number you haven't actually observed. -->

## Notes

- No load testing, no automated messaging, no test bookings: one conversation, on my own account,
  as the assignment requires.
- Phone number and email in the transcript fixture are redacted; the live session used the real
  ones, registered to the same contact details as this application.
