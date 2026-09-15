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

## Live demo

**[mystorage-interview-project.vercel.app](https://mystorage-interview-project.vercel.app/)** — a
static build. Vercel serves the frontend, but `src/server/index.ts` is a plain `node:http` server,
which doesn't run on Vercel's serverless model — there is no live backend behind that link.

What still works there: the audit evidence, the static before/after mockups, and the 15-question
**test set panel, pre-loaded with the real result from an actual run** (`src/data/cachedEvalResult.json`,
committed, not regenerated on every deploy) — so the ungrounded-vs-grounded score is real, just not
freshly computed on page load. What doesn't work: the ask box and the "run live" button both need
`POST /api/ask`/`/api/eval`, which only exist when `npm run dev`/`npm start` is running — the UI
says so explicitly if you try either on the deployed link.

For the actual interactive demo: `npm install && cp .env.example .env` (add a key) `&& npm run dev`.

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
`npm run models` lists the models your key can access, for debugging `GEMINI_MODEL`/`GROQ_MODEL`.

`PROVIDER=gemini|groq|mock` (default `gemini`). Gemini's free tier is heavily rate-limited (as
low as 5 requests/minute and 20/day on some keys), which can block a full 15-question run;
`PROVIDER=groq` (set `GROQ_API_KEY`, get one free at [console.groq.com](https://console.groq.com))
uses a much more generous free tier over the same `ask()` interface — no other code changes.
`npm test` runs the unit tests for the prompt/grader/concurrency/testset logic.

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
| `src/lib/concurrency.ts` | Small in-house concurrency limiter, used by the server and CLI eval runner. |
| `src/evals/runPromptEval.ts` | CLI runner for the prompt testset (`npm run eval`). |
| `src/components/Chat.tsx` | Shared `Bubble`/`ColumnLabel` chat UI pieces, used by both the static demo and the live ask box. |
| `src/components/AskPanel.tsx` | The live ask box: one question, two real answers, pass/fail chips. |
| `src/components/EvalRunner.tsx` | "Run test set" button and the 15-question score table. |
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

`npm run eval:transcript` against the 2026-09-14 transcript: **1/7 pass, 4 high-severity failures.** Each
failure maps to a numbered finding in FINDINGS.md.

## Results

Real run, 2026-09-15, `PROVIDER=groq` (`openai/gpt-oss-20b` — Gemini's free tier proved too
rate-limited to complete a full 15-question run in one sitting; see `PROVIDER=groq|gemini|mock`
above):

**ungrounded 2/15 vs grounded 14/15.**

The ungrounded prompt passes only when the model's general knowledge happens to line up with
MyStorage's actual numbers (it doesn't have any). The one remaining grounded failure is
`protection-ceilings`: the model correctly stated the Basic and Silver ceilings in full, but
dropped a zero group on Gold and Platinum ("50.000 VNĐ" / "100.000 VNĐ" instead of "50.000.000" /
"100.000.000") — a real precision slip on later items in a longer list, not a grading artifact.
Grounding fixes retrieval; it doesn't guarantee perfect transcription of every number, every time.

Running this eval also surfaced a real bug in the grader itself: it initially failed several
genuinely-correct grounded answers because the model grouped digits with a Unicode narrow
no-break space (U+202F) instead of a dot, which `parseAmounts`/`statesAmount` didn't recognize.
Fixed in `src/lib/factCheck.ts` (see git history) — worth knowing if a different model produces
a different score than the one above.

## Notes

- No load testing, no automated messaging, no test bookings: one conversation, on my own account,
  as the assignment requires.
- Phone number and email in the transcript fixture are redacted; the live session used the real
  ones, registered to the same contact details as this application.
