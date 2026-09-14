/**
 * Lists the Gemini models the configured GEMINI_API_KEY can access, so a
 * wrong GEMINI_MODEL is a one-command debug.
 *
 *   npm run models
 */
import '../lib/loadEnv'

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
