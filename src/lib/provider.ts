/**
 * ask() is the one place this app talks to a model. PROVIDER selects the
 * backend (gemini | groq | mock); everything else in the app is
 * provider-agnostic.
 */
import './loadEnv'

export type AskFn = (systemPrompt: string, question: string) => Promise<string>

const PROVIDER = process.env.PROVIDER ?? 'gemini'
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

const MOCK_WARNING = '⚠️  MOCK PROVIDER — not real results, wiring test only  ⚠️'

/** Mock answers are for wiring tests only — never a source for README/FINDINGS/scores. */
function mockAnswer(systemPrompt: string, question: string): string {
  console.warn(MOCK_WARNING)
  const grounded = systemPrompt.includes('QUY TẮC BẮT BUỘC')
  return grounded
    ? `[MOCK-GROUNDED] Đây là câu trả lời giả lập cho: "${question}"`
    : `[MOCK-BASELINE] Đây là câu trả lời giả lập cho: "${question}"`
}

async function geminiAnswer(systemPrompt: string, question: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Copy .env.example to .env and add your key, or set PROVIDER=mock.')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${body}`)
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
  if (!text) throw new Error(`Gemini returned no text. Raw response: ${JSON.stringify(data)}`)
  return text
}

/** Groq's chat completions API is OpenAI-compatible — no SDK needed here either. */
async function groqAnswer(systemPrompt: string, question: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set. Copy .env.example to .env and add your key, or set PROVIDER=mock.')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Groq API error ${response.status}: ${body}`)
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = data.choices?.[0]?.message?.content ?? ''
  if (!text) throw new Error(`Groq returned no text. Raw response: ${JSON.stringify(data)}`)
  return text
}

export function isMockProvider(): boolean {
  return PROVIDER === 'mock'
}

export const ask: AskFn =
  PROVIDER === 'mock'
    ? async (systemPrompt, question) => mockAnswer(systemPrompt, question)
    : PROVIDER === 'groq'
      ? groqAnswer
      : geminiAnswer
