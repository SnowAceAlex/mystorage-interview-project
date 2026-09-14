import { runChecks } from '../lib/factCheck'
import { AUDIT_TRANSCRIPT } from '../data/transcript'

const SEVERITY_LABEL: Record<string, string> = {
  high: 'nghiêm trọng',
  medium: 'trung bình',
  low: 'thấp',
}

/**
 * The same checks `npm run eval` runs, rendered live. Nothing here is a
 * screenshot: the rows below are computed from the captured transcript every
 * time the page loads.
 */
export default function EvalPanel() {
  const results = runChecks(AUDIT_TRANSCRIPT)
  const passed = results.filter((result) => result.passed).length

  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">Kiểm thử tự động</span>
        <h2>7 check chạy trên chính hội thoại đã ghi lại</h2>
        <p>
          Mỗi finding trong báo cáo là một assertion chạy được, không phải ảnh chụp màn hình. Chạy lại
          bằng <code>npm run eval</code> — exit code khác 0 khi còn lỗi, nên nó cắm thẳng vào CI được.
        </p>
      </div>

      <div className="score">
        <strong>
          {passed}/{results.length}
        </strong>
        <span>check đạt · transcript {AUDIT_TRANSCRIPT.id}</span>
      </div>

      <div className="checks">
        {results.map((result) => (
          <div key={result.id} className={result.passed ? 'check passed' : 'check'}>
            <div className="check-head">
              <span className={result.passed ? 'pill pass' : 'pill'}>{result.passed ? 'PASS' : 'FAIL'}</span>
              <h3>{result.title}</h3>
              {!result.passed && <span className="severity">{SEVERITY_LABEL[result.severity]}</span>}
            </div>
            <dl>
              <dt>Nguồn</dt>
              <dd>{result.expected}</dd>
              <dt>Thực tế</dt>
              <dd>{result.observed}</dd>
              <dt>Ảnh hưởng</dt>
              <dd>{result.impact}</dd>
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}
