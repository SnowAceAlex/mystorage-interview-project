import { createServer, type IncomingMessage } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { ask, isMockProvider } from '../lib/provider'
import { BASELINE_SYSTEM_PROMPT, groundedSystemPrompt } from '../lib/prompts'
import { grade } from '../lib/grader'
import { TESTSET } from '../data/testset'
import { mapWithConcurrency } from '../lib/concurrency'

const PORT = Number(process.env.PORT ?? 8787)
const DIST_DIR = join(process.cwd(), 'dist')

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf-8')
  return raw ? JSON.parse(raw) : {}
}

function matchExpectation(question: string) {
  return TESTSET.find((expectation) => expectation.question === question)
}

async function answerBoth(question: string) {
  const [baselineAnswer, groundedAnswer] = await Promise.all([
    ask(BASELINE_SYSTEM_PROMPT, question),
    ask(groundedSystemPrompt(), question),
  ])
  const expectation = matchExpectation(question)
  return {
    baseline: { answer: baselineAnswer, grade: expectation ? grade(baselineAnswer, expectation) : null },
    grounded: { answer: groundedAnswer, grade: expectation ? grade(groundedAnswer, expectation) : null },
    mock: isMockProvider(),
  }
}

async function runEval() {
  const rows = await mapWithConcurrency(TESTSET, 4, async (expectation) => {
    const [baselineAnswer, groundedAnswer] = await Promise.all([
      ask(BASELINE_SYSTEM_PROMPT, expectation.question),
      ask(groundedSystemPrompt(), expectation.question),
    ])
    return {
      id: expectation.id,
      question: expectation.question,
      baseline: { answer: baselineAnswer, grade: grade(baselineAnswer, expectation) },
      grounded: { answer: groundedAnswer, grade: grade(groundedAnswer, expectation) },
    }
  })

  const totals = {
    baseline: rows.filter((row) => row.baseline.grade.passed).length,
    grounded: rows.filter((row) => row.grounded.grade.passed).length,
    total: rows.length,
  }

  return { rows, totals, mock: isMockProvider() }
}

async function serveStatic(pathname: string): Promise<{ body: Buffer; type: string } | undefined> {
  const filePath = join(DIST_DIR, pathname === '/' ? 'index.html' : pathname)
  try {
    const body = await readFile(filePath)
    return { body, type: CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream' }
  } catch {
    try {
      const body = await readFile(join(DIST_DIR, 'index.html'))
      return { body, type: CONTENT_TYPES['.html'] }
    } catch {
      return undefined
    }
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

    if (req.method === 'POST' && url.pathname === '/api/ask') {
      const body = (await readJsonBody(req)) as { question?: unknown }
      if (typeof body.question !== 'string' || !body.question.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'question is required' }))
        return
      }
      const result = await answerBoth(body.question)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/eval') {
      const result = await runEval()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
      return
    }

    const file = await serveStatic(url.pathname)
    if (file) {
      res.writeHead(200, { 'Content-Type': file.type })
      res.end(file.body)
      return
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server listening on http://localhost:${PORT}${isMockProvider() ? ' (PROVIDER=mock)' : ''}`)
})
