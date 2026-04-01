# Lessons Log

Patterns and mistakes captured across sessions. Claude reviews this at the start of each session to avoid repeating errors. Sahil can read it to learn common patterns.

---

## Tool Calling Architecture (March 2026 rebuild)

The February 2026 lessons below this section are all from the OLD architecture (JSON parsing, deep merge, `ready_for_diagnosis`). That architecture was replaced in March 2026 with native tool calling. The old lessons are removed because the patterns they address no longer exist in the codebase.

---

### 2026-03 — Claude tool_use requires a continuation loop

**What happened:** Claude returned only `tool_use` blocks with empty text on the opening turn. The chat pane showed no message.

**Root cause:** With `tool_choice: { type: "auto" }`, Claude may return `stop_reason: "tool_use"` meaning it expects `tool_result` blocks before producing text. The API was only making a single call.

**Fix:** Added a loop in `diagnostic.js` — when `stop_reason === "tool_use"`, send back `tool_result` blocks and call Claude again. Repeat until `stop_reason === "end_turn"` (max 3 loops).

**Rule:** Always handle the tool_use continuation pattern when using Claude tool calling. Never assume a single API call will produce text.

---

### 2026-03 — Don't store intermediate tool_use blocks in conversation history

**What happened:** After fixing the continuation loop, the second turn returned 500 Internal Server Error.

**Root cause:** `_raw_content` was set to `allContent` which contained `tool_use` blocks from intermediate rounds AND text from the final round. When the frontend stored this in `rawHistory`, `reconstructMessages` tried to create `tool_result` blocks for the intermediate tool_use IDs — but those were already resolved server-side. Claude rejected the invalid tool_result references.

**Fix:** Store only the final response's content blocks in `_raw_content`. Intermediate tool calls are resolved server-side and invisible to the frontend. Use `finalContent` (last response only), not `allContent` (all rounds).

**Rule:** When using a tool-use loop, the conversation history should only contain the final response. Intermediate tool calls are internal to the API handler.

---

### 2026-03 — Empty string is falsy in JS — check for null instead

**What happened:** `if (apiResponse.message)` skipped rendering when message was `""`.

**Note:** This was masked by the continuation loop fix (message is no longer empty). But worth remembering: use `!== null` or `!== undefined` for optional string fields, not truthiness.

---

## Infrastructure Lessons (still valid from February 2026)

---

### 2026-02 — `vercel dev` doesn't load `.env.local` for serverless functions

**What happened:** Added Supabase logging with env vars in `prototype/.env.local`. The ANTHROPIC_API_KEY worked (Claude responded), but SUPABASE_URL and SUPABASE_ANON_KEY were undefined in the serverless function. Turns out ANTHROPIC_API_KEY only worked because it was set in the shell environment, not from the file.

**Root cause:** `vercel dev` loads `.env` (and `.env.development.local` from `vercel env pull`) for serverless functions, but doesn't reliably load `.env.local`. This is a Vercel CLI quirk.

**Rule:** For `vercel dev`, put env vars in `.env` (not `.env.local`). Both are excluded from git by the `.env*` pattern in `.gitignore`. Alternatively, use `vercel env pull` to download remote env vars to `.env.development.local`. When debugging env var issues, add `console.log("[Vale] VAR set:", !!process.env.VAR)` to verify what's actually available.

---

### 2026-02 — Fire-and-forget async doesn't work in serverless functions

**What happened:** Supabase logging was fire-and-forget (no `await`). The insert call was made, then the response was returned immediately. Rows never appeared in Supabase.

**Root cause:** Serverless functions (Vercel, AWS Lambda, etc.) freeze or terminate right after the response is sent. Any pending async work (Promises, setTimeout, etc.) that hasn't completed gets killed. Unlike a long-running server, there's no background process to finish the work.

**Rule:** In serverless environments, `await` any async work before returning the response. Wrap in try/catch so failures don't break the main function.

---

## Dogfooding Learnings (from PRD v4 Section 2 & 6)

These learnings come from testing the product with real users and personas. They inform the system prompt guardrails, the level framework, and the observation quality bar.

---

### 401K false positive (fiduciary failure)

**What happened:** AI assumed user wasn't maxing 401K based on conversational data. She was contributing 6% which exceeds the annual max.

**Why it matters:** This is a fiduciary failure — presenting inferences as facts. A registered advisor cannot tell a client "you're leaving money on the table" based on a guess.

**Rule:** This is why `data_verified` exists and Level 3+ requires it. Findings based on estimates or conversational inference stay at Level 1-2 until data is verified with concrete numbers.

---

### Fabricated dollar estimates (fiduciary failure)

**What happened:** AI claimed "$30-60K in tax savings" with no basis. Actual was $15-25K.

**Why it matters:** Dollar estimates carry authority. Overstating them is a fiduciary violation.

**Rule:** Dollar estimates are acceptable when clearly framed as approximate ("roughly," "in the range of"). Calculation tools for verified numbers are a future build — until then, the `data_verified` flag stays false and the level framework prevents overconfident findings.

---

### Tax bracket error — household vs. individual

**What happened:** AI assumed "$0 income year" when household was $450K+.

**Rule:** Careful about household vs. individual framing. Always clarify whether income figures refer to the individual or the household before using them in tax analysis.

---

### Observation quality bar

**What we learned:** Early observations were generic and didn't land. The 2-of-3 criteria emerged from testing: (1) domain expertise — beyond what Google would tell you, (2) situation-specific — references their actual numbers, (3) cross-domain connection — reveals an interaction they hadn't considered. Observations that hit 2+ criteria consistently produce "I hadn't considered that" reactions. Observations that only hit 1 feel like filler.

**Rule:** Every observation must satisfy at least 2 of 3 criteria. Observations emerge naturally from the conversation — never forced on a schedule.

---

### Fiduciary tone

**What we learned:** Early language used "savings found" and "opportunities identified" — reads as promotional. The correct framing is "areas identified for review." Every finding should serve the client's interest, not Vale's conversion metrics.

**Rule:** "Areas identified for review" over "savings found." If the honest answer is "your current setup is working," that's what the report says.

---

### Domains: five, not six — and the right five

**What we learned:** Cash flow was originally lumped with investing. But "you're spending more than you earn" is a fundamentally different finding from "your portfolio is concentrated." Later, we reorganized the domains: Equity folded into Investing (it's an asset class, not a separate domain). Protection split into Estate Planning and Insurance (different professionals, different timelines, different work items).

**Rule:** Five domains: `cash_flow`, `investing` (includes equity compensation), `taxes`, `estate_planning`, `insurance`. Life events are triggers, not domains. Real estate is cross-domain context.

---

## Map Experience Fixes (March 2026)

These five lessons came from diagnosing why the financial map — the right-panel visual that builds as the user talks — was broken across multiple dimensions. Root cause analysis led to the fixed-slot registry redesign.

---

### 2026-03 — Free-form AI keys cause duplication

**What happened:** The `update_map` tool accepted any string as `key` and `label`. Claude invented different names every turn ("household" → "family_structure" → "household_composition"). Each variation created a new item because the old `add_item` action always appended. After a full conversation: 15+ items when there should have been 8-10.

**Root cause:** When the AI's vocabulary is unconstrained, the frontend can't enforce deduplication. Array-based state with string matching is inherently fragile — it depends on the AI using the exact same string every time, which it won't.

**Fix:** Created `mapRegistry.js` with 20 fixed item slots. The AI picks from an enum (`item_id`), not free-form strings. Labels come from the registry, not the AI. State is object-based (keyed by item_id), so upsert is automatic — calling the same item_id updates in place.

**Rule:** When an AI tool writes to a shared data structure, constrain its keys to a fixed enum. Let the AI fill in values (detail, status), not invent identifiers.

---

### 2026-03 — Empty containers destroy the reveal moment

**What happened:** The system prompt said "Call show_section for 'situation' early — even in your opening response." This made the map panel visible immediately at 56% width with an empty "Your Situation" header. The user saw a blank form from the first moment — no magic, no reveal.

**Root cause:** Showing structure before content makes the experience feel like a data-entry form, not a conversation building a picture. The map's value is in the progressive reveal — watching your financial life take shape as you talk.

**Fix:** Removed `show_section` instruction from the opening. Sections now appear implicitly when they have items (items.length > 0). The entire map panel starts at 0 width and slides in with a CSS transition when the first item arrives. Chat starts full-width, then smoothly narrows to 44% as the map takes 56%.

**Rule:** Never show empty containers. If a UI element's value comes from progressive population, hide it until there's something to show. The reveal IS the experience.

---

### 2026-03 — Passive prompt instructions get ignored

**What happened:** The system prompt said "Update status as your assessment evolves" — a vague, passive instruction. The AI defaulted every item to "neutral" (amber) and never changed it. Every dot on the map was the same color.

**Root cause:** Without explicit examples and an active instruction, the AI takes the path of least resistance. "Update status as appropriate" isn't specific enough to override the default behavior.

**Fix:** Added explicit status examples to the prompt: neutral ("I have a 401K" — just learned, no assessment), good ("I max my 401K match" — confirmed solid), warning ("I have a few old 401Ks" — worth investigating), alert ("No will, two kids, $3M net worth" — needs immediate attention). Added active instruction: "Every item MUST have an intentional status. If you know enough to assess, assess."

**Rule:** When you want the AI to make a judgment call, give concrete examples of each judgment level with realistic scenarios. Passive instructions ("do X as appropriate") get ignored. Active instructions ("every X MUST have Y") get followed.

---

### 2026-03 — Internal categories ≠ user-facing labels

**What happened:** Domain tags (CASH FLOW, PROTECTION, EQUITY) — internal AI categories used for diagnostic reasoning — leaked into the map UI. "Household — PROTECTION" makes no sense to a user looking at their financial picture.

**Root cause:** The `update_map` tool had a `domain` field that the AI set on every item. The frontend rendered it as a badge next to the label. The domain taxonomy is useful for the AI's reasoning and the diagnosis report, but confusing when shown directly to users on the map.

**Fix:** Removed domain tag rendering from FinancialMap.jsx entirely. The domain stays in the data model (used by the diagnosis prompt for categorization), but never appears on the map UI.

**Rule:** Distinguish between AI-internal categories and user-facing labels. Internal taxonomies help the AI reason; they shouldn't be exposed raw to the user. If an internal category needs to be user-facing, translate it into language that makes sense in the user's context.

---

### 2026-03 — Observation-gap connection must be explicit

**What happened:** The system prompt never said "when you generate an observation, also set a gap item on the map." The AI treated observations (chat cards) and map updates as independent actions. Observations appeared in chat but no corresponding gap item appeared in the "What Needs Attention" section.

**Root cause:** The AI doesn't infer multi-tool coordination unless explicitly instructed. Calling `add_observation` and `update_map` together requires a prompt instruction linking them.

**Fix:** Added explicit instruction in the system prompt: "When you generate an observation, also call update_map to set the corresponding gap item with status 'alert'. The observation explains the insight in chat; the gap item makes it persistent on the map."

**Rule:** When two tool calls should always happen together, say so explicitly in the prompt. The AI won't infer that generating an observation should also create a map item — you have to tell it.

---

### 2026-03 — Tool calling without internal_reasoning leaks analysis into text

**What happened:** After migrating from JSON envelope responses (with `message` + `internal_reasoning` fields) to native tool calling, the AI's conversational quality degraded. Responses became 2-3x longer, filled with financial mechanics explanations, multiple questions per turn, and repetitive observations. The same prompt rules existed but were being ignored.

**Root cause:** The JSON envelope had an `internal_reasoning` field — a designated place for Claude's diagnostic thinking that was stripped before sending to the client. The `message` field acted as a container that implicitly constrained text length. When tool calling replaced the envelope, Claude had no place to put its analytical thinking, so it leaked into the conversational text.

**Fix:** First tried a custom `reason` tool (Claude calls it before every text response). Worked for quality but added 2-3 seconds latency per turn (extra API round-trip). Replaced with Claude's native extended thinking (`thinking: { type: "enabled", budget_tokens: 1024 }`), which provides the same structural separation within the same API call — zero additional latency.

**Rule:** When migrating from structured response formats to tool calling, if the old format had an internal reasoning channel, restore the structural separation. Extended thinking is the best option — it separates analysis from text natively with no latency cost. A custom "reason" tool works but adds a round-trip per turn.

---

### 2026-03 — Extended thinking beats custom reason tools for latency-sensitive apps

**What happened:** The `reason` tool restored conversational quality (analysis stayed out of text, responses got concise) but added 2-3 seconds latency per turn — an extra API round-trip because Claude calls the tool first, we send tool_results back, then Claude produces text.

**Root cause:** Any required-every-turn tool adds at least one round-trip to the tool-use loop. For a 12-15 turn conversation, that's 25-45 seconds of cumulative latency — unacceptable for a 5-minute conversion experience.

**Fix:** Replaced the `reason` tool with Claude's native extended thinking parameter (`thinking: { type: "enabled", budget_tokens: 1024 }`). Thinking happens within the same API call — zero additional round-trips. The structural separation (thinking ≠ text) is the same. We lose the `response_plan` and `domains_covered` structured fields, but the old JSON envelope architecture produced great quality without those fields — structural separation alone was sufficient.

**Rule:** When you need a designated thinking space, prefer extended thinking over a custom tool. Extended thinking is built into the API call (no extra round-trip). Custom thinking tools add latency proportional to conversation length. Only use a custom tool when you need structured fields that extended thinking can't provide AND the latency cost is acceptable.

---

### 2026-03 — Tool calling latency is unacceptable for real-time conversation

**What happened:** After migrating from JSON envelope responses to native tool calling, latency tripled from ~5-8s to ~15-23s per turn. Each turn required 2-3 API round-trips (tool calls → tool_results → text). Over a 12-15 turn conversation, that's minutes of cumulative waiting.

**Root cause:** The tool-use loop is fundamentally multi-round-trip. Claude returns `stop_reason: "tool_use"`, you send back `tool_result` blocks, Claude calls again. With 3 tools + extended thinking, a data-heavy turn could take 3 rounds. Each round is a full API call (~5-8s).

**Fix:** Reverted to JSON envelope responses combined with extended thinking. Claude returns a single JSON object (`{ message, map_updates, observation, closing }`) in the text block. Extended thinking provides the structural separation between analysis and conversation (which the old `internal_reasoning` field used to provide, but in a way that broke JSON parsing). Result: single API call, ~5-8s latency, same quality, simpler code (~190 lines vs ~400 lines).

**Rule:** For real-time conversational UIs, prefer single-round-trip architectures. Tool calling is powerful but the loop adds latency proportional to the number of tools × conversation turns. JSON envelope + extended thinking is the best-of-both-worlds approach: structured data (JSON), structural separation (thinking block), single round-trip (one API call).

---

### 2026-03 — Adding tools increases loop iterations — budget MAX_TOOL_LOOPS accordingly

**What happened:** After adding the `reason` tool, the first data-heavy turn (user shares 4+ facts) returned an empty message. Map updates were extracted but no text was produced.

**Root cause:** With `reason` as a required tool, Claude now does: round 1 (`reason`) → round 2 (`update_map` x4) → round 3 (text). On heavy turns, Claude sometimes calls tools one-at-a-time instead of batching, consuming more loop iterations. `MAX_TOOL_LOOPS = 5` wasn't enough headroom.

**Fix:** Increased `MAX_TOOL_LOOPS` from 5 to 10. The safety cap still prevents infinite loops, but gives enough room for reason + multiple tool calls + text production.

**Rule:** When adding a required-every-turn tool like `reason`, increase `MAX_TOOL_LOOPS` to accommodate the extra iteration(s). Budget at least 2x the expected number of tool-calling rounds.

---

### 2026-03 — Claude can return end_turn with only tool_use blocks (no text)

**What happened:** After the map first appeared, the user typed "Sahil" (their name). The map updated (Household detail changed to "Sahil") but no AI message appeared in chat. The user was left talking into the void.

**Root cause:** Claude returned `stop_reason: "end_turn"` with only a `tool_use` block and no text block. The tool-use loop checked `stop_reason !== "tool_use"` → true → broke out. But `finalContent` had no text blocks, so `message = ""`. Since `""` is falsy, `if (apiResponse.message)` skipped adding a chat message. The map update went through (tool_use block was extracted), but the user saw silence.

**Fix:** Changed the loop's break condition from just checking `stop_reason` to also checking for text. If Claude returns `end_turn` with tool_use blocks but no text, treat it like a `tool_use` round — send back tool_results and continue the loop to force text production. Also increased `MAX_TOOL_LOOPS` from 3 to 5 for safety.

**Rule:** Never trust `stop_reason` alone to determine if you have a user-facing response. Always verify the response actually contains text. The AI can decide it "only needed to call tools" and return end_turn with no message — but in a conversational UI, silence is a bug.

---

### 2026-03 — React StrictMode breaks useRef guards in effects

**What happened:** The DiagnosisTransition screen would get stuck — diagnosis data arrived, hero number showed, but the exit animation never fired. The component sat on the transition screen indefinitely.

**Root cause:** The exit effect used `exitingRef.current` as a guard: set it to `true` on entry, schedule timeouts, return cleanup that clears timeouts. In React 18 StrictMode (dev mode), effects run, clean up, then run again on mount. The cleanup cleared the timeouts, but `exitingRef.current` stayed `true` (refs persist across StrictMode remount). When the effect re-ran, the guard blocked it — timeouts were never rescheduled.

**Fix:** Reset the ref in the cleanup function: `exitingRef.current = false`. This way the StrictMode remount starts with a clean ref and can re-enter the guard, rescheduling the timeouts.

**Rule:** When using a ref as a one-shot guard in a useEffect, reset the ref in the cleanup function. StrictMode's double-mount cycle preserves ref values but clears scheduled work (timeouts, intervals). If you don't reset the ref in cleanup, the guard blocks the second mount from re-scheduling.

---

### 2026-03 — Client-side timeouts must exceed server-side API latency

**What happened:** The diagnosis generation showed "Something went wrong" because the DiagnosisTransition component had a 15-second fallback timeout, but the `/api/diagnosis` call (large prompt + Claude Sonnet + JSON generation) regularly takes 15-30 seconds.

**Fix:** Increased client timeout from 15s to 60s. Added single retry on transient errors (429, 5xx). Added `maxDuration = 60` export for Vercel Pro plan. Added "Try again" button to error state so users don't have to redo the entire intake.

**Rule:** Client-side timeouts should be at least 2x the expected API latency. For AI-powered endpoints with large prompts, budget 30-60 seconds minimum. Always add retry logic for transient failures.

---

## March 2026 Redesign — Conversation → Home Screen

---

### 2026-03 — The map was competing with the conversation

**What we learned:** The side-panel financial map was distracting during conversation. Users were looking at the map instead of engaging with Vale. The conversation quality is what builds trust — the map was diluting it.

**Fix:** Removed the map entirely. Made the conversation full-screen. The AI's understanding now gets expressed through the home screen (generated after the conversation), not through real-time map updates.

**Rule:** During a conversation, the user's attention should be on the dialogue. Visual trackers that update while someone is talking compete for attention rather than enhancing it. Show the synthesis after the conversation, not during.

---

### 2026-03 — Observation summaries need to be prompted explicitly

**What we learned:** Adding a `summary` field to the observation JSON requires explicit prompt instructions with examples. Without specific guidance like "under 10 words, punchy and specific," the AI generates generic summaries ("Tax issue identified") instead of useful ones ("$13M taxable event with no exercise strategy").

**Rule:** When adding a new field to the AI's JSON output, include 2-3 examples of what good looks like and explicit constraints (word count, specificity level). The AI defaults to generic without examples.

---

### 2026-03 — Separate generation endpoints for separate concerns

**What we learned:** We considered generating home screen content (score, briefing, work items) inline with the conversation's closing turn. This would have made the final turn much slower (~15-20s) and the system prompt unwieldy. Keeping it as a separate API call (/api/diagnosis repurposed) with its own prompt lets each concern be optimized independently.

**Rule:** When the AI needs to produce fundamentally different outputs (conversational text vs. structured generation), use separate prompts and endpoints. The transition animation masks the second API call's latency.
