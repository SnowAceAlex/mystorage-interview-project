import type { CSSProperties } from 'react'

type Props = {
  value: number
  total: number
  label: string
  tone: 'bad' | 'good'
}

/** One score as a number plus a thin bar, so two scores compare at a glance. */
export default function ScoreTile({ value, total, label, tone }: Props) {
  const ratio = total > 0 ? value / total : 0
  return (
    <div className={`score-tile ${tone}`}>
      <span className="score-value">
        {value}
        <span className="score-total">/{total}</span>
      </span>
      <span className="score-label">{label}</span>
      <span className="score-bar" style={{ '--ratio': ratio } as CSSProperties} aria-hidden="true" />
    </div>
  )
}
