import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    : null;

/**
 * Log a single diagnostic turn to Supabase.
 * Fire-and-forget — never blocks the response or throws.
 */
export function logTurn({ sessionId, mode, turnNumber, userMessage, aiResponse, observation, state, diagnosis, completed }) {
  if (!supabase) return;

  supabase
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
    })
    .then(({ error }) => {
      if (error) console.error("[Vale] Log insert failed:", error.message);
    });
}
