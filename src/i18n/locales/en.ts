export const en = {
  meta: {
    title: 'Grounded Answers',
  },
  topbar: {
    brand: 'Grounded Answers',
    language: 'Language',
    skip: 'Skip to content',
  },
  masthead: {
    eyebrow: 'Audit prototype · stow.mystorage.vn',
    title: "Grounding the MyStorage assistant's numbers",
    lede: 'The production assistant writes prices and coverage limits as free-form prose. This page shows where that goes wrong, and a fix that reads every figure from the published source.',
    capturedAt: 'Conversation captured {{date}}',
    source: 'Source of truth: {{label}}',
    author: 'Bùi Công Vinh · Product Engineering Intern',
  },
  notice: {
    body: "Independent prototype for a hiring assignment, not an official MyStorage product. Reference data comes from {{label}} — the company's public, machine-readable description of itself, verified {{date}}.",
  },
  diagnosis: {
    eyebrow: 'Diagnosis',
    title: 'Six defects, one root cause',
    body: "Prices that don't match the advertised price, coverage limits described vaguely, an hourly rate never stated, a temperature range that changes between two answers. Taken one by one, that's four bugs; taken together, it's one: the assistant generates figures as free-form prose, so their accuracy depends on each individual generation. Let the model write the words — not the numbers.",
  },
  compare: {
    current: 'Current',
    proposed: 'Proposed',
    evidence: 'Original conversation, in Vietnamese',
  },
  grade: {
    pass: 'PASS',
    fail: 'FAIL',
    ungrounded: 'Ungrounded',
    grounded: 'Grounded',
  },
  ask: {
    eyebrow: 'Live demo',
    title: 'Ask one question, see two answers',
    body: "The same question, sent to the same model with two different system prompts: one with no data at all (my reconstruction of an assistant that hasn't been grounded — not MyStorage's real prompt, which I don't have access to), and one with the figures table from <code>groundTruth.ts</code>.",
    label: 'Your question',
    placeholder: 'e.g. What is the maximum payout on the Silver protection plan?',
    submit: 'Ask',
    loading: 'Asking…',
    examples: 'Try one',
    mock: 'MOCK PROVIDER — not a real model answer, only for checking the connection.',
    serverError:
      'Couldn\'t reach the API server (status {{status}}). This may be the static deploy — running it needs npm run dev on a local machine (with an API key). See "Graded question set" below for real results from a saved run.',
  },
  evalRunner: {
    eyebrow: 'Graded question set',
    title: 'Run 15 questions through both prompts',
    body: 'Each question has a machine-checkable expectation — a figure that must be stated correctly, a string that must appear, or a request that must be declined. The "ungrounded" column uses my reconstructed prompt, not MyStorage\'s real one.',
    run: 'Run live (needs local server)',
    running: 'Running…',
    serverStatus: 'Server returned {{status}}',
    liveError:
      "Couldn't reach the API server ({{message}}). This may be the static deploy — the results below are still real results from the most recent saved run, not fake numbers. Run npm run dev locally (with an API key) to run it live yourself.",
    mock: 'MOCK PROVIDER — the scores below are not real results, only for checking the connection.',
    cached:
      'Most recent real run, saved {{capturedAt}} via {{provider}}/{{model}} — not fake numbers, just not run this very moment. Press the button above to try it live (needs the server and an API key locally).',
    live: 'The scores below were just run live against the real API, not fake numbers.',
    issues: 'Issues (grounded)',
  },
  fix1: {
    eyebrow: 'Fix 1',
    title: 'Protection: a recommendation with no ceiling',
    flag: "Silver's ceiling is 25,000,000 VND — the customer declared 20 million, leaving only 5 million of headroom, and the answer never states that figure.",
  },
  fix2: {
    eyebrow: 'Fix 2',
    title: 'Pricing: llms.txt advertises "from 559,000", the chat starts at 779,000',
    flag: 'None of these reaches the "from 559,000 VND/month" price that llms.txt advertises, and nothing explains why.',
    explainer:
      "The assistant still writes the quote, but every price is checked against the published floor before it goes out. If it drifts, the ops team gets flagged — the customer isn't the one who finds out.",
  },
  factcard: {
    source: 'source: {{label}}',
    advertisedFrom: 'Advertised (llms.txt) from',
    lowestInChat: 'Lowest in chat',
    gap: 'Difference',
    drifted:
      'A {{gap}}/month gap against the "from" price {{label}} advertises. One of two things has to change: update the floor price, or have the assistant say which plan actually carries {{floor}}.',
    matches: 'The chat price matches the floor price per {{label}}.',
    protectionTitle: 'Maximum payout by plan',
    colPlan: 'Plan',
    colFee: 'Fee',
    colCap: 'Maximum payout',
    recommended: 'Recommended',
    headroom:
      'You declared {{declared}} — the {{tier}} plan has {{headroom}} of headroom before its ceiling. Adding items beyond that means upgrading to {{next}}.',
    nextFallback: 'a higher plan',
    basicLimit: 'The {{tier}} plan is limited to {{perCbm}}/m³ and at most {{cap}} per contract.',
  },
  plans: {
    tiers: {
      basic: 'Basic',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
    },
    price: {
      free: 'Free',
      surcharge: 'Monthly surcharge',
    },
  },
  services: {
    'air-conditioned': 'Air-Conditioned Storage',
    furniture: 'Furniture Storage',
    luggage: 'Luggage Storage',
  },
  evalPanel: {
    eyebrow: 'Automated checks',
    title: '7 checks run on the captured conversation itself',
    body: 'Every finding in the report is a runnable assertion, not a screenshot. Re-run it with <code>npm run eval:transcript</code> — it exits non-zero while defects remain, so it plugs straight into CI.',
    score: 'checks passing',
    transcript: 'transcript {{id}}',
    expected: 'Source',
    observed: 'Observed',
    impact: 'Impact',
  },
  severity: {
    high: 'high',
    medium: 'medium',
    low: 'low',
  },
  footer: {
    run: '<strong>Try it:</strong> <code>npm install</code> → <code>npm run dev</code> to view this page, <code>npm run eval:transcript</code> to run the 7 checks in the terminal, or <code>npm run eval</code> to run the 15 questions through both prompts.',
    source:
      "Reference data: <a>{{label}}</a> (verified {{date}}) · original conversation captured {{capturedAt}} on the applicant's own account; phone number and email are redacted in the repo.",
  },
} as const

type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> }

export type Messages = Shape<typeof en>
