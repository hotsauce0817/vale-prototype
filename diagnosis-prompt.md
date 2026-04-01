# Vale Diagnosis Prompt — Annotated Reference

One-paragraph summary: The diagnosis prompt is a separate system prompt used after the intake conversation ends. It receives the full conversation transcript, financial map state, observations, and closing context, then generates structured findings JSON. This document explains the prompt's I/O contract, design rationale, the gold-standard example, and known edge cases.

**Last updated:** 2026-03-10
**Source file:** `prototype/api/_lib/diagnosisPrompt.js`

---

## Architecture: Why a Separate Prompt

The intake and diagnosis use fundamentally different prompts:

- **Intake prompt** (`systemPrompt.js`) — conversational, progressive, builds rapport. Claude talks to the user.
- **Diagnosis prompt** (`diagnosisPrompt.js`) — analytical, structured output. Claude produces a JSON artifact from the full transcript.

Combining them would force one prompt to be both a conversational partner AND a structured analyzer. Splitting them allows:
1. Each prompt to be optimized independently
2. The diagnosis call to run in parallel with the transition animation (better UX)
3. The diagnosis to see the COMPLETE transcript, not just the last turn

---

## Input Contract

The `buildDiagnosisPrompt()` function assembles the full prompt from four pieces:

```
Base prompt (DIAGNOSIS_PROMPT constant)
  + "## Conversation Transcript" — formatted chat log
  + "## Financial Map State" — JSON snapshot of the map
  + "## Observations Generated During Intake" — numbered list with domains and quality criteria
  + "## Intake Closing Context" — domains explored, observation count, reason for closing
```

**Transcript format:** Plain text with role labels ("User: ..." / "Vale: ..."). The transcript is formatted by the calling code in `diagnosis.js`, not by the prompt itself.

**Map state:** The JSON object from `useDiagnosticChat`'s `mapState` — three sections (situation, assets, gaps), each with visibility flag and items array. Items have key, label, value, status, and domain.

**Observations:** Numbered list with text, domains, and quality criteria met. This gives the diagnosis engine context about what the intake AI already surfaced.

**Closing context:** From `complete_intake` tool call — which domains were explored, how many observations were generated, and why the intake AI decided to close.

---

## Prompt Structure — Section by Section

### Fiduciary Standard

```
You are a fiduciary. Every finding must be:
- Grounded in something the user actually said or revealed
- Honest about confidence level
- Specific to their situation
- Actionable
```

**Why it exists:** PRD Section 2. The diagnosis is the highest-stakes output — it's what the user takes away. Every finding must meet the fiduciary bar. The grounding requirement prevents the AI from manufacturing findings about topics that weren't discussed.

### The Five Domains

Restates the domain taxonomy so the diagnosis engine uses consistent keys. This prevents domain drift (e.g., using "investment" instead of "investing").

### Finding Levels (1-5)

| Level | Meaning | Unlocked by |
|---|---|---|
| 1 | Signal detected, need more context | Conversational mention |
| 2 | Can explain why it matters | Enough context to educate |
| 3 | Can model scenarios | Verified data (`data_verified: true`) |
| 4 | Needs decision with tradeoffs | Modeling complete, genuine tradeoff |
| 5 | Urgent & complex — act now | Clear action path |

**Level enforcement rule:** If `data_verified` is false, the maximum level is 2. This is the critical guardrail from the 401K false positive dogfooding lesson — you cannot assign Level 3+ without concrete, verified data.

**Why Level 5 is exempt:** Some findings are clearly urgent regardless of data precision (e.g., "you need a will and you have two kids"). Level 5 is about urgency + complexity, not data precision.

### Urgency Categories

Three levels: `act_now` (deadline exists), `plan_ahead` (window closes eventually), `investigate` (worth looking into). Simplified from an earlier four-category system.

### Output Format

The diagnosis returns a single JSON object with:

- `name` — user's name if captured
- `headline` — one-sentence synthesis (diagnosis, not summary)
- `total_optimization` — dollar floor with "+" suffix, or null
- `domains_impacted` — array of domain keys
- `expressed_needs` — what the user explicitly said they want (their words)
- `diagnosed_gaps` — array of finding objects (see `findings-schema.md`)
- `cross_domain_insights` — Vale's signature: the coordination insights nobody else catches
- `primary_finding` — the single most important finding, elevated for prominence

### Rules

10 rules governing output quality. Key ones:

- **Rule 1:** 2-5 findings. Quality over quantity.
- **Rule 4:** Every finding MUST have `grounded_in`. Can't ground it? Don't include it.
- **Rule 6:** Headline feels like a diagnosis, not a summary. "You have several areas to address" is BAD. Be specific and direct.
- **Rule 9:** Simple situations get simple diagnoses. Don't manufacture complexity.
- **Rule 10:** `total_optimization` is calculated from individual `dollar_estimate` values. If fewer than 2 findings have estimates, set to null.

---

## Gold-Standard Example

The prompt includes one full gold-standard example for a user profile:
- 28yo engineer, 50K ISOs (mix of ISO/NSO), ~$200K salary
- Company being acquired, no CPA doing strategy
- Used ChatGPT for research, no estate plan

The example produces 3 findings:
1. **Taxes (L4, act_now):** Using ChatGPT to navigate a $47K tax event. Demonstrates: specific dollar estimates, grounded in user's words, cross-domain (equity + taxes).
2. **Equity (L5, act_now):** No exercise strategy with a closing deadline. Demonstrates: highest urgency, specific to acquisition timeline.
3. **Protection (L2, plan_ahead):** No estate plan with incoming assets. Demonstrates: lower level (no verified data needed for "you need a will"), appropriate urgency.

**Why this example matters:** It shows the AI the expected quality bar — specific, grounded, honest about confidence, and with dollar estimates framed as approximate ranges.

---

## Known Edge Cases

### Empty Basket
User gives minimal information over 10+ turns. The diagnosis should produce 1-2 findings max and close gracefully. Don't manufacture findings from thin air.

### No Equity
Many users won't have equity compensation. The `involves_equity` flag on `primary_finding` should be false. Don't force equity findings.

### High Confidence, No Data
User is articulate and confident but provides no concrete numbers. All findings should be Level 1-2 with `data_verified: false`. The level framework prevents overconfident findings.

### Single Domain
Some users only care about one thing (e.g., "I just need help with my taxes"). The diagnosis should still check adjacent domains briefly but shouldn't force findings where none exist. 2 findings is fine.

### Invalid JSON
The prompt says "respond with ONLY valid JSON." But Claude occasionally wraps it in markdown fences or adds text. The calling code in `diagnosis.js` should handle this defensively. (Current implementation: direct parse attempt. TODO: add fallback regex extraction.)

---

## What This Prompt Adds (Net New)

This diagnosis prompt didn't exist in the previous architecture. Previously, the intake prompt tried to produce both the conversation AND the diagnosis in a single flow using `ready_for_diagnosis` + a `diagnosis` JSON object. This caused:
- Edge cases where the flag fired without the diagnosis object
- The diagnosis was constrained by the 2048 max token limit shared with conversation text
- No way to inject the full transcript (the intake prompt only saw the conversation history)

The separate prompt solves all three problems.
