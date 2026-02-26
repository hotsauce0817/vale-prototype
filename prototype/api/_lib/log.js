import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    : null;

/**
 * Log a diagnostic error to Supabase.
 * Called when the API fails to produce a valid response — JSON parse failures,
 * timeouts, Anthropic API errors, etc.
 */
export async function logError({ sessionId, mode, turnNumber, errorType, rawResponse, userMessage }) {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from("diagnostic_errors")
      .insert({
        session_id: sessionId,
        mode,
        turn_number: turnNumber,
        error_type: errorType,
        raw_response: rawResponse || null,
        user_message: userMessage || null,
      });

    if (error) console.error("[Vale] Error log insert failed:", error.message);
  } catch (err) {
    // Never let logging break the diagnostic
    console.error("[Vale] Error log error:", err.message);
  }
}

/**
 * Log a single diagnostic turn to Supabase.
 * Awaitable — in serverless environments, we need to wait for the insert
 * to complete before the function terminates.
 */
export async function logTurn({ sessionId, mode, turnNumber, userMessage, aiResponse, observation, state, diagnosis, completed }) {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from("diagnostic_turns")
      .insert({
        session_id: sessionId,
        mode,
        turn_number: turnNumber,
        user_message: userMessage,
        ai_response: aiResponse,
        observation: observation || null,
        state_snapshot: state,
        diagnosis: diagnosis || null,
        completed: completed || false,
      });

    if (error) console.error("[Vale] Log insert failed:", error.message);
  } catch (err) {
    // Never let logging break the diagnostic
    console.error("[Vale] Log error:", err.message);
  }
}
