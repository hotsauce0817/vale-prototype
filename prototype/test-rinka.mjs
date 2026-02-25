// Quick test script for the Rinka diagnostic flow
// Run: node test-rinka.mjs

// Use production URL if --prod flag, otherwise local
const API_URL = process.argv.includes("--prod")
  ? "https://prototype-six-alpha.vercel.app/api/diagnostic"
  : "http://localhost:3001/api/diagnostic";

const RINKA_RESPONSES = [
  "I have some money coming in and I don't know what to do with it",
  "My company is being acquired",
  "What's the difference?",
  "They just withhold from the check, I think it's fine",
  "I've used ChatGPT / done my own research",
  "I don't even know what I don't know",
  "That nobody takes a huge chunk in taxes I didn't expect",
  "Wait — is that actually a thing that happens?",
  "I figured I'd deal with it when the money actually arrives",
];

async function callAPI(messages, state, mode) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, state, mode }),
  });
  return res.json();
}

async function main() {
  let apiMessages = [];
  let state = {};
  let observationCount = 0;
  let turn = 0;

  console.log("=== Starting Rinka Demo Flow ===\n");

  // Turn 0: Get AI opening
  const opening = await callAPI([], state, "rinka");
  console.log(`AI [Turn ${++turn}]: ${opening.message}`);
  if (opening.observation) {
    observationCount++;
    console.log(`  📌 OBSERVATION: ${opening.observation.text}`);
  }
  console.log();

  // Store in API messages format
  apiMessages.push(
    { role: "user", content: "Begin the diagnostic intake conversation." },
    { role: "assistant", content: JSON.stringify(opening) }
  );
  if (opening.state_update) state = { ...state, ...opening.state_update };

  // Loop through Rinka's responses
  for (const userMsg of RINKA_RESPONSES) {
    // Add user message
    apiMessages.push({ role: "user", content: userMsg });
    console.log(`Rinka: ${userMsg}`);

    // Get AI response
    const response = await callAPI(apiMessages, state, "rinka");
    turn++;

    console.log(`AI [Turn ${turn}]: ${response.message}`);
    if (response.observation) {
      observationCount++;
      console.log(`  📌 OBSERVATION: ${response.observation.text}`);
      if (response.observation.domains) {
        console.log(`     Domains: ${response.observation.domains.join(", ")}`);
      }
    }
    console.log();

    // Store assistant response
    apiMessages.push({ role: "assistant", content: JSON.stringify(response) });
    if (response.state_update) state = { ...state, ...response.state_update };

    // Check for diagnosis
    if (response.ready_for_diagnosis) {
      console.log("=== DIAGNOSIS READY ===\n");
      if (response.diagnosis) {
        console.log("Expressed needs:", JSON.stringify(response.diagnosis.expressed_needs, null, 2));
        console.log("\nDiagnosed gaps:", JSON.stringify(response.diagnosis.diagnosed_gaps, null, 2));
        console.log("\nCross-domain insights:", JSON.stringify(response.diagnosis.cross_domain_insights, null, 2));
        console.log("\nScore context:", response.diagnosis.score_context);
      }
      break;
    }
  }

  console.log(`\n=== Summary: ${turn} turns, ${observationCount} observations ===`);
}

main().catch(console.error);
