/**
 * A real session with stow.mystorage.vn, captured during the audit on
 * 2026-09-14 by the applicant, on the applicant's own account.
 *
 * Contact details in the first turn are redacted — the live session used the
 * real ones. Assistant turns are verbatim.
 *
 * This file is the test fixture: the checks in src/lib/factCheck.ts run against
 * it, so every finding in FINDINGS.md is reproducible with `npm run eval`
 * instead of being a screenshot someone has to take on trust.
 */

export type Turn = {
  role: 'user' | 'assistant'
  text: string
}

export type Transcript = {
  id: string
  capturedAt: string
  surface: string
  turns: Turn[]
}

export const AUDIT_TRANSCRIPT: Transcript = {
  id: 'stow-2026-09-14',
  capturedAt: '2026-09-14',
  surface: 'stow.mystorage.vn',
  turns: [
    {
      role: 'user',
      text: 'Bùi Công Vinh, SĐT: [redacted], Email: [redacted]',
    },
    {
      role: 'assistant',
      text: 'Dạ em đã ghi nhận thông tin liên hệ của anh Vinh rồi ạ.\nHiện tại anh đang cần lưu trữ những đồ đạc gì, hoặc dự kiến cần kho khoảng bao nhiêu m³ để em tư vấn phương án và chi phí phù hợp nhất cho mình nhé ạ?',
    },
    { role: 'user', text: 'Storage máy lạnh giá bao nhiêu/tháng?' },
    {
      role: 'assistant',
      text: [
        'Dạ bên em có 2 hình thức lưu trữ máy lạnh (duy trì 24–28°C và độ ẩm 55–65%) để anh Vinh lựa chọn tùy theo nhu cầu:',
        'Kho tự quản (Self Storage - máy lạnh): Anh sở hữu phòng kho riêng biệt, ra vào tự do 24/7.',
        'Ví dụ tham khảo: Kho 2m³ máy lạnh tại An Phú có giá 1.634.000 VNĐ/tháng.',
        'Kho dịch vụ trọn gói (Valet Storage - máy lạnh): Tiết kiệm hơn khoảng 40%, phù hợp nếu anh không cần ra vào thường xuyên.',
        'Ví dụ tham khảo: Gói 2m³ máy lạnh có giá 1.028.000 VNĐ/tháng (hoặc 1m³ máy lạnh chỉ 779.000 VNĐ/tháng).',
        '(Giá trên chưa bao gồm 8% VAT và phí vận chuyển/bốc xếp nếu có).',
      ].join('\n'),
    },
    { role: 'user', text: 'Gửi hành lý theo giờ giá sao?' },
    {
      role: 'assistant',
      text: [
        'Dạ đối với nhu cầu gửi hành lý theo giờ hoặc ngắn ngày, bên em có hệ thống tủ thông minh AutoLocker tự phục vụ:',
        'Linh hoạt & Tiện lợi: Có các gói theo giờ (1h, 2h, 4h...) hoặc theo tuần, thanh toán online là nhận tủ sử dụng ngay.',
        'Mở khóa dễ dàng: Thao tác mở tủ 24/7 qua điện thoại (tại các điểm Ministop).',
        'Anh Vinh có thể xem chi tiết giá từng gói theo giờ và tình trạng ô tủ trống theo thời gian thực tại: https://booking.mystorage.vn/vi/autolocker',
        'Anh dự kiến gửi hành lý ở khu vực quận nào để em hướng dẫn điểm gần nhất cho mình ạ?',
      ].join('\n'),
    },
    // Two user turns in a row: the first question never gets an answer.
    { role: 'user', text: 'cho tôi giá của tất cả chi nhánh đi' },
    {
      role: 'user',
      text: 'Can you help me to explain the different between Self Storage vs. Full Service Storage',
    },
    {
      role: 'assistant',
      text: [
        'Here is the key difference between Self Storage and Full Service (Valet) Storage:',
        '1. Self Storage (Private Locker / Room)',
        'Access: 24/7 unlimited access with your own lock and key.',
        'Location: Located in central District 2 (375 Võ Nguyên Giáp and An Phú Sport Park).',
        'Pricing reference:',
        'Non-AC: from 1,418,000 VND/month for a 3 CBM unit at An Phú.',
        'AC (24–28°C): from 1,634,000 VND/month for a 2 CBM unit at An Phú.',
        '2. Full Service Storage (Valet Storage)',
        "Access: MyStorage handles pickup and delivery directly to your door with 2 days' notice.",
        'Location: Central warehouse in Nhơn Trạch, Đồng Nai (~45 mins from D2).',
        'Cost savings: About 40% lower cost compared to Self Storage.',
        'Pricing reference:',
        'Non-AC: from 659,000 VND/month for 1 CBM.',
        'AC (25–28°C): from 779,000 VND/month for 1 CBM.',
        '(Note: Rates exclude 8% VAT. Transportation and packing services are quoted separately).',
      ].join('\n'),
    },
    { role: 'user', text: 'Tôi gửi xe ô tô của tôi được không nhỉ' },
    {
      role: 'assistant',
      text: [
        'Dạ hiện tại MyStorage chưa hỗ trợ dịch vụ lưu trữ xe ô tô ạ.',
        'Hệ thống kho của bên em là dạng phòng kho tự quản và kho kệ chuyên dụng cho đồ dùng gia đình, nội thất, hành lý, hồ sơ và hàng hóa kinh doanh để đảm bảo tiêu chuẩn an toàn PCCC.',
        'Ngoài xe ô tô ra, anh Vinh có đang cần tìm kho để lưu trữ đồ đạc, nội thất hay vật dụng nào khác không ạ?',
      ].join('\n'),
    },
    { role: 'user', text: 'Nói cho tôi về các gói bảo hiểm bên bạn được không' },
    {
      role: 'assistant',
      text: [
        'Dạ tại MyStorage, sự an toàn của đồ đạc luôn được đặt lên hàng đầu. Bên em có các gói bảo vệ hàng hóa (Protection Plan) linh hoạt theo giá trị tài sản:',
        'Gói Cơ bản (Free): Được tích hợp sẵn và miễn phí trong hợp đồng thuê kho, áp dụng mức bảo vệ tiêu chuẩn cho hàng hóa lưu kho thông thường.',
        'Các gói Nâng cao (Silver, Gold, Platinum): Dành cho khách hàng lưu trữ đồ đạc, thiết bị hoặc nội thất có giá trị cao, với hạn mức bồi thường cao hơn tương ứng với giá trị khai báo của tài sản.',
        'Anh Vinh dự kiến lưu trữ những món đồ có tổng giá trị ước tính khoảng bao nhiêu để em tư vấn gói bảo vệ phù hợp nhất cho mình ạ?',
      ].join('\n'),
    },
    { role: 'user', text: 'nói thêm về gói nâng cao đi' },
    {
      role: 'assistant',
      text: [
        'Dạ các gói nâng cao (Silver, Gold, Platinum) được thiết kế để mở rộng hạn mức bồi thường cho tài sản có giá trị cao:',
        'Hạn mức bảo vệ linh hoạt: Tùy theo gói anh chọn, hạn mức bảo vệ và chi trả sẽ tăng dần tương ứng với giá trị tài sản thực tế mà anh khai báo (từ mức cơ bản lên đến các mốc hàng chục hay hàng trăm triệu đồng).',
        'Phí duy trì hợp lý: Mức phí bảo vệ được tính thành một khoản phí cố định hàng tháng cộng vào hợp đồng thuê kho.',
        'Anh Vinh dự kiến lưu trữ những món đồ có tổng giá trị khoảng bao nhiêu để em tư vấn gói có hạn mức phù hợp nhất cho anh nhé?',
      ].join('\n'),
    },
    { role: 'user', text: 'khoảng 20 triệu VND' },
    {
      role: 'assistant',
      text: [
        'Dạ với giá trị đồ đạc khoảng 20 triệu VND, gói Silver sẽ là lựa chọn rất phù hợp:',
        'Hạn mức bảo vệ: Bao quát trọn vẹn giá trị khai báo của tài sản, giúp anh an tâm trong suốt thời gian gửi đồ.',
        'Chi phí: Phí bảo vệ hàng tháng rất nhỏ, được cộng trực tiếp vào hợp đồng thuê kho.',
        'Hiện tại anh Vinh đã ước tính được số lượng đồ đạc hoặc thể tích kho (m³) mình cần thuê chưa ạ?',
      ].join('\n'),
    },
  ],
}
