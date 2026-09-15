import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { runChecks } from '../lib/factCheck'
import { AUDIT_TRANSCRIPT } from '../data/transcript'
import { useLocale } from '../i18n'
import ScoreTile from './ScoreTile'

/**
 * The same checks `npm run eval:transcript` runs, rendered live. Nothing here is a
 * screenshot: the rows below are computed from the captured transcript every
 * time the page loads.
 */
export default function EvalPanel() {
  const { t } = useTranslation()
  const locale = useLocale()
  const results = useMemo(() => runChecks(AUDIT_TRANSCRIPT, locale), [locale])
  const passed = results.filter((result) => result.passed).length

  return (
    <section className="section" aria-labelledby="eval-panel-title">
      <div className="section-head">
        <span className="eyebrow">{t('evalPanel.eyebrow')}</span>
        <h2 id="eval-panel-title">{t('evalPanel.title')}</h2>
        <p>
          <Trans i18nKey="evalPanel.body" components={{ code: <code /> }} />
        </p>
      </div>

      <div className="scores">
        <ScoreTile
          tone={passed === results.length ? 'good' : 'bad'}
          value={passed}
          total={results.length}
          label={`${t('evalPanel.score')} · ${t('evalPanel.transcript', { id: AUDIT_TRANSCRIPT.id })}`}
        />
      </div>

      <div className="checks">
        {results.map((result) => (
          <article key={result.id} className={result.passed ? 'check passed' : 'check'}>
            <div className="check-head">
              <span className={result.passed ? 'pill pass' : 'pill'}>
                {result.passed ? t('grade.pass') : t('grade.fail')}
              </span>
              <h3>{result.title}</h3>
              {!result.passed && <span className="severity">{t(`severity.${result.severity}`)}</span>}
            </div>
            <dl>
              <dt>{t('evalPanel.expected')}</dt>
              <dd>{result.expected}</dd>
              <dt>{t('evalPanel.observed')}</dt>
              <dd>{result.observed}</dd>
              <dt>{t('evalPanel.impact')}</dt>
              <dd>{result.impact}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
