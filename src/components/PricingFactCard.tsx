import { useTranslation } from 'react-i18next'
import { ADVERTISED_PRICES, SOURCE, formatVndFor } from '../data/groundTruth'
import { useLocale } from '../i18n'
import type { en } from '../i18n/locales/en'

type Props = {
  /** Key into ADVERTISED_PRICES. */
  service: keyof typeof en.services
  /** Lowest price the assistant actually quoted in the conversation. */
  quoted: number
}

/**
 * Reconciles the "from" price a customer saw on the website with the lowest
 * price the assistant quotes in chat. Today nothing compares the two, so the
 * gap only surfaces when a customer notices it.
 */
export default function PricingFactCard({ service, quoted }: Props) {
  const { t } = useTranslation()
  const locale = useLocale()
  const advertised = ADVERTISED_PRICES.find((price) => price.key === service)
  if (!advertised) return null

  const money = (amount: number) => formatVndFor(amount, locale)
  const gap = quoted - advertised.floor
  const gapPercent = Math.round((gap / advertised.floor) * 100)
  const drifted = gap > 0

  return (
    <div className="factcard">
      <header>
        <h3>{t(`services.${service}`)}</h3>
        <span>{t('factcard.source', { label: SOURCE.label })}</span>
      </header>
      <dl className="delta">
        <div>
          <dt>{t('factcard.advertisedFrom')}</dt>
          <dd className="value">{money(advertised.floor)}</dd>
        </div>
        <div>
          <dt>{t('factcard.lowestInChat')}</dt>
          <dd className={drifted ? 'value bad' : 'value'}>{money(quoted)}</dd>
        </div>
        <div>
          <dt>{t('factcard.gap')}</dt>
          <dd className={drifted ? 'value bad' : 'value'}>
            {drifted ? '+' : ''}
            {gapPercent}%
          </dd>
        </div>
      </dl>
      <footer>
        {drifted
          ? t('factcard.drifted', { gap: money(gap), label: SOURCE.label, floor: money(advertised.floor) })
          : t('factcard.matches', { label: SOURCE.label })}
      </footer>
    </div>
  )
}
