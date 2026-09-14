# Audit — stow.mystorage.vn

**Session:** 2026-09-14, my own account (same email and phone as this application).
**Method:** one customer conversation in Vietnamese and English about pricing, service
differences, out-of-scope requests and protection plans. Every assistant answer was then
compared against the company's own published figures in `mystorage.vn/llms.txt` and the FAQ
it links to.

Each finding below is encoded as a check in `src/lib/factCheck.ts` and runs against the
captured transcript with `npm run eval`, so none of it has to be taken on trust.

---

## The pattern behind the findings

Four of the six defects are the same defect: **the assistant produces figures as free prose,
so accuracy depends on the generation rather than on a source of truth.** Prices drift from
what the website advertises, published ceilings get softened into "tens to hundreds of
millions", a rate the site states plainly is replaced by a link, and one spec changes between
two turns of the same conversation.

The prose is the model's job. The numbers should not be.

---

## F1 — Chat prices never reach the advertised floor price · **High**

**What happened.** Asked "Storage máy lạnh giá bao nhiêu/tháng?", the assistant quoted
1,634,000 VND/month (self storage, 2 CBM), 1,028,000 (valet, 2 CBM) and 779,000 (valet,
1 CBM). The public service page advertises air-conditioned storage **from 559,000 VND/month**.
The lowest number in the entire conversation is 39% above the advertised floor, and nothing in
the answer reconciles the two.

**Steps to reproduce.** Open a new chat → send `Storage máy lạnh giá bao nhiêu/tháng?` → compare
the lowest quote against the "from" price on
`mystorage.vn/services/air-conditioned-storage/` (also in `llms.txt`).

**Why it matters.** The customer has usually already seen the 559,000 figure — it is the number
the site is marketed on. Being quoted 779,000 as the cheapest option at the first question reads
as bait pricing, at precisely the moment the customer is comparing against competitors. Either
the website's floor price is stale or the assistant is missing the cheapest SKU; both are
revenue-affecting and both are invisible today because nothing compares the two numbers.

**Proposed fix.** Reconcile quotes against the advertised floor before they are sent. Where the
gap is legitimate (e.g. the 559,000 SKU exists only at one branch), the assistant should say so
in the same breath. Where it is not, the drift should raise an alert to operations rather than
wait for a customer to notice. Prototype: `PricingFactCard`.

---

## F2 — A question is dropped when two messages arrive close together · **High**

**What happened.** I sent `cho tôi giá của tất cả chi nhánh đi` ("give me prices for all
branches") and, before a reply arrived, a second question about Self Storage vs Full Service.
The assistant answered the second and never returned to the first. No error, no "let me get back
to that" — the question simply disappeared.

**Steps to reproduce.** Send two messages within a few seconds of each other; only the later one
is answered.

**Why it matters.** Asking for prices across all branches is the strongest buying signal in the
whole session — a customer comparison-shopping on location. It was silently discarded. This is
also a common mobile behaviour, where people send short messages in quick succession.

**Proposed fix.** Queue user turns instead of letting the newest supersede the pending one; or
detect multiple outstanding questions and answer them in order. At minimum, surface an
acknowledgement so the customer knows which question is being answered.

---

## F3 — Published protection ceilings are never stated · **High**

**What happened.** Asked about protection plans, and then explicitly asked for more detail on
the upgraded tiers, the assistant named Silver / Gold / Platinum but gave no ceilings, describing
them as "các mốc hàng chục hay hàng trăm triệu đồng" ("tens to hundreds of millions"). The
company's own FAQ publishes exact figures: **25,000,000 / 50,000,000 / 100,000,000 VND**, with
the free Basic plan at 500,000 VND per CBM capped at 10,000,000 VND.

**Steps to reproduce.** `Nói cho tôi về các gói bảo hiểm bên bạn được không` → `nói thêm về gói
nâng cao đi`. No figure appears in either answer.

**Why it matters.** This is the amount the customer is paid if their belongings are lost. The
information is already public; withholding it in the one place a customer actually asks makes the
plan impossible to evaluate and pushes the decision back to a human agent.

**Proposed fix.** Render the tier table from a single source of truth whenever protection comes
up, the same way the assistant already renders structured Self Storage / Valet comparison cards.
Prototype: `ProtectionPlanCard`.

---

## F4 — "Fully covered" claimed without naming the ceiling · **High**

**What happened.** I declared a value of ~20,000,000 VND. The assistant recommended Silver and
stated its protection "bao quát trọn vẹn giá trị khai báo" ("fully covers the declared value")
without mentioning that Silver's ceiling is 25,000,000 VND.

**Steps to reproduce.** Continue F3's conversation with `khoảng 20 triệu VND`.

**Why it matters.** The recommendation happens to be correct, but the customer is 5,000,000 VND
from the ceiling and cannot tell. One more item stored and they are silently under-covered — a
claim dispute waiting to happen, and one the transcript would show the assistant caused.

**Proposed fix.** Any coverage claim must carry the ceiling it refers to, plus the remaining
headroom. Prototype: `ProtectionPlanCard` with `declaredValue` set.

---

## F5 — A published rate is replaced by a link · **Medium**

**What happened.** Asked `Gửi hành lý theo giờ giá sao?` ("how much is hourly luggage
storage?"), the assistant explained the AutoLocker system and linked to
`booking.mystorage.vn/vi/autolocker` without ever stating the rate. The site publishes
**from 54,000 VND/hour**.

**Why it matters.** An extra click to learn a number the company already advertises, at the point
of highest purchase intent. On mobile the link is also a context switch out of the conversation.

**Proposed fix.** State the published starting rate, then link for live availability.

---

## F6 — The same spec changes between two turns · **Low**

**What happened.** Air-conditioned storage was described as **24–28°C** in one answer and
**25–28°C** in another, in the same conversation.

**Why it matters.** Small on its own, but this is the number a customer storing wine, instruments
or electronics reads most carefully. Two different answers to the same question undermines
confidence in every other figure in the chat.

**Proposed fix.** Read specs from the same source of truth as prices.

---

## Handled well — keep this behaviour

Asked whether I could store a car, the assistant declined clearly, explained why (fire-safety
standards, the warehouse formats it does offer), invented no price, and offered a relevant
alternative. This is exactly the right shape for an out-of-scope request, and the eval has a
passing check to protect it from regressing.

---

## What I built

`Grounded Answers` — a prototype that fixes F3/F4 end to end and demonstrates the approach for
F1.

- `src/data/groundTruth.ts` — every figure the assistant is allowed to state, copied from
  `llms.txt` and the FAQ with the source and verification date attached.
- `src/components/ProtectionPlanCard.tsx` — renders the ceilings, marks the plan that covers the
  declared value, and states the remaining headroom.
- `src/components/PricingFactCard.tsx` — reconciles a quoted price against the advertised floor
  and surfaces the gap.
- `src/lib/factCheck.ts` + `src/evals/run.ts` — the six findings above as deterministic checks
  over the real transcript. `npm run eval` exits non-zero while any check fails, so this belongs
  in CI.

Current result: **1/7 checks pass** against the live assistant's answers.

---

## What I would do with two more hours

<!-- TODO (Vinh): your own answer. Candidates, pick what you actually believe:
     - wire the checks against the live API instead of a saved transcript
     - add a Vietnamese/English language-consistency check
     - extend groundTruth.ts to cover all 8 locations and run a branch-pricing check for F2 -->

## What Claude Code produced that I rejected or rewrote

<!-- TODO (Vinh): this has to be yours and specific — it is the thing they are actually
     screening for. Write what you genuinely changed while building this. -->

## Hours spent

<!-- TODO (Vinh): your real number. -->
