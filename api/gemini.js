export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawApiKey = process.env.GEMINI_API_KEY;
  const apiKey = typeof rawApiKey === "string"
    ? rawApiKey.trim().replace(/^([\"'])(.*)\1$/, "$2").trim()
    : "";

  if (!apiKey) {
    return res.status(500).json({
      error: "AI service is not configured on the server",
      code: "MISSING_GEMINI_API_KEY"
    });
  }

  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON request body" });
    }

    const { messages, max_tokens, system } = body;
    const selectedModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

    if (!selectedModel) {
      return res.status(500).json({
        error: "AI service is not configured with a model",
        code: "MISSING_GEMINI_MODEL"
      });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or invalid messages" });
    }
    if (max_tokens != null && (!Number.isInteger(max_tokens) || max_tokens <= 0)) {
      return res.status(400).json({ error: "max_tokens must be a positive integer" });
    }
    if (system != null && typeof system !== "string") {
      return res.status(400).json({ error: "system must be a string" });
    }

    const contents = messages.map((message) => {
      const role = message?.role === "assistant" || message?.role === "model"
        ? "model"
        : "user";
      const rawContent = message?.content;
      let text = "";

      if (typeof rawContent === "string") {
        text = rawContent;
      } else if (Array.isArray(rawContent)) {
        text = rawContent
          .map((part) => typeof part === "string" ? part : part?.text || "")
          .join("");
      } else if (rawContent != null) {
        text = String(rawContent);
      }

      return {
        role,
        parts: [{ text }]
      };
    }).filter((message) => message.parts[0].text.trim());

    if (contents.length === 0) {
      return res.status(400).json({ error: "Messages contain no usable text" });
    }

    const upstreamBody = {
      contents,
      tools: [{ google_search: {} }],
      ...(system != null ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      ...(max_tokens != null ? { generationConfig: { maxOutputTokens: max_tokens } } : {})
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify(upstreamBody),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_) {
      data = {};
    }

    if (!response.ok) {
      const upstreamMessage = data?.error?.message || "Upstream service error";
      const upstreamStatus = data?.error?.status || "UPSTREAM_ERROR";

      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({
          error: "Gemini authentication failed",
          code: "INVALID_GEMINI_API_KEY",
          status: response.status,
          type: upstreamStatus,
          message: "The server reached Google Gemini, but Google rejected the configured API key. Verify the Vercel Development/Preview/Production GEMINI_API_KEY value."
        });
      }

      return res.status(response.status).json({
        error: "Gemini API request failed",
        status: response.status,
        type: upstreamStatus,
        message: upstreamMessage
      });
    }

    const candidate = data?.candidates?.[0];
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts.map((part) => part?.text || "").join("").trim();

    if (!text) {
      return res.status(502).json({
        error: "Gemini API returned an empty response",
        status: 502,
        type: "empty_response"
      });
    }

    const groundingMetadata = candidate?.groundingMetadata || null;
    const sources = Array.isArray(groundingMetadata?.groundingChunks)
      ? groundingMetadata.groundingChunks
          .map((chunk) => chunk?.web)
          .filter((web) => web?.uri)
          .map((web) => ({ title: web.title || web.uri, uri: web.uri }))
      : [];

    return res.status(200).json({
      content: [{ type: "text", text }],
      model: selectedModel,
      provider: "google",
      groundingMetadata,
      searchQueries: groundingMetadata?.webSearchQueries || [],
      sources
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      return res.status(504).json({
        error: "Gemini API request timed out",
        status: 504,
        type: "timeout"
      });
    }

    console.error("Gemini proxy error:", error);
    const cause = error && typeof error === "object" ? error.cause : null;
    const networkCode =
      cause && typeof cause === "object" && typeof cause.code === "string"
        ? cause.code
        : null;

    return res.status(500).json({
      error: "Failed to contact Gemini API",
      status: 500,
      type: networkCode || "network_error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
