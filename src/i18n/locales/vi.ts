import type { Messages } from './en'

/** UI copy, Vietnamese. Shape is checked against en.ts. */
export const vi = {
  meta: {
    title: 'Grounded Answers',
  },
  topbar: {
    brand: 'Grounded Answers',
    language: 'Ngôn ngữ',
    skip: 'Bỏ qua, tới nội dung',
  },
  masthead: {
    eyebrow: 'Audit prototype · stow.mystorage.vn',
    title: 'Neo số liệu của trợ lý MyStorage vào nguồn công bố',
    lede: 'Trợ lý đang chạy thật viết giá và hạn mức bảo hiểm bằng văn xuôi tự do. Trang này chỉ ra chỗ nó sai, và một cách sửa: đọc mọi con số từ nguồn đã công bố.',
    capturedAt: 'Hội thoại {{date}}',
    source: 'Nguồn đối chiếu: {{label}}',
    author: 'Bùi Công Vinh · Product Engineering Intern',
  },
  notice: {
    body: 'Prototype độc lập cho bài test tuyển dụng, không phải sản phẩm chính thức của MyStorage. Dữ liệu đối chiếu lấy từ {{label}} — trang mô tả công khai, có cấu trúc máy đọc được của công ty, xác minh ngày {{date}}.',
  },
  diagnosis: {
    eyebrow: 'Chẩn đoán',
    title: 'Sáu lỗi, một nguyên nhân',
    body: 'Giá lệch với giá quảng cáo, hạn mức bảo hiểm bị nói mờ đi, giá theo giờ không được nêu, dải nhiệt độ đổi giữa hai câu trả lời. Nhìn riêng lẻ thì là bốn bug; nhìn chung thì là một: trợ lý sinh số liệu bằng văn xuôi tự do, nên độ chính xác phụ thuộc vào từng lượt sinh. Phần chữ cứ để model viết — phần số thì không nên.',
  },
  compare: {
    current: 'Hiện tại',
    proposed: 'Đề xuất',
    evidence: 'Hội thoại gốc, tiếng Việt',
  },
  grade: {
    pass: 'PASS',
    fail: 'FAIL',
    ungrounded: 'Ungrounded',
    grounded: 'Grounded',
  },
  ask: {
    eyebrow: 'Demo trực tiếp',
    title: 'Hỏi một câu, xem hai câu trả lời',
    body: 'Cùng một câu hỏi, gửi tới cùng một model với hai system prompt khác nhau: một không có dữ liệu gì (bản tái tạo của tôi cho một trợ lý chưa được "ground" — không phải prompt thật của MyStorage, tôi không có quyền truy cập vào đó), một có bảng số liệu từ <code>groundTruth.ts</code>.',
    label: 'Câu hỏi của bạn',
    placeholder: 'VD: Gói bảo hiểm Silver bồi thường tối đa bao nhiêu?',
    submit: 'Hỏi',
    loading: 'Đang hỏi…',
    examples: 'Thử một câu',
    mock: 'MOCK PROVIDER — đây không phải câu trả lời thật từ model, chỉ để kiểm tra kết nối.',
    serverError:
      'Không gọi được server API (mã lỗi {{status}}). Có thể đây là bản deploy tĩnh — để chạy được cần chạy npm run dev ở máy local (có API key). Xem mục "Bộ câu hỏi chấm điểm" bên dưới để thấy kết quả chạy thật đã lưu sẵn.',
  },
  evalRunner: {
    eyebrow: 'Bộ câu hỏi chấm điểm',
    title: 'Chạy 15 câu hỏi qua cả hai prompt',
    body: 'Mỗi câu có một expectation máy kiểm tra được — số phải nêu đúng, chuỗi phải xuất hiện, hoặc phải từ chối. Cột "ungrounded" dùng prompt tái tạo của tôi, không phải prompt thật của MyStorage.',
    run: 'Chạy trực tiếp (cần server local)',
    running: 'Đang chạy…',
    serverStatus: 'Server trả lỗi {{status}}',
    liveError:
      'Không gọi được server API ({{message}}). Đây có thể là bản deploy tĩnh — kết quả bên dưới vẫn là kết quả thật từ lần chạy gần nhất đã lưu sẵn, không phải số liệu giả. Chạy npm run dev ở máy local (có API key) để tự chạy trực tiếp.',
    mock: 'MOCK PROVIDER — điểm số dưới đây không phải kết quả thật, chỉ để kiểm tra kết nối.',
    cached:
      'Kết quả chạy thật gần nhất, lưu sẵn ngày {{capturedAt}} qua {{provider}}/{{model}} — không phải số liệu giả, chỉ không phải vừa chạy ngay lúc này. Bấm nút trên để thử chạy trực tiếp (cần server + API key ở local).',
    live: 'Điểm số dưới đây vừa chạy trực tiếp qua API thật, không phải số liệu giả.',
    issues: 'Vấn đề (grounded)',
  },
  fix1: {
    eyebrow: 'Sửa lỗi 1',
    title: 'Bảo hiểm: khuyến nghị mà không cho biết trần',
    flag: 'Trần của Silver là 25.000.000 VNĐ — khách khai 20 triệu, tức chỉ còn 5 triệu dư địa, mà câu trả lời không hề nói ra con số đó.',
  },
  fix2: {
    eyebrow: 'Sửa lỗi 2',
    title: 'Giá: llms.txt công bố "từ 559.000", chat bắt đầu từ 779.000',
    flag: 'Không có mức nào chạm tới giá "từ 559.000 VNĐ/tháng" mà llms.txt công bố, và không câu nào giải thích vì sao.',
    explainer:
      'Báo giá vẫn do trợ lý viết, nhưng mọi mức giá đều đối chiếu với giá sàn đang công bố trước khi gửi đi. Lệch thì cảnh báo cho team vận hành, không để khách là người phát hiện.',
  },
  factcard: {
    source: 'nguồn: {{label}}',
    advertisedFrom: 'Giá công bố (llms.txt) từ',
    lowestInChat: 'Thấp nhất trong chat',
    gap: 'Chênh lệch',
    drifted:
      'Chênh {{gap}}/tháng so với mức "từ" mà {{label}} công bố. Cần chốt lại: hoặc cập nhật lại giá sàn, hoặc trợ lý phải nêu rõ gói nào mới có mức {{floor}}.',
    matches: 'Giá trong chat khớp với giá sàn theo {{label}}.',
    protectionTitle: 'Hạn mức bồi thường theo gói',
    colPlan: 'Gói',
    colFee: 'Phí',
    colCap: 'Bồi thường tối đa',
    recommended: 'Khuyến nghị',
    headroom:
      'Bạn khai {{declared}} — gói {{tier}} còn dư {{headroom}} trước khi chạm trần. Thêm tài sản vượt mức này cần nâng lên {{next}}.',
    nextFallback: 'gói cao hơn',
    basicLimit: 'Gói {{tier}} giới hạn {{perCbm}}/m³ và tối đa {{cap}} mỗi hợp đồng.',
  },
  plans: {
    tiers: {
      basic: 'Cơ bản',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
    },
    price: {
      free: 'Miễn phí',
      surcharge: 'Phụ phí/tháng',
    },
  },
  services: {
    'air-conditioned': 'Kho máy lạnh (Air-Conditioned Storage)',
    furniture: 'Kho nội thất (Furniture Storage)',
    luggage: 'Gửi hành lý (Luggage Storage)',
  },
  evalPanel: {
    eyebrow: 'Kiểm thử tự động',
    title: '7 check chạy trên chính hội thoại đã ghi lại',
    body: 'Mỗi finding trong báo cáo là một assertion chạy được, không phải ảnh chụp màn hình. Chạy lại bằng <code>npm run eval:transcript</code> — exit code khác 0 khi còn lỗi, nên nó cắm thẳng vào CI được.',
    score: 'check đạt',
    transcript: 'transcript {{id}}',
    expected: 'Nguồn',
    observed: 'Thực tế',
    impact: 'Ảnh hưởng',
  },
  severity: {
    high: 'nghiêm trọng',
    medium: 'trung bình',
    low: 'thấp',
  },
  footer: {
    run: '<strong>Chạy thử:</strong> <code>npm install</code> → <code>npm run dev</code> để xem trang này, <code>npm run eval:transcript</code> để chạy 7 check trong terminal, hoặc <code>npm run eval</code> để chạy 15 câu hỏi qua cả hai prompt.',
    source:
      'Nguồn dữ liệu đối chiếu: <a>{{label}}</a> (verified {{date}}) · hội thoại gốc ghi ngày {{capturedAt}} trên tài khoản của chính người nộp đơn, số điện thoại và email đã được che trong repo.',
  },
} as const satisfies Messages
