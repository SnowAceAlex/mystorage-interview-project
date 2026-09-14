import { PROTECTION_PLANS, SOURCE, formatVnd, planFor } from '../data/groundTruth'

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
  const recommended = declaredValue ? planFor(declaredValue) : undefined
  const headroom = recommended && declaredValue ? recommended.cap - declaredValue : undefined

  return (
    <div className="factcard">
      <header>
        <h3>Hạn mức bồi thường theo gói</h3>
        <span>nguồn: {SOURCE.label}</span>
      </header>
      <table>
        <thead>
          <tr>
            <th scope="col">Gói</th>
            <th scope="col">Phí</th>
            <th scope="col" style={{ textAlign: 'right' }}>
              Bồi thường tối đa
            </th>
          </tr>
        </thead>
        <tbody>
          {PROTECTION_PLANS.map((plan) => (
            <tr key={plan.tier} className={plan === recommended ? 'recommended' : undefined}>
              <th scope="row" style={{ fontFamily: 'var(--font-body)', textTransform: 'none', fontSize: '14px', color: 'var(--ink)' }}>
                {plan.tier}
                {plan === recommended && <span className="tag">đủ cho mức bạn khai</span>}
              </th>
              <td>{plan.price}</td>
              <td className="figure">{formatVnd(plan.cap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        {recommended && declaredValue !== undefined ? (
          <>
            Bạn khai {formatVnd(declaredValue)} — gói {recommended.tier} còn dư{' '}
            {formatVnd(headroom ?? 0)} trước khi chạm trần. Thêm tài sản vượt mức này cần nâng lên{' '}
            {PROTECTION_PLANS[PROTECTION_PLANS.indexOf(recommended) + 1]?.tier ?? 'gói cao hơn'}.
          </>
        ) : (
          <>Gói Cơ bản giới hạn {formatVnd(PROTECTION_PLANS[0].perCbm ?? 0)}/m³ và tối đa {formatVnd(PROTECTION_PLANS[0].cap)} mỗi hợp đồng.</>
        )}
      </footer>
    </div>
  )
}
