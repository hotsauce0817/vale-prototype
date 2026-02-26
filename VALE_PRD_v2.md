# Vale Prototype — PRD v2

**Date:** February 26, 2026
**Target:** Demoable for investor meetings starting March 16, 2026

This document defines what to build and why. It does not prescribe implementation. Read the existing codebase for architecture patterns and make engineering decisions accordingly.

---

## 1. Context: What Changed

We tested the prototype end-to-end with a real scenario and found three problems:

**The emotional arc breaks after the diagnosis.** The intake is a conversation — intimate, personal, the AI listening and building momentum. The diagnosis is a surprise — "you came for one problem, Vale found seven gaps." Then ModeExplorer dumps everything into a three-tab dashboard. The AI disappears. Three tabs present the same core insight repackaged three ways. No hierarchy, no clear action, no depth.

**The prototype jumps from signal to recommendation.** After 12 turns, Vale has *signal* — it knows your CPA only files, your advisor only invests, you have four equity positions nobody coordinates. That's enough to see the opportunity. It's nowhere near enough to say "file an 83(b)" or "exercise in Q3." Those require grant agreements, tax returns, vesting schedules. Giving specific recommendations without that data isn't fiduciary — it's reckless dressed up as conviction.

**The advisor is the default conversion.** Most users are BASE tier — no human access. The product is the AI. The human is a 10% safety layer for high-stakes decisions. Funneling everyone to a human at the end inverts the thesis.

### The Fix

Instead of a dashboard, continue the conversation. Instead of premature recommendations, earn the right to go deeper. Instead of converting to a human, convert to the product.

The AI says: *"I see something here. Let me prove it to you."* Then it does the work.

---

## 2. The New Flow

### Screen 1: Entry
**One path visible: "Try it yourself."** The user clicks and enters the general diagnostic intake. No profile selection. No life event selection. Just start.

**Rinka demo is hidden.** Accessible via a URL parameter (e.g., `?demo=rinka`) for investor walkthroughs only. Not visible on the default entry screen. When an investor gets the prototype link, they see a clean product — not a prototype with demo options.

**Kill the other hardcoded profiles.** Maya, Arun, and Vikram powered the old ModeExplorer and HumanHandoff screens, which are now dead. These profiles can stay in the codebase for reference but should not be accessible through any UI path. The `?dev=true` flow can remain as a developer tool if useful, but it's not part of the demo.

### Screen 2: Diagnostic Intake
**General intake — not equity-specific.** The AI covers all five domains through natural conversation. It doesn't know what the user's primary situation is until the conversation reveals it. This is the product working: the AI triages across domains, follows the energy, and identifies what matters most.

If equity surfaces, great — that feeds the audit. If someone comes in with tax anxiety or estate gaps or a home purchase, the diagnosis still works. The intake is domain-agnostic by design.

Prompt fixes needed (see Section 4).

### Screen 3: Diagnosis + Opportunity
**Top:** The existing diagnosis display — "What you told us" / "What we noticed."

**Bottom (new): The Opportunity.** The AI's single highest-priority finding, framed as an opportunity worth exploring deeper. Not a recommendation. A clear statement: "Here's what I see, here's why it matters, and here's what a proper audit would reveal."

**CTA — conditional on what the diagnosis found:**

If the primary finding involves equity compensation (equity event, stock options, RSUs, ISOs, acquisition, etc.):
→ "Let's go deeper →" with supporting text: "Takes about 10 minutes. I'll ask some specific questions about your equity positions."
→ Navigates to the Equity Audit (Screen 4).

If the primary finding is NOT equity-related:
→ The Opportunity section still renders (every diagnosis should have a primary finding worth going deeper on). But the CTA is softer: "This is where Vale goes deeper — coming soon." or similar. The diagnosis is the end of the current prototype for non-equity paths.
→ This is fine. Most tech workers in the target demo WILL have equity. And the diagnosis alone is impressive for non-equity scenarios.

### Screen 4: The Equity Audit
**The centerpiece of the new build.** A second AI conversation — same chat UI, same observation cards — with a specialized equity audit prompt. 10-15 turns of specific, domain-expert questions about their equity compensation, tax situation, and time-sensitive decisions.

The AI is methodical, fiduciary, emotionally supportive. It doesn't rush to recommendations — it earns trust through the quality of its questions. The user thinks: *"Nobody has ever asked me these questions before."*

When the AI has enough data, it produces a quantified analysis.

### Screen 5: The Analysis
The payoff. A clean, authoritative display of what the audit found:

- **Headline finding** — one sentence, specific, with a dollar range
- **Narrative** — 3-4 paragraphs explaining the full equity and tax picture using their actual numbers
- **Scenario comparison** — "without coordination" vs "with Vale," with estimated annual impact
- **Action items** — 2-3 specific things to do, in order, with urgency indicators
- **Secondary findings** — other things noted, lightweight
- **Conversion CTAs** — "Start your Vale plan — $75/month" (primary) and "Want a CFP to review? Explore Vale+" (secondary, smaller)

The CTAs don't need to be functional. They show the investor the conversion moment.

### What's Killed
- **ModeExplorer (three tabs)** — replaced by Audit + Analysis
- **HumanHandoff screen** — replaced by conversion CTA on Analysis
- **Advisor View toggle** — cut. Explain verbally in pitch.
- **ReturnExperience** — already cut
- **Hardcoded profile selection on entry** — profiles remain in code for dev reference but not accessible to users
- **Life event entry selection** — removed. General intake only.

---

## 3. Why Equity Compensation as the First Audit

The pitch walks through Rinka's story. Equity comp is the beachhead — highest urgency, highest dollar, most social life event in Tier 1.

More importantly, equity comp is auditable. The questions are specific. The math is concrete. The AI can produce dollar ranges because the inputs are finite: grant type, strike price, FMV, shares, tax bracket, exercise timing. A general "coordination audit" can't produce numbers. An equity audit can.

The intake stays general (covers all domains). The audit is where we go deep on one domain. Equity is the first domain built. Others follow the same pattern.

---

## 4. Intake Prompt Fixes

The diagnostic intake works but had gaps in end-to-end testing. These improve signal quality for the audit.

**Status: Implemented in Phase 1.** Original fixes 2 (mechanical observation enforcement) and 3 (domain checklist) were dropped — they produced contrived behavior. The intent was folded into a stronger observation framing and a fan-out strategy that follows implications instead of checking boxes.

### Fix 1: Name Capture ✓
Within the first 2-3 exchanges, naturally ask: "Before we go further — what should I call you?" Store in `state_update.user.name`.

### Fix 2: Observation Quality + Fan-Out ✓ (replaces original Fixes 2, 3, 4)
Two changes to the base prompt:
- **Observation framing:** "A diagnostic intake that ends with zero observations has failed — it means you listened but didn't catch anything the user hadn't already considered. Every situation has at least one gap between what the person knows and what's actually at stake. Find it."
- **Fan-out strategy:** "After 5-7 turns on the primary area, use what you've already learned to probe adjacent domains. Don't ask generic checklist questions — follow the implications. Two kids and no mention of a will? That's a signal. Significant equity and no tax strategist? Follow that thread."

Also added: after an observation, the message should still end with a question on a different thread. The observation pauses one topic; the message opens another.

### Fix 3: Primary Finding in Diagnosis ✓
Added `primary_finding` to the diagnosis output:

```json
"primary_finding": {
  "domain": "which domain this belongs to",
  "title": "the one-sentence finding",
  "why_it_matters": "2-3 sentences on why this is #1 priority",
  "what_audit_reveals": "what going deeper would show them",
  "involves_equity": true/false
}
```

`involves_equity` is a strict flag — true ONLY if the finding is specifically about equity compensation decisions (exercise timing, ISO/NSO strategy, vesting, concentration risk). The test: would this finding exist if the user had no equity? If yes, it's not an equity finding.

---

## 5. The Equity Audit — Product Requirements

### What It Is
A domain-expert AI conversation focused on equity compensation. The AI has been told what the diagnostic found. It doesn't re-ask what was already covered. It opens by referencing the diagnosis: "Based on our earlier conversation, I can see [primary finding]. I'd like to dig into the specifics..."

### What It Collects
For every equity position in the household:
- Grant type (ISO, NSO, RSU, RSA)
- Shares (total, vested, unvested)
- Strike price and current/acquisition FMV
- Exercise history
- Vesting schedule
- Company status and any liquidity events
- Time-sensitive deadlines (exercise windows, 83(b) elections)

Plus tax context:
- Federal bracket and filing status
- State of residence (state tax treatment varies enormously)
- CPA relationship (filing only vs. strategic)
- Prior AMT exposure
- Other income events in the household

### How It Asks
- One question at a time
- Explains why each question matters: "This matters because the difference between ISOs and NSOs changes your tax treatment by potentially tens of thousands of dollars."
- Starts broad, then narrows: "What type of equity?" before "What's the strike price?"
- Helps when the user doesn't know: "This would be on your grant agreement or in your equity portal — Carta, Shareworks, E*Trade."
- Patient with uncertainty — works with ranges and estimates
- Confirms before analyzing: "Let me make sure I have this right: [summary]"

### Domain Knowledge the AI Needs

**ISO taxation:**
- Exercise creates AMT preference item = (FMV - strike) × shares
- AMT exemption 2025: $88,100 single / $137,000 married filing jointly
- AMT rate: 26% on first $239,100 above exemption, 28% above that
- Qualifying disposition: hold 2 years from grant + 1 year from exercise
- Disqualifying disposition: spread taxed as ordinary income
- AMT credit carries forward to offset regular tax in future years

**NSO taxation:**
- Spread at exercise is ordinary income (federal + state + FICA)
- Employer withholds at supplemental rate (22% federal), often under-withholds for high earners
- New cost basis = FMV at exercise; subsequent gains are capital gains

**RSU taxation:**
- FMV at vesting is ordinary income, no exercise decision
- Planning centers on sell-to-cover vs hold, post-vest sale timing, concentration risk

**83(b) elections:**
- Must file within 30 days of restricted stock grant (not RSUs)
- Recognize income at grant (low value) vs vesting (potentially much higher)
- Irrevocable — if stock becomes worthless, tax paid is not recoverable
- Critical for founders/early employees

**Exercise timing strategy:**
- Spread exercises across tax years to manage AMT bracket
- Exercise early in calendar year for maximum LTCG qualification time
- Coordinate with household income events (partner's equity, bonuses)
- California taxes ISOs at exercise regardless of disposition type

**Cross-position interactions:**
- Multiple positions create combined AMT/income impact
- Partner A's exercise affects household bracket for Partner B
- Tax-loss harvesting in portfolios can offset equity income
- Quarterly estimated payments must account for equity events

### When It Generates Observations
Gold card observations during the audit when:
- A specific dollar opportunity is identified
- A time-sensitive risk surfaces (deadlines, windows)
- A cross-position interaction is detected (household tax impact)

### When It Ends
The audit concludes when:
- All equity positions in the household are mapped
- Tax bracket and filing situation are understood
- Key interactions and time-sensitive items are identified
- Enough data exists to produce estimated dollar ranges
- At least 8 exchanges have occurred

### What It Produces
When the audit is complete, the AI generates an `audit_result`:

```json
{
  "headline": "The single most important finding, with a dollar range",
  "narrative": "3-4 paragraphs explaining the full equity and tax picture. Specific to their situation. Uses their numbers. Shows the math conceptually — 'your 10,000 ISOs at $5 strike with $25 FMV create a $200K spread that triggers approximately $X in AMT.' This is the moment the user sees exactly what's at stake.",
  "scenario": {
    "uncoordinated": "What happens with current approach",
    "coordinated": "What changes with proper planning",
    "estimated_annual_impact": "Dollar range, e.g. '$15,000 - $35,000'"
  },
  "actions": [
    {
      "title": "Specific action",
      "urgency": "now | soon | later",
      "detail": "1-2 sentences on what this involves",
      "who": "vale | user | professional"
    }
  ],
  "secondary_findings": ["Other things noted, single line each"],
  "data_quality": "high | medium | low"
}
```

### Tone
Fiduciary. Methodical. Earns trust through question quality, not answer speed. When data is insufficient, says so honestly: "Without seeing the actual grant agreement, I'm estimating. The real numbers could be higher or lower — but the direction is clear."

Never oversells. Never manufactures urgency. If the situation is well-handled, says so. Trust comes from honesty, not from finding problems.

---

## 6. The Rinka Demo Path

The Rinka demo must be bulletproof for investor meetings. Accessible only via URL parameter (e.g., `?demo=rinka`), not visible on the default entry screen.

Both the intake AND audit use pre-scripted user responses (like the existing `data/rinka.js` pattern). The AI responds live; the user picks from preset choices.

### Rinka Audit Conversation Arc
1. Opening references the diagnostic: "You have a mix of ISOs and NSOs from the acquisition..."
2. Grant details: ISOs exercised at $10.95, NSOs at different prices, ~42K shares total
3. Acquisition terms: cash acquisition, payout expected within 30 days
4. Exercise history: some exercised, some converting in acquisition
5. Tax situation: no CPA doing strategy, doesn't understand ISO/NSO distinction
6. AMT: has she received any AMT paperwork? (No)
7. Withholding: "they just withhold from the check" — probe rate
8. Other equity: any from prior or future employers? (No)
9. Confirmation: "Let me make sure I have this right..."
10. Analysis generation

### Rinka Expected Analysis Output
The audit result should align with the pitch deck narrative:
- AMT exposure of ~$47K she hasn't accounted for
- Actual tax liability of ~$52K vs the ~$40K ChatGPT estimated
- Option exercise window closing in 47 days
- Over-withholding by $3-5K
- No backdoor Roth setup (missed opportunity)
- Estimated first-year impact: $12K-$15K from AMT planning + withholding optimization + tax-advantaged account setup

---

## 7. Analysis Display Requirements

### Content Hierarchy
1. Headline finding (large, authoritative)
2. Narrative (the core — reads like a letter from a financial advisor who did the work)
3. Scenario comparison (before/after with dollar impact)
4. Actions (2-3 items, sequenced, with urgency)
5. Secondary findings (lightweight)
6. Data quality note if medium/low
7. Conversion section with CTAs

### Visual Direction
Feels like a document, not a dashboard. Clean, readable, authoritative. The narrative is the centerpiece. Use the existing design token system — serif for headlines and narrative, gold accents sparingly.

### Conversion CTAs
- **Primary:** "Start your Vale plan — $75/month →"
- **Secondary:** "Want a CFP to review these findings? Explore Vale+ →" (smaller)
- **Fine print:** "Vale is a registered investment advisor (SEC RIA). All recommendations are fiduciary."

None functional. They demonstrate the business model.

---

## 8. What We're NOT Building

- Account connections (Plaid)
- File upload for documents
- Multiple audit domains (equity only for now)
- Advisor view / CFP briefing
- Managed investing features
- Payment / subscription processing
- Session persistence between reloads
- A functional "Vale plan"
- Non-equity audit paths (diagnosis is the endpoint for non-equity scenarios)

---

## 9. Success Criteria

### The Rinka demo works flawlessly
Entry (via ?demo=rinka) → Intake (8-10 turns, 2+ observations) → Diagnosis (with opportunity framing) → Audit (8-10 turns of specific equity questions, 1-2 observations) → Analysis (quantified findings, scenario comparison, actions, conversion CTA). Consistent quality across 5+ runs.

### The open path works for equity scenarios
A user enters via "Try it yourself," the general intake identifies equity as a primary area, the audit asks relevant questions, and the analysis produces specific (if estimated) findings.

### The open path degrades gracefully for non-equity scenarios
A user without equity goes through the general intake, gets a diagnosis with an opportunity framing, and sees a "coming soon" state for the deeper audit. The diagnosis alone is still valuable.

### The emotional arc is intact
The audit produces: *"Nobody has ever asked me these questions before."*
The analysis produces: *"I didn't know I was leaving that much on the table."*

### An investor watching can see:
1. The AI is doing real financial reasoning, not just chatting
2. The general intake triages across all financial domains — then goes deep on what matters most
3. The product replaces an expensive human advisor for 90% of the work
4. The equity audit is a repeatable pattern that extends to other life events
5. The conversion from free diagnostic to paid audit is natural, not forced

---

## 10. How This Extends (Pitch Context)

The equity audit is a template. Every life event follows the same pattern:

1. **General diagnostic intake** → identifies which domains have the biggest gaps
2. **Domain-specific audit** → goes deep with expert questions
3. **Quantified analysis** → shows the user exactly what's at stake

Home purchase: mortgage scenarios, down payment optimization, tax implications, insurance needs.
Inheritance: step-up basis, estate settlement, account consolidation, beneficiary designations.
Job change: 401(k) rollover, equity decisions, benefit gap analysis.

Same conversational architecture. New prompts and domain knowledge. Not new engineering.

The general intake is the permanent front door. The audits are modules that plug in behind it. Each new audit domain opens a new distribution surface and multiplies the product's value. The platform gets smarter with each domain added because the intake already covers everything — you're just building deeper paths for each finding.

This is the pitch: *"Watch the AI triage a complete financial picture, then go deep on the most urgent area. Now imagine this for every major financial decision a family makes."*
