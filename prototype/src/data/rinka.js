/**
 * Rinka's context and pre-selected responses for the curated demo path.
 *
 * Based on real customer discovery interview. The responses are shown as
 * choice buttons — the presenter clicks through while the AI generates
 * observations and diagnosis in real-time.
 *
 * Response sets are ordered: set N appears after the AI's Nth message.
 * `pick` indicates the pre-highlighted "recommended" choice for the demo.
 */

export const RINKA_CONTEXT = {
  name: "Rinka",
  situation: "Senior engineer, company being acquired, mix of ISOs and NSOs (~$400K expected payout), single, Bay Area, ~$200K base",
  key_facts: "Used ChatGPT for equity research. Said 'I had no further questions.' No CPA, no advisor, no estate plan. Thinks 'they just withhold from the check' for taxes. Arc covers Investing Layers 2-3 (savings + portfolio), not Layer 1 (cash flow).",
};

export const RINKA_RESPONSES = [
  {
    choices: [
      "I have some money coming in and I don't know what to do with it",
      "My company is being acquired and I want to make sure I handle this right",
      "I want to figure out where to invest",
    ],
    pick: 0,
  },
  {
    choices: [
      "My company is being acquired",
      "It's a bonus / RSU vest",
      "I'm selling something",
    ],
    pick: 0,
  },
  {
    choices: [
      "I think it's a mix but I'm not totally sure",
      "I know exactly — here's the breakdown",
      "What's the difference?",
    ],
    pick: 2,
  },
  {
    choices: [
      "They just withhold from the check, I think it's fine",
      "I'm not sure actually",
      "I file taxes but I don't really plan around them",
    ],
    pick: 0,
  },
  {
    choices: [
      "No, nobody",
      "I have someone who does my taxes",
      "I've used ChatGPT / done my own research",
    ],
    pick: 2,
  },
  {
    choices: [
      "Maybe a 3 — I know I'm probably missing stuff",
      "Like a 6 — I think I'm mostly fine",
      "I don't even know what I don't know",
    ],
    pick: 2,
  },
  {
    choices: [
      "That nobody takes a huge chunk in taxes I didn't expect",
      "That I'm actually making the most of this — not just parking it somewhere",
      "Honestly, just knowing someone qualified looked at it",
    ],
    pick: 0,
  },
  {
    choices: [
      "I haven't really thought about it that way",
      "Wait — is that actually a thing that happens?",
      "So the withholding might not be enough?",
    ],
    pick: 1,
  },
  {
    choices: [
      "No, I haven't talked to anyone about this specifically",
      "I looked into it online but got overwhelmed",
      "I figured I'd deal with it when the money actually arrives",
    ],
    pick: 2,
  },
];
