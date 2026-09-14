/**
 * Single source of truth for every figure the assistant is allowed to state.
 *
 * Everything here is copied from MyStorage's own public, machine-readable
 * description of itself (https://mystorage.vn/llms.txt, "Last verified:
 * 2026-09-13") and the FAQ it links to. Nothing is inferred or estimated.
 *
 * The point of the prototype: an assistant should read its numbers from a file
 * like this one, not regenerate them from model weights on every turn.
 */

export const SOURCE = {
  url: 'https://mystorage.vn/llms.txt',
  verifiedAt: '2026-09-13',
  label: 'mystorage.vn/llms.txt',
} as const

export type AdvertisedPrice = {
  key: string
  service: string
  /** Lowest price the public site advertises for this service. */
  floor: number
  unit: 'VNĐ/tháng' | 'VNĐ/giờ'
  quote: string
}

/**
 * "From" prices as advertised on the public site. These are the numbers a
 * customer has already seen before they ever open the chat.
 */
export const ADVERTISED_PRICES: AdvertisedPrice[] = [
  {
    key: 'air-conditioned',
    service: 'Kho máy lạnh (Air-Conditioned Storage)',
    floor: 559_000,
    unit: 'VNĐ/tháng',
    quote: 'Climate-controlled units from 559,000 VND (~US$21) per month.',
  },
  {
    key: 'furniture',
    service: 'Kho nội thất (Furniture Storage)',
    floor: 559_000,
    unit: 'VNĐ/tháng',
    quote: 'Furniture and household-item storage from 559,000 VND (~US$21) per month.',
  },
  {
    key: 'luggage',
    service: 'Gửi hành lý (Luggage Storage)',
    floor: 54_000,
    unit: 'VNĐ/giờ',
    quote: 'Hourly/daily luggage storage from 54,000 VND/hour.',
  },
]

export type ProtectionPlan = {
  tier: 'Cơ bản' | 'Silver' | 'Gold' | 'Platinum'
  price: string
  /** Maximum payout per contract, in VNĐ. */
  cap: number
  /** Per-CBM sub-limit, where the site states one. */
  perCbm?: number
  note: string
}

/**
 * Protection plans. The public FAQ states every one of these ceilings — which
 * is exactly why the assistant refusing to state them is a defect and not a
 * policy.
 */
export const PROTECTION_PLANS: ProtectionPlan[] = [
  {
    tier: 'Cơ bản',
    price: 'Miễn phí',
    cap: 10_000_000,
    perCbm: 500_000,
    note: 'Đi kèm mọi hợp đồng thuê kho.',
  },
  { tier: 'Silver', price: 'Phụ phí/tháng', cap: 25_000_000, note: 'Gói nâng cao mức 1.' },
  { tier: 'Gold', price: 'Phụ phí/tháng', cap: 50_000_000, note: 'Gói nâng cao mức 2.' },
  { tier: 'Platinum', price: 'Phụ phí/tháng', cap: 100_000_000, note: 'Hạn mức cao nhất.' },
]

/** Services the company actually offers, per llms.txt. Anything else is out of scope. */
export const SERVICES_IN_SCOPE = [
  'self-storage',
  'full-service-storage',
  'luggage-storage',
  'document-storage',
  'wine-storage',
  'motorbike-storage',
  'business-storage',
  'cold-storage',
  'air-conditioned-storage',
  'furniture-storage',
  'house-moving',
  'packing-materials',
] as const

/**
 * Smallest protection plan that fully covers a declared value — the
 * recommendation the assistant gives by feel today.
 */
export function planFor(declaredValue: number): ProtectionPlan | undefined {
  return PROTECTION_PLANS.find((plan) => declaredValue <= plan.cap)
}

const vnd = new Intl.NumberFormat('vi-VN')

export function formatVnd(amount: number): string {
  return `${vnd.format(amount)} VNĐ`
}
