import type { ReactNode } from 'react'

export function Bubble({ role, children }: { role: 'user' | 'assistant'; children: ReactNode }) {
  return <div className={role === 'user' ? 'bubble user' : 'bubble'}>{children}</div>
}

export function ColumnLabel({ tone, children }: { tone: 'bad' | 'good'; children: ReactNode }) {
  return (
    <div className="column-label">
      <span className={tone === 'good' ? 'dot good' : 'dot'} />
      {children}
    </div>
  )
}
