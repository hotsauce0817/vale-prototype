import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    : null;

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
