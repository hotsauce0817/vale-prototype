import { useState, useCallback, useRef } from "react";

/**
 * Initial diagnostic state — tracks the user's situation across 5 domains.
 * Sent to the API with each request so Claude knows what's been explored.
 */
function createInitialState(mode, entryContext) {
  return {
    user: {
      name: null,
      household: null,
      life_stage: null,
      hhi_range: null,
      state_of_residence: null,
      dependents: [],
      score: null,
      score_plus_two_answer: null,
    },
    entry_path: mode === "rinka" ? "rinka" : entryContext === "generic" ? "generic" : "life_event",
    life_event: entryContext === "equity" ? "equity_event" : entryContext === "home" ? "home_purchase" : null,
    domains: {
      investing: {
        explored: false,
        gap_severity: null,
        layers: {
          cash_flow: { explored: false, gap_severity: null, signals: [], key_facts: [] },
          savings: { explored: false, gap_severity: null, signals: [], key_facts: [] },
          portfolio: { explored: false, gap_severity: null, signals: [], key_facts: [] },
        },
        signals: [],
        key_facts: [],
      },
      tax: { explored: false, gap_severity: null, signals: [], key_facts: [] },
      retirement: { explored: false, gap_severity: null, signals: [], key_facts: [] },
      estate: { explored: false, gap_severity: null, signals: [], key_facts: [] },
      insurance: { explored: false, gap_severity: null, signals: [], key_facts: [] },
    },
    observations: [],
    cross_domain_interactions: [],
    cross_domain_interactions_detected: [],
    conversation_turn: 0,
    ready_for_diagnosis: false,
  };
}

/**
 * Merge arrays by appending unique items (dedup by string equality).
 */
function mergeArrayUnique(existing, incoming) {
  const set = new Set(existing || []);
  return [...(existing || []), ...(incoming || []).filter((s) => !set.has(s))];
}

/**
 * Merge a single domain's fields into existing domain state.
 * Handles signals/key_facts array dedup and layers nesting.
 */
function mergeDomain(existing, update) {
  const merged = { ...existing, ...update };

  // Merge domain-level arrays
  if (update.signals) merged.signals = mergeArrayUnique(existing.signals, update.signals);
  if (update.key_facts) merged.key_facts = mergeArrayUnique(existing.key_facts, update.key_facts);

  // Deep-merge layers (only the Investing domain has these)
  if (update.layers && typeof update.layers === "object" && existing.layers) {
    merged.layers = { ...existing.layers };
    for (const layerKey of Object.keys(update.layers)) {
      if (existing.layers[layerKey]) {
        merged.layers[layerKey] = { ...existing.layers[layerKey], ...update.layers[layerKey] };
        if (update.layers[layerKey].signals) {
          merged.layers[layerKey].signals = mergeArrayUnique(existing.layers[layerKey].signals, update.layers[layerKey].signals);
        }
        if (update.layers[layerKey].key_facts) {
          merged.layers[layerKey].key_facts = mergeArrayUnique(existing.layers[layerKey].key_facts, update.layers[layerKey].key_facts);
        }
      }
    }
  }

  return merged;
}

/**
 * Deep merge state_update into existing state.
 * Only fields present in the update are changed.
 */
function mergeState(existing, update) {
  if (!update || typeof update !== "object") return existing;
  const result = { ...existing };
  for (const key of Object.keys(update)) {
    if (key === "domains" && typeof update.domains === "object") {
      result.domains = { ...existing.domains };
      // Normalize: remap old key if Claude uses it
      const domainUpdates = { ...update.domains };
      if (domainUpdates.investment_coordination) {
        domainUpdates.investing = { ...(domainUpdates.investing || {}), ...domainUpdates.investment_coordination };
        delete domainUpdates.investment_coordination;
      }
      for (const domain of Object.keys(domainUpdates)) {
        if (existing.domains[domain]) {
          result.domains[domain] = mergeDomain(existing.domains[domain], domainUpdates[domain]);
        }
      }
    } else if (key === "user" && typeof update.user === "object") {
      result.user = { ...existing.user };
      for (const uKey of Object.keys(update.user)) {
        if (update.user[uKey] !== undefined && update.user[uKey] !== null) {
          result.user[uKey] = update.user[uKey];
        }
      }
    } else if (key === "observations" && Array.isArray(update.observations)) {
      result.observations = [...(existing.observations || []), ...update.observations];
    } else if (key === "cross_domain_interactions" && Array.isArray(update.cross_domain_interactions)) {
      result.cross_domain_interactions = [...(existing.cross_domain_interactions || []), ...update.cross_domain_interactions];
    } else if (key === "cross_domain_interactions_detected" && Array.isArray(update.cross_domain_interactions_detected)) {
      // Append, deduplicate by type
      const existingTypes = new Set((existing.cross_domain_interactions_detected || []).map((d) => d.type));
      result.cross_domain_interactions_detected = [
        ...(existing.cross_domain_interactions_detected || []),
        ...update.cross_domain_interactions_detected.filter((d) => !existingTypes.has(d.type)),
      ];
    } else {
      result[key] = update[key];
    }
  }
  return result;
}

/**
 * Custom hook for managing the diagnostic conversation.
 *
 * @param {string} mode - "rinka" | "open"
 * @param {string} entryContext - "equity" | "home" | "generic" (for open mode)
 * @returns {object} { messages, isLoading, diagnosis, observationCount, startConversation, sendMessage }
 */
export default function useDiagnosticChat(mode, entryContext) {
  // Display messages: { type: "ai"|"user"|"observation"|"done", content: string }
  const [messages, setMessages] = useState([]);
  // Diagnostic state sent to API
  const [diagnosticState, setDiagnosticState] = useState(() => createInitialState(mode, entryContext));
  // API messages (role/content pairs for Claude)
  const apiMessagesRef = useRef([]);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // Final diagnosis
  const [diagnosis, setDiagnosis] = useState(null);
  // Observation count
  const [observationCount, setObservationCount] = useState(0);
  // Stable session ID for logging (persists across re-renders)
  const sessionIdRef = useRef(crypto.randomUUID());

  /**
   * Call the API with current conversation state.
   */
  const callAPI = useCallback(async (apiMessages, currentState) => {
    const apiMode = mode === "rinka" ? "rinka" : (entryContext || "generic");
    const response = await fetch("/api/diagnostic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages,
        state: currentState,
        mode: apiMode,
        sessionId: sessionIdRef.current,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `API error: ${response.status}`);
    }

    return response.json();
  }, [mode, entryContext]);

  /**
   * Process an API response: update messages, state, check for diagnosis.
   */
  const processResponse = useCallback(async (apiResponse, currentState) => {
    const newMessages = [];

    // Extract observation text (handle both object and string formats from API)
    const obsText = apiResponse.observation
      ? (typeof apiResponse.observation === "string" ? apiResponse.observation : apiResponse.observation.text)
      : null;

    if (obsText) {
      setObservationCount((c) => c + 1);
    }

    // Attach observation directly to the AI message so they render as one unit.
    // This guarantees the observation card always appears above the follow-up question.
    if (apiResponse.message) {
      newMessages.push({ type: "ai", content: apiResponse.message, observation: obsText || null });
    } else if (obsText) {
      // Observation without a message (rare) — render standalone
      newMessages.push({ type: "observation", content: obsText });
    }

    setMessages((prev) => [...prev, ...newMessages]);

    // Merge state update
    let updatedState = currentState;
    if (apiResponse.state_update && Object.keys(apiResponse.state_update).length > 0) {
      updatedState = mergeState(currentState, apiResponse.state_update);
      updatedState.conversation_turn = (updatedState.conversation_turn || 0) + 1;
      setDiagnosticState(updatedState);
    } else {
      updatedState = { ...currentState, conversation_turn: (currentState.conversation_turn || 0) + 1 };
      setDiagnosticState(updatedState);
    }

    // Store the assistant's raw JSON as the API message
    apiMessagesRef.current = [
      ...apiMessagesRef.current,
      { role: "assistant", content: JSON.stringify(apiResponse) },
    ];

    // Check for diagnosis
    if (apiResponse.ready_for_diagnosis) {
      if (apiResponse.diagnosis) {
        setDiagnosis(apiResponse.diagnosis);
        setMessages((prev) => [...prev, { type: "done" }]);
      } else {
        console.warn("[Vale] ready_for_diagnosis was true but no diagnosis object — prompting AI to generate it");
        // Force a follow-up call to get the diagnosis
        const retryResponse = await callAPI(
          [...apiMessagesRef.current, { role: "user", content: JSON.stringify({ message: "Please generate the diagnosis now.", state_update: {} }) }],
          updatedState
        );
        if (retryResponse?.diagnosis) {
          setDiagnosis(retryResponse.diagnosis);
          setMessages((prev) => [...prev, { type: "done" }]);
          apiMessagesRef.current = [
            ...apiMessagesRef.current,
            { role: "user", content: JSON.stringify({ message: "Please generate the diagnosis now.", state_update: {} }) },
            { role: "assistant", content: JSON.stringify(retryResponse) },
          ];
        }
      }
    }

    return updatedState;
  }, [callAPI]);

  /**
   * Start the conversation — get the AI's opening message.
   */
  const startConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      const initialState = createInitialState(mode, entryContext);
      setDiagnosticState(initialState);
      apiMessagesRef.current = [];

      const apiResponse = await callAPI([], initialState);
      await processResponse(apiResponse, initialState);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setMessages([{ type: "ai", content: "Something went wrong connecting to Vale. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [mode, entryContext, callAPI, processResponse]);

  /**
   * Send a user message and get the AI's response.
   */
  const sendMessage = useCallback(async (text) => {
    // Add user message to display
    setMessages((prev) => [...prev, { type: "user", content: text }]);

    // Add to API messages
    const updatedApiMessages = [
      ...apiMessagesRef.current,
      { role: "user", content: text },
    ];
    apiMessagesRef.current = updatedApiMessages;

    setIsLoading(true);
    try {
      const currentState = diagnosticState;
      const apiResponse = await callAPI(updatedApiMessages, currentState);
      await processResponse(apiResponse, currentState);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [
        ...prev,
        { type: "ai", content: "I had trouble processing that. Could you try again?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [diagnosticState, callAPI, processResponse]);

  return {
    messages,
    isLoading,
    diagnosis,
    observationCount,
    diagnosticState,
    apiMessages: apiMessagesRef,
    sessionId: sessionIdRef.current,
    startConversation,
    sendMessage,
  };
}
