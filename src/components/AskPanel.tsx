import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Bubble, ColumnLabel } from './Chat'
import ProtectionPlanCard from './ProtectionPlanCard'
import { TESTSET } from '../data/testset'
import type { GradeResult } from '../lib/grader'

const PROTECTION_KEYWORDS = /silver|gold|platinum|bảo hiểm|bảo vệ|protection|insurance/i
const EXAMPLE_QUESTIONS = TESTSET.slice(0, 3).map((item) => item.question)

type SideResult = { answer: string; grade: GradeResult | null }
type AskResponse = { baseline: SideResult; grounded: SideResult; mock: boolean }

function GradeChips({ grade }: { grade: GradeResult | null }) {
  const { t } = useTranslation()
  if (!grade) return null
  if (grade.passed) return <span className="pill pass">{t('grade.pass')}</span>
  return (
    <div className="check-head">
      <span className="pill">{t('grade.fail')}</span>
      {[...grade.missing, ...grade.contradictions].map((item) => (
        <span key={item} className="severity">
          {item}
        </span>
      ))}
    </div>
  )
}

function SkeletonBubble() {
  return (
    <div className="bubble skeleton" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}

export default function AskPanel() {
  const { t } = useTranslation()
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [result, setResult] = useState<AskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError(null)
    setAsked(question)
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? t('ask.serverError', { status: response.status }))
      }
      setResult((await response.json()) as AskResponse)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const showProtectionCard = PROTECTION_KEYWORDS.test(asked)

  return (
    <section className="section" aria-labelledby="ask-title">
      <div className="section-head">
        <span className="eyebrow">{t('ask.eyebrow')}</span>
        <h2 id="ask-title">{t('ask.title')}</h2>
        <p>
          <Trans i18nKey="ask.body" components={{ code: <code /> }} />
        </p>
      </div>

      <form onSubmit={handleSubmit} className="askbox">
        <label className="visually-hidden" htmlFor="ask-input">
          {t('ask.label')}
        </label>
        <input
          id="ask-input"
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t('ask.placeholder')}
        />
        <button type="submit" disabled={loading || !question.trim()}>
          {loading ? t('ask.loading') : t('ask.submit')}
        </button>
      </form>

      {!result && !loading && (
        <div className="examples">
          <span className="examples-label">{t('ask.examples')}</span>
          {EXAMPLE_QUESTIONS.map((example) => (
            <button key={example} type="button" className="chip" lang="vi" onClick={() => setQuestion(example)}>
              {example}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      {result?.mock && !loading && <p className="notice warn">{t('ask.mock')}</p>}

      {loading && (
        <div className="compare" aria-busy="true">
          <div>
            <ColumnLabel tone="bad">{t('grade.ungrounded')}</ColumnLabel>
            <SkeletonBubble />
          </div>
          <div>
            <ColumnLabel tone="good">{t('grade.grounded')}</ColumnLabel>
            <SkeletonBubble />
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="compare reveal">
          <div>
            <ColumnLabel tone="bad">{t('grade.ungrounded')}</ColumnLabel>
            <Bubble role="assistant">
              <p className="answer">{result.baseline.answer}</p>
              <GradeChips grade={result.baseline.grade} />
            </Bubble>
          </div>
          <div>
            <ColumnLabel tone="good">{t('grade.grounded')}</ColumnLabel>
            <div className="thread">
              <Bubble role="assistant">
                <p className="answer">{result.grounded.answer}</p>
                <GradeChips grade={result.grounded.grade} />
              </Bubble>
              {showProtectionCard && <ProtectionPlanCard />}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
