import { ADVERTISED_PRICES, SOURCE, formatVnd } from '../data/groundTruth'

type Props = {
  /** Key into ADVERTISED_PRICES. */
  service: string
  /** Lowest price the assistant actually quoted in the conversation. */
  quoted: number
}

/**
 * Reconciles the "from" price a customer saw on the website with the lowest
 * price the assistant quotes in chat. Today nothing compares the two, so the
 * gap only surfaces when a customer notices it.
 */
export default function PricingFactCard({ service, quoted }: Props) {
  const advertised = ADVERTISED_PRICES.find((price) => price.key === service)
  if (!advertised) return null

  const gap = quoted - advertised.floor
  const gapPercent = Math.round((gap / advertised.floor) * 100)
  const drifted = gap > 0

  return (
    <div className="factcard">
      <header>
        <h3>{advertised.service}</h3>
        <span>nguồn: {SOURCE.label}</span>
      </header>
      <div className="delta">
        <div>
          <span className="label">Giá công bố (llms.txt) từ</span>
          <span className="value">{formatVnd(advertised.floor)}</span>
        </div>
        <div>
          <span className="label">Thấp nhất trong chat</span>
          <span className={drifted ? 'value bad' : 'value'}>{formatVnd(quoted)}</span>
        </div>
        <div>
          <span className="label">Chênh lệch</span>
          <span className={drifted ? 'value bad' : 'value'}>
            {drifted ? '+' : ''}
            {gapPercent}%
          </span>
        </div>
      </div>
      <footer>
        {drifted
          ? `Chênh ${formatVnd(gap)}/tháng so với mức "từ" mà ${SOURCE.label} công bố. Cần chốt lại: hoặc cập nhật lại giá sàn, hoặc trợ lý phải nêu rõ gói nào mới có mức ${formatVnd(advertised.floor)}.`
          : `Giá trong chat khớp với giá sàn theo ${SOURCE.label}.`}
      </footer>
    </div>
  )
}
