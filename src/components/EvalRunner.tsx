import { useState } from 'react'
import type { GradeResult } from '../lib/grader'

type EvalRow = {
  id: string
  question: string
  baseline: { answer: string; grade: GradeResult }
  grounded: { answer: string; grade: GradeResult }
}

type EvalResponse = {
  rows: EvalRow[]
  totals: { baseline: number; grounded: number; total: number }
  mock: boolean
}

export default function EvalRunner() {
  const [result, setResult] = useState<EvalResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runEval() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/eval', { method: 'POST' })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Server trả lỗi ${response.status}`)
      }
      setResult((await response.json()) as EvalResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">Bộ câu hỏi chấm điểm</span>
        <h2>Chạy 15 câu hỏi qua cả hai prompt</h2>
        <p>
          Mỗi câu có một expectation máy kiểm tra được — số phải nêu đúng, chuỗi phải xuất hiện, hoặc
          phải từ chối. Cột "ungrounded" dùng prompt tái tạo của tôi, không phải prompt thật của
          MyStorage.
        </p>
      </div>

      <button type="button" onClick={runEval} disabled={loading}>
        {loading ? 'Đang chạy…' : 'Chạy test set'}
      </button>

      {error && <div className="notice">{error}</div>}

      {result?.mock && (
        <div className="notice">
          <span>MOCK PROVIDER — điểm số dưới đây không phải kết quả thật, chỉ để kiểm tra kết nối.</span>
        </div>
      )}

      {result && !result.mock && (
        <div className="notice">
          <span>Điểm số dưới đây là kết quả chạy thật qua Gemini, không phải số bịa.</span>
        </div>
      )}

      {result && (
        <>
          <div className="score">
            <strong>
              {result.totals.baseline}/{result.totals.total}
            </strong>
            <span>ungrounded</span>
            <strong>
              {result.totals.grounded}/{result.totals.total}
            </strong>
            <span>grounded</span>
          </div>

          <div className="checks">
            {result.rows.map((row) => (
              <details key={row.id} className={row.grounded.grade.passed ? 'check passed' : 'check'}>
                <summary className="check-head">
                  <span className={row.baseline.grade.passed ? 'pill pass' : 'pill'}>
                    ungrounded {row.baseline.grade.passed ? 'PASS' : 'FAIL'}
                  </span>
                  <span className={row.grounded.grade.passed ? 'pill pass' : 'pill'}>
                    grounded {row.grounded.grade.passed ? 'PASS' : 'FAIL'}
                  </span>
                  <h3>{row.question}</h3>
                </summary>
                <dl>
                  <dt>Ungrounded</dt>
                  <dd>{row.baseline.answer}</dd>
                  <dt>Grounded</dt>
                  <dd>{row.grounded.answer}</dd>
                  {row.grounded.grade.missing.length + row.grounded.grade.contradictions.length > 0 && (
                    <>
                      <dt>Vấn đề (grounded)</dt>
                      <dd>{[...row.grounded.grade.missing, ...row.grounded.grade.contradictions].join('; ')}</dd>
                    </>
                  )}
                </dl>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
