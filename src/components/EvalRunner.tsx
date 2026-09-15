import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GradeResult } from '../lib/grader'
import cachedResult from '../data/cachedEvalResult.json'
import ScoreTile from './ScoreTile'

type EvalRow = {
  id: string
  question: string
  baseline: { answer: string; grade: GradeResult }
  grounded: { answer: string; grade: GradeResult }
}

type EvalTotals = { baseline: number; grounded: number; total: number }

type EvalState = {
  rows: EvalRow[]
  totals: EvalTotals
  mock?: boolean
}

const CACHED: EvalState & { capturedAt: string; provider: string; model: string } = cachedResult

export default function EvalRunner() {
  const { t } = useTranslation()
  const [result, setResult] = useState<EvalState>(CACHED)
  const [usingCache, setUsingCache] = useState(true)
  const [loading, setLoading] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)

  async function runEval() {
    setLoading(true)
    setLiveError(null)
    try {
      const response = await fetch('/api/eval', { method: 'POST' })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? t('evalRunner.serverStatus', { status: response.status }))
      }
      const live = (await response.json()) as EvalState
      setResult(live)
      setUsingCache(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setLiveError(t('evalRunner.liveError', { message }))
    } finally {
      setLoading(false)
    }
  }

  const passLabel = (passed: boolean) => (passed ? t('grade.pass') : t('grade.fail'))

  return (
    <section className="section" aria-labelledby="eval-runner-title">
      <div className="section-head">
        <span className="eyebrow">{t('evalRunner.eyebrow')}</span>
        <h2 id="eval-runner-title">{t('evalRunner.title')}</h2>
        <p>{t('evalRunner.body')}</p>
      </div>

      <button type="button" className="button-secondary" onClick={runEval} disabled={loading}>
        {loading ? t('evalRunner.running') : t('evalRunner.run')}
      </button>

      {liveError && (
        <p className="notice error" role="alert">
          {liveError}
        </p>
      )}

      {result.mock && <p className="notice warn">{t('evalRunner.mock')}</p>}

      {!result.mock && usingCache && (
        <p className="notice">
          {t('evalRunner.cached', { capturedAt: CACHED.capturedAt, provider: CACHED.provider, model: CACHED.model })}
        </p>
      )}

      {!result.mock && !usingCache && <p className="notice">{t('evalRunner.live')}</p>}

      <div className="scores">
        <ScoreTile tone="bad" value={result.totals.baseline} total={result.totals.total} label={t('grade.ungrounded')} />
        <ScoreTile tone="good" value={result.totals.grounded} total={result.totals.total} label={t('grade.grounded')} />
      </div>

      <div className="checks" aria-busy={loading}>
        {result.rows.map((row) => (
          <details key={row.id} className={row.grounded.grade.passed ? 'check passed' : 'check'}>
            <summary className="check-head">
              <span className={row.baseline.grade.passed ? 'pill pass' : 'pill'}>
                {t('grade.ungrounded')} {passLabel(row.baseline.grade.passed)}
              </span>
              <span className={row.grounded.grade.passed ? 'pill pass' : 'pill'}>
                {t('grade.grounded')} {passLabel(row.grounded.grade.passed)}
              </span>
              <h3 lang="vi">{row.question}</h3>
            </summary>
            <dl>
              <dt>{t('grade.ungrounded')}</dt>
              <dd className="answer">{row.baseline.answer}</dd>
              <dt>{t('grade.grounded')}</dt>
              <dd className="answer">{row.grounded.answer}</dd>
              {row.grounded.grade.missing.length + row.grounded.grade.contradictions.length > 0 && (
                <>
                  <dt>{t('evalRunner.issues')}</dt>
                  <dd>{[...row.grounded.grade.missing, ...row.grounded.grade.contradictions].join('; ')}</dd>
                </>
              )}
            </dl>
          </details>
        ))}
      </div>
    </section>
  )
}
