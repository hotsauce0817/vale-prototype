/**
 * Rinka's pre-selected responses for the equity audit demo path.
 *
 * Same pattern as rinka.js (intake) — ordered response sets with a
 * highlighted "pick" for the presenter. The AI generates live responses
 * using the audit prompt; these are the user-side buttons.
 *
 * Arc follows PRD Section 6:
 * 1. Grant details (ISO/NSO split, share count)
 * 2. Strike prices / grant specifics
 * 3. Acquisition terms and timeline
 * 4. Exercise history
 * 5. Tax situation / CPA relationship
 * 6. AMT awareness
 * 7. Withholding expectations
 * 8. Other equity / household income
 * 9. Confirmation / anything else
 * 10. California / CPA details (AI often probes here)
 * 11. Acquisition price per share (needed for AMT calc)
 * 12. Final confirmation before analysis
 */

export const RINKA_AUDIT_RESPONSES = [
  // 1 — After AI opens referencing the diagnostic and asks about grant types
  {
    choices: [
      "I think I have both ISOs and NSOs — about 42,000 shares total, but I'm not sure of the exact split",
      "I know I have stock options but I'm not sure which kind",
      "Where would I find that information?",
    ],
    pick: 0,
  },
  // 2 — AI asks about strike prices, specifics
  {
    choices: [
      "My ISOs were granted at $10.95 — I remember from the grant letter. The NSOs might be different but I'm not sure",
      "I'd have to check Carta to get the exact numbers",
      "I think everything was around the same price?",
    ],
    pick: 0,
  },
  // 3 — AI asks about the acquisition details
  {
    choices: [
      "It's all cash — we're supposed to close in about 30 days and then get paid out",
      "I know it's an acquisition but I don't know all the terms yet",
      "What specifically do I need to know about the deal?",
    ],
    pick: 0,
  },
  // 4 — AI asks about exercise history
  {
    choices: [
      "I exercised some of my ISOs early last year when the stock price was lower",
      "I haven't exercised anything — it all just converts in the acquisition, right?",
      "I'm not sure what counts as exercising",
    ],
    pick: 0,
  },
  // 5 — AI asks about tax situation / CPA
  {
    choices: [
      "I used ChatGPT to figure out the tax part — it said I'd owe about $40K total",
      "I have someone who does my taxes but we haven't talked about the equity",
      "I'm planning to deal with the tax part after I get the money",
    ],
    pick: 0,
  },
  // 6 — AI asks about AMT awareness / prior AMT
  {
    choices: [
      "No — what's AMT? Is that something separate from regular taxes?",
      "I think I've heard of it but I don't know if it applies to me",
      "ChatGPT didn't mention that",
    ],
    pick: 0,
  },
  // 7 — AI asks about withholding expectations
  {
    choices: [
      "I figured they'd just withhold whatever they need to from the check",
      "I think someone said 22%? That should cover it, right?",
      "I honestly haven't thought about that part",
    ],
    pick: 1,
  },
  // 8 — AI asks about other equity positions or household income
  {
    choices: [
      "No, this is my only equity — just this company",
      "I might get equity at my next job but nothing right now",
      "No partner, no other equity, just my salary and this",
    ],
    pick: 2,
  },
  // 9 — AI confirms summary and asks if anything else
  {
    choices: [
      "Yes, that sounds right — I just want to make sure I'm not missing anything big",
      "I think so. Is there something I should be worried about?",
      "That's right. What does all of this mean for me?",
    ],
    pick: 0,
  },
  // 10 — AI asks about state of residence / CPA details
  {
    choices: [
      "Yes, I'm in California. I just file on my own with TurboTax, no CPA",
      "Bay Area — and no, just TurboTax",
      "California. I haven't talked to a tax person about any of this",
    ],
    pick: 0,
  },
  // 11 — AI asks about acquisition price per share (needed for AMT calc)
  {
    choices: [
      "I think it's around $20 per share — that's what they said in the company meeting",
      "I'm not sure of the exact price — somewhere in the $20s I think?",
      "Where would I find that number?",
    ],
    pick: 0,
  },
  // 12 — Final confirmation before analysis generation
  {
    choices: [
      "Yes, that all sounds right. What does this mean for me?",
      "I think so — is there something big I'm missing?",
      "That's correct. Should I be worried?",
    ],
    pick: 0,
  },
];
