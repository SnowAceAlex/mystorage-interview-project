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
