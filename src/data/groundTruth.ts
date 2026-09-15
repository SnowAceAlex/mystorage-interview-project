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
const vndEn = new Intl.NumberFormat('en-US')

export function formatVnd(amount: number): string {
  return `${vnd.format(amount)} VNĐ`
}

/** Display formatting per UI locale. The 'vi' branch is exactly formatVnd. */
export function formatVndFor(amount: number, locale: 'en' | 'vi'): string {
  return locale === 'vi' ? formatVnd(amount) : `${vndEn.format(amount)} VND`
}

/** Locale-neutral key for each tier, so UI copy can name it in either language. */
export const TIER_KEY = {
  'Cơ bản': 'basic',
  Silver: 'silver',
  Gold: 'gold',
  Platinum: 'platinum',
} as const satisfies Record<ProtectionPlan['tier'], string>

export type CompanyFact = {
  key: string
  label: string
  value: string
  quote: string
}

/** Company facts a customer might ask about directly, copied from llms.txt. */
export const COMPANY_FACTS: CompanyFact[] = [
  {
    key: 'founded',
    label: 'Năm thành lập & quản lý',
    value: 'Thành lập năm 2019, dưới sự quản lý của đội ngũ Mỹ và Đức.',
    quote:
      'Founded 2019, under US and German management; official member of the Self Storage Association of Asia (SSAA) and the American Chamber of Commerce in Vietnam.',
  },
  {
    key: 'headquarters',
    label: 'Trụ sở chính',
    value: '375 Võ Nguyên Giáp, Phường An Khánh, Thành phố Thủ Đức, TP. Hồ Chí Minh.',
    quote: 'Headquarters: 375 Vo Nguyen Giap Street, An Khanh Ward, Thu Duc City, Ho Chi Minh City, Vietnam.',
  },
  {
    key: 'phone',
    label: 'Số điện thoại',
    value: '028 7770 0117 (+84 28 7770 0117)',
    quote: 'Phone: 028 7770 0117 (+84 28 7770 0117). Email: hello@mystorage.vn.',
  },
  {
    key: 'reply-time',
    label: 'Thời gian phản hồi',
    value: 'Hỗ trợ Thứ Hai–Thứ Bảy, 9h–18h (Chủ nhật hỗ trợ từ xa); phản hồi trong khoảng 2 giờ trong giờ làm việc.',
    quote:
      'Support hours: Monday–Saturday, 9am–6pm (remote support on Sundays); typical reply time is 2 hours during business hours.',
  },
  {
    key: 'reviews',
    label: 'Đánh giá khách hàng',
    value: 'Hơn 650 đánh giá 5 sao từ khách hàng đã xác thực trên Google.',
    quote: '650+ five-star reviews from verified customers on Google.',
  },
  {
    key: 'locations-count',
    label: 'Số lượng cơ sở',
    value: '8 cơ sở tại TP.HCM và Đồng Nai.',
    quote:
      'MyStorage is a self-storage and full-service storage company in Ho Chi Minh City, Vietnam, founded in 2019 under US and German management, with 8 facilities across HCMC and Dong Nai.',
  },
  {
    key: 'languages',
    label: 'Ngôn ngữ website',
    value: 'Tiếng Anh, Tiếng Việt, Tiếng Hàn, Tiếng Nhật.',
    quote: 'Q: What languages is the MyStorage website available in?\nA: English, Vietnamese, Korean, and Japanese.',
  },
  {
    key: 'booking',
    label: 'Cách đặt kho',
    value: 'Đặt online tại booking.mystorage.vn, hoặc liên hệ qua điện thoại/email/messenger.',
    quote: 'Booking: https://booking.mystorage.vn/en/book?step=service — book online, or contact by phone/email/messenger.',
  },
  {
    key: 'self-vs-full-service',
    label: 'Khác biệt Self Storage và Full Service Storage',
    value:
      'Self Storage: khách tự ra vào kho riêng bất cứ lúc nào. Full Service: nhân viên MyStorage lấy, lưu trữ và trả đồ, khách không cần đến kho.',
    quote:
      "Self Storage gives customers a private unit they can access directly and independently, any time. Full Service Storage is pickup-and-delivery: MyStorage staff retrieve, store, and return items, so the customer never has to visit a facility themselves.",
  },
]

/** Self-storage unit size range, from the Self Storage service page and Size Guide. */
export const UNIT_SIZE_RANGE = {
  min: 1,
  max: 23,
  unit: 'CBM',
  quote: 'Private, air-conditioned self-storage units from 1–23 CBM with 24/7 access; 480+ units across HCMC.',
}

/** Wine storage climate spec, from the Wine Storage page. */
export const WINE_STORAGE = {
  tempLow: 12,
  tempHigh: 15,
  humidityLow: 60,
  humidityHigh: 70,
  quote: 'Climate-controlled at 12–15°C and 60–70% humidity, 24/7 access.',
}
