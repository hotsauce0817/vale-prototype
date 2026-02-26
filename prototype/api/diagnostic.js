import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./_lib/systemPrompt.js";
import { logTurn, logError } from "./_lib/log.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/diagnostic
 *
 * Request body:
 * {
 *   messages: [{ role: "user"|"assistant", content: "..." }],
 *   state: { user: {}, domains: {}, ... },
 *   mode: "rinka" | "equity" | "home" | "generic"
 * }
 *
 * Returns parsed JSON from Claude's diagnostic response.
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  try {
    const { messages = [], state = {}, mode = "generic", sessionId } = req.body;
    console.log("[Vale] sessionId received:", sessionId, "| body keys:", Object.keys(req.body || {}));

    // Build system prompt with mode context and current state
    const systemPrompt = buildSystemPrompt(mode, state);

    // Build messages for Claude
    const claudeMessages = messages.length === 0
      // First turn: send a minimal user message to get the AI's opening
      ? [{ role: "user", content: "Begin the diagnostic intake conversation." }]
      : messages;

    // Call Claude — 2048 tokens gives room for message + observation + state_update + diagnosis
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages,
    });

    // Extract text content from Claude's response
    const rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Try to parse JSON — strip markdown fences if present
    let parsed;
    const cleanText = rawText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseErr) {
      // If that fails, try to extract the outermost JSON object
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          console.error("JSON parse failed after extraction. Raw text:", rawText.slice(0, 500));
          // Retry with stronger instruction
          const retryResponse = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            system: systemPrompt + "\n\nCRITICAL: Your previous response was not valid JSON. You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON.",
            messages: claudeMessages,
          });

          const retryText = retryResponse.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("");

          const retryClean = retryText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
          try {
            parsed = JSON.parse(retryClean);
          } catch {
            const retryMatch = retryClean.match(/\{[\s\S]*\}/);
            if (retryMatch) {
              try { parsed = JSON.parse(retryMatch[0]); } catch { /* fall through */ }
            }
            if (!parsed) {
              console.error("JSON parse failed after retry. Retry text:", retryText.slice(0, 500));
              const lastUserMsg = messages.length > 0 ? messages[messages.length - 1] : null;
              await logError({
                sessionId: sessionId || "unknown",
                mode,
                turnNumber: state.conversation_turn || 0,
                errorType: "json_parse_failed_after_retry",
                rawResponse: (rawText || "").slice(0, 2000),
                userMessage: lastUserMsg?.role === "user" ? lastUserMsg.content : null,
              });
              return res.status(200).json({
                message: "I'm having a moment — let me try that again. Could you repeat what you just said?",
                observation: null,
                state_update: {},
                ready_for_diagnosis: false,
              });
            }
          }
        }
      } else {
        console.error("No JSON object found in response. Raw text:", rawText.slice(0, 500));
        const lastUserMsg = messages.length > 0 ? messages[messages.length - 1] : null;
        await logError({
          sessionId: sessionId || "unknown",
          mode,
          turnNumber: state.conversation_turn || 0,
          errorType: "no_json_in_response",
          rawResponse: (rawText || "").slice(0, 2000),
          userMessage: lastUserMsg?.role === "user" ? lastUserMsg.content : null,
        });
        return res.status(200).json({
          message: "I'm having a moment — let me try that again. Could you repeat what you just said?",
          observation: null,
          state_update: {},
          ready_for_diagnosis: false,
        });
      }
    }

    // Strip internal_reasoning before sending to client (useful for server-side debugging)
    const { internal_reasoning, ...clientResponse } = parsed;

    // Ensure required fields exist
    const result = {
      message: clientResponse.message || "",
      observation: clientResponse.observation || null,
      state_update: clientResponse.state_update || {},
      ready_for_diagnosis: clientResponse.ready_for_diagnosis || false,
      diagnosis: clientResponse.diagnosis || clientResponse.state_update?.diagnosis || null,
    };

    // Log this turn to Supabase (awaited — serverless functions terminate after response)
    const lastUserMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    await logTurn({
      sessionId: sessionId || "unknown",
      mode,
      turnNumber: state.conversation_turn || 0,
      userMessage: lastUserMsg?.role === "user" ? lastUserMsg.content : null,
      aiResponse: result.message,
      observation: result.observation,
      state,
      diagnosis: result.diagnosis,
      completed: result.ready_for_diagnosis || false,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Diagnostic API error:", err);

    // Log the error to Supabase so we can track failure rates
    const { messages: msgs = [], state: errState = {}, mode: errMode = "generic", sessionId: errSessionId } = req.body || {};
    const lastUserMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    await logError({
      sessionId: errSessionId || "unknown",
      mode: errMode,
      turnNumber: errState.conversation_turn || 0,
      errorType: err.status === 401 ? "invalid_api_key"
        : err.status === 429 ? "rate_limited"
        : err.status ? `anthropic_error_${err.status}`
        : "unhandled_exception",
      rawResponse: (err.message || "").slice(0, 2000),
      userMessage: lastUserMsg?.role === "user" ? lastUserMsg.content : null,
    });

    // Handle specific Anthropic errors
    if (err.status === 401) {
      return res.status(500).json({ error: "Invalid API key" });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limited — please wait a moment and try again" });
    }

    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
