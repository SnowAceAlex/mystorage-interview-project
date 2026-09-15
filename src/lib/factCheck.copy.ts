/**
 * Report copy for factCheck.ts, per locale. The checks themselves are
 * locale-free; only the words describing a result live here.
 *
 * The 'vi' strings are what `npm run eval:transcript` prints and must stay
 * unchanged. Quotes of what the assistant said stay in Vietnamese in both.
 */

export type Locale = 'en' | 'vi'

export type CheckCopy = {
  advertisedFloor: {
    title: string
    expected: (floor: string, quote: string) => string
    observedNone: string
    observed: (lowest: string, gap: number, all: string) => string
    impact: string
  }
  luggageRate: {
    title: string
    expected: (floor: string, quote: string) => string
    observedPass: string
    observedFail: string
    impact: string
  }
  protectionCaps: {
    title: string
    observedPass: string
    observedFail: (disclosed: number, total: number) => string
    impact: string
  }
  coverageClaim: {
    title: string
    expectedTier: (tier: string, cap: string) => string
    expectedAny: string
    observedPass: string
    observedFail: (tier: string | undefined, cap: string) => string
    impact: string
  }
  specConsistency: {
    title: string
    expected: string
    observedPass: (ranges: string) => string
    observedFail: (count: number, ranges: string) => string
    impact: string
  }
  droppedQuestion: {
    title: string
    expected: string
    observedPass: string
    observedFail: (count: number, questions: string) => string
    impact: string
  }
  outOfScope: {
    title: string
    expected: string
    observedPass: string
    observedFail: string
    impact: string
  }
  noneStated: string
}

const vi: CheckCopy = {
  advertisedFloor: {
    title: 'Giá thấp nhất trong chat khớp với giá "từ" đang quảng cáo',
    expected: (floor, quote) => `${floor}/tháng — ${quote}`,
    observedNone: 'Không tìm thấy báo giá kho máy lạnh nào trong hội thoại.',
    observed: (lowest, gap, all) => `Thấp nhất ${lowest}/tháng (cao hơn ${gap}%); các mức khác: ${all}.`,
    impact:
      'Khách đọc "từ 559.000" trên website rồi được báo giá cao hơn 39% ngay câu hỏi đầu tiên. Hoặc trang web sai, hoặc trợ lý bỏ sót gói rẻ nhất — cả hai đều làm hỏng niềm tin đúng lúc khách đang so giá.',
  },
  luggageRate: {
    title: 'Hỏi thẳng giá theo giờ thì phải nhận được con số',
    expected: (floor, quote) => `${floor}/giờ — ${quote}`,
    observedPass: 'Câu trả lời có nêu mức giá theo giờ.',
    observedFail: 'Không có con số nào; trợ lý chuyển hướng sang link booking.mystorage.vn/vi/autolocker.',
    impact:
      'Con số này đã công bố công khai. Bắt khách bấm thêm một link để biết giá là rào cản không cần thiết ngay ở bước khách đang cân nhắc.',
  },
  protectionCaps: {
    title: 'Hạn mức bồi thường từng gói được nêu bằng số',
    observedPass: 'Đã nêu đủ hạn mức các gói nâng cao.',
    observedFail: (disclosed, total) =>
      `Nêu được ${disclosed}/${total} hạn mức. Trợ lý mô tả bằng chữ: "các mốc hàng chục hay hàng trăm triệu đồng".`,
    impact:
      'Đây là số tiền được bồi thường khi mất mát. Khách không thể tự kiểm chứng gói nào đủ cho tài sản của mình, dù chính FAQ của công ty đã công bố các mốc này.',
  },
  coverageClaim: {
    title: 'Khẳng định "bao quát trọn vẹn" phải kèm hạn mức của gói',
    expectedTier: (tier, cap) => `Khuyến nghị ${tier} thì phải nêu hạn mức ${cap}.`,
    expectedAny: 'Mọi khẳng định về phạm vi bảo vệ đều kèm hạn mức.',
    observedPass: 'Khẳng định có kèm hạn mức.',
    observedFail: (tier, cap) =>
      `Khuyến nghị ${tier ?? 'một gói'} và khẳng định "bao quát trọn vẹn giá trị khai báo" mà không nêu mức trần ${cap}.`,
    impact:
      'Khách khai 20 triệu, sát trần 25 triệu của gói Silver. Thêm một món đồ nữa là vượt hạn mức mà khách không hề biết mình đang ở đâu so với ngưỡng.',
  },
  specConsistency: {
    title: 'Thông số kho máy lạnh nhất quán trong cùng hội thoại',
    expected: 'Một dải nhiệt độ duy nhất cho kho máy lạnh.',
    observedPass: (ranges) => `Nhất quán: ${ranges}.`,
    observedFail: (count, ranges) => `${count} dải khác nhau trong cùng một hội thoại: ${ranges}.`,
    impact:
      'Chi tiết nhỏ nhưng khách lưu rượu, nhạc cụ hay đồ điện tử sẽ đọc kỹ con số này; hai câu trả lời lệch nhau làm giảm độ tin cậy của mọi con số còn lại.',
  },
  droppedQuestion: {
    title: 'Không bỏ sót câu hỏi khi khách gửi liên tiếp',
    expected: 'Mỗi lượt hỏi của khách đều được trả lời.',
    observedPass: 'Không có câu hỏi nào bị bỏ sót.',
    observedFail: (count, questions) => `${count} câu bị bỏ qua hoàn toàn: ${questions}.`,
    impact:
      'Hỏi giá tất cả chi nhánh là tín hiệu mua hàng rõ ràng nhất trong cả hội thoại. Trợ lý trả lời câu sau và không bao giờ quay lại câu trước — lead đi thẳng vào khoảng trống.',
  },
  outOfScope: {
    title: 'Dịch vụ không có thì từ chối, không bịa',
    expected: 'Lưu trữ ô tô không nằm trong danh mục dịch vụ đã công bố.',
    observedPass: 'Từ chối đúng, không báo giá, và gợi ý tiếp phương án thay thế.',
    observedFail: 'Không từ chối rõ ràng.',
    impact: 'Trường hợp này trợ lý xử lý tốt — giữ nguyên hành vi này khi sửa các lỗi còn lại.',
  },
  noneStated: 'không nêu',
}

const en: CheckCopy = {
  advertisedFloor: {
    title: 'Lowest price in chat matches the advertised "from" price',
    expected: (floor, quote) => `${floor}/month — ${quote}`,
    observedNone: 'No air-conditioned storage quote found in the conversation.',
    observed: (lowest, gap, all) => `Lowest ${lowest}/month (${gap}% higher); other prices quoted: ${all}.`,
    impact:
      'The customer reads "from 559,000" on the website, then gets quoted 39% more on their very first question. Either the website is wrong or the assistant skipped the cheapest plan — both damage trust right when the customer is comparing prices.',
  },
  luggageRate: {
    title: 'Asking for the hourly rate directly returns a number',
    expected: (floor, quote) => `${floor}/hour — ${quote}`,
    observedPass: 'The answer states the hourly rate.',
    observedFail: 'No figure at all; the assistant redirects to booking.mystorage.vn/vi/autolocker.',
    impact:
      'This figure is already public. Making the customer click through another link to learn the price is an unnecessary hurdle at exactly the moment they are deciding.',
  },
  protectionCaps: {
    title: 'Each plan’s maximum payout is stated as a number',
    observedPass: 'All upgraded plan ceilings were stated.',
    observedFail: (disclosed, total) =>
      `Stated ${disclosed}/${total} ceilings. The assistant described them in words instead: "các mốc hàng chục hay hàng trăm triệu đồng".`,
    impact:
      'This is the amount paid out on a loss. The customer cannot check which plan covers their belongings, even though the company’s own FAQ publishes these ceilings.',
  },
  coverageClaim: {
    title: 'A "fully covered" claim comes with the plan’s ceiling',
    expectedTier: (tier, cap) => `Recommending ${tier} means stating its ${cap} ceiling.`,
    expectedAny: 'Every coverage claim comes with its ceiling.',
    observedPass: 'The claim includes the ceiling.',
    observedFail: (tier, cap) =>
      `Recommends ${tier ?? 'a plan'} and claims "bao quát trọn vẹn giá trị khai báo" without stating the ${cap} ceiling.`,
    impact:
      'The customer declared 20 million, close to Silver’s 25 million ceiling. One more item and they are over the limit without knowing where they stand.',
  },
  specConsistency: {
    title: 'Air-conditioned storage specs stay consistent within one conversation',
    expected: 'A single temperature range for air-conditioned storage.',
    observedPass: (ranges) => `Consistent: ${ranges}.`,
    observedFail: (count, ranges) => `${count} different ranges in the same conversation: ${ranges}.`,
    impact:
      'A small detail, but customers storing wine, instruments or electronics read this number closely; two answers that disagree undermine every other figure.',
  },
  droppedQuestion: {
    title: 'No question gets dropped when the customer sends several in a row',
    expected: 'Every customer question gets an answer.',
    observedPass: 'No question was dropped.',
    observedFail: (count, questions) => `${count} question(s) ignored entirely: ${questions}.`,
    impact:
      'Asking for prices at every location is the clearest buying signal in the whole conversation. The assistant answers the next message and never returns to it — the lead falls into the gap.',
  },
  outOfScope: {
    title: 'Services not offered are declined, not invented',
    expected: 'Car storage is not in the published service list.',
    observedPass: 'Declined correctly, gave no price, and suggested an alternative.',
    observedFail: 'Did not clearly decline.',
    impact: 'The assistant handles this case well — keep this behaviour while fixing the rest.',
  },
  noneStated: 'none stated',
}

export const CHECK_COPY: Record<Locale, CheckCopy> = { en, vi }
