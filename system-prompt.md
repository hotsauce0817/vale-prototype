# Vale Intake System Prompt — Annotated Reference

One-paragraph summary: The intake system prompt defines Vale's conversational AI behavior during the diagnostic intake. It controls identity, tone, question strategy, the 1-10 scale opening, domain triage, the progressive financial map, observation quality, and closing logic. This document walks through each section with inline commentary explaining what it controls, why it exists, and what breaks if removed.

**Last updated:** 2026-03-10
**Source file:** `prototype/api/_lib/systemPrompt.js`

---

## Identity & Fiduciary Standard (lines 1-11)

```
You are Vale, the AI layer of a registered investment advisory firm (SEC RIA). Your purpose is to understand a person's full financial picture through conversation, surface the gaps, risks, and cross-domain interactions they don't know they have, and provide actionable financial guidance.
```

**What it controls:** Sets the foundational frame for every response — Vale is a fiduciary, not a chatbot. This shapes tone, directness, and the standard of care.

**Why it exists:** PRD Section 2 (Fiduciary Standards). Vale is registering as an SEC RIA. Every interaction is a fiduciary interaction. Without this framing, Claude defaults to generic assistant behavior — hedging, disclaiming, and avoiding direct financial statements.

**What breaks if removed:** Claude becomes a generic chatbot that says "I'm not a financial advisor" and refuses to give direct guidance. The entire product value proposition collapses.

---

## Personality & Tone (lines 7-11)

```
You are calm, direct, and perceptive. You sound like a trusted friend who happens to understand finance deeply — not a chatbot, not a banker, not a salesperson.
```

**What it controls:** Conversational style. One question at a time, short paragraphs, no bullet points, no emoji, warm but substantive.

**Why it exists:** The product feel is critical — "best 5 minutes with a financial advisor." If it feels like a form or an interrogation, users disengage. The anti-patterns (no lists, no emoji, no jargon) come from testing.

**What breaks if removed:** Claude reverts to its default style — verbose, uses markdown formatting, stacks multiple questions. Feels like talking to an LLM, not an advisor.

---

## Response Quality Standard (lines 13-31)

```
Every conversational response you generate must satisfy at least 2 of these 3 criteria:
1. DEMONSTRATES DOMAIN EXPERTISE
2. APPLIES KNOWLEDGE TO THEIR SPECIFIC SITUATION
3. REVEALS A CONNECTION THE USER DIDN'T STATE
```

**What it controls:** The minimum bar for every response. Prevents filler turns where Claude acknowledges without adding value.

**Why it exists:** From dogfooding — early versions had turns like "That makes sense! Tell me more about your taxes." These waste the user's time and erode trust. The 2-of-3 standard ensures every turn delivers value.

**What breaks if removed:** Conversations become shallow. Claude asks checklist questions without demonstrating expertise. Users feel like they're filling out a form, not talking to an advisor.

The "NEVER DO THESE" list (lines 23-29) is equally critical — these are the specific anti-patterns observed during testing. The "INSTEAD" block (lines 30-31) gives Claude a positive directive: add something the user didn't know between every acknowledgment and every question.

---

## Mode: Diagnostic Intake (lines 33-48)

```
This conversation is the diagnostic intake — you are listening, asking questions, and generating observations. Your observations should be confident and direct — not hedgy — but they are insights about what you're noticing, not action items.
```

**What it controls:** Scopes Claude's behavior to intake mode. Separates observation ("here's what I notice") from recommendation ("here's what you should do").

**Why it exists:** PRD Section 3.3. The intake surfaces insights; the diagnosis prescribes actions. Mixing them undermines both — recommendations without full context are irresponsible, and observations lose their power if they immediately jump to action.

**What breaks if removed:** Claude starts recommending specific actions mid-conversation ("You should split your exercise across two tax years") before having the full picture. This is a fiduciary problem and a UX problem.

The "if user asks what should I do" redirect (line 47-48) is important — users will ask, and the AI needs a natural way to defer without dismissing.

---

## Task Definition (lines 50-57)

```
Conduct a diagnostic intake conversation of 8-15 exchanges. Through this conversation, you will:
1. Understand the user's financial situation
2. Assess across five domains
3. Build a visual financial map using update_map
4. Surface observations using add_observation
5. Signal completion using complete_intake
```

**What it controls:** The concrete goals and tool-calling contract. Tells Claude what tools exist and when to use them.

**Why it exists:** Without explicit tool references here, Claude may not call tools consistently. The numbered list creates a mental model for the AI about what a successful intake looks like.

---

## The Five Domains (lines 59-107)

Each domain section includes:
- **Definition** — what the domain covers
- **Key signals** — what to listen for in conversation
- **Cross-domain triggers** — how this domain connects to others

**What it controls:** The diagnostic taxonomy. Tells Claude what to probe and what to listen for.

**Why it exists:** PRD Section 4.1. The domains are the product — they define what Vale sees that nobody else does. The cross-domain triggers are especially critical: they're the "coordination insight" that single-domain advisors miss.

**What breaks if removed:** Claude probes randomly or focuses only on what the user volunteers. It misses signals (e.g., "no will with dependents" → protection gap) and fails to connect domains (e.g., equity exercise → AMT → cash flow).

The **posture adjustment** in Cash Flow (line 67) is important: if someone is stressed about making rent, don't probe portfolio construction. This comes from dogfooding — it's tone-deaf to discuss tax optimization with someone in financial distress.

The **equity domain knowledge** block (lines 89-98) provides specific numbers (AMT exemptions, rates, holding periods). Without these, Claude either hallucinates numbers or gives vague answers.

---

## Key Cross-Domain Interactions (lines 108-123)

```
These are NOT a sixth domain — they are the connective tissue between domains.
```

**What it controls:** Tells Claude which domain pairs to watch for and what the interactions look like.

**Why it exists:** This is Vale's core differentiator. The coordination between domains is the product. Without explicit examples, Claude treats each domain as siloed.

---

## Opening the Conversation (lines 124-151)

```
"On a scale of 1 to 10, how in control do you feel of your financial life right now?"
```

**What it controls:** The structured opening sequence: warm greeting → scale question → +2 follow-up → domain triage.

**Why it exists:** Three reasons: (1) Triage signal — a "3" conversation is fundamentally different from an "8". (2) Gap reveal — the +2 answer shows what the user *thinks* their gap is. (3) Trackable metric for longitudinal comparison.

**What breaks if removed:** The opening becomes open-ended and unpredictable. Claude may ask "What's on your mind?" and get a vague answer with no triage signal. The conversation meanders instead of focusing on the user's highest-urgency domain.

The domain triage rules (lines 136-142) map +2 answer keywords to starting domains. This ensures the conversation immediately goes where it matters most.

---

## Name Handling (lines 153-161)

**What it controls:** When and how to capture the user's name. Specific anti-pattern: never extract a name from a greeting ("Hi there" → name is NOT "there").

**Why it exists:** Personalization builds trust. But getting the name wrong is worse than not having it. The "Hi there" bug was observed in testing.

---

## Question Strategy (lines 163-180)

**What it controls:** One question at a time, follow the energy, natural bridges between domains, don't interrogate.

**Why it exists:** The "fan-out strategy" (lines 172-180) is critical — after going deep on one domain (4-5 turns), the AI must bridge to adjacent domains using something the user said. This prevents the conversation from being a checklist while ensuring domain coverage.

The mandatory protection probe (line 180) for users with dependents comes from dogfooding — the AI would sometimes skip protection entirely for families with kids. That's a fiduciary failure.

---

## Map Building (lines 190-229)

**What it controls:** How and when to call `update_map`. Three sections (situation → assets → gaps), progressive reveal, status colors.

**Why it exists:** PRD Section 3.4. The map is the visual proof that the AI is listening. Users see their picture being organized in real time.

**Key rule:** Status codes diagnostic assessment, NOT domain. Red = needs attention, gold = investigate, green = confirmed good. This comes from the dogfooding lesson about map colors (see `lessons.md`).

---

## Observation Generation (lines 230-265)

**What it controls:** When to generate observations, the 2-of-3 quality bar, the hard constraint of 2-3 per intake, the separation between observation card and text message.

**Why it exists:** PRD Section 3.3, dogfooding quality bar lesson. Observations are Vale's signature moment — the "I hadn't considered that" reaction.

**Critical rule (line 253):** The observation and the text message display separately in the UI. NEVER repeat or reference observation content in the text. This was a frequent anti-pattern in testing — the AI would say the insight in the observation card AND in its text message, which felt redundant.

The dollar anchoring section (lines 257-264) tells Claude to include magnitude estimates. This comes from the PRD's fiduciary standard — estimates are acceptable when framed as approximate. The dogfooding lesson about fabricated dollar estimates informs the guardrail.

---

## Closing Logic (lines 266-291)

**What it controls:** When to call `complete_intake` (5 conditions), turn management (soft close at 12, hard at 15), and the closing message format.

**Why it exists:** Without explicit closing criteria, Claude either ends too early (after 4-5 turns) or keeps going indefinitely. The conditions ensure enough signal for a quality diagnosis.

The closing message rules (lines 283-291) control the transition to the diagnosis. Key: hint at findings WITHOUT summarizing them. The diagnosis page is the reveal — don't spoil it.

---

## Guardrails & Edge Cases (lines 293-308)

**What it controls:** Fiduciary guardrails (no fabricated precision, no jargon without context, no promotional language) and edge case handling.

**Why it exists:** PRD Section 2 (Fiduciary Standards) and Section 5 (Guardrails). These are the safety rails that prevent fiduciary violations.

---

## What This Prompt ADDS vs. Previous Version

- **Tool calling for map updates** — replaces JSON state_update blobs with `update_map` tool
- **2-of-3 observation quality bar** — enforced via `quality_criteria_met` field
- **Turn caps** — soft 12, hard 15 (was unbounded)
- **1-10 scale opening** — replaces open-ended "What's going on?"
- **Domain triage from +2 answer** — conversation immediately focuses on highest-urgency area
- **Closing behavior** — explicit criteria and message format (was `ready_for_diagnosis` flag)
- **Guardrails from PRD Section 4** — fiduciary tone, dollar estimate framing

## What This Prompt REMOVES vs. Previous Version

- **Dollar anchoring in observations** — estimates are approximate, never precise
- **Diagnosis schema output** — diagnosis is now a separate API call (`/api/diagnosis`)
- **JSON response format** — replaced by tool calling (text is just text)
- **State injection** — no more JSON state appended to the prompt
- **Deep merge logic** — map builds via tool calls, not state_update merging
- **Rinka demo path** — single conversation path, no mode branching
