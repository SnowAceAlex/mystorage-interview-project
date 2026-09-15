import { Trans, useTranslation } from 'react-i18next'
import AskPanel from './components/AskPanel'
import EvalRunner from './components/EvalRunner'
import EvalPanel from './components/EvalPanel'
import LanguageSwitcher from './components/LanguageSwitcher'
import PricingFactCard from './components/PricingFactCard'
import ProtectionPlanCard from './components/ProtectionPlanCard'
import { Bubble, ColumnLabel, EvidenceNote } from './components/Chat'
import { AUDIT_TRANSCRIPT } from './data/transcript'
import { SOURCE } from './data/groundTruth'
import { airConditionedQuotes } from './lib/factCheck'

const lowestAcQuote = airConditionedQuotes(AUDIT_TRANSCRIPT)[0] ?? 0

export default function App() {
  const { t } = useTranslation()

  return (
    <>
      <a className="skip-link" href="#main">
        {t('topbar.skip')}
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <span className="wordmark">{t('topbar.brand')}</span>
          <LanguageSwitcher />
        </div>
      </header>

      <main id="main" className="shell">
        <header className="masthead">
          <span className="eyebrow">{t('masthead.eyebrow')}</span>
          <h1>{t('masthead.title')}</h1>
          <p className="lede">{t('masthead.lede')}</p>
          <div className="meta">
            <span>{t('masthead.capturedAt', { date: AUDIT_TRANSCRIPT.capturedAt })}</span>
            <span>{t('masthead.source', { label: SOURCE.label })}</span>
            <span>{t('masthead.author')}</span>
          </div>
        </header>

        <p className="notice warn">{t('notice.body', { label: SOURCE.label, date: SOURCE.verifiedAt })}</p>

        <section className="section" aria-labelledby="diagnosis-title">
          <div className="section-head">
            <span className="eyebrow">{t('diagnosis.eyebrow')}</span>
            <h2 id="diagnosis-title">{t('diagnosis.title')}</h2>
            <p>{t('diagnosis.body')}</p>
          </div>
        </section>

        <AskPanel />
        <EvalRunner />

        <section className="section" aria-labelledby="fix1-title">
          <div className="section-head">
            <span className="eyebrow">{t('fix1.eyebrow')}</span>
            <h2 id="fix1-title">{t('fix1.title')}</h2>
          </div>
          <div className="compare panel">
            <div>
              <ColumnLabel tone="bad">{t('compare.current')}</ColumnLabel>
              <EvidenceNote />
              <div className="thread">
                <Bubble role="user" lang="vi">
                  khoảng 20 triệu VND
                </Bubble>
                <Bubble role="assistant">
                  <p lang="vi">Dạ với giá trị đồ đạc khoảng 20 triệu VND, gói Silver sẽ là lựa chọn rất phù hợp:</p>
                  <p lang="vi">
                    <strong>Hạn mức bảo vệ:</strong> Bao quát trọn vẹn giá trị khai báo của tài sản, giúp
                    anh an tâm trong suốt thời gian gửi đồ.
                  </p>
                  <p className="flag">{t('fix1.flag')}</p>
                </Bubble>
              </div>
            </div>
            <div>
              <ColumnLabel tone="good">{t('compare.proposed')}</ColumnLabel>
              <div className="thread">
                <Bubble role="user" lang="vi">
                  khoảng 20 triệu VND
                </Bubble>
                <Bubble role="assistant" lang="vi">
                  <p>Dạ với giá trị tài sản khoảng 20 triệu, gói Silver là mức bảo hiểm phù hợp:</p>
                </Bubble>
                <ProtectionPlanCard declaredValue={20_000_000} />
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="fix2-title">
          <div className="section-head">
            <span className="eyebrow">{t('fix2.eyebrow')}</span>
            <h2 id="fix2-title">{t('fix2.title')}</h2>
          </div>
          <div className="compare panel">
            <div>
              <ColumnLabel tone="bad">{t('compare.current')}</ColumnLabel>
              <EvidenceNote />
              <div className="thread">
                <Bubble role="user" lang="vi">
                  Storage máy lạnh giá bao nhiêu/tháng?
                </Bubble>
                <Bubble role="assistant">
                  <p lang="vi">
                    Ví dụ tham khảo: Kho 2m³ máy lạnh tại An Phú có giá 1.634.000 VNĐ/tháng. Gói valet 2m³
                    máy lạnh 1.028.000 VNĐ/tháng (hoặc 1m³ máy lạnh chỉ 779.000 VNĐ/tháng).
                  </p>
                  <p className="flag">{t('fix2.flag')}</p>
                </Bubble>
              </div>
            </div>
            <div>
              <ColumnLabel tone="good">{t('compare.proposed')}</ColumnLabel>
              <div className="thread">
                <p className="annotation">{t('fix2.explainer')}</p>
                <PricingFactCard service="air-conditioned" quoted={lowestAcQuote} />
              </div>
            </div>
          </div>
        </section>

        <EvalPanel />

        <footer className="colophon">
          <p>
            <Trans i18nKey="footer.run" components={{ strong: <strong />, code: <code /> }} />
          </p>
          <p>
            <Trans
              i18nKey="footer.source"
              values={{ label: SOURCE.label, date: SOURCE.verifiedAt, capturedAt: AUDIT_TRANSCRIPT.capturedAt }}
              components={{ a: <a href={SOURCE.url} /> }}
            />
          </p>
        </footer>
      </main>
    </>
  )
}
