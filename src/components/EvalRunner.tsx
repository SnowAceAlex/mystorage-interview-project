import { useState } from 'react'
import type { GradeResult } from '../lib/grader'
import cachedResult from '../data/cachedEvalResult.json'

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
        throw new Error(body?.error ?? `Server trả lỗi ${response.status}`)
      }
      const live = (await response.json()) as EvalState
      setResult(live)
      setUsingCache(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setLiveError(
        `Không gọi được server API (${message}). Đây có thể là bản deploy tĩnh ` +
        `kết quả bên dưới vẫn là kết quả thật từ lần chạy gần nhất đã lưu sẵn, không phải số liệu giả. Chạy ` +
        `npm run dev ở máy local (có API key) để tự chạy trực tiếp.`,
      )
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
        {loading ? 'Đang chạy…' : 'Chạy trực tiếp (cần server local)'}
      </button>

      {liveError && <div className="notice">{liveError}</div>}

      {result.mock && (
        <div className="notice">
          <span>MOCK PROVIDER — điểm số dưới đây không phải kết quả thật, chỉ để kiểm tra kết nối.</span>
        </div>
      )}

      {!result.mock && usingCache && (
        <div className="notice">
          <span>
            Kết quả chạy thật gần nhất, lưu sẵn ngày {CACHED.capturedAt} qua {CACHED.provider}/
            {CACHED.model} — không phải số liệu giả, chỉ không phải vừa chạy ngay lúc này. Bấm nút trên để
            thử chạy trực tiếp (cần server + API key ở local).
          </span>
        </div>
      )}

      {!result.mock && !usingCache && (
        <div className="notice">
          <span>Điểm số dưới đây vừa chạy trực tiếp qua API thật, không phải số liệu giả.</span>
        </div>
      )}

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
    </div>
  )
}
