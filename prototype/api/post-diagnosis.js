import Anthropic from "@anthropic-ai/sdk";
import { logTurn } from "./_lib/log.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/post-diagnosis
 *
 * Takes a completed diagnostic (conversation + diagnosis + state) and generates
 * structured content for ModeExplorer and HumanHandoff.
 *
 * Request body:
 * {
 *   messages: [{ role: "user"|"assistant", content: "..." }],
 *   diagnosis: { expressed_needs, diagnosed_gaps, cross_domain_insights, score_context },
 *   state: { user: {}, domains: {}, observations: [], ... },
 *   mode: "rinka" | "equity" | "home" | "generic"
 * }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  try {
    const { messages = [], diagnosis = {}, state = {}, mode = "generic" } = req.body;

    const systemPrompt = buildAdvisoryPrompt();

    // Build the user message with all diagnostic context
    const userMessage = buildUserMessage(messages, diagnosis, state, mode);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    let parsed = parseJSON(rawText);

    // Retry with stronger instruction if parsing failed
    if (!parsed) {
      console.error("[Vale] post-diagnosis JSON parse failed. Retrying...");
      const retryResponse = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt + "\n\nCRITICAL: Your previous response was not valid JSON. You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON.",
        messages: [{ role: "user", content: userMessage }],
      });

      const retryText = retryResponse.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

      parsed = parseJSON(retryText);
    }

    if (!parsed) {
      console.error("[Vale] post-diagnosis JSON parse failed after retry");
      return res.status(500).json({ error: "Failed to generate structured content" });
    }

    // Validate and fill defaults so components never crash
    const result = validateOutput(parsed, state, diagnosis);

    // Log to Supabase
    await logTurn({
      sessionId: state.sessionId || "post-diagnosis",
      mode,
      turnNumber: -1, // special marker for post-diagnosis
      userMessage: "post-diagnosis-generation",
      aiResponse: JSON.stringify(result).slice(0, 1000),
      observation: null,
      state,
      diagnosis,
      completed: true,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("[Vale] Post-diagnosis API error:", err);

    if (err.status === 401) {
      return res.status(500).json({ error: "Invalid API key" });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limited — please wait a moment and try again" });
    }

    return res.status(500).json({ error: "Something went wrong generating your plan." });
  }
}

/* ── JSON parsing (same 3-layer fallback as diagnostic.js) ── */

function parseJSON(rawText) {
  const cleanText = rawText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
  try {
    return JSON.parse(cleanText);
  } catch {
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/* ── Output validation ── */

function validateOutput(parsed, state, diagnosis) {
  const userName = parsed.name || state?.user?.name || "there";
  return {
    name: userName,
    partnerName: parsed.partnerName || null,
    avatar: parsed.avatar || userName.charAt(0).toUpperCase(),
    context: parsed.context || "",
    primaryMode: ["financial-picture", "decision-map", "what-if"].includes(parsed.primaryMode)
      ? parsed.primaryMode
      : "financial-picture",
    modes: {
      "financial-picture": validateFinancialPicture(parsed.modes?.["financial-picture"]),
      "decision-map": validateDecisionMap(parsed.modes?.["decision-map"]),
      "what-if": validateWhatIf(parsed.modes?.["what-if"]),
    },
    diagnosed: validateDiagnosed(parsed.diagnosed, diagnosis),
    advisorBrief: validateAdvisorBrief(parsed.advisorBrief),
  };
}

function validateFinancialPicture(fp) {
  const defaults = { title: "Your financial picture", subtitle: "Here's what we found.", items: [] };
  if (!fp) return defaults;
  return {
    title: fp.title || defaults.title,
    subtitle: fp.subtitle || defaults.subtitle,
    items: Array.isArray(fp.items) ? fp.items.map((item) => ({
      icon: item.icon || "◈",
      cat: item.cat || "GENERAL",
      title: item.title || "",
      body: item.body || "",
      urgency: ["high", "medium", "low"].includes(item.urgency) ? item.urgency : "medium",
      action: item.action || "Learn more",
    })) : [],
  };
}

function validateDecisionMap(dm) {
  const defaults = { title: "Your decision map", subtitle: "Steps to take, in order.", items: [] };
  if (!dm) return defaults;
  return {
    title: dm.title || defaults.title,
    subtitle: dm.subtitle || defaults.subtitle,
    items: Array.isArray(dm.items) ? dm.items.map((item, i) => ({
      step: item.step || i + 1,
      title: item.title || "",
      body: item.body || "",
      status: ["now", "next", "later"].includes(item.status) ? item.status : "next",
    })) : [],
  };
}

function validateWhatIf(wi) {
  const defaults = { title: "What if...?", subtitle: "Questions on your mind.", scenarios: [] };
  if (!wi) return defaults;
  return {
    title: wi.title || defaults.title,
    subtitle: wi.subtitle || defaults.subtitle,
    scenarios: Array.isArray(wi.scenarios) ? wi.scenarios.map((s) => ({
      q: s.q || "",
      a: s.a || "",
    })) : [],
  };
}

function validateDiagnosed(diagnosed, diagnosis) {
  if (Array.isArray(diagnosed) && diagnosed.length > 0) {
    // Ensure all entries are strings
    return diagnosed.map((d) => typeof d === "string" ? d : (d.title || d.body || JSON.stringify(d)));
  }
  // Fallback: derive from diagnosis gaps
  if (diagnosis?.diagnosed_gaps) {
    return diagnosis.diagnosed_gaps.map((g) =>
      typeof g === "string" ? g : (g.title || g.body || JSON.stringify(g))
    );
  }
  return [];
}

function validateAdvisorBrief(ab) {
  const defaults = { summary: "", urgentItems: [], talkingPoints: [], personality: "" };
  if (!ab) return defaults;
  return {
    summary: ab.summary || defaults.summary,
    urgentItems: Array.isArray(ab.urgentItems) ? ab.urgentItems : defaults.urgentItems,
    talkingPoints: Array.isArray(ab.talkingPoints) ? ab.talkingPoints : defaults.talkingPoints,
    personality: ab.personality || defaults.personality,
  };
}

/* ── Build user message with full context ── */

function buildUserMessage(messages, diagnosis, state, mode) {
  // Extract just the conversational content from messages (not full JSON responses)
  const conversationSummary = messages
    .map((m) => {
      if (m.role === "user") return `User: ${m.content}`;
      // Assistant messages are JSON strings — extract just the message text
      try {
        const parsed = JSON.parse(m.content);
        return `Vale: ${parsed.message || m.content}`;
      } catch {
        return `Vale: ${m.content}`;
      }
    })
    .join("\n");

  return `Here is the completed intake for a ${mode} diagnostic session. Generate the post-diagnosis content.

## Conversation Transcript
${conversationSummary}

## Diagnosis
${JSON.stringify(diagnosis, null, 2)}

## Final Diagnostic State
${JSON.stringify(state, null, 2)}`;
}

/* ── Advisory system prompt ── */

function buildAdvisoryPrompt() {
  return `You are Vale's advisory engine. You have the full conversation history from a completed diagnostic intake, along with the structured diagnosis and accumulated state.

Your job: generate the post-diagnosis experience. This is where the product shifts from "here's what we noticed" to "here's what to do about it."

You are generating content for two audiences:
1. THE USER — who will see their gaps prioritized, a sequenced decision map, and answers to their likely questions. This content should be specific, direct, and actionable. Reference their actual situation. No generic advice.
2. THE CFP — who will read a 60-second briefing before the call. Professional shorthand. Specific enough to act on immediately.

## Content Quality Standard

Every field must reference the user's actual situation. Here's the difference between generic and specific:

GENERIC (bad): "Your tax situation has implications worth reviewing."
SPECIFIC (good): "You said 'they just withhold from the check.' That flat supplemental rate rarely matches actual liability — especially with ISOs triggering AMT."

GENERIC (bad): "Consider reviewing your estate plan."
SPECIFIC (good): "No will, no insurance, no professional relationships, and a major wealth event incoming. You're about to receive the largest sum of your life with no infrastructure around it."

GENERIC (bad): "Discuss tax strategy with client."
SPECIFIC (good): "Walk through ISO vs NSO distinction using her specific grants. Model the withholding gap — show what employer will withhold vs likely actual liability."

## What to Generate

You MUST return a JSON object with ALL of the following fields. Every field must be populated — no nulls, no empty strings, no empty arrays.

**name** — The user's first name from the conversation. If unknown, use "there".

**partnerName** — Partner/spouse name if mentioned. null if not mentioned.

**avatar** — First letter of name, uppercase.

**context** — One-line situational summary using · separators (e.g. "Single · Tech · Bay Area · ~$150K–$300K HHI · ISOs & NSOs from acquisition").

**primaryMode** — Choose the mode that best fits the user's primary need:
- "financial-picture" — when the main value is showing them the full landscape of gaps
- "decision-map" — when there's a specific decision or life event to sequence
- "what-if" — when the user was primarily exploring questions, not facing a specific event

**modes** — Object with exactly three keys:

**modes["financial-picture"]** — Object with:
- "title": string — the overarching financial picture theme
- "subtitle": string — one sentence of context
- "items": array of 3-5 objects, each with:
  - "icon": one of "◈" "○" "◊" "◇" "△" (vary them)
  - "cat": uppercase domain label (CASH FLOW, INVESTMENT, TAX, RETIREMENT, ESTATE, INSURANCE, COORDINATION, EQUITY)
  - "title": string — the gap, specific to their situation
  - "body": string — 2-3 sentences, advisory tone, references their actual situation
  - "urgency": "high" for clear material gaps, "medium" for likely gaps, "low" for nice-to-haves
  - "action": specific next step label (e.g. "Review equity tax exposure" NOT "Learn more")
  Order items by urgency (high first).

**modes["decision-map"]** — Object with:
- "title": string — the decision being mapped (centered on their life event if applicable)
- "subtitle": string
- "items": array of 4-6 objects, each with:
  - "step": number (1, 2, 3...)
  - "title": string
  - "body": string — 1-2 sentences
  - "status": "now" (1-2 items), "next" (2-3 items), or "later" (1-2 items)

**modes["what-if"]** — Object with:
- "title": string — the main question on their mind
- "subtitle": string
- "scenarios": array of 3-4 objects, each with:
  - "q": string — question in the user's voice, as if they'd type it at 10:30pm
  - "a": string — Vale's answer, 2-3 sentences, specific to their numbers and situation. Not hedgy — give real guidance.

**diagnosed** — Array of 2-4 plain strings summarizing key diagnosed gaps. Written for advisor reference. Example: "Acquisition payout has major tax implications she hasn't considered — ISO vs NSO treatment, AMT exposure, withholding gaps"

**advisorBrief** — Object with:
- "summary": string — 2-3 sentences written for a CFP. Professional shorthand.
- "urgentItems": array of 2-4 strings — only time-sensitive items. Each starts with the urgency driver.
- "talkingPoints": array of 3-5 strings — specific enough to act on. Not "discuss taxes" but "Walk through ISO vs NSO using her specific grants."
- "personality": string — 2-3 sentences on how to approach this client. Analytical or anxious? Wants control or delegation? Skeptical?

## Response Format

Return ONLY valid JSON matching the schema above. No markdown fences. No text outside the JSON object. Every field must be populated.`;
}
