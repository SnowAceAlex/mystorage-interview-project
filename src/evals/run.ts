/**
 * Runs the fact checks over the captured transcript and prints a report.
 *
 *   npm run eval:transcript
 *
 * Exit code is non-zero when any check fails, so this can sit in CI and fail a
 * build the same way a unit test would.
 */

import { runChecks } from '../lib/factCheck'
import { AUDIT_TRANSCRIPT } from '../data/transcript'
import { SOURCE } from '../data/groundTruth'

const color = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
}

const results = runChecks(AUDIT_TRANSCRIPT)
const failed = results.filter((result) => !result.passed)

console.log(
  `\n${color.bold}Grounded answers — fact check${color.reset}\n` +
    `${color.dim}transcript ${AUDIT_TRANSCRIPT.id} (${AUDIT_TRANSCRIPT.surface}, ${AUDIT_TRANSCRIPT.capturedAt})\n` +
    `source of truth ${SOURCE.label}, verified ${SOURCE.verifiedAt}${color.reset}\n`,
)

for (const result of results) {
  const badge = result.passed ? `${color.green}PASS${color.reset}` : `${color.red}FAIL${color.reset}`
  const severity = result.passed ? '' : ` ${color.yellow}[${result.severity}]${color.reset}`
  console.log(`${badge}${severity} ${result.title}`)
  console.log(`  ${color.dim}nguồn    ${color.reset}${result.expected}`)
  console.log(`  ${color.dim}thực tế  ${color.reset}${result.observed}`)
  if (!result.passed) console.log(`  ${color.dim}ảnh hưởng${color.reset} ${result.impact}`)
  console.log()
}

const high = failed.filter((result) => result.severity === 'high').length
console.log(
  `${color.bold}${results.length - failed.length}/${results.length} đạt${color.reset}` +
    (failed.length ? ` — ${failed.length} lỗi (${high} nghiêm trọng)\n` : '\n'),
)

process.exit(failed.length > 0 ? 1 : 0)
