import { useTranslation } from 'react-i18next'
import { PROTECTION_PLANS, SOURCE, TIER_KEY, formatVndFor, planFor, type ProtectionPlan } from '../data/groundTruth'
import { useLocale } from '../i18n'

type Props = {
  /** Value the customer declared, so the card can mark the plan that covers it. */
  declaredValue?: number
}

/**
 * The fix, in one component: whenever protection plans come up, the ceilings
 * are rendered from groundTruth.ts instead of being described in prose. The
 * model can phrase the conversation however it likes; the numbers are not its
 * job.
 */
export default function ProtectionPlanCard({ declaredValue }: Props) {
  const { t } = useTranslation()
  const locale = useLocale()
  const money = (amount: number) => formatVndFor(amount, locale)
  const tierName = (plan: ProtectionPlan) => t(`plans.tiers.${TIER_KEY[plan.tier]}`)
  const priceLabel = (plan: ProtectionPlan) =>
    plan.price === 'Miễn phí' ? t('plans.price.free') : t('plans.price.surcharge')

  const recommended = declaredValue ? planFor(declaredValue) : undefined
  const headroom = recommended && declaredValue ? recommended.cap - declaredValue : undefined
  const next = recommended ? PROTECTION_PLANS[PROTECTION_PLANS.indexOf(recommended) + 1] : undefined
  const basic = PROTECTION_PLANS[0]

  return (
    <div className="factcard">
      <header>
        <h3>{t('factcard.protectionTitle')}</h3>
        <span>{t('factcard.source', { label: SOURCE.label })}</span>
      </header>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{t('factcard.colPlan')}</th>
              <th scope="col">{t('factcard.colFee')}</th>
              <th scope="col" className="figure">
                {t('factcard.colCap')}
              </th>
            </tr>
          </thead>
          <tbody>
            {PROTECTION_PLANS.map((plan) => (
              <tr key={plan.tier} className={plan === recommended ? 'recommended' : undefined}>
                <th scope="row" className="plan-name">
                  {tierName(plan)}
                  {plan === recommended && <span className="tag">{t('factcard.recommended')}</span>}
                </th>
                <td>{priceLabel(plan)}</td>
                <td className="figure">{money(plan.cap)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer>
        {recommended && declaredValue !== undefined
          ? t('factcard.headroom', {
              declared: money(declaredValue),
              tier: tierName(recommended),
              headroom: money(headroom ?? 0),
              next: next ? tierName(next) : t('factcard.nextFallback'),
            })
          : t('factcard.basicLimit', { tier: tierName(basic), perCbm: money(basic.perCbm ?? 0), cap: money(basic.cap) })}
      </footer>
    </div>
  )
}
