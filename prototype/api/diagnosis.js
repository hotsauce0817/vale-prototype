import Anthropic from "@anthropic-ai/sdk";
import { buildHomePrompt } from "./_lib/homePrompt.js";
import { logTurn, logError } from "./_lib/log.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Vercel serverless function config — extend timeout for large Claude calls
export const maxDuration = 60;

/**
 * Format raw conversation history into a readable transcript.
 * Extracts message text from JSON envelope responses and user messages.
 * Preserves [OBSERVATION] markers for the generation prompt.
 */
function formatTranscript(rawHistory) {
  const lines = [];

  for (const entry of rawHistory || []) {
    if (entry.role === "assistant") {
      // Extract text blocks (which contain JSON envelope)
      const textBlocks = Array.isArray(entry.content)
        ? entry.content
            .filter((b) => b.type === "text")
            .map((b) => b.text)
        : [String(entry.content)];
      const rawText = textBlocks.join("");

      // Try to parse JSON envelope and extract message + observation
      let text = rawText;
      try {
        const clean = rawText
          .replace(/^```(?:json)?\s*/m, "")
          .replace(/\s*```$/m, "")
          .trim();
        const parsed = JSON.parse(clean);
        if (parsed.message) text = parsed.message;
        if (parsed.observation?.text)
          lines.push(`[OBSERVATION] ${parsed.observation.text}`);
      } catch {
        // Not JSON — use raw text (graceful fallback responses)
      }

      if (text) lines.push(`VALE: ${text}`);
    } else if (entry.role === "user") {
      lines.push(`USER: ${entry.content}`);
      lines.push(""); // blank line between turns
    }
  }

  return lines.join("\n");
}

/**
 * POST /api/diagnosis
 *
 * Generates the home screen content from the completed diagnostic intake.
 *
 * Request body:
 * {
 *   rawHistory: [{ role, content }],   // full conversation history
 *   observations: [{ text, summary, domains }],  // observations from intake
 *   closing: { reason, domains_explored, observation_count },
 *   sessionId: string
 * }
 *
 * Returns: Home screen JSON (score, balance_sheet, briefing_items, work_items, etc.)
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  try {
    const {
      rawHistory = [],
      observations = [],
      closing = null,
      sessionId,
    } = req.body;

    // Format the conversation into a readable transcript
    const transcript = formatTranscript(rawHistory);

    // Build the home screen generation prompt with all context
    const systemPrompt = buildHomePrompt(
      transcript,
      observations,
      closing
    );

    // Call Claude to generate the home screen content
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            "Generate the home screen content based on the conversation transcript and observations provided. Return ONLY valid JSON.",
        },
      ],
    });

    // Extract text from response
    const rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse JSON — strip markdown fences if present
    let homeData;
    const cleanText = rawText
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```$/m, "")
      .trim();

    try {
      homeData = JSON.parse(cleanText);
    } catch (parseErr) {
      // Try to extract JSON object
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          homeData = JSON.parse(jsonMatch[0]);
        } catch {
          console.error(
            "Home screen JSON parse failed. Raw text:",
            rawText.slice(0, 500)
          );
          await logError({
            sessionId: sessionId || "unknown",
            mode: "home_generation",
            turnNumber: 0,
            errorType: "home_json_parse_failed",
            rawResponse: rawText.slice(0, 2000),
            userMessage: null,
          });
          return res
            .status(500)
            .json({ error: "Failed to parse home screen response" });
        }
      } else {
        console.error(
          "No JSON found in home screen response. Raw:",
          rawText.slice(0, 500)
        );
        await logError({
          sessionId: sessionId || "unknown",
          mode: "home_generation",
          turnNumber: 0,
          errorType: "no_json_in_home",
          rawResponse: rawText.slice(0, 2000),
          userMessage: null,
        });
        return res
          .status(500)
          .json({ error: "Failed to generate home screen" });
      }
    }

    // Log the generation
    await logTurn({
      sessionId: sessionId || "unknown",
      mode: "home_generation",
      turnNumber: 0,
      userMessage: "[home screen generation]",
      aiResponse: homeData.score_explanation || "",
      observation: null,
      state: { closing },
      diagnosis: homeData,
      completed: true,
    });

    return res.status(200).json(homeData);
  } catch (err) {
    console.error("Home screen generation API error:", err);

    const { sessionId } = req.body || {};
    await logError({
      sessionId: sessionId || "unknown",
      mode: "home_generation",
      turnNumber: 0,
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
      .json({ error: "Something went wrong generating your home screen." });
  }
}
