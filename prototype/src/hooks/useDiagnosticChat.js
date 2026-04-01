import { useState, useCallback, useRef } from "react";

/**
 * Hook for managing the diagnostic intake conversation.
 *
 * API returns JSON envelope: { message, observation, closing, _raw_content }.
 * Observations come from the observation field (includes text + summary for strip).
 * Closing is signaled by the closing field.
 *
 * @returns {object} { messages, isLoading, observationCount, observationSummaries,
 *                     closing, sessionId, rawHistory, observations, startConversation, sendMessage }
 */
export default function useDiagnosticChat() {
  // Display messages: { type: "ai"|"user"|"done", content: string, observation?: string }
  const [messages, setMessages] = useState([]);
  // Observations generated during the conversation
  const [observations, setObservations] = useState([]);
  // Raw conversation history — useRef (not useState) because:
  // 1. We need the latest value in async callbacks without stale closure issues
  // 2. History updates don't need to trigger re-renders (only messages do)
  // 3. The API only needs this on send, not on every render
  const rawHistoryRef = useRef([]);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // Closing signal from complete_intake
  const [closing, setClosing] = useState(null);
  // Stable session ID — useRef so it survives re-renders without changing
  const sessionIdRef = useRef(crypto.randomUUID());

  /**
   * Call the diagnostic API.
   */
  const callAPI = useCallback(async (userMessage) => {
    const response = await fetch("/api/diagnostic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawHistory: rawHistoryRef.current,
        userMessage,
        sessionId: sessionIdRef.current,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `API error: ${response.status}`);
    }

    return response.json();
  }, []);

  /**
   * Process an API response: update history, observations, messages.
   */
  const processResponse = useCallback(
    (apiResponse, userMessage) => {
      // Store in raw history for next API call.
      // _raw_content contains the full response (thinking + text blocks).
      // Thinking blocks must be preserved in history per Anthropic API requirements.
      if (userMessage) {
        rawHistoryRef.current = [
          ...rawHistoryRef.current,
          { role: "user", content: userMessage },
        ];
      }
      rawHistoryRef.current = [
        ...rawHistoryRef.current,
        { role: "assistant", content: apiResponse._raw_content },
      ];

      // Process observation
      if (apiResponse.observation) {
        setObservations((prev) => [...prev, apiResponse.observation]);
      }

      // Add display message
      if (apiResponse.message) {
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            content: apiResponse.message,
            observation: apiResponse.observation?.text || null,
          },
        ]);
      }

      // Check for closing
      if (apiResponse.closing) {
        setClosing(apiResponse.closing);
        // Add "done" message after a brief delay so user reads the closing message
        setTimeout(() => {
          setMessages((prev) => [...prev, { type: "done" }]);
        }, 1500);
      }
    },
    []
  );

  /**
   * Start the conversation — get the AI's opening message.
   */
  const startConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      rawHistoryRef.current = [];
      setObservations([]);
      setMessages([]);
      setClosing(null);

      const apiResponse = await callAPI(null);
      processResponse(apiResponse, null);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setMessages([
        {
          type: "ai",
          content:
            "Something went wrong connecting to Vale. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [callAPI, processResponse]);

  /**
   * Send a user message and get the AI's response.
   */
  const sendMessage = useCallback(
    async (text) => {
      setMessages((prev) => [...prev, { type: "user", content: text }]);
      setIsLoading(true);
      try {
        const apiResponse = await callAPI(text);
        processResponse(apiResponse, text);
      } catch (err) {
        console.error("Failed to send message:", err);
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            content: "I had trouble processing that. Could you try again?",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [callAPI, processResponse]
  );

  // Extract observation summaries for the persistent strip
  const observationSummaries = observations.map((o) => o.summary || o.text);

  return {
    messages,
    isLoading,
    observationCount: observations.length,
    observationSummaries,
    closing,
    sessionId: sessionIdRef.current,
    rawHistory: rawHistoryRef,
    observations,
    startConversation,
    sendMessage,
  };
}
