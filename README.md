# Grounded Answers

A prototype fix for **stow.mystorage.vn**, MyStorage's AI personal assistant, built for the
Product Engineering Intern (AI-Native) assignment.

The audit is in **[FINDINGS.md](./FINDINGS.md)**. The short version: four of the six defects I
found are one defect. The assistant states figures — prices, insurance ceilings, temperature
ranges — as free prose, so they drift from what the company publishes about itself. This repo
makes the numbers come from one file, and turns the findings into tests that fail a build.

> Independent prototype for a job application. Not affiliated with or endorsed by MyStorage.
> Reference data is copied from the company's public `llms.txt` (verified 2026-09-13).

## Run it

```bash
npm install
npm run dev     # the before/after demo
npm run eval    # the six findings as deterministic checks, exits non-zero while any fail
```

## What's here

| Path | What it does |
| --- | --- |
| `src/data/groundTruth.ts` | Every figure the assistant may state, with its source and verification date. The single source of truth. |
| `src/data/transcript.ts` | The real audit conversation, verbatim, contact details redacted. The test fixture. |
| `src/lib/factCheck.ts` | Seven deterministic checks: advertised-price floor, dropped questions, ceiling disclosure, unsupported coverage claims, published-rate disclosure, spec consistency, out-of-scope handling. |
| `src/evals/run.ts` | CLI runner for the checks (`npm run eval`). |
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

## Notes

- No load testing, no automated messaging, no test bookings: one conversation, on my own account,
  as the assignment requires.
- Phone number and email in the transcript fixture are redacted; the live session used the real
  ones, registered to the same contact details as this application.
