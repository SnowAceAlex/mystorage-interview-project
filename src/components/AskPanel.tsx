import { useState, type FormEvent } from 'react'
import { Bubble, ColumnLabel } from './Chat'
import ProtectionPlanCard from './ProtectionPlanCard'
import type { GradeResult } from '../lib/grader'

const PROTECTION_KEYWORDS = /silver|gold|platinum|bảo hiểm|bảo vệ|protection|insurance/i

type SideResult = { answer: string; grade: GradeResult | null }
type AskResponse = { baseline: SideResult; grounded: SideResult; mock: boolean }

function GradeChips({ grade }: { grade: GradeResult | null }) {
  if (!grade) return null
  if (grade.passed) return <span className="pill pass">PASS</span>
  return (
    <div className="check-head">
      <span className="pill">FAIL</span>
      {[...grade.missing, ...grade.contradictions].map((item) => (
        <span key={item} className="severity">
          {item}
        </span>
      ))}
    </div>
  )
}

export default function AskPanel() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<AskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (!response.ok) throw new Error(`Server trả lỗi ${response.status}`)
      setResult((await response.json()) as AskResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const showProtectionCard = PROTECTION_KEYWORDS.test(question)

  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">Demo trực tiếp</span>
        <h2>Hỏi một câu, xem hai câu trả lời</h2>
        <p>
          Cùng một câu hỏi, gửi tới cùng một model với hai system prompt khác nhau: một không có dữ
          liệu gì (bản tái tạo của tôi cho một trợ lý chưa được "ground" — không phải prompt thật của
          MyStorage, tôi không có quyền truy cập vào đó), một có bảng số liệu từ <code>groundTruth.ts</code>.
        </p>
      </div>

      {result?.mock && (
        <div className="notice">
          <span>MOCK PROVIDER — đây không phải câu trả lời thật từ model, chỉ để kiểm tra kết nối.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="askbox">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="VD: Gói bảo hiểm Silver bồi thường tối đa bao nhiêu?"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Đang hỏi…' : 'Hỏi'}
        </button>
      </form>

      {error && <div className="notice">{error}</div>}

      {result && (
        <div className="compare">
          <div>
            <ColumnLabel tone="bad">Ungrounded</ColumnLabel>
            <Bubble role="assistant">
              <p>{result.baseline.answer}</p>
              <GradeChips grade={result.baseline.grade} />
            </Bubble>
          </div>
          <div>
            <ColumnLabel tone="good">Grounded</ColumnLabel>
            <div className="thread">
              <Bubble role="assistant">
                <p>{result.grounded.answer}</p>
                <GradeChips grade={result.grounded.grade} />
              </Bubble>
              {showProtectionCard && <ProtectionPlanCard />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
