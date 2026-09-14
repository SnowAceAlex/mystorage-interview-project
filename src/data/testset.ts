/**
 * 15 questions, every expectation traceable to llms.txt (repo root,
 * fetched from https://mystorage.vn/llms.txt) or src/data/groundTruth.ts.
 * No fact here is invented — see grader.ts for how each is checked.
 */

import type { Expectation } from '../lib/grader'

export const TESTSET: Expectation[] = [
  {
    id: 'ac-floor-price',
    question: 'Storage máy lạnh giá bao nhiêu/tháng?',
    requiredAmounts: [559_000],
    amountKind: 'price',
  },
  {
    id: 'luggage-hourly-rate',
    question: 'Gửi hành lý theo giờ giá bao nhiêu?',
    requiredAmounts: [54_000],
    amountKind: 'price',
  },
  {
    id: 'protection-ceilings',
    question: 'Các gói bảo vệ Cơ bản, Silver, Gold, Platinum có hạn mức bồi thường bao nhiêu?',
    requiredAmounts: [10_000_000, 25_000_000, 50_000_000, 100_000_000],
    amountKind: 'ceiling',
  },
  {
    id: 'declared-value-20m',
    question: 'Tôi khai báo giá trị đồ đạc khoảng 20.000.000 VNĐ thì nên chọn gói bảo vệ nào?',
    requiredAmounts: [25_000_000],
    requiredStrings: ['Silver'],
    amountKind: 'ceiling',
  },
  {
    id: 'unit-size-range',
    question: 'Kho tự quản có những kích thước nào?',
    requiredStrings: ['1', '23', 'CBM'],
  },
  {
    id: 'wine-storage-spec',
    question: 'Kho lưu trữ rượu vang duy trì nhiệt độ và độ ẩm bao nhiêu?',
    requiredStrings: ['12', '15', '60', '70'],
  },
  {
    id: 'out-of-scope-car',
    question: 'Tôi gửi xe ô tô của tôi được không nhỉ?',
    mustDecline: true,
  },
  {
    id: 'company-founded',
    question: 'MyStorage thành lập năm nào và ai quản lý?',
    requiredStrings: ['2019'],
  },
  {
    id: 'company-headquarters',
    question: 'Trụ sở chính của MyStorage ở đâu?',
    requiredStrings: ['375'],
  },
  {
    id: 'company-phone',
    question: 'Số điện thoại liên hệ của MyStorage là gì?',
    requiredStrings: ['7770 0117'],
  },
  {
    id: 'company-reply-time',
    question: 'MyStorage phản hồi khách hàng trong khoảng thời gian bao lâu?',
    requiredStrings: ['2 giờ'],
  },
  {
    id: 'company-reviews',
    question: 'MyStorage có bao nhiêu đánh giá 5 sao trên Google?',
    requiredStrings: ['650'],
  },
  {
    id: 'booking-method',
    question: 'Làm sao để đặt kho lưu trữ tại MyStorage?',
    requiredStrings: ['booking.mystorage.vn'],
  },
  {
    id: 'languages-supported',
    question: 'Website MyStorage hỗ trợ những ngôn ngữ nào?',
    requiredStrings: ['Hàn', 'Nhật'],
  },
  {
    id: 'self-vs-full-service',
    question: 'Sự khác biệt giữa Self Storage và Full Service Storage là gì?',
    requiredStrings: ['nhân viên'],
  },
]
