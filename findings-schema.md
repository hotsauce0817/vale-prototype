# Vale Findings Schema

One-paragraph summary: This document defines the JSON schema for Vale's diagnosis output — the structured findings that appear on the diagnostic report. It includes the full schema, examples for each level (1-5), examples for each domain, and edge case examples. Use this as the reference for frontend rendering, automated validation, and prompt engineering.

**Last updated:** 2026-03-10
**Source:** PRD v4 Section 4.3, `diagnosisPrompt.js`

---

## Full Schema

```json
{
  "name": "string | null",
  "headline": "string — one-sentence diagnosis, not summary",
  "total_optimization": "string | null — dollar floor with '+', e.g. '$47,000+'",
  "domains_impacted": ["cash_flow", "investing", "taxes", "equity", "protection"],
  "expressed_needs": ["string — user's own words, 2-4 items"],
  "diagnosed_gaps": [
    {
      "domain": "cash_flow | investing | taxes | equity | protection",
      "title": "string — short, punchy headline",
      "summary": "string — 2-3 sentences, references their specific situation",
      "urgency": "act_now | plan_ahead | investigate",
      "level": 1,
      "data_verified": false,
      "grounded_in": ["string — specific evidence from conversation, 1-3 items"],
      "dollar_estimate": "string | null — dollar range, e.g. '$32K-47K potential AMT exposure'",
      "tags": ["string — short descriptive tags, 2-4 items"]
    }
  ],
  "cross_domain_insights": ["string — 1-3 sentences each, the coordination insights"],
  "primary_finding": {
    "domain": "string",
    "title": "string — single most important finding",
    "explanation": "string — 2-3 sentences on why this is #1 priority",
    "involves_equity": false,
    "dollar_estimate": "string | null",
    "cta_text": "string — conversational, e.g. 'Let's model your scenarios'",
    "time_estimate": "string — e.g. '~10 minutes'"
  }
}
```

---

## Field Rules

| Field | Required | Validation |
|---|---|---|
| `name` | No | String or null |
| `headline` | Yes | Non-empty. Must feel like a diagnosis, not summary |
| `total_optimization` | No | Null if <2 findings have dollar estimates |
| `domains_impacted` | Yes | 1-5 valid domain keys |
| `expressed_needs` | Yes | 2-4 items, user's own language |
| `diagnosed_gaps` | Yes | 1-7 finding objects |
| `diagnosed_gaps[].domain` | Yes | Must be one of the 5 valid domains |
| `diagnosed_gaps[].level` | Yes | 1-5. If `data_verified: false`, max is 2 |
| `diagnosed_gaps[].urgency` | Yes | Must be `act_now`, `plan_ahead`, or `investigate` |
| `diagnosed_gaps[].grounded_in` | Yes | Non-empty array. If empty, finding is blocked |
| `diagnosed_gaps[].data_verified` | Yes | Boolean |
| `cross_domain_insights` | Yes | 1-3 items |
| `primary_finding` | Yes | Must reference one of the diagnosed_gaps |
| `primary_finding.involves_equity` | Yes | True ONLY if finding is specifically about equity compensation |

---

## Level Enforcement

**Hard rule:** If `data_verified === false` and level > 2, the report renderer downgrades to Level 2.

**Exception:** Level 5 is exempt — some actions are clear without verified data (e.g., "you need a will").

Implementation: check in frontend rendering code, not in the prompt. The prompt includes the rule, but the renderer enforces it as a safety net.

---

## Examples by Level

### Level 1 — Awareness

"You should know this." Signal detected, need more context.

```json
{
  "domain": "investing",
  "title": "Old 401(k) sitting unmanaged from a previous job",
  "summary": "You mentioned a 401(k) from your last employer that you haven't touched. Depending on the balance and fund options, rolling it into an IRA could give you better investment choices and lower fees.",
  "urgency": "investigate",
  "level": 1,
  "data_verified": false,
  "grounded_in": ["User said: 'I think I still have a 401k from my old job somewhere'"],
  "dollar_estimate": null,
  "tags": ["old-401k", "rollover-candidate"]
}
```

### Level 2 — Action Item

"You should do this." Can explain why it matters.

```json
{
  "domain": "taxes",
  "title": "TurboTax may not handle the tax complexity ahead",
  "summary": "Exercising ISOs can trigger AMT, which standard tax software handles mechanically but doesn't help you plan around. At your income level, proactive tax planning could save significantly more than reactive filing.",
  "urgency": "plan_ahead",
  "level": 2,
  "data_verified": false,
  "grounded_in": ["User said: 'I just use TurboTax'", "Inferred: ISO exercise creates AMT exposure"],
  "dollar_estimate": null,
  "tags": ["TurboTax", "AMT exposure", "ISO exercise"]
}
```

### Level 3 — Professional Review

"This needs expert eyes." Requires verified data.

```json
{
  "domain": "taxes",
  "title": "Withholding gap on RSU vesting could mean a surprise tax bill",
  "summary": "Your employer withholds at the 22% supplemental rate on RSU vests, but at $380K household income your marginal rate is 32%. That's a roughly $8K-12K gap per year that shows up at tax time.",
  "urgency": "plan_ahead",
  "level": 3,
  "data_verified": true,
  "grounded_in": ["User confirmed: '$250K base salary'", "User confirmed: 'spouse makes about $130K'", "User confirmed: 'about $80K in RSUs vest each year'"],
  "dollar_estimate": "$8K-12K annual withholding gap",
  "tags": ["RSU-withholding", "supplemental-rate", "tax-planning"]
}
```

### Level 4 — Coordinated Strategy

"Multiple pieces need to work together." Cross-domain complexity.

```json
{
  "domain": "equity",
  "title": "ISO exercise timing drives a three-way decision across equity, taxes, and investing",
  "summary": "Exercising your 50K ISOs before the acquisition closes vs. letting them convert has different AMT implications, changes your capital gains treatment, and affects how much cash you'll have to invest post-close. These can't be planned in isolation.",
  "urgency": "act_now",
  "level": 4,
  "data_verified": true,
  "grounded_in": ["User confirmed: '50K options, mix of ISO and NSO'", "User confirmed: 'acquisition closing in ~60 days'", "User confirmed: '$200K salary'"],
  "dollar_estimate": "$32K-47K potential tax optimization",
  "tags": ["exercise-timing", "AMT", "acquisition", "cross-domain"]
}
```

### Level 5 — Urgent & Complex

"Act now, and it's complicated."

```json
{
  "domain": "protection",
  "title": "Two kids, significant assets, no will — the state decides",
  "summary": "You have two children under 5 and a net worth that's about to increase substantially. Without a will, guardianship and asset distribution are determined by state law, not your wishes. This is the most time-sensitive gap in your picture.",
  "urgency": "act_now",
  "level": 5,
  "data_verified": true,
  "grounded_in": ["User confirmed: 'two kids, 3 and 5'", "User confirmed: 'no will'", "User confirmed: 'just inherited $200K'"],
  "dollar_estimate": null,
  "tags": ["no-will", "guardianship", "estate-planning", "dependents"]
}
```

---

## Examples by Domain

### cash_flow

```json
{
  "domain": "cash_flow",
  "title": "Burn rate exceeds passive income with no salary",
  "summary": "At $18K/month in expenses with no active income, you're drawing down assets at a rate that needs a deliberate liquidation strategy — not just pulling from whatever account is convenient.",
  "urgency": "act_now",
  "level": 3,
  "data_verified": true,
  "grounded_in": ["User confirmed: '$0 salary currently'", "User confirmed: 'spending about $18K/month'", "User confirmed: 'spouse earns $450K'"],
  "dollar_estimate": null,
  "tags": ["burn-rate", "no-salary", "liquidation-strategy"]
}
```

### investing

```json
{
  "domain": "investing",
  "title": "Five accounts across three institutions with no coordination",
  "summary": "You have a current 401(k), an old 401(k), a Roth IRA, a brokerage, and a Wealthfront account. Nobody is looking at the combined allocation. You could be double-weighted in large-cap growth across all of them.",
  "urgency": "plan_ahead",
  "level": 2,
  "data_verified": false,
  "grounded_in": ["User mentioned: 'Wealthfront, old Fidelity 401k, new company 401k'", "User said: 'I've never looked at them together'"],
  "dollar_estimate": null,
  "tags": ["account-fragmentation", "allocation-drift", "no-coordination"]
}
```

### taxes

See Level 3 example above (withholding gap).

### equity

See Level 4 example above (ISO exercise timing).

### protection

See Level 5 example above (no will with dependents).

---

## Edge Cases

### Level 3+ with `data_verified: false`

**Invalid.** The report renderer auto-downgrades to Level 2. Example of what the AI might return (incorrectly) and what the renderer shows:

```json
// AI returns (incorrect):
{ "level": 3, "data_verified": false, "title": "You might be overpaying on taxes" }

// Renderer displays as:
{ "level": 2, "data_verified": false, "title": "You might be overpaying on taxes" }
```

### Empty Basket (1-2 findings)

User gives minimal info. Valid diagnosis with just 1-2 findings:

```json
{
  "name": null,
  "headline": "There are a couple of areas worth looking into — but I'd need more detail to give you a complete picture.",
  "total_optimization": null,
  "domains_impacted": ["investing"],
  "expressed_needs": ["Have a plan instead of just guessing"],
  "diagnosed_gaps": [
    {
      "domain": "investing",
      "title": "No framework for where your money goes",
      "summary": "You mentioned wanting a plan but not knowing where to start. That's actually the most common starting point — and the fix is simpler than it feels.",
      "urgency": "investigate",
      "level": 1,
      "data_verified": false,
      "grounded_in": ["User said: 'I feel like I should be doing more with my money'"],
      "dollar_estimate": null,
      "tags": ["no-plan", "getting-started"]
    }
  ],
  "cross_domain_insights": [],
  "primary_finding": {
    "domain": "investing",
    "title": "Building a financial framework from scratch",
    "explanation": "The most impactful first step is understanding where your money currently goes and whether it's aligned with your goals.",
    "involves_equity": false,
    "dollar_estimate": null,
    "cta_text": "Let's build your picture",
    "time_estimate": "~5 minutes"
  }
}
```

### Complex User (5-6 findings)

User with equity, high income, family, multiple accounts, upcoming life event. The diagnosis can have up to 5-6 findings across 4-5 domains. Keep `total_optimization` as a sum of individual dollar estimates.

### `involves_equity` Strictness

Set to `true` ONLY when the primary finding is specifically about equity compensation decisions. If the primary finding is about taxes but the user has equity, it's still `false`. The flag controls whether the report shows an equity-specific CTA flow.
