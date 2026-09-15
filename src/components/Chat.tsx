import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '../i18n'

export function Bubble({
  role,
  lang,
  children,
}: {
  role: 'user' | 'assistant'
  lang?: string
  children: ReactNode
}) {
  return (
    <div className={role === 'user' ? 'bubble user' : 'bubble'} lang={lang}>
      {children}
    </div>
  )
}

export function ColumnLabel({ tone, children }: { tone: 'bad' | 'good'; children: ReactNode }) {
  return (
    <div className="column-label">
      <span className={tone === 'good' ? 'dot good' : 'dot'} />
      {children}
    </div>
  )
}

/** Tells an English reader the quoted conversation below is verbatim, not translated. */
export function EvidenceNote() {
  const { t } = useTranslation()
  if (useLocale() === 'vi') return null
  return (
    <p className="evidence-note">
      <span className="tag">VI</span>
      {t('compare.evidence')}
    </p>
  )
}
