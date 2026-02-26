import { useState, useCallback, useRef } from "react";

/**
 * Initial audit state — tracks equity positions and tax context.
 */
function createInitialAuditState() {
  return {
    positions: [],
    tax_context: {
      filing_status: null,
      federal_bracket: null,
      state: null,
      cpa_relationship: null,
      prior_amt: null,
    },
    time_sensitive: [],
    household_income_events: [],
    conversation_turn: 0,
    ready_for_analysis: false,
  };
}

/**
 * Deep merge audit state updates. Positions are merged by index/grant_type,
 * arrays are appended with dedup, objects are shallow merged.
 */
function mergeAuditState(existing, update) {
  if (!update || typeof update !== "object") return existing;
  const result = { ...existing };

  for (const key of Object.keys(update)) {
    if (key === "positions" && Array.isArray(update.positions)) {
      // Merge positions — append new ones, update existing by matching grant_type + company
      const merged = [...(existing.positions || [])];
      for (const pos of update.positions) {
        const idx = merged.findIndex(
          (p) => p.grant_type === pos.grant_type && p.company === pos.company
        );
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...pos };
        } else {
          merged.push(pos);
        }
      }
      result.positions = merged;
    } else if (key === "tax_context" && typeof update.tax_context === "object") {
      result.tax_context = { ...existing.tax_context };
      for (const tKey of Object.keys(update.tax_context)) {
        if (update.tax_context[tKey] !== undefined && update.tax_context[tKey] !== null) {
          result.tax_context[tKey] = update.tax_context[tKey];
        }
      }
    } else if (key === "time_sensitive" && Array.isArray(update.time_sensitive)) {
      const set = new Set(existing.time_sensitive || []);
      result.time_sensitive = [
        ...(existing.time_sensitive || []),
        ...update.time_sensitive.filter((s) => !set.has(s)),
      ];
    } else if (key === "household_income_events" && Array.isArray(update.household_income_events)) {
      const set = new Set(existing.household_income_events || []);
      result.household_income_events = [
        ...(existing.household_income_events || []),
        ...update.household_income_events.filter((s) => !set.has(s)),
      ];
    } else {
      result[key] = update[key];
    }
  }
  return result;
}

/**
 * Custom hook for managing the equity audit conversation.
 *
 * Same architecture as useDiagnosticChat but:
 * - Uses "audit" / "rinka_audit" mode
 * - Sends diagnosticContext (diagnosis + state from intake) with each call
 * - Checks for ready_for_analysis + audit_result instead of diagnosis
 *
 * @param {string} mode - "rinka" | "open" (maps to "rinka_audit" | "audit" for the API)
 * @param {object} diagnosticContext - { diagnosis, state } from the intake
 * @returns {object}
 */
export default function useAuditChat(mode, diagnosticContext) {
  const [messages, setMessages] = useState([]);
  const [auditState, setAuditState] = useState(() => createInitialAuditState());
  const apiMessagesRef = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [observationCount, setObservationCount] = useState(0);
  const sessionIdRef = useRef(crypto.randomUUID());

  const apiMode = mode === "rinka" ? "rinka_audit" : "audit";

  const callAPI = useCallback(async (apiMessages, currentState) => {
    const response = await fetch("/api/diagnostic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages,
        state: currentState,
        mode: apiMode,
        sessionId: sessionIdRef.current,
        diagnosticContext,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `API error: ${response.status}`);
    }

    return response.json();
  }, [apiMode, diagnosticContext]);

  const processResponse = useCallback(async (apiResponse, currentState) => {
    const newMessages = [];

    const obsText = apiResponse.observation
      ? (typeof apiResponse.observation === "string" ? apiResponse.observation : apiResponse.observation.text)
      : null;

    if (obsText) {
      setObservationCount((c) => c + 1);
    }

    if (apiResponse.message) {
      newMessages.push({ type: "ai", content: apiResponse.message, observation: obsText || null });
    } else if (obsText) {
      newMessages.push({ type: "observation", content: obsText });
    }

    setMessages((prev) => [...prev, ...newMessages]);

    // Merge state update
    let updatedState = currentState;
    if (apiResponse.state_update && Object.keys(apiResponse.state_update).length > 0) {
      updatedState = mergeAuditState(currentState, apiResponse.state_update);
      updatedState.conversation_turn = (updatedState.conversation_turn || 0) + 1;
      setAuditState(updatedState);
    } else {
      updatedState = { ...currentState, conversation_turn: (currentState.conversation_turn || 0) + 1 };
      setAuditState(updatedState);
    }

    // Store assistant's raw JSON as API message
    apiMessagesRef.current = [
      ...apiMessagesRef.current,
      { role: "assistant", content: JSON.stringify(apiResponse) },
    ];

    // Check for audit completion
    if (apiResponse.ready_for_analysis) {
      if (apiResponse.audit_result) {
        setAuditResult(apiResponse.audit_result);
        setMessages((prev) => [...prev, { type: "done" }]);
      } else {
        console.warn("[Vale] ready_for_analysis was true but no audit_result — prompting AI to generate it");
        const retryResponse = await callAPI(
          [...apiMessagesRef.current, { role: "user", content: JSON.stringify({ message: "Please generate the audit result now.", state_update: {} }) }],
          updatedState
        );
        if (retryResponse?.audit_result) {
          setAuditResult(retryResponse.audit_result);
          setMessages((prev) => [...prev, { type: "done" }]);
          apiMessagesRef.current = [
            ...apiMessagesRef.current,
            { role: "user", content: JSON.stringify({ message: "Please generate the audit result now.", state_update: {} }) },
            { role: "assistant", content: JSON.stringify(retryResponse) },
          ];
        }
      }
    }

    return updatedState;
  }, [callAPI]);

  const startConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      const initialState = createInitialAuditState();
      setAuditState(initialState);
      apiMessagesRef.current = [];

      const apiResponse = await callAPI([], initialState);
      await processResponse(apiResponse, initialState);
    } catch (err) {
      console.error("Failed to start audit:", err);
      setMessages([{ type: "ai", content: "Something went wrong connecting to Vale. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [callAPI, processResponse]);

  const sendMessage = useCallback(async (text) => {
    setMessages((prev) => [...prev, { type: "user", content: text }]);

    const updatedApiMessages = [
      ...apiMessagesRef.current,
      { role: "user", content: text },
    ];
    apiMessagesRef.current = updatedApiMessages;

    setIsLoading(true);
    try {
      const currentState = auditState;
      const apiResponse = await callAPI(updatedApiMessages, currentState);
      await processResponse(apiResponse, currentState);
    } catch (err) {
      console.error("Failed to send audit message:", err);
      setMessages((prev) => [
        ...prev,
        { type: "ai", content: "I had trouble processing that. Could you try again?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [auditState, callAPI, processResponse]);

  return {
    messages,
    isLoading,
    auditResult,
    observationCount,
    auditState,
    apiMessages: apiMessagesRef,
    sessionId: sessionIdRef.current,
    startConversation,
    sendMessage,
  };
}
