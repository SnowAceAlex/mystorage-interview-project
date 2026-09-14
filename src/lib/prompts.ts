import {
  ADVERTISED_PRICES,
  COMPANY_FACTS,
  PROTECTION_PLANS,
  SOURCE,
  UNIT_SIZE_RANGE,
  WINE_STORAGE,
  formatVnd,
} from '../data/groundTruth'

/**
 * A RECONSTRUCTION of a plausible ungrounded MyStorage assistant prompt —
 * NOT the real stow.mystorage.vn system prompt, which this project has no
 * access to. It exists to demonstrate the class of error ungrounded
 * prompting produces, not to reproduce their assistant.
 */
export const BASELINE_SYSTEM_PROMPT = `Bạn là trợ lý ảo của MyStorage, một công ty lưu trữ kho tự quản (self storage) và lưu trữ trọn gói (full-service storage) tại Việt Nam.

Vai trò của bạn:
- Trả lời câu hỏi của khách hàng về dịch vụ lưu trữ một cách thân thiện, chuyên nghiệp và ngắn gọn.
- Ưu tiên trả lời bằng tiếng Việt trừ khi khách hàng hỏi bằng tiếng Anh, thì trả lời bằng tiếng Anh.
- Xưng "em", gọi khách là "anh/chị".
- Nếu không chắc chắn về một dịch vụ hoặc mức giá, vẫn cố gắng đưa ra câu trả lời hữu ích nhất có thể dựa trên hiểu biết chung về ngành lưu trữ.`

function serializeFactsBlock(): string {
  const prices = ADVERTISED_PRICES.map(
    (price) => `- ${price.service}: từ ${formatVnd(price.floor)}/${price.unit === 'VNĐ/giờ' ? 'giờ' : 'tháng'}`,
  ).join('\n')

  const plans = PROTECTION_PLANS.map((plan) => {
    const cap = `bồi thường tối đa ${formatVnd(plan.cap)}`
    const perCbm = plan.perCbm ? `, ${formatVnd(plan.perCbm)}/m³` : ''
    return `- ${plan.tier} (${plan.price}): ${cap}${perCbm}`
  }).join('\n')

  const facts = COMPANY_FACTS.map((fact) => `- ${fact.label}: ${fact.value}`).join('\n')

  return `## Bảng giá dịch vụ (nguồn: ${SOURCE.label}, xác minh ${SOURCE.verifiedAt})
${prices}

## Hạn mức các gói bảo vệ (Protection Plan)
${plans}

## Kích thước kho
Kho tự quản có kích thước từ ${UNIT_SIZE_RANGE.min} đến ${UNIT_SIZE_RANGE.max} ${UNIT_SIZE_RANGE.unit}.

## Kho lưu trữ rượu vang
Nhiệt độ duy trì ${WINE_STORAGE.tempLow}–${WINE_STORAGE.tempHigh}°C, độ ẩm ${WINE_STORAGE.humidityLow}–${WINE_STORAGE.humidityHigh}%.

## Thông tin công ty
${facts}

## Dịch vụ KHÔNG cung cấp
MyStorage không nhận lưu trữ ô tô. Kho chỉ dành cho đồ gia dụng, nội thất, hành lý, hồ sơ và hàng hóa kinh doanh, để đảm bảo tiêu chuẩn phòng cháy chữa cháy (PCCC).`
}

/**
 * Same role and tone as the baseline, plus every figure the assistant is
 * allowed to state and an explicit instruction not to estimate beyond it.
 */
export function groundedSystemPrompt(): string {
  return `${BASELINE_SYSTEM_PROMPT}

Dưới đây là toàn bộ số liệu bạn được phép sử dụng. QUY TẮC BẮT BUỘC: chỉ nêu một con số nếu nó xuất hiện trong bảng dưới đây. Nếu khách hỏi một con số không có trong bảng, hãy nói rõ là bạn không có thông tin đó thay vì ước tính hoặc suy đoán.

${serializeFactsBlock()}`
}
