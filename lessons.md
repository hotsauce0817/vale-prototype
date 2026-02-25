# Lessons Log

Patterns and mistakes captured across sessions. Claude reviews this at the start of each session to avoid repeating errors. Sahil can read it to learn common patterns. Fang can read it to understand where the prototype's rough edges are.

*If this file keeps going stale, merge it into `architecture.md` as a "Lessons & Gotchas" section. One file that gets updated beats two files where one is always empty.*

---

### 2026-02 — Claude's JSON responses need defensive parsing

**What happened:** Claude sometimes wraps JSON in markdown fences (` ```json ... ``` `), includes text before/after the JSON object, or returns malformed JSON — even when the system prompt says "respond with ONLY valid JSON."

**Root cause:** LLMs are probabilistic. Instruction-following is high but not 100%. The longer and more complex the system prompt, the more likely the model deviates from format instructions on any given turn.

**Rule:** Always parse LLM JSON output defensively. Strip markdown fences, regex-extract the outermost `{...}`, and have a retry strategy. Don't trust that format instructions will be followed every time. See `diagnostic.js` lines 56-108 for the current 3-layer fallback.

---

### 2026-02 — Claude uses wrong domain keys in state updates

**What happened:** The system prompt defines the domain as `investing`, but Claude sometimes returns `investment_coordination` as a key in `state_update.domains`. If you naively merge, the update gets silently dropped because there's no matching key.

**Root cause:** The system prompt describes cross-domain interactions extensively, and the model sometimes conflates the interaction description with the domain key. The word "investment" appears in many contexts.

**Rule:** Normalize incoming keys before merging. `useDiagnosticChat.js` lines 96-98 remap `investment_coordination` → `investing`. When you encounter model output that doesn't match your schema, normalize rather than reject — but log it so you can tighten the prompt later.

---

### 2026-02 — `ready_for_diagnosis` can fire without a diagnosis object

**What happened:** Claude occasionally sets `ready_for_diagnosis: true` in the response but doesn't include the `diagnosis` object in the same response. The UI expects both to arrive together.

**Root cause:** The system prompt was updated to say "include the diagnosis in the SAME response," but the model doesn't always comply — especially when the response is already long and approaching the token limit (2048 max tokens).

**Rule:** Don't assume co-occurrence of related fields in LLM output. The hook now retries with a follow-up call when the flag is set but the object is missing (lines 216-231 of `useDiagnosticChat.js`). In production, consider increasing `max_tokens` for diagnosis turns or splitting the diagnosis into a dedicated follow-up call.

---

### 2026-02 — Deep merge with arrays needs dedup logic

**What happened:** Early versions of the state merge would duplicate signals and key_facts across turns. If Claude sent `signals: ["no TLH strategy"]` on turn 5 and again on turn 8, the array would contain the same string twice.

**Root cause:** Naive spread (`[...existing, ...incoming]`) doesn't check for duplicates. Claude doesn't track what it's already sent — each response is generated fresh based on the full conversation history.

**Rule:** Always dedup when merging arrays from LLM state updates. `mergeArrayUnique()` in `useDiagnosticChat.js` uses Set-based dedup. Works for string arrays; would need a different approach for object arrays (e.g., dedup by `.type` field, as done for `cross_domain_interactions_detected`).

---

### 2026-02 — Display messages and API messages must be tracked separately

**What happened:** Early design used a single messages array for both rendering the UI and sending to the Claude API. This created problems: observations (which the user sees) aren't part of the API conversation, and the API needs the raw JSON response as the assistant message (not the extracted `message` field).

**Root cause:** The user-facing conversation and the API-facing conversation have different shapes. The user sees: AI message, observation card, user message. The API sees: assistant (full JSON), user (text). Mixing them corrupts both.

**Rule:** Separate display state from API state. `messages` (useState) drives the UI. `apiMessagesRef` (useRef) drives the API. They are updated in parallel but have different shapes. useRef for API messages avoids stale closure issues in async callbacks.

---

### 2026-02 — `vercel dev` doesn't load `.env.local` for serverless functions

**What happened:** Added Supabase logging with env vars in `prototype/.env.local`. The ANTHROPIC_API_KEY worked (Claude responded), but SUPABASE_URL and SUPABASE_ANON_KEY were undefined in the serverless function. Turns out ANTHROPIC_API_KEY only worked because it was set in the shell environment, not from the file.

**Root cause:** `vercel dev` loads `.env` (and `.env.development.local` from `vercel env pull`) for serverless functions, but doesn't reliably load `.env.local`. This is a Vercel CLI quirk.

**Rule:** For `vercel dev`, put env vars in `.env` (not `.env.local`). Both are excluded from git by the `.env*` pattern in `.gitignore`. Alternatively, use `vercel env pull` to download remote env vars to `.env.development.local`. When debugging env var issues, add `console.log("[Vale] VAR set:", !!process.env.VAR)` to verify what's actually available.

---

### 2026-02 — Fire-and-forget async doesn't work in serverless functions

**What happened:** Supabase logging was fire-and-forget (no `await`). The insert call was made, then the response was returned immediately. Rows never appeared in Supabase.

**Root cause:** Serverless functions (Vercel, AWS Lambda, etc.) freeze or terminate right after the response is sent. Any pending async work (Promises, setTimeout, etc.) that hasn't completed gets killed. Unlike a long-running server, there's no background process to finish the work.

**Rule:** In serverless environments, `await` any async work before returning the response. Wrap in try/catch so failures don't break the main function. The ~50-100ms for a Supabase insert is negligible compared to the ~3-5s Claude API call that precedes it.
