/**
 * POST /api/diagnostic — Intake conversation endpoint.
 *
 * This is the core API handler for Vale's diagnostic intake. Each call:
 *   1. Reconstructs Claude-compatible messages from the frontend's rawHistory
 *   2. Calls Claude with extended thinking (single API call, no tool-use loop)
 *   3. Parses the JSON envelope response
 *   4. Returns structured response: text message + observation + closing
 *
 * KEY ARCHITECTURE DECISION: JSON envelope + extended thinking
 *   Claude returns a single JSON object with message, map_updates, observation, closing.
 *   Extended thinking provides structural separation (analysis in thinking block,
 *   conversation in JSON message field) without the multi-round latency of tool calling.
 *   See lessons.md for why we moved away from tool calling.
 */
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./_lib/systemPrompt.js";
import { logTurn, logError } from "./_lib/log.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── JSON parsing ──

/**
 * Parse Claude's JSON envelope response from the content blocks.
 * Returns the parsed object, or null if parsing fails.
 */
function parseEnvelope(content) {
  const rawText = content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const clean = rawText
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  // Attempt 1: direct parse
  try {
    return { parsed: JSON.parse(clean), rawText };
  } catch (_) {}

  // Attempt 2: extract outermost JSON object
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return { parsed: JSON.parse(match[0]), rawText };
    } catch (_) {}
  }

  return { parsed: null, rawText };
}

// ── Message reconstruction ──

/**
 * Reconstruct Claude-compatible messages from raw conversation history.
 *
 * rawHistory is an array of { role, content } where:
 *   - assistant entries have content as an array of blocks (thinking + text)
 *   - user entries have content as a plain string
 *
 * With JSON envelope (no tools), this is straightforward — just pass through.
 * Thinking blocks must be preserved per Anthropic API requirements.
 */
function reconstructMessages(rawHistory, userMessage) {
  const messages = [
    { role: "user", content: "Begin the diagnostic intake conversation." },
  ];

  for (const entry of rawHistory || []) {
    messages.push({ role: entry.role, content: entry.content });
  }

  if (userMessage) {
    messages.push({ role: "user", content: userMessage });
  }

  return messages;
}

// ── API handler ──

/**
 * POST /api/diagnostic
 *
 * Request body:
 * {
 *   rawHistory: [{ role, content }],  // conversation history
 *   userMessage: string | null,        // new user message (null for opening)
 *   sessionId: string
 * }
 *
 * Returns:
 * {
 *   message: string,                   // text for the chat
 *   observation: object | null,        // observation card data (text, summary, domains)
 *   closing: object | null,            // intake closing signal
 *   _raw_content: [...],               // full content array for history
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
    const { rawHistory = [], userMessage = null, sessionId } = req.body;

    const systemPrompt = buildSystemPrompt();
    const claudeMessages = reconstructMessages(rawHistory, userMessage);

    // Single API call with extended thinking — no tool-use loop.
    // Claude returns a JSON envelope in the text block, analysis in the thinking block.
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages,
      thinking: { type: "enabled", budget_tokens: 1024 },
    });

    // Parse JSON envelope from the text response
    const { parsed, rawText } = parseEnvelope(response.content);

    // Extract thinking for logging
    const thinkingText = response.content
      .filter((b) => b.type === "thinking")
      .map((b) => b.thinking)
      .join("\n");
    const reasoning = thinkingText ? { thinking: thinkingText } : null;

    // Graceful fallback if JSON parsing fails
    if (!parsed) {
      console.error("JSON parse failed. Raw text:", rawText.slice(0, 500));

      const turnNumber = (rawHistory || []).filter(
        (e) => e.role === "user"
      ).length;
      await logError({
        sessionId: sessionId || "unknown",
        mode: "intake",
        turnNumber,
        errorType: "json_parse_failed",
        rawResponse: rawText.slice(0, 2000),
        userMessage: userMessage || "[opening]",
      });

      // Return raw text as the message so the conversation isn't broken
      return res.status(200).json({
        message:
          rawText ||
          "I had trouble organizing my thoughts. Could you say that again?",
        observation: null,
        closing: null,
        _raw_content: response.content,
      });
    }

    // Validate and extract structured data from the JSON envelope
    const message = parsed.message || "";
    const observation = parsed.observation?.text ? parsed.observation : null;
    // Accept closing if it's any truthy object (reason field preferred but not required)
    const closing =
      parsed.closing && typeof parsed.closing === "object"
        ? parsed.closing
        : null;

    const result = {
      message,
      observation,
      closing,
      _raw_content: response.content,
    };

    // Log to Supabase
    const turnNumber = (rawHistory || []).filter(
      (e) => e.role === "user"
    ).length;
    await logTurn({
      sessionId: sessionId || "unknown",
      mode: "intake",
      turnNumber,
      userMessage: userMessage || "[opening]",
      aiResponse: message,
      observation: observation?.text || null,
      state: { reasoning },
      diagnosis: null,
      completed: !!closing,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Diagnostic API error:", err);

    // Log error to Supabase
    const { sessionId, rawHistory = [] } = req.body || {};
    await logError({
      sessionId: sessionId || "unknown",
      mode: "intake",
      turnNumber: (rawHistory || []).filter((e) => e.role === "user").length,
      errorType:
        err.status === 401
          ? "invalid_api_key"
          : err.status === 429
            ? "rate_limited"
            : err.status
              ? `anthropic_error_${err.status}`
              : "unhandled_exception",
      rawResponse: (err.message || "").slice(0, 2000),
      userMessage: null,
    });

    if (err.status === 401) {
      return res.status(500).json({ error: "Invalid API key" });
    }
    if (err.status === 429) {
      return res
        .status(429)
        .json({ error: "Rate limited — please wait a moment and try again" });
    }
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
}
