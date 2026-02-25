# Vale — Technical Architecture

A living reference for how Vale is built. Updated as the system evolves.

**How to read this document:** The first four sections (System Overview → Key Decisions → Current Implementation → Patterns & Practices) document what Vale is and how it works. Everyone reads these. The sections below the divider are Sahil's learning notes — foundational reference material you can skip if you already know the concepts.

---

## System Overview

Vale's prototype is a diagnostic intake conversation — an AI that talks to a user, builds a picture of their financial life across five domains, surfaces cross-domain interactions they didn't know they had, and generates a structured diagnosis.

**Data flow:**

```
User (browser)
  → App.jsx (state machine — routes between screens based on phase)
    → LiveIntake screen (conversation UI)
      → useDiagnosticChat hook (manages conversation state, API calls, state merging)
        → POST /api/diagnostic (Vercel serverless function)
          → buildSystemPrompt() (constructs mode-specific prompt + injects current state)
            → Claude Sonnet API (generates JSON response: message + observation + state_update + diagnosis)
          ← JSON response parsed, internal_reasoning stripped
        ← State merged into diagnostic state, messages rendered
      ← Conversation continues until ready_for_diagnosis = true
    → IntakeRecap screen (displays diagnosis)
```

**Two conversation paths:**
1. **Rinka demo** — Pre-scripted user responses from a real customer interview. Demonstrates the product with a known-good conversation arc. The AI responds live; the user picks from preset choices.
2. **Open intake** — Free-text conversation. Three entry contexts: equity event, home purchase, or generic (cold start with score question).

**The core protocol:** Every API call sends `{ messages, state, mode }`. Claude returns `{ message, observation, state_update, ready_for_diagnosis, diagnosis }`. The frontend deep-merges `state_update` into the running diagnostic state, accumulating signals across turns. When `ready_for_diagnosis` is true and a `diagnosis` object is present, the UI transitions to the recap screen.

---

## Key Decisions

Architectural choices we made and why — so we remember the reasoning later.

### 2026-02 — Start with a static frontend prototype
**Decision:** Build the initial prototype as a static frontend (HTML/JS/CSS with Vite) before adding backend services.
**Why:** Lets us validate the product concept, UX flow, and messaging with real users before investing in backend complexity. We can add APIs, databases, and auth later without throwing away the frontend work.

### 2026-02 — Vale's AI Session Architecture
**Decision:** Three-layer session design — each layer uses a different type of prompt, but all share the same persistent user profile.

**The three layers:**

1. **Intake session** — Runs on a general advisor prompt. Goal: build the user's financial profile and detect their highest-urgency situation. The AI asks smart questions, builds rapport, and extracts structured data. The application layer watches for urgency signals in the background. When it detects a high-urgency event with enough parameters, it surfaces a card: "It looks like your equity situation is time-sensitive — want to go deeper?" User taps yes → specialized session loads with everything already known. The intake never feels like a form. It feels like talking to an advisor who gets smarter as the conversation goes on.

2. **Task/card sessions** — Specialized prompts per domain (equity, tax, investing, etc.), loaded with the user's stored profile. The navigation menu IS the router — user taps "tax optimization," the tax system prompt loads. These are the deeply built, testable, auditable flows where the quality bar is highest. Each domain has its own prompt, decision trees, guardrails, and eval test cases.

3. **General/home session** — Hybrid concierge prompt for open-ended questions. When someone types "should I put more into my 401k?" (which touches tax, investing, and cash flow), this prompt recognizes the shape of the question and either handles it broadly or triages to a specialized session. Think: the AI concierge who knows when to hand you to a specialist.

**Key design principles:**
- **Profile is persistent, prompts are session-specific.** The stored financial profile (income, accounts, equity, family, prior decisions) gets injected into every system prompt. Prompts are different per domain; the profile is always the same.
- **Each session is a fresh API call.** Conversation history handles within-session memory automatically. You don't build anything — it's how the API works.
- **Session summaries keep the profile alive.** At the end of each session, a quick summarization call extracts decisions made, open questions, and new facts — then appends them to the profile. Lightweight and cheap.
- **Link-based routing skips triage.** A URL like `vale.com/start?event=equity` pre-selects the domain before a word is typed. You load the equity prompt immediately and open three steps deeper than generic intake.
- **Build routing plumbing from day one.** Even with only 2 life events at launch, build the intake so it outputs a route. When life event #3 is ready, you add a new prompt and a new route — not a refactor.

### 2026-02 — AI Function Ownership Matrix
**Decision:** Map AI engineering scope to roles for hiring and team structure.

This matters because the AI stack has distinct functions that require different expertise. The PM (Sahil) should own eval frameworks and prompt engineering alongside the AI engineer — these are the most product-facing parts of the stack. The CFP is critical for defining what "correct" looks like and where the compliance boundaries are.

| Function | AI Engineer | PM | CFP |
|---|---|---|---|
| LLM Architecture | Owns | Understands constraints | — |
| RAG Systems | Owns | Understands capabilities | Informs data structure |
| Eval Frameworks | Builds infrastructure | Drives the process | Defines "correct" |
| Prompt Engineering | Technical optimization | Shared ownership | Reviews financial accuracy |
| Reasoning Chains | Makes them work | Designs the steps | Validates the logic |
| Guardrails | Implements | Defines product rules | Defines compliance rules |

**Implication for hiring:** The first AI engineer (beyond Kuan-Ying) needs to own LLM architecture and RAG. Prompt engineering and evals can be PM-driven initially — especially for an AI-native PM. The CFP is indispensable for evals and guardrails from day one.

---

## Current Implementation

What exists today. ~1,700 lines of custom code total.

### Stack
- **Frontend:** React 18, Vite 5, no CSS framework (inline styles with design tokens)
- **Backend:** Single Vercel serverless function calling Claude Sonnet via Anthropic SDK
- **Dependencies:** `react`, `react-dom`, `@anthropic-ai/sdk` — that's it
- **No:** TypeScript, tests, CI/CD, database, auth, state library, CSS framework

### File Map

**Frontend — `prototype/src/`**

| File | What it does |
|---|---|
| `App.jsx` | State machine. 5 state variables (`phase`, `profileKey`, `flowMode`, `entryContext`, `diagnosis`) control which screen renders. Phases: select → intake → recap → modes → return → human. |
| `hooks/useDiagnosticChat.js` | **Core complexity lives here.** Custom hook managing: display messages (what user sees), API messages (role/content pairs for Claude via `useRef`), diagnostic state (accumulated across turns), and diagnosis extraction. Includes deep merge logic with array dedup for signals/key_facts. |
| `screens/LiveIntake.jsx` | Conversation UI for both Rinka demo and open intake. Renders messages, observations, loading states. Calls `useDiagnosticChat` hook. |
| `screens/EntrySelect.jsx` | Landing screen. Three paths: Rinka demo, equity event, home purchase. |
| `screens/IntakeRecap.jsx` | Displays diagnosis — either from AI (diagnosis object) or hardcoded profiles. |
| `screens/DiagnosticIntake.jsx` | Hardcoded profile flow (dev mode only). Pre-scripted intake with canned responses. |
| `screens/ModeExplorer.jsx` | Post-diagnosis: shows Vale vs. Vale+ tiers. Hardcoded profiles only. |
| `screens/ReturnExperience.jsx` | Simulates returning user experience. Hardcoded profiles only. |
| `screens/HumanHandoff.jsx` | CFP handoff stub. Hardcoded profiles only. |
| `tokens.js` | Design system: colors, typography, spacing, border radius. All styles reference `T.` |
| `data/profiles.js` | Three hardcoded demo profiles (Maya, Arun, Vikram) with full intake/diagnosis data. |
| `data/rinka.js` | Pre-scripted Rinka responses array. Each entry has display text + choice options. |
| `components/shared.jsx` | Reusable UI primitives: `Btn`, `Card`, `FadeIn`, `Badge`, etc. |

**Backend — `prototype/api/`**

| File | What it does |
|---|---|
| `diagnostic.js` | POST endpoint. Receives `{ messages, state, mode }`, builds system prompt, calls Claude Sonnet (2048 max tokens), parses JSON response with 3-layer fallback (direct parse → regex extract → retry with stronger instruction), strips `internal_reasoning`, returns normalized response. |
| `_lib/systemPrompt.js` | **This is the product logic.** 334 lines. Defines Vale's identity, the 5 financial domains with cross-domain interactions, observation criteria, conversation strategy, JSON response format, and diagnosis generation rules. Mode-specific contexts appended: Rinka (focused on equity/tax/investing), Life Event (score → +2 → deep diagnosis), Generic (cold start with score question). Current diagnostic state injected as JSON at the end. |

### Diagnostic State Shape

The state object that accumulates across the conversation:

```
{
  user: { name, household, life_stage, hhi_range, state_of_residence, dependents, score },
  entry_path: "rinka" | "life_event" | "generic",
  life_event: "equity_event" | "home_purchase" | null,
  domains: {
    investing: {
      explored, gap_severity,
      layers: {                          ← only investing has sub-layers
        cash_flow: { explored, gap_severity, signals[], key_facts[] },
        savings:   { explored, gap_severity, signals[], key_facts[] },
        portfolio: { explored, gap_severity, signals[], key_facts[] }
      },
      signals[], key_facts[]
    },
    tax:        { explored, gap_severity, signals[], key_facts[] },
    retirement: { explored, gap_severity, signals[], key_facts[] },
    estate:     { explored, gap_severity, signals[], key_facts[] },
    insurance:  { explored, gap_severity, signals[], key_facts[] }
  },
  observations[],
  cross_domain_interactions_detected[],
  conversation_turn: number,
  ready_for_diagnosis: boolean
}
```

### Known Prototype Debt

These are intentional trade-offs at prototype stage, not oversights:

- **No types.** No TypeScript. State shapes are implicit, enforced by convention and the system prompt's JSON format spec.
- **No tests.** The deep merge logic (`mergeState`, `mergeDomain`, `mergeArrayUnique`) does real work and should be tested. The JSON parsing fallback chain in `diagnostic.js` should also be tested.
- **JSON parsing is fragile.** Claude sometimes wraps JSON in markdown fences or includes text outside the JSON object. `diagnostic.js` has a 3-layer fallback: direct parse → regex extraction → full retry with stronger instruction. Works but is prototype scaffolding.
- **`ready_for_diagnosis` without diagnosis.** Edge case where Claude sets the flag but doesn't include the diagnosis object. The hook handles it with a retry call (line 216-231 of `useDiagnosticChat.js`), but it's a band-aid.
- **No session persistence.** Conversation is lost on page reload. State lives in React `useState`/`useRef` only.
- **Screen routing won't scale.** `App.jsx` uses if/else chains on a `phase` string. Fine for 7 screens, not for 20+.
- **Claude sometimes uses wrong domain key.** The merge logic normalizes `investment_coordination` → `investing` (line 96-98 of `useDiagnosticChat.js`) because Claude occasionally deviates from the schema.
- **Inline styles everywhere.** All styling via `T.` tokens and inline style objects. Clean and consistent, but no CSS framework or component library.
- **Dev mode feature flag.** `?dev` query param switches to hardcoded profile flow. Not a proper feature flag system.

---

## Patterns & Practices

Engineering patterns we follow. Populated as we adopt them.

*(Will cover: environment strategy, branching workflow, testing approach, deployment pipeline, code review norms.)*

---
---

## Foundational Reference — Sahil's Learning Notes

*The sections below are plain-language explanations of architecture, tooling, and AI concepts — written as a personal learning reference. Each entry covers what it is, why it matters, and what the alternatives are. If you already know this stuff, you can stop here.*

---

## Developer Tooling & Workflow

How code gets from your laptop to users — the tools, the flow, and why we chose what we chose.

### Hot Module Replacement (HMR)
When developing locally, HMR lets you see code changes in the browser almost instantly — without refreshing the page or losing your current state. If you're filling out a form and tweak the button color, HMR updates the button without clearing the form. The feedback loop between changing code and seeing the result is under a second.

### Vite (Our Build Tool)
A build tool — it takes your source code (JavaScript, CSS, etc.) and packages it into optimized files a browser can run. Vite is what makes HMR work for us.

**Why Vite over alternatives:**
- **Webpack** was the industry standard for years but is slow — builds can take 10-30 seconds on large projects. Vite uses a different approach (native ES modules) that makes it nearly instant.
- **Turbopack** (from Vercel) is the newer competitor, tightly coupled to Next.js. We're not on Next.js yet, so Vite is the better fit.
- **esbuild / Rollup** are lower-level tools that Vite is built on top of. Vite gives us the developer experience (HMR, plugin system) without having to configure the underlying bundlers directly.

### Branching & Deployment Flow
How code moves from a developer's laptop to the live product:
1. **Local** — developer writes code on their machine, sees changes instantly (HMR)
2. **Feature Branch** — they push to a Git branch (e.g., `header-redesign`). Vercel creates a preview URL.
3. **Review** — team reviews the preview URL, automated tests run against it
4. **Merge to Main** — once approved, code merges into the `main` branch
5. **Production** — merging to `main` automatically triggers a production deployment. The live site updates within minutes.

Key principle: developers never code directly on `main`. The main branch = the live product. Merging to main = shipping to users.

### Preview / Ephemeral Environments
In the old world, there was one shared "staging server" where everyone's code collided — a bottleneck. Modern platforms (Vercel, Netlify, etc.) replaced this with ephemeral environments: every Git branch or pull request automatically gets its own unique, live URL.
- Three developers working on three features = three distinct live sites you can test simultaneously
- Environments are disposable — if one has an issue, push a new commit and a fresh one is built in seconds
- You only pay while they exist (no idle servers sitting around)
- Non-developers can leave feedback directly on the preview URL instead of describing issues in Slack

### Vercel (Our Hosting & Deployment Platform)
The platform that hosts our app and handles deployment. Push code → site updates. Every branch gets its own live preview URL.

**What makes Vercel unique:**
- **Owns Next.js** (a popular web framework) — so their platform is the "perfect home" for apps built with it. Millions of developers use the free framework, then naturally move to the paid hosting. Classic Trojan horse strategy.
- **Preview Deployments** — every code push creates a unique live URL. A PM or designer can see the feature in seconds without waiting for a formal build.
- **Edge Network** — your site is replicated across hundreds of locations worldwide. Users get near-instant loads regardless of where they are, which directly impacts conversion rates and SEO.
- **Serverless** — you don't manage servers. Code runs on-demand when someone visits. Handles 10 visitors or 10 million with zero manual adjustment.
- **v0** — their AI tool that generates production-ready UI from plain-English descriptions. Moves Vercel from a developer tool to a product tool.

**Why Vercel over alternatives:**
- **AWS (S3 + CloudFront + Lambda)** — more flexible and cheaper at scale, but requires significant DevOps expertise to configure, monitor, and maintain. We'd need to build what Vercel gives us for free (preview deployments, automatic SSL, edge distribution). Right choice for later when we need fine-grained control; wrong choice for a 2-person team shipping fast.
- **Netlify** — very similar to Vercel. Both are excellent. Vercel has a slight edge for React apps and a stronger serverless story. Netlify has better form handling and identity management built in. Either would work; we went Vercel because of the Next.js ecosystem we may adopt later.
- **Railway / Render / Fly.io** — better for traditional server apps (always-on backends, databases). We're serverless for now, which is Vercel's sweet spot. If we need persistent servers later (e.g., WebSocket connections for real-time chat), we'd consider these.

### Serverless Functions
Traditional servers run 24/7 whether anyone's using them or not — like keeping a restaurant open with full staff at 3am. Serverless functions only run when triggered (a user visits a page, submits a form, etc.). You pay per execution, not per hour. Trade-off: there can be a brief "cold start" delay when a function hasn't been called recently, though modern platforms have largely solved this.

Our backend (`/api/diagnostic`) is a single serverless function on Vercel. It spins up when a user sends a message, calls Claude, returns the response, and shuts down. No server to manage.

### CI/CD (Continuous Integration / Continuous Deployment)
An automated pipeline that tests and deploys code every time a developer pushes changes. "Continuous Integration" means code is automatically tested when merged. "Continuous Deployment" means it's automatically shipped to production if tests pass. The whole point: remove manual steps between writing code and users seeing it. Reduces human error and speeds up iteration.

We don't have CI/CD set up yet (no tests to run), but Vercel handles the CD half — every push to `main` auto-deploys to production.

---

## AI Architecture — The Stack

The full AI pipeline, organized inside-out: from how models are built, to how you talk to them, to how they access knowledge, to how they become products. Read top-to-bottom to understand the whole picture.

---

### Layer 1: How Models Are Built

#### Pre-training (The "Education")
The foundation. A model reads a massive chunk of the internet — books, articles, code, conversations — to learn grammar, facts, reasoning patterns, and how to predict the next word. This takes months, thousands of GPUs, and millions of dollars. The output is a "base model" that's incredibly smart but doesn't know how to follow instructions — it just predicts what text comes next. Think of it as someone who read every book in the library but never had a conversation.

#### Post-training (The "Socialization")
This turns a raw base model into a helpful assistant. Two main steps:
- **Instruction Fine-Tuning (SFT):** Teaching the model that when someone says "write a poem," it should actually write a poem instead of continuing to predict random text. Done by training on thousands of examples of good instruction-following behavior.
- **RLHF (Reinforcement Learning from Human Feedback):** Aligning the model with human values — making it helpful, harmless, and honest. Human raters score the model's outputs, and the model learns to produce responses humans prefer. This is why Claude sounds helpful rather than chaotic.

#### Fine-tuning (The "Specialization")
Taking an already-trained model and training it further on a specific domain. Unlike pre-training (which is general), fine-tuning uses a smaller, curated dataset to make the model an expert in a niche — like medical terminology, legal reasoning, or a company's specific communication style.
- **What changes:** The model's internal weights (its "DNA"). It permanently absorbs the new knowledge or behavior.
- **Cost:** High. Requires GPUs, data science expertise, and a quality training dataset.
- **When to use it:** Only when the model's fundamental behavior needs a permanent shift. For most use cases, prompt engineering + RAG is faster and cheaper. Harvey (legal AI) is a notable exception — they fed 10 billion+ tokens of case law into OpenAI's models to make them "think like lawyers" at a foundational level.

#### Open Source vs. Closed Models
- **Closed models** (GPT-4, Claude): You access them through an API. You can't see the weights, can't download them, can't run them on your own servers. You can fine-tune through the provider's interface, but you're renting a customized version — never owning it.
- **Open-weight models** (Llama, Mistral, Gemma): You can download the model file, run it on your own hardware, fine-tune it however you want, and keep everything private.
- **The trade-off:** Closed models are generally more capable and easier to use. Open models give you full control, data privacy (nothing leaves your servers), and no vendor lock-in. Most startups use closed models via API for their core product and only go open when privacy or cost demands it.

---

### Layer 2: How You Talk to the Model

#### Prompt Engineering (The "Interface")
The craft of writing instructions that guide the AI's behavior. This happens at **inference time** — meaning the model is already built, and you're just shaping how it responds without changing its brain. It's the most accessible part of the AI stack: no GPUs, no training data, just clear thinking about what the AI needs to know.

The model doesn't just see the user's message. It sees a structured package — the **"Prompt Sandwich"**:
1. **System Prompt (the bread):** Hidden instructions from the developer. "You are a financial planning assistant. Never give specific investment advice without disclaimers. If confidence is low, recommend a CFP review." The user never sees this.
2. **Few-Shot Examples (the filling):** Optional examples of how to perform the task. "Input: 'Should I exercise my ISOs?' → Output: [example of ideal response]." Teaches the model the expected format and quality.
3. **User Prompt (the garnish):** The actual message from the user.

**Key insight:** Fine-tuning changes the model's brain so it reacts differently to the same words. Prompt engineering changes the environment so the brain has better information to work with. For 90% of use cases, prompt engineering is faster, cheaper, and more flexible.

#### The Inference Flow (What Happens When You Press Send)
When an API call is made, three things happen in milliseconds:
1. **Tokenization:** All the text (system prompt + conversation history + user message) gets converted into numbers the model can process.
2. **Prefill Phase:** The model reads the entire block of text at once to understand context.
3. **Decode Phase:** The model predicts the next word, one at a time, based on that context. Each word is influenced by everything that came before it.

This is why longer prompts cost more — you're paying per token (roughly 3/4 of a word) for both input and output.

#### Reasoning Chains (The Model Thinking Step-by-Step)
When the model works through a multi-step problem **within a single API call.** You send one prompt, and the model reasons through a logical sequence in its response. "Should I do a Roth conversion this year?" → the model itself works through: (1) check current tax bracket, (2) estimate future bracket, (3) calculate traditional IRA balance, (4) model tax cost of converting, (5) project benefits over 10/20/30 years, (6) check for interactions with estate planning, RMDs, state taxes, (7) generate a recommendation with confidence level.

The technique that enables this is **Chain-of-Thought (CoT) prompting** — instructing the model to "think step by step" or "show your reasoning." Without this, the model might skip to a conclusion. With it, the model walks through each step explicitly, which produces more accurate answers and lets you (or the CFP) verify the logic.

**The supervision spectrum:** Not all reasoning chains are equal. The amount of structure you impose determines how testable and auditable the output is:

- **Unstructured** — "Think step by step about whether I should do a Roth conversion." The model decides what steps to take and in what order. You're trusting its judgment entirely. The instruction lives in the prompt ("think step by step") but there's no framework — you're just encouraging the model to show its work. Flexible, good for open-ended exploration. But hard to test — you can't predict what path it'll take, so you can't write a regression test that checks "did it consider AMT?"

- **Semi-supervised** — The reasoning framework is **defined in the system prompt** as structured instructions the model follows within a single API call. Example: "When analyzing a Roth conversion, always consider: (1) current vs. future tax bracket, (2) conversion tax cost, (3) long-term projections, (4) interactions with other accounts. Show your reasoning at each step." The model reads these instructions at inference time and follows the framework when generating its response. You defined what steps to take; the model fills in the actual analysis at each step. Testable — you can verify it hit each step — but the quality of each step depends on the model's judgment.

- **Supervised / Structured** — The reasoning framework **moves out of the prompt and into your application code.** Each step becomes a separate API call (this is where reasoning chains and prompt chains converge). Your code orchestrates: Step 1 → call the model with income data, ask it to classify tax bracket. Step 2 → take that output, call the model with IRA data, ask it to model conversion cost. Step 3 → call a tax calculation API with real numbers. The application controls the flow, not the model. Every step has defined inputs, outputs, and validation. Fully testable, auditable, CFP-reviewable.

**Where the orchestration lives** is the key distinction: unstructured → the model's judgment. Semi-supervised → the system prompt (instructions the model follows). Supervised → your application code (separate calls your code controls).

**How this maps to Vale:**
- The **general/concierge session** uses less structured reasoning — it needs to explore freely when a user asks an open-ended question.
- The **task/card sessions** use heavily supervised chains — you know the domain, the steps, and what "wrong" looks like. This is where the quality bar is highest.
- **Evals and guardrails** are only possible for supervised chains — you can write a test for "did the AI check AMT exposure on this ISO exercise" but not for "did the AI give good general financial advice."
- This is a core technical reason to start with focused life events: **you can only build supervised reasoning chains for domains you deeply understand.** Generic advice forces unstructured chains, which are untestable.

Designing these chains — what steps, in what order, with what data — is part AI engineering and part product design. The engineer makes them work technically. The PM and CFP define what the steps should be. For Vale, reasoning chains are where the "no family has a CFO" problem gets solved — the AI coordinates across domains rather than giving siloed answers.

---

### Layer 3: How the Model Accesses Knowledge

#### RAG (Retrieval Augmented Generation)
A "search-then-speak" workflow. Instead of stuffing everything into the prompt, you store information in a database and retrieve only what's relevant for each query.

How it works:
1. **Retrieve:** When the user asks a question, the system searches a database for the specific information needed.
2. **Augment:** That information gets injected into the prompt alongside the user's message.
3. **Generate:** The model reads the provided context and generates an answer grounded in real data.

**For Vale:** When a family asks about refinancing their mortgage, the system pulls their current mortgage terms, income, credit profile, current rates, other debts, and financial goals — but NOT their estate plan or insurance details, which would waste context space and potentially confuse the model. RAG is the system that decides what to retrieve and how.

**Real-world example:** When Claude shows "memories" about you across conversations, that's RAG. Your facts are stored in a database. When you start a new chat, the system searches for relevant facts and injects them into the prompt. The model doesn't "remember" you — a very fast librarian hands it the right notes exactly when you ask a question.

#### Memory Types
AI "memory" is actually three different things:

1. **Parametric Memory (the "brain"):** What the model learned during pre-training and fine-tuning. Frozen in time — a 2023 model's parametric memory has nothing about 2024 events. Permanent but not updatable without retraining.

2. **Conversational Memory (the "short-term"):** The chat history within a single session. Every previous message gets sent with each new API call, so the model always knows what was just discussed. Automatic — you don't build anything. Disappears when the session ends.

3. **External Memory / RAG (the "reference library"):** Facts stored in a database and retrieved when relevant. The model doesn't "know" the information permanently — but because RAG puts the right pages in front of its eyes, it can act like it does. Easy to update, easy to restrict access, easy to cite sources.

**Why this matters for Vale:** You don't need the AI to remember every conversation. You need a well-structured profile (external memory) that gets injected into every session. Clean profile + session summaries = 90% of the value with 10% of the complexity.

#### Context Windows (The Fundamental Constraint)
Every LLM has a limit on how much text it can "see" at once — the context window. Think of it as the model's desk: it can only have so many documents open simultaneously. Claude's context window is ~200K tokens (roughly 150K words). Sounds enormous, but a family's full financial picture — income, expenses, accounts, assets, insurance, estate documents, tax history — could easily be hundreds of pages.

This constraint is exactly why RAG exists: instead of dumping everything on the desk, you have a librarian who pulls only the 3-5 pages that matter for this specific question. Managing context effectively — getting the right information to the model at the right time — is one of the core challenges of AI product development.

---

### Layer 4: How It Becomes a Product

#### LLM Architecture / Orchestration
The foundational design of how your AI system processes information. Not "which model" — but how the whole system works together. Key decisions:
- **Model selection:** Maybe Claude for complex financial reasoning, a smaller/cheaper model (like Haiku) for simple classification tasks, a different model for triage routing. You don't use one model for everything — you match the model to the task.
- **Chaining calls:** A single user question often requires multiple AI calls in sequence. "Should I exercise my ISOs?" might need: (1) retrieve income data, (2) check tax bracket, (3) model AMT exposure, (4) consider portfolio allocation, (5) generate recommendation. That's an orchestrated sequence, not one prompt.
- **Routing between domains:** When you have multiple specialized areas (tax, investing, equity, estate), you need a way to direct each query to the right specialized prompt. The entry point the user chooses (tapping a card vs. typing an open question) is often enough to route automatically.

**Industry examples:** Harvey (legal AI) went deep on model customization — continued pre-training with 10B+ tokens of case law so the model fundamentally "thinks like a lawyer." Legora (also legal) went deep on RAG instead — connecting frontier models to law firms' document management systems with sentence-level citations. Both are successful; different architectural bets.

#### Prompt Chaining (Application-Level Orchestration)
When your application code makes **multiple separate API calls** in sequence, with the output of one feeding into the next. Your code is the conductor — it decides what to call, in what order, and what data to pass between steps. (Compare with reasoning chains in Layer 2, where the model thinks through steps within a single call.)

The same Roth conversion example, but as a prompt chain: (1) API call to retrieve the user's income data from the database, (2) API call to a cheap/fast model to classify their tax bracket, (3) API call to model AMT exposure with the retrieved numbers, (4) API call to the primary model to generate a recommendation using all previous outputs. Each step is a separate prompt, possibly using different models — a lightweight one for classification, an expensive one for the final recommendation.

**When to use which:** If the model can reason through the whole problem in one call (no external data needed between steps), a reasoning chain is simpler and faster. When the problem requires data lookups, API calls, or tool use between steps — check a database, call a tax API, retrieve account balances — the model can't do that alone, so you break it into a prompt chain. For Vale, it'll be a mix: reasoning chains for the analysis within each step, prompt chains for the orchestration that feeds data between steps.

#### Prompt Layering & Routing
Separately from chaining, you can evolve a prompt's focus over the course of a conversation:
- **Sequential injection:** Start with a general advisor prompt. As the conversation reveals information, append structured context blocks that shift the AI's focus. "User has disclosed an equity event in 60 days. Prioritize this. Apply equity compensation rules." The system prompt doesn't change, but injected context narrows it.
- **Prompt swap at a trigger point:** Run a general prompt until you know enough to route, then end the session and load a specialized prompt. The user experiences continuity; you've handed off between two AI configurations.
- **Link-based routing:** A URL like `vale.com/start?event=equity` pre-selects the domain before a word is typed, skipping the general prompt entirely.

#### Eval Frameworks (How You Know the AI Is Right)
Arguably the most important and most underestimated piece. For a product where bad advice means a family loses real money, you need systematic measurement.

What this means:
- **Test cases:** "Family with $800K in assets, two kids, RSUs vesting, considering a home purchase — what should the system recommend?" Then the CFP defines what a good answer looks like.
- **Regression tests:** Run test cases automatically every time you change the AI system to make sure you haven't broken what was working.
- **Quality metrics:** Did it catch the tax implication? Did it consider all relevant accounts? Did it recommend something dangerous? Did it hedge appropriately when uncertain?
- **Dashboards:** Track accuracy, coverage, and failure patterns over time.

**Why focus matters for evals:** You can write a test for "did the AI correctly calculate AMT exposure on ISO exercise for a California resident at $450K." You cannot write a test for "did the AI give correct advice about inheriting a farm in Iowa." Deep life events are testable. Generic advice is not. This is a core reason to start focused.

#### Guardrails (The Safety Layer)
The system that prevents the AI from causing harm. For a financial product under RIA registration, guardrails include:
- Never recommending something illegal or non-compliant with SEC rules
- Flagging when confidence is low and a human CFP should review
- Preventing hallucinated numbers — if the AI says "your account balance is $500K," that must match real data
- Ensuring recommendations stay within what an RIA can legally advise on
- Catching dangerous edge cases — "the AI recommended investing the emergency fund in crypto" should never happen
- Regulatory compliance in AI outputs — there are specific SEC rules about how investment advice can be communicated

The AI engineer implements guardrails. The PM defines what product rules to enforce. The CFP defines the compliance boundaries. All three must collaborate — guardrails that are technically sound but miss a regulatory nuance are worse than useless.
