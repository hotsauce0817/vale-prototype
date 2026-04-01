# Vale PRD: Diagnostic Intake + Report
### v4.0 — March 7, 2026
### Updated with founder feedback on domains, levels, pricing, and fiduciary standards

---

## 1. What We're Building and Why

Vale's core experience is a **diagnostic conversation that builds a visual picture of the user's financial life in real time, culminating in a report that identifies coordination gaps and creates doors to deeper exploration.**

This is the best 5 minutes a user has ever spent with a financial advisor. Not because it's flashy — because it sees what nobody else sees. The CPA files but doesn't plan. The broker manages but doesn't coordinate. Nobody tells you what you're missing. Vale does.

This PRD covers:

**The Intake** — A conversational AI that builds a structured "map" of the user's financial life progressively as they talk. The AI earns trust by demonstrating it's connecting dots nobody else connects.

**The Report** — A persistent artifact with finding cards, each at a specific level reflecting how much Vale knows. The report is the user's home screen — always current, always actionable.

### What success looks like

A user completes the intake and sees a report that surfaces things they didn't know they needed to worry about — grounded in what they told us, not fabricated. They feel seen, not sold to. At least one finding makes them think: "Nobody has ever told me this."

### MVP for March 16 Demo

1. User lands on page, conversation starts immediately (no signup)
2. Split-screen intake works with live AI driving conversation and map
3. Transition animation plays after conversation concludes
4. Report renders with AI-generated findings
5. Finding cards display with levels and CTAs (CTAs don't need to route anywhere)

What can be cut: accounts, persistence, working CTAs, error recovery, multi-session.

---

## 2. Fiduciary Standards

Vale is registering as an SEC RIA. **Every interaction is a fiduciary interaction.** This isn't a tone guideline — it's a legal and ethical obligation that shapes every product decision.

### Core Principles

**Act in the client's best interest.** Every finding, every recommendation, every CTA must serve the user's financial wellbeing — not Vale's conversion metrics. If the honest answer is "your current setup is working," that's what the report says.

**Never overstate what we know.** The 401K false positive from dogfooding is a fiduciary failure: we told a user they were leaving $11K on the table when they weren't. The AI must never present inferences as facts. If data hasn't been verified, the finding must say so.

**Never fabricate dollar estimates.** During dogfooding, the AI claimed "$30-60K in tax savings" with no basis. This is a fiduciary violation. The AI should avoid presenting specific dollar figures as precise facts. When the AI does estimate (which it will — it's useful for context), estimates must be clearly framed as approximate: "roughly," "in the range of," "approximately." The long-term solution is dedicated calculation tools that produce verified numbers; until those exist, the `data_verified` flag and level enforcement prevent estimates from being treated as confirmed findings.

**Disclose uncertainty.** When the AI doesn't know enough to advise, it must say so clearly. "This is worth investigating" is honest. "You should do X" without supporting data is not.

**Present both sides of tradeoffs.** When a finding involves competing priorities (e.g., maximize tax-deferred growth vs. preserve liquidity), the AI must surface both sides. This is why Level 4 exists.

**Respect existing professionals.** Never: "Your advisor is doing a bad job." Instead: "There may be a coordination gap between your investment management and your tax planning." The user chose their professionals. Vale identifies what falls between them.

**No steering toward Vale products.** The AI must never recommend custody transfer, subscription upgrades, or Vale services as a finding. These emerge naturally in the exploration phase when they genuinely serve the strategy — not in the diagnostic.

### How These Principles Appear in the Product

- **Findings language:** "Areas identified for review" not "savings found"
- **Level assignment:** No Level 3+ without verified data (see 4.4)
- **Observation quality:** Observations demonstrate expertise, they don't sell the product
- **Report headline:** Frames the situation, doesn't dramatize it
- **CTA labels:** Action-oriented and neutral ("Explore strategy", "Walk through these") not promotional ("Unlock savings", "Start saving now")

---

## 3. The Intake

### 3.1 Interaction Paradigm

The layout transitions as the conversation progresses:
- **Turns 1-2:** Full-width chat (100%). No map visible. The AI asks the scale question and "+2" follow-up.
- **First real data share (turn 3+):** Map slides in from the right. Chat smoothly narrows. The user watches their financial picture take shape as they talk.
- **From then on:** Split-screen — Left (44%) conversational chat + Right (56%) progressive financial map.

### 3.2 Entry Point

No signup, no onboarding, no name capture. The AI opens with a warm greeting, then asks: "On a scale of 1 to 10, how in control do you feel of your financial life right now?" After the user answers, follows up: "What would it take to get you to a [score + 2]?" (or "What's keeping it from being a perfect 10?" for 9-10). If the user arrived through a life event entry, the scale is scoped: "How confident are you that you're handling [event] well?"

### 3.3 The Conversation

**Opening:** Scale question (1-10 "how in control") followed by "+2" follow-up. The +2 answer is the AI's primary triage signal — it reveals what the user thinks their gap is. The AI uses this to decide which domain to probe first. The delta between the user's perceived gap and the actual gap (discovered through conversation) drives the strongest observations.

**Middle:** AI follows the user's lead, ensures breadth across the five domains (see Section 4.1) plus protection basics. Typically 6-10 turns, 3-5 minutes.

**Observations:** Brief insights that connect dots. Must meet 2-of-3 criteria:
1. Domain expertise
2. Situation-specific
3. Reveals connections between domains

Observations emerge naturally — not on a schedule. If the AI reaches turn 6 with no observations, that's a signal it isn't probing deeply enough, not a trigger to manufacture one. The AI should never force an observation where one doesn't exist.

**Closing:** AI signals transition. Hints at findings without specifics.

### 3.4 The Map

The map panel starts hidden (0 width) and slides in when the AI first calls `update_map` — typically turn 3+, when the user shares substantive financial details. The chat smoothly narrows from full-width to 44%. This progressive reveal is the signature moment — watching your financial picture take shape as you talk.

Three sections appear implicitly when they have content:

**"Your Situation"** — Household, income, location, life stage, monthly spend
**"What You Have"** — Investment portfolio, retirement accounts, equity compensation, real estate, cash & savings, illiquid holdings, credit lines, other assets
**"What Needs Attention"** — Drawdown strategy, account coordination, equity planning, tax strategy, estate plan, insurance coverage, concentration risk

**Fixed item slots (20 total):** Items come from a predefined registry (`mapRegistry.js`). The AI picks an `item_id` from the menu — it never invents item names. Labels and section placement are automatic from the registry. Calling the same item_id again updates in place (upsert). This prevents the duplication problem where the AI invented new names each turn.

**Color coding reflects diagnostic assessment (4 statuses):**
- **Gray (neutral):** Just learned, no assessment yet
- **Green (good):** Confirmed solid — checked, no issue found
- **Gold (warning):** Worth investigating — something flagged but not yet clear
- **Red (alert):** Needs immediate attention — dot pulses to draw the eye

Items appear with slide-in animation. Existing items highlight briefly (gold pulse) when their detail updates. No domain tags on the map — internal categories (CASH FLOW, EQUITY) stay in the data model for diagnosis, but aren't shown to users.

**Observation-gap connection:** When the AI generates an observation (chat card), it also sets the corresponding gap item on the map with status "alert." The observation explains the insight conversationally; the gap item makes it persistent and visible on the map.

**Map → Report transition:** The map does NOT persist into the report. It fades during transition. The report synthesizes map data into findings.

### 3.5 Map Update Mechanism

Uses Claude native tool calling. The AI calls `update_map()` as a tool use alongside its response text. The tool-use loop resolves all tool calls server-side.

Tool schema:
```
update_map {
  item_id: enum (20 fixed slots from mapRegistry.js)
  detail: string (specific text using user's actual numbers/names)
  status: "neutral" | "good" | "warning" | "alert"
}
```

All three fields required. No `action`, `section`, `key`, `label`, or `domain` fields — these were removed to prevent duplication and simplify the interface.

### 3.6 Conversation Quality

Every response should: open a new domain, deepen an existing one, or surface a connecting observation.

Must NOT: ask multiple questions per turn, repeat user info, generate dollar estimates, use unexplained jargon, close prematurely.

Turn limits: soft cap 12, hard cap 15.

### 3.7 Transition

1. AI delivers closing message
2. Chat fades
3. Transition animation (~3.5s)
4. Report renders

Readiness: 3+ of 5 domains touched, 2+ gaps identified, income structure described, 6+ turns.

### 3.8 Diagnosis: A Separate AI Call

After conversation concludes, a **separate prompt** produces the report. Why separate: conversation AI optimizes for rapport, diagnosis AI optimizes for accuracy.

Input: full transcript + map state + system context.

Output: see Section 4.3 for schema.

---

## 4. The Report

### 4.1 Domains

Five domains on the report, aligned with the pitch and the product roadmap:

| Domain | What it covers |
|---|---|
| `cash_flow` | Budgeting, spending, savings rate, debt management, emergency fund, liquidity, burn rate, liabilities (mortgage, loans, SBLOC) |
| `investing` | Portfolio allocation, retirement accounts, drawdown strategy, concentration risk, rebalancing, asset location, vehicle selection |
| `taxes` | Filing, planning, optimization, estimated payments, state coordination, capital gains strategy |
| `equity` | Options, RSUs, exercise strategy, tender planning, 83(b), concentration risk from equity, vesting |
| `protection` | Estate (wills, trusts, guardianship) + Insurance (life, disability, property, liability) |

**Life events are NOT a domain.** They're triggers that create findings across multiple domains. An equity event creates findings in `equity`, `taxes`, and `investing`. A first child creates findings in `protection` and `cash_flow`. A home purchase creates findings in `cash_flow` (mortgage payments), `taxes` (deductions), `investing` (down payment source), and `protection` (homeowner's insurance). Life events are metadata on the user's context, not a finding category.

**Real estate is not a domain.** Real estate findings are tagged with the domain they primarily affect: a mortgage is `cash_flow`, a rental property return is `investing`, property tax planning is `taxes`, homeowner's insurance is `protection`.

### 4.1.1 Diagnostic Reasoning: The 3-Layer Pipeline

While the report has 5 domains, the AI's diagnostic reasoning within the cash_flow + investing space follows a **3-layer pipeline** inherited from the current system prompt. This pipeline determines how the AI probes and where it starts:

**Layer 1: Cash Flow Health** — Is income covering expenses? Are there liquidity concerns? Is debt managed intelligently? This layer detects whether cash flow is a constraint on everything else. If someone is drowning in student loans or spending anxiety, talking about portfolio construction is tone-deaf.

**Layer 2: Savings Adequacy** — Is the savings rate appropriate? Are savings directed to the right vehicles? Is the employer match being captured? "Not maxing employer match" is an immediate, quantifiable finding.

**Layer 3: Portfolio Construction** — Is the portfolio appropriate for their situation? Are assets in the right account types? Is there dangerous concentration?

**Posture adjustment:** If Layer 1 reveals significant cash flow stress, the AI adjusts the entire diagnostic. Don't probe portfolio construction if the person is worried about making rent. The diagnostic still covers the domains, but the tone shifts from optimization to foundation-building.

**How the layers map to report domains:**
- Layer 1 findings → `cash_flow` domain on the report
- Layer 2 findings → `cash_flow` (savings rate, emergency fund) or `investing` (vehicle selection, employer match)
- Layer 3 findings → `investing` domain on the report

The pipeline is a diagnostic tool — how the AI thinks. The domains are a reporting taxonomy — how the user sees findings. They're connected but distinct.

### 4.2 Report Structure

**Hero:** Headline (one sentence) + finding count + "areas identified for review."

**Finding cards:** See 4.3.

**Closing:** "Each finding can be explored further to collect information, model options, and take action."

### 4.3 Finding Card Schema

```json
{
  "headline": "One sentence framing the user's situation",
  "finding_count": 4,
  "findings": [
    {
      "id": "string",
      "title": "Specific finding headline",
      "summary": "One sentence explanation",
      "domain": "cash_flow | investing | taxes | equity | protection",
      "level": 1,
      "urgency": "act_now | plan_ahead | investigate",
      "tags": ["data point 1", "data point 2"],
      "cta_label": "Right next action",
      "grounded_in": ["User said: '...'"],
      "data_verified": false
    }
  ]
}
```

### 4.4 The Level Framework

Every finding has a level reflecting how much Vale knows — and what the right next step is. The CTA is the same for all users. Free and paid users diverge in the experience AFTER clicking, not on the card itself.

| Level | Meaning | CTA | Unlocked by |
|---|---|---|---|
| 1 | Signal detected, need more context | "Tell me more" / "Share [data]" | Conversational mention |
| 2 | Can explain why it matters | "Understand why this matters" / "Explore" | Enough context to educate |
| 3 | Can model scenarios | "Model my scenarios" / "Run the numbers" | Verified data (`data_verified: true`) |
| 4 | Needs decision with tradeoffs | "Walk through this decision" | Modeling complete, genuine tradeoff |
| 5 | Ready to act | "Get this started" | Clear action path |

**What happens after the click — this is where free and paid diverge:**

- **Level 4:** Everyone gets the AI walking through both sides of the tradeoff. Paid users additionally get a human advisor who reviews and validates the decision.
- **Level 5:** Everyone gets the AI's recommended action steps. Paid users additionally get Vale executing those steps (filing, rebalancing, coordinating with professionals, etc.).

The card itself never says "upgrade" or "paid feature." The user clicks the CTA, gets value from the AI, and if they want human validation or hands-off execution, that's presented as an option within the flow — not as a gate before it.

### 4.5 Level Assignment Enforcement

**Hard rule:** If `data_verified === false` and level is 3 or 4, the report renderer downgrades to Level 2.

Level 5 is exempt — some actions are clear without verified data (e.g., "you need a will").

### 4.6 Urgency

Three levels, simplified from the original four:

| Urgency | Meaning | Tag label |
|---|---|---|
| `act_now` | Deadline exists or money is being lost | "Act now" |
| `plan_ahead` | No deadline but the window closes | "Plan ahead" |
| `investigate` | Worth looking into, no urgency | "Investigate" |

### 4.7 Finding Quality Standards

- **Grounded:** `grounded_in` must be non-empty
- **Specific:** References user's actual situation, not generic advice
- **Actionable:** Every finding has a CTA
- **Honest about uncertainty:** Dollar estimates are framed as approximate, not precise. Findings with estimates stay at Level 1-2 until data is verified.
- **Fiduciary:** Serves the client's interest (see Section 2)

### Gold-Standard Diagnosis Example

**User:** 28-year-old engineer, $180K, 50K ISOs at pre-IPO company, renting, no advisor, TurboTax, wants "an app that makes a plan."

```json
{
  "headline": "You have meaningful equity that could become your largest asset — and no one is helping you plan for it.",
  "finding_count": 3,
  "findings": [
    {
      "id": "equity-planning",
      "title": "50,000 ISO options with no exercise strategy",
      "summary": "ISOs have specific tax treatment and timing considerations that affect how much you keep in a liquidity event.",
      "domain": "equity",
      "level": 1,
      "urgency": "plan_ahead",
      "tags": ["50K ISOs", "Pre-IPO", "Exercise timing"],
      "cta_label": "Share your grant details",
      "grounded_in": ["User said: 'I have about 50,000 stock options'", "User said: 'I think they're ISOs'"],
      "data_verified": false
    },
    {
      "id": "tax-exposure",
      "title": "TurboTax may not handle the tax complexity ahead",
      "summary": "Exercising ISOs can trigger AMT, which standard tax software handles mechanically but doesn't help you plan around.",
      "domain": "taxes",
      "level": 2,
      "urgency": "plan_ahead",
      "tags": ["TurboTax", "AMT exposure", "ISO exercise"],
      "cta_label": "Understand why this matters",
      "grounded_in": ["User said: 'I just use TurboTax'", "Inferred: ISO exercise creates AMT exposure"],
      "data_verified": false
    },
    {
      "id": "no-financial-framework",
      "title": "No spending, savings, or investment framework beyond a 401K",
      "summary": "You're about to receive a significant payout with no plan for where it goes — savings rate, vehicle selection, and allocation all need to be addressed.",
      "domain": "cash_flow",
      "level": 1,
      "urgency": "investigate",
      "tags": ["No budget", "No investment plan", "401K only"],
      "cta_label": "Build your financial picture",
      "grounded_in": ["User said: 'I want an app that makes a plan'", "User said: 'bonds, ETFs, I don't know what any of those mean'"],
      "data_verified": false
    }
  ]
}
```

---

## 5. Guardrails

### 5.1 Accuracy
- No fabricated numbers presented as precise facts (fiduciary obligation — see Section 2)
- Dollar estimates are acceptable when clearly framed as approximate ("roughly $X", "in the range of $X-Y")
- Confidence language matches actual confidence
- Level enforcement via `data_verified` (4.5) — prevents estimates from reaching Level 3+
- **Known gap:** Calculation tools (for verified, precise numbers) are a future build. Until then, the AI estimates and the level framework prevents overconfidence.

### 5.2 Scope
- 3-6 solid findings over 7 vague ones
- Don't diagnose what you can't explain in plain language
- Only reference what the user shared

### 5.3 Error States

**Invalid diagnosis JSON:** Show map items as summary + "Try again."

**Empty Basket (minimal info after 10 turns):** Graceful close with 1-2 findings.

**User asks questions instead of sharing:** Acknowledge, note for report, redirect.

**Sensitive data:** Never echo SSNs, account numbers, passwords.

---

## 6. Evaluation Framework

### 6.1 Automated Checks (every diagnosis)

| Check | Rule | Action on fail |
|---|---|---|
| Finding count | 1-7 | Log warning |
| Level enforcement | L3-4 requires `data_verified: true` | Auto-downgrade to L2 |
| Grounding | `grounded_in` non-empty | Block finding |
| Domain coverage | 2+ unique domains | Log warning |
| Domain validity | Only `cash_flow`, `investing`, `taxes`, `equity`, `protection` | Block finding |
| Urgency validity | Only `act_now`, `plan_ahead`, `investigate` | Default to `investigate` |

### 6.2 Manual Review

| Dimension | Target |
|---|---|
| Naturalness | Feels like best 5 minutes with an advisor (1-5) |
| Specificity | References user's actual situation |
| False findings | 0 |
| Observation quality | 2-of-3 criteria met, emerged naturally |
| Fiduciary compliance | No promotional language, both sides of tradeoffs presented |

### 6.3 Test Personas

**Persona 1: Rinka** — 28, engineer, $180K, 50K ISOs, no advisor, TurboTax
- Opens: Rates herself a 3 — "I know I'm probably leaving money on the table but I don't know where to start." +2 answer: "A 5 would mean I understood what my options were worth and had a plan for the tax hit."
- Expected by turn 3: AI asks about option type. Map shows equity.
- Expected by turn 5: observation about exercise timing or tax treatment.
- Report: equity (L1-2, no exercise strategy), taxes (L2, AMT/withholding exposure), cash_flow or investing (L1, no savings or investment framework). 3 findings. No protection finding — she's 28, single, no dependents.

**Persona 2: Chris** — 34, PM, $250K, married, kid, house, $400K RSUs, Wealthfront
- Opens: Rates himself a 5 — "I feel like we're doing okay but nothing's really organized." +2 answer: "A 7 would mean I knew our investments, taxes, and house stuff were actually working together."
- Expected: investing finding (fragmentation), taxes finding (coordination), protection (L5). 3-4 findings.

**Persona 3: Sahil** — 35, founder, $0, spouse $450K, two kids, $8M NW
- Opens: Rates himself a 4 — "I have a lot of assets but no salary and no one coordinating anything." +2 answer: "A 6 would mean I had a burn rate plan and someone looking at the whole picture."
- Expected: cash_flow (burn rate/liquidation), investing (fragmented accounts, drawdown), equity (Headway), protection (estate). 4 findings across 4 domains.

**Persona 4: Maria** — 42, physician, $350K, married to teacher, three kids, inherited $200K
- Opens: Rates herself a 6 — "I'm usually on top of things but this inheritance has me out of my depth." +2 answer: "An 8 would mean I knew exactly where to put this money and had the estate stuff handled."
- Expected: investing (inheritance allocation), protection (estate planning). 2-3 findings.

**Persona 5: Empty Basket**
- Opens: Rates themselves a 5 — "I feel like I should be doing more with my money?" +2 answer: "A 7 would mean I had a plan instead of just guessing."
- Expected: 1-2 findings. Graceful experience.

### 6.4 Cadence

- **Per-deploy:** Rinka + Empty Basket
- **Weekly:** All 5 personas
- **Monthly:** 3-5 real users

---

## 7. User Testing

### Pre-Launch (before March 16)

1. Founder dogfood (Sahil, live)
2. Friendly strangers (3-5, target demo, no coaching)
3. Investor dry run (2-3, live)

### Post-Launch Metrics

| Metric | Target |
|---|---|
| Completion rate | >70% |
| Time to report | 3-5 min median |
| Finding accuracy | <10% error |
| CTA click rate | >40% |
| 7-day return | >25% |

---

## 8. Documentation

### Create During Build

| Document | Purpose |
|---|---|
| `architecture.md` | System overview, data flow, file responsibilities |
| `system-prompt.md` | Intake prompt, annotated. Guardrails traceable to this PRD. |
| `diagnosis-prompt.md` | Diagnosis prompt. I/O contract. Gold-standard examples. |
| `findings-schema.md` | JSON schema. Level × domain examples. Edge cases. |
| `eval-playbook.md` | Persona scripts. Automated checks. Scoring rubrics. |
| `design-tokens.md` | Colors, type, spacing, animations. Brand rationale. |
| `lessons.md` | Dogfooding learnings. Continuously updated. |

### Standards

- One-paragraph summary at top
- "Last updated" date
- Explain WHY, not just WHAT
- Written for a new engineer — no assumed context
- **Velocity with compounding quality**

---

## 9. Open Questions

1. Persistence (database, accounts) — session-only for MVP
2. Exploration architecture — Phase 3
3. New finding discovery mechanism — Phase 3
4. Multi-user (spouse/partner) — affects data model, punted
5. Account connections (Plaid, uploads) — Phase 2
6. **Calculation tools** — The AI currently estimates dollar figures, which we know from dogfooding can be wrong ($30-60K claimed vs. $15-25K actual). The architecture calls for domain-specific calculation tools (tax math, exercise modeling, SBLOC interest) that produce verified numbers. Until those tools exist, the `data_verified` flag stays `false` on all AI-estimated findings, and the level framework prevents overconfident presentation. This is a known gap, not a blocker — the diagnostic is valuable even with estimates, and the level enforcement prevents the 401K false positive pattern.

---

*v4.0 changes: Removed prescribed observation frequency (#1). Color codes status not domain (#2). Added Fiduciary Standards as Section 2 (#3, #7). Domains expanded to 5 with cash_flow split from investing, aligned with pitch and current system prompt's 3-layer pipeline (#4). Urgency simplified to 3 (#5). Levels available to all users with free/paid CTA variants (#6). 3-layer diagnostic reasoning (cash flow → savings → portfolio) preserved from current system prompt with posture adjustment rule (#4). Real estate handled as cross-domain context, not its own domain.*
