/**
 * Loads .env into process.env before anything reads GEMINI_API_KEY /
 * GEMINI_MODEL / PROVIDER. Uses Node's built-in loader (Node >=20.6) —
 * no dotenv dependency. Must be imported before any process.env read.
 */
try {
  process.loadEnvFile('.env')
} catch {
  // .env is optional — PROVIDER=mock and CI runs don't need one.
}
