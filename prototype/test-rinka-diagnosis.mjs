// Test to verify diagnosis generation after full conversation
// Run: node test-rinka-diagnosis.mjs

const API_URL = "http://localhost:3001/api/diagnostic";

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
  "I think it's happening in the next few months",
  "Around $400K, I think",
  "No, nobody — just me and ChatGPT",
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

  // Get AI opening
  const opening = await callAPI([], state, "rinka");
  process.stdout.write(`AI: ${opening.message}\n\n`);
  apiMessages.push(
    { role: "user", content: "Begin the diagnostic intake conversation." },
    { role: "assistant", content: JSON.stringify(opening) }
  );

  for (let i = 0; i < RINKA_RESPONSES.length; i++) {
    const userMsg = RINKA_RESPONSES[i];
    apiMessages.push({ role: "user", content: userMsg });
    process.stdout.write(`Rinka: ${userMsg}\n`);

    const response = await callAPI(apiMessages, state, "rinka");
    process.stdout.write(`AI: ${response.message}\n`);
    if (response.observation) {
      observationCount++;
      process.stdout.write(`  📌 ${response.observation.text}\n`);
    }
    process.stdout.write("\n");

    apiMessages.push({ role: "assistant", content: JSON.stringify(response) });
    if (response.state_update) state = { ...state, ...response.state_update };

    if (response.ready_for_diagnosis) {
      console.log("\n🎯 DIAGNOSIS GENERATED!");
      console.log(JSON.stringify(response.diagnosis, null, 2));
      console.log(`\nTotal: ${i + 2} turns, ${observationCount} observations`);
      return;
    }
  }

  console.log(`\nConversation ended without diagnosis after ${RINKA_RESPONSES.length + 1} turns, ${observationCount} observations`);
  console.log("(This means the AI needs more turns — may need to adjust prompt convergence)");
}

main().catch(console.error);
