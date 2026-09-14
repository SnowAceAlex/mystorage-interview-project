import AskPanel from './components/AskPanel'
import EvalRunner from './components/EvalRunner'
import EvalPanel from './components/EvalPanel'
import PricingFactCard from './components/PricingFactCard'
import ProtectionPlanCard from './components/ProtectionPlanCard'
import { Bubble, ColumnLabel } from './components/Chat'
import { AUDIT_TRANSCRIPT } from './data/transcript'
import { SOURCE } from './data/groundTruth'
import { airConditionedQuotes } from './lib/factCheck'

const lowestAcQuote = airConditionedQuotes(AUDIT_TRANSCRIPT)[0] ?? 0

export default function App() {
  return (
    <main className="shell">
      <header className="masthead">
        <span className="eyebrow">Audit prototype · stow.mystorage.vn</span>
        <h1>Trợ lý nói số, nhưng số không lấy từ đâu cả</h1>
        <p className="lede">
          Bảy check chạy trên một hội thoại thật với trợ lý AI của MyStorage, và một cách sửa: mọi con
          số trong câu trả lời đều đọc từ một nguồn dữ liệu duy nhất, thay vì được model viết lại mỗi
          lượt.
        </p>
        <div className="meta">
          <span>Hội thoại {AUDIT_TRANSCRIPT.capturedAt}</span>
          <span>Nguồn đối chiếu: {SOURCE.label}</span>
          <span>Bùi Công Vinh · Product Engineering Intern</span>
        </div>
      </header>

      <div className="notice">
        <span>
          Prototype độc lập cho bài test tuyển dụng, không phải sản phẩm chính thức của MyStorage. Dữ
          liệu đối chiếu lấy từ trang công khai của công ty, ngày {SOURCE.verifiedAt}.
        </span>
      </div>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Chẩn đoán</span>
          <h2>Sáu lỗi, một nguyên nhân</h2>
          <p>
            Giá lệch với giá quảng cáo, hạn mức bảo hiểm bị nói mờ đi, giá theo giờ không được nêu, dải
            nhiệt độ đổi giữa hai câu trả lời. Nhìn riêng lẻ thì là bốn bug; nhìn chung thì là một:
            trợ lý sinh số liệu bằng văn xuôi tự do, nên độ chính xác phụ thuộc vào từng lượt sinh.
            Phần chữ cứ để model viết — phần số thì không nên.
          </p>
        </div>
      </section>

      <AskPanel />
      <EvalRunner />

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Sửa lỗi 1</span>
          <h2>Bảo hiểm: khuyến nghị mà không cho biết trần</h2>
        </div>
        <div className="compare">
          <div>
            <ColumnLabel tone="bad">Hiện tại</ColumnLabel>
            <div className="thread">
              <Bubble role="user">khoảng 20 triệu VND</Bubble>
              <Bubble role="assistant">
                <p>Dạ với giá trị đồ đạc khoảng 20 triệu VND, gói Silver sẽ là lựa chọn rất phù hợp:</p>
                <p>
                  <strong>Hạn mức bảo vệ:</strong> Bao quát trọn vẹn giá trị khai báo của tài sản, giúp
                  anh an tâm trong suốt thời gian gửi đồ.
                </p>
                <p className="flag">
                  Trần của Silver là 25.000.000 VNĐ — khách khai 20 triệu, tức chỉ còn 5 triệu dư địa,
                  mà câu trả lời không hề nói ra con số đó.
                </p>
              </Bubble>
            </div>
          </div>
          <div>
            <ColumnLabel tone="good">Đề xuất</ColumnLabel>
            <div className="thread">
              <Bubble role="user">khoảng 20 triệu VND</Bubble>
              <Bubble role="assistant">
                <p>Dạ với giá trị khai báo 20 triệu, gói Silver là mức thấp nhất phủ được ạ:</p>
              </Bubble>
              <ProtectionPlanCard declaredValue={20_000_000} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">Sửa lỗi 2</span>
          <h2>Giá: trang web nói "từ 559.000", chat bắt đầu từ 779.000</h2>
        </div>
        <div className="compare">
          <div>
            <ColumnLabel tone="bad">Hiện tại</ColumnLabel>
            <div className="thread">
              <Bubble role="user">Storage máy lạnh giá bao nhiêu/tháng?</Bubble>
              <Bubble role="assistant">
                <p>
                  Ví dụ tham khảo: Kho 2m³ máy lạnh tại An Phú có giá 1.634.000 VNĐ/tháng. Gói valet 2m³
                  máy lạnh 1.028.000 VNĐ/tháng (hoặc 1m³ máy lạnh chỉ 779.000 VNĐ/tháng).
                </p>
                <p className="flag">
                  Không có mức nào chạm tới giá "từ 559.000 VNĐ/tháng" mà trang dịch vụ đang quảng cáo,
                  và không câu nào giải thích vì sao.
                </p>
              </Bubble>
            </div>
          </div>
          <div>
            <ColumnLabel tone="good">Đề xuất</ColumnLabel>
            <div className="thread">
              <Bubble role="assistant">
                <p>
                  Báo giá vẫn do trợ lý viết, nhưng mọi mức giá đều đối chiếu với giá sàn đang công bố
                  trước khi gửi đi. Lệch thì cảnh báo cho team vận hành, không để khách là người phát
                  hiện.
                </p>
              </Bubble>
              <PricingFactCard service="air-conditioned" quoted={lowestAcQuote} />
            </div>
          </div>
        </div>
      </section>

      <EvalPanel />

      <footer className="colophon">
        <p>
          <strong>Chạy thử:</strong> <code>npm install</code> → <code>npm run dev</code> để xem trang
          này, <code>npm run eval</code> để chạy 7 check trong terminal.
        </p>
        <p>
          Nguồn dữ liệu đối chiếu: <a href={SOURCE.url}>{SOURCE.label}</a> (verified {SOURCE.verifiedAt})
          · hội thoại gốc ghi ngày {AUDIT_TRANSCRIPT.capturedAt} trên tài khoản của chính người nộp đơn,
          số điện thoại và email đã được che trong repo.
        </p>
      </footer>
    </main>
  )
}
