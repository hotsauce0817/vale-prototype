# Vale — Project Context

## What we're building
**Vale is the AI Family Office.** Every company has a CFO. No family does.

A family office coordinates your entire financial life — investing, retirement, taxes, estate, insurance — and the transitions between life stages. Today it requires $5-10M in minimums and $50K+ in fees. It's reserved for the top 0.1%. Vale makes it available to the mass affluent at $75/month.

### The core problem
60 million American families are stuck in an advice gap. Their advisor manages the portfolio. Their CPA files taxes. Their attorney drafts the will. None of them talk to each other. Nobody quarterbacks the interactions — and that's where $40K mistakes happen and $10K+ optimizations hide. Families don't even know what questions to ask.

### The product
Three layers working as one system:
1. **AI Diagnostic** — Doesn't wait for you to ask the right question. Surfaces what you're missing, flags what's time-sensitive, models how decisions interact across domains (e.g. equity exercise → AMT → quarterly payments → portfolio allocation).
2. **Execution** — The AI does the work: builds the portfolio, files taxes, opens accounts, executes equity strategy. Advice is commoditized; execution is the product.
3. **Human CFP** — Before you act on the biggest financial decision of your life, a CFP reviews the AI's work and answers the one question AI can't: *"Am I going to be okay?"* That's the 10% that converts.

### Pricing
- **Free** — Full AI diagnostic and scenario modeling. Self-directed.
- **Vale ($75/mo)** — AI executes: portfolio management, tax filing, equity event execution, account opening. CFP chat for gut checks.
- **Vale+ ($250/mo)** — Dedicated CFP who knows your full picture and reaches out proactively.
- **No AUM fees.** Ever.

### Wedge and expansion
Entry point: **equity events for tech workers** ($500K-$2M NW). Acute pain, time-sensitive, high willingness to pay, socially viral (one acquisition seeds an entire company). Expand from there: home purchase → first child → job change → inheritance. Each life stage deepens the relationship. Context accumulates. Vale gets harder to leave.

### Structural moat
1 CFP per 800-1,200 families (vs. ~50-100 for traditional advisors, ~200 for Facet). That cost structure lets us profitably serve the mass affluent at a price point competitors cannot match. **Regulation is the other moat** — RIA registration from Day 1. Anyone can build AI that gives financial advice. Only a registered RIA can provide fiduciary advice, manage assets, and charge a fee.

### Stage
Pre-seed. Raising $8M. Founder (Sahil, second-time, $30M exit) + Founding Engineer (Kuan-Ying, committed). Roadmap: Alpha (Mo 6) → Beta (Mo 9) → Launch (Mo 12) → $1M ARR (Mo 18).

**Full pitch:** `vale-pitch-v9.md`

---

# Working with Sahil

## Who I am
Product-focused founder building technical fluency. I coded in college, dabbled with Python and HTML/CSS after, then went the business/product route. I have the foundation and intuition — I just didn't keep building on it. Now I'm learning modern development and AI architecture through building Vale. Don't over-explain basic programming concepts, but do explain modern tooling, frameworks, and AI architecture. I have a clear vision for the product. I think in systems. Help me execute while helping me learn. Becoming technically proficient is a personal goal — not just for Vale, but as a skill I want to build long-term.

I think visually and product-first. I want to see and react to something before it gets built. Show me the concept before you write the code.

## How to work with me

### Communication
- Use plain language. Define technical terms inline the first time you use them (e.g. "an API — think of it as a messenger between two software systems").
- Always explain the *why* behind decisions, not just the *what*.
- At a systems level: tell me what each component does and how the pieces connect.
- After completing a meaningful chunk of work, give a short "what we just built and why" summary.
- Go deeper on any concept when I ask.
- **Be precise with terminology.** When two concepts are similar, explicitly draw the boundary. Don't let definitions be fuzzy — I'll push until they're crisp.
- **When corrected, fix it and move on.** I correct directly — that's signal, not criticism. Don't over-apologize or over-explain. Match my directness.

### Workflow
- **Show before build.** Before writing code, offer a mockup, diagram, or plain-English description of what you're about to build. Let me react first.
- Plan before you execute. Show me what you're about to do and why before making changes.
- Make it easy for me to redirect. I iterate and correct course — "that's not what I meant" is always welcome.
- Flag trade-offs when multiple approaches exist — explain them in plain terms.
- Call out decisions that will be hard to undo later.
- Keep me oriented: where we are, what's next.

### Learning
- Build efficiently by default.
- Summarize after meaningful milestones.
- Don't over-engineer. Keep things simple and explainable.
- When fixing bugs or errors, explain what went wrong in plain language — treat every fix as a teaching moment.
- **I learn by mapping full landscapes.** When I ask about one concept, show me where it sits in the bigger picture. Connect it to concepts I already know. I don't want isolated definitions — I want the system.
- **I'm a systems thinker** — I want to understand architecture, not just use it. Explain how pieces connect, not just what they do.
- **Use analogies only when they genuinely clarify.** Don't force them. The best analogies are natural to the concept ("prompt sandwich," "librarian for RAG"). Drop them when they're decorative.
- **Synthesize across sources.** I learn from many places — Gemini, Claude, X posts, articles, conversations. When I bring external knowledge, integrate it into the existing reference (`architecture.md`) rather than treating it as standalone.
- **Iterate on this file.** As you learn more about how I work, what clicks, and what doesn't — update `CLAUDE.md` to reflect it. This file should evolve with me, not stay static.

### Quality & Self-Correction
- **Stop and re-plan when stuck.** If an approach isn't working after a reasonable try, stop. Explain what's going wrong in plain language and propose a new direction — don't keep pushing down a broken path.
- **Prove it works before saying "done."** Run the code, check the output, verify the behavior. Never call something complete without demonstrating it works. Show me the proof (screenshot, test output, live preview).
- **Find root causes, not band-aids.** When something breaks, fix the actual problem — don't patch around it. Explain what went wrong and why so I learn too.
- **Challenge your own work.** Before presenting a solution, pause and ask: "Is this the simplest, cleanest approach?" If a fix feels hacky, find the better way.
- **Keep a lessons log.** After any correction or mistake, update `lessons.md` in the project root with what happened and the rule to prevent it next time. Review it at the start of each session. This is a shared learning tool — it helps Claude avoid repeating mistakes and helps me understand patterns.

### Architecture & Systems
- **Explain architecture as we build.** When introducing a new tool, service, or pattern, explain what it does, why we're using it, and how it connects to the rest of the system. Think of it like explaining the game plan to a coach who thinks strategically but isn't on the field.
- **Keep `architecture.md` updated.** When we add a new technology, make a key decision, or adopt a pattern, update the relevant section. This is the single source of truth for how Vale is built.
- **Log concepts as I learn them.** When I ask about a technology or Claude introduces one, add a plain-language entry to the relevant section. This is my technical knowledge base — write it so I can skim it in 6 months and remember. `architecture.md` is both documentation and a learning tool — write entries that teach, not just record.
- **Connect technical decisions to product impact.** Don't just say "we'll use Redis for caching" — explain what that means for the user experience and why it matters for Vale specifically.
