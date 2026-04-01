# Vale Eval Playbook

One-paragraph summary: This document defines how to test Vale's diagnostic system — the five test personas with scripted openers, the automated checks that run on every diagnosis, the manual review dimensions with scoring rubrics, and the evaluation cadence. Use this as the reference for QA, regression testing, and new team member onboarding.

**Last updated:** 2026-03-10
**Source:** PRD v4 Sections 5 and 6

---

## Test Personas

Five personas designed to exercise different conversation paths, domain depths, and edge cases. Each persona has a scripted opener (their response to the 1-10 scale question), expected behavior at key turns, and expected report output.

### Persona 1: Rinka

**Profile:** 28, engineer, $180K salary, 50K ISOs (mix of ISO/NSO) at pre-IPO company, no advisor, uses TurboTax, no estate plan, single, no dependents.

**Opens:** Rates herself a 3 — "I know I'm probably leaving money on the table but I don't know where to start."

**+2 answer:** "A 5 would mean I understood what my options were worth and had a plan for the tax hit."

**Expected behavior:**
- Turn 3: AI asks about option type (ISO vs NSO). Map shows equity section.
- Turn 5: Observation about exercise timing or ISO/NSO tax treatment difference.
- AI should triage to Equity domain first (she mentions "options" and "tax hit" in +2).
- Should bridge to Taxes (AMT, withholding) and then probe Cash Flow or Investing.

**Expected report:**
- `equity` (L1-2): No exercise strategy. `data_verified: false` unless she provides specific grant details.
- `taxes` (L2): AMT/withholding exposure from ISO exercise. TurboTax may not handle it.
- `cash_flow` or `investing` (L1): No savings or investment framework.
- 3 findings total. No protection finding — she's 28, single, no dependents.

**Tests what:** Equity-heavy conversation, domain triage from +2 answer, appropriate level assignment with limited data.

---

### Persona 2: Chris

**Profile:** 34, PM, $250K salary, married, 1 kid (toddler), homeowner, $400K RSUs vesting, uses Wealthfront, has a CPA but just for filing.

**Opens:** Rates himself a 5 — "I feel like we're doing okay but nothing's really organized."

**+2 answer:** "A 7 would mean I knew our investments, taxes, and house stuff were actually working together."

**Expected behavior:**
- AI should triage to Investing domain (mentions "investments" and "working together").
- Should probe account fragmentation (Wealthfront + 401k + RSU accounts).
- Should bridge to Taxes (RSU withholding, CPA only files), then Protection (kid, no will?).
- Observation about coordination gap between accounts/domains.

**Expected report:**
- `investing` (L2): Account fragmentation, no coordinated allocation.
- `taxes` (L2-3): CPA files but doesn't plan. RSU withholding gap.
- `protection` (L5): Toddler, homeowner, likely no will — urgent.
- 3-4 findings total.

**Tests what:** Multi-domain conversation, coordination insights, protection probe for users with dependents.

---

### Persona 3: Sahil

**Profile:** 35, founder (no salary), spouse earns $450K, two kids (young), $8M NW, multiple accounts, previous exit (Headway), no coordinator.

**Opens:** Rates himself a 4 — "I have a lot of assets but no salary and no one coordinating anything."

**+2 answer:** "A 6 would mean I had a burn rate plan and someone looking at the whole picture."

**Expected behavior:**
- AI should triage to Cash Flow (mentions "burn rate" and "no salary").
- Should explore liquidation strategy (no income, drawing from assets).
- Should bridge to Investing (fragmented accounts, drawdown), then Equity (Headway), then Protection (two kids, significant assets).
- Observation about burn rate + no coordination across accounts.

**Expected report:**
- `cash_flow` (L3): Burn rate exceeds passive income, needs liquidation strategy.
- `investing` (L2): Fragmented accounts, no coordinated drawdown.
- `equity` (L1-2): Headway equity position.
- `protection` (L5): Two young kids, $8M NW, likely needs estate plan update.
- 4 findings across 4 domains.

**Tests what:** Complex user, no-income scenario, posture adjustment (cash flow stress first), 4+ domain coverage.

---

### Persona 4: Maria

**Profile:** 42, physician, $350K salary, married to a teacher, three kids, just inherited $200K, otherwise well-organized.

**Opens:** Rates herself a 6 — "I'm usually on top of things but this inheritance has me out of my depth."

**+2 answer:** "An 8 would mean I knew exactly where to put this money and had the estate stuff handled."

**Expected behavior:**
- AI should triage to Investing (mentions "where to put this money") or Protection ("estate stuff").
- Should explore inheritance allocation — where to deploy $200K.
- Should bridge to Protection — inheritance often triggers estate planning review.
- Observation about inheritance as a trigger for broader estate/protection review.

**Expected report:**
- `investing` (L2-3): Inheritance allocation. Where to deploy $200K given existing portfolio.
- `protection` (L2-3): Estate planning — inheritance received, three kids, likely needs update.
- 2-3 findings total. Simpler diagnosis — she's otherwise well-organized.

**Tests what:** Life event trigger (inheritance), appropriate simplicity (don't manufacture complexity), protection finding for user with dependents.

---

### Persona 5: Empty Basket

**Profile:** Vague, provides minimal information, doesn't go deep on anything.

**Opens:** Rates themselves a 5 — "I feel like I should be doing more with my money?"

**+2 answer:** "A 7 would mean I had a plan instead of just guessing."

**Expected behavior:**
- AI should triage to Cash Flow (vague, mentions "money" and "plan" — default path).
- AI should try to probe but respect brevity if answers are thin.
- Should still generate 1-2 observations from whatever signal exists.
- Should close gracefully after 10-12 turns even with limited info.

**Expected report:**
- 1-2 findings max. No forced findings.
- Likely: `investing` or `cash_flow` (L1) — "no framework for where money goes."
- Headline should acknowledge limited info honestly.
- Graceful experience — user should not feel judged for being vague.

**Tests what:** Edge case — minimal information. Graceful degradation. AI doesn't manufacture findings. Empty basket is valid.

---

## Automated Checks (Every Diagnosis)

These checks run on the JSON output from `/api/diagnosis`. They're validation rules — automated quality gates.

| Check | Rule | Action on Fail |
|---|---|---|
| **Finding count** | 1-7 findings in `diagnosed_gaps` | Log warning. >7 = likely over-diagnosis. 0 = broken. |
| **Level enforcement** | If `data_verified: false`, level must be ≤ 2 | Auto-downgrade to L2 in renderer |
| **Level 5 exception** | Level 5 exempt from `data_verified` check | No action needed |
| **Grounding** | `grounded_in` must be non-empty for every finding | Block finding from rendering |
| **Domain coverage** | 2+ unique domains across all findings | Log warning |
| **Domain validity** | Every `domain` must be one of: `cash_flow`, `investing`, `taxes`, `equity`, `protection` | Block finding |
| **Urgency validity** | Every `urgency` must be one of: `act_now`, `plan_ahead`, `investigate` | Default to `investigate` |
| **Headline quality** | `headline` is non-empty | Block report render |
| **Primary finding exists** | `primary_finding` object is present | Log error |
| **involves_equity strictness** | If `primary_finding.involves_equity: true`, primary finding domain should be `equity` | Log warning |

### Implementation Status

Currently: these checks exist as rules in the diagnosis prompt and the PRD. They are NOT yet implemented as automated validation code.

**TODO:** Add a validation layer in `diagnosis.js` (or a shared utility) that runs these checks on the raw JSON before returning to the frontend. Log violations to Supabase for monitoring.

---

## Manual Review Dimensions

For human evaluation of conversation + report quality. Score each dimension 1-5.

| Dimension | What to evaluate | 1 (fail) | 3 (acceptable) | 5 (excellent) |
|---|---|---|---|---|
| **Naturalness** | Does the conversation feel like talking to an advisor? | Robotic, formulaic, checklist-like | Functional but some awkward transitions | Best 5 minutes with a financial advisor |
| **Specificity** | Does the AI reference the user's actual situation? | Generic education, could apply to anyone | Some specific references, some generic | Every response references their numbers, dates, circumstances |
| **False findings** | Are there findings not supported by the conversation? | 2+ fabricated or unsupported findings | 1 borderline finding | 0 false findings |
| **Observation quality** | Do observations meet 2-of-3 criteria? Emerge naturally? | Generic observations, forced timing | Meet criteria but feel mechanical | "I hadn't considered that" reaction, naturally timed |
| **Fiduciary compliance** | Honest about uncertainty? No promotional language? | Dollar figures presented as facts, "savings found" language | Mostly compliant with minor issues | "Areas identified for review" tone, honest about unknowns |
| **Domain coverage** | Are relevant domains explored? | Only 1 domain, missed obvious gaps | 2-3 domains, some gaps missed | 3+ domains, followed implications naturally |
| **Closing quality** | Does closing build anticipation without spoiling? | Lists all findings in closing message | Adequate close but too much revealed | Hints at significance, builds anticipation, uses name |
| **Map accuracy** | Does the map reflect what was discussed? | Missing major items, wrong statuses | Most items present, some status issues | Comprehensive, accurate statuses, good labels |

### Scoring

- **Pass:** Average score ≥ 3.0, no dimension below 2
- **Strong pass:** Average score ≥ 4.0
- **Fail:** Any dimension at 1, or average below 3.0

---

## How to Log Results

### Per-Session Logging (Automated)

Every conversation is logged to Supabase via `logTurn()` and `logError()` in `_lib/log.js`. Captures:
- Session ID
- Turn number
- User message and AI response
- Observations generated
- Map state at each turn
- Whether intake completed

### Eval Logging (Manual)

When running eval personas, log to a shared spreadsheet or document:
1. Persona name
2. Date
3. Transcript (or link to Supabase session)
4. Manual review scores (8 dimensions)
5. Automated check results (pass/fail per check)
6. Notes on failures or interesting behavior
7. Action items for prompt changes

---

## Evaluation Cadence

| Cadence | What to run | Who |
|---|---|---|
| **Per-deploy** | Rinka + Empty Basket | Engineer deploying (manual, ~10 min) |
| **Weekly** | All 5 personas | PM (Sahil) or engineer (~30 min) |
| **Monthly** | 3-5 real users (friendly strangers) | PM + friendly users (~2 hours) |

### Pre-Launch (before March 16 demo)

1. **Founder dogfood** — Sahil runs through as himself (Persona 3)
2. **Friendly strangers** — 3-5 people in target demo, no coaching
3. **Investor dry run** — 2-3 investors, live demo

### Post-Launch Metrics

| Metric | Target |
|---|---|
| Completion rate | >70% start → report |
| Time to report | 3-5 min median |
| Finding accuracy | <10% false findings |
| CTA click rate | >40% |
| 7-day return | >25% |
