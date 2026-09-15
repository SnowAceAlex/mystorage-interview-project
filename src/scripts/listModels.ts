/**
 * Lists the models the configured key (Gemini or Groq, per PROVIDER) can
 * access, so a wrong GEMINI_MODEL/GROQ_MODEL is a one-command debug.
 *
 *   npm run models
 */
import '../lib/loadEnv'

const PROVIDER = process.env.PROVIDER ?? 'gemini'

if (PROVIDER === 'groq') {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error('GROQ_API_KEY is not set. Copy .env.example to .env and add your key.')
    process.exit(1)
  }

  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) {
    console.error(`Groq API error ${response.status}: ${await response.text()}`)
    process.exit(1)
  }

  const data = (await response.json()) as { data?: { id: string }[] }
  for (const model of data.data ?? []) {
    console.log(model.id)
  }
} else {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.')
    process.exit(1)
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  if (!response.ok) {
    console.error(`Gemini API error ${response.status}: ${await response.text()}`)
    process.exit(1)
  }

  const data = (await response.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] }
  for (const model of data.models ?? []) {
    const methods = (model.supportedGenerationMethods ?? []).join(', ')
    console.log(`${model.name}  [${methods}]`)
  }
}
