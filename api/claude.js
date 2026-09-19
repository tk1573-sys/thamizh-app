export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Keep the provider credential server-side only. Support CLAUDE_API_KEY as
  // a migration fallback, but prefer the existing ANTHROPIC_API_KEY name.
  const rawApiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const apiKey = typeof rawApiKey === "string"
    ? rawApiKey.trim().replace(/^([\"'])(.*)\1$/, "$2").trim()
    : "";

  if (!apiKey) {
    return res.status(500).json({
      error: "AI service is not configured on the server",
      code: "MISSING_ANTHROPIC_API_KEY"
    });
  }

  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON request body" });
    }

    const { model, messages, max_tokens, system } = body;
    const selectedModel = typeof model === "string" && model.trim()
      ? model.trim()
      : (process.env.CLAUDE_MODEL || "claude-sonnet-4-6").trim();

    if (!selectedModel) {
      return res.status(500).json({
        error: "AI service is not configured with a model",
        code: "MISSING_CLAUDE_MODEL"
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

    const upstreamBody = {
      model: selectedModel,
      messages,
      ...(max_tokens != null ? { max_tokens } : {}),
      ...(system != null ? { system } : {})
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(upstreamBody),
        signal: controller.signal
      });
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
      const upstreamType = data?.error?.type || "upstream_error";

      if (response.status === 401) {
        return res.status(502).json({
          error: "Anthropic authentication failed",
          code: "INVALID_ANTHROPIC_API_KEY",
          status: 401,
          type: upstreamType,
          message: "The server reached Anthropic, but Anthropic rejected the configured API key. Verify the Vercel Development/Preview/Production ANTHROPIC_API_KEY value."
        });
      }

      return res.status(response.status).json({
        error: "Anthropic API request failed",
        status: response.status,
        type: upstreamType,
        message: upstreamMessage
      });
    }

    if (!data?.content || !Array.isArray(data.content) || data.content.length === 0) {
      return res.status(502).json({
        error: "Anthropic API returned an empty response",
        status: 502,
        type: "empty_response"
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    if (error?.name === "AbortError") {
      return res.status(504).json({
        error: "Anthropic API request timed out",
        status: 504,
        type: "timeout"
      });
    }

    console.error("Anthropic proxy error:", error);
    const cause = error && typeof error === "object" ? error.cause : null;
    const upstreamStatus =
      cause && typeof cause === "object" && Number.isInteger(cause.status)
        ? cause.status
        : cause && typeof cause === "object" && Number.isInteger(cause.statusCode)
          ? cause.statusCode
          : null;
    const networkCode =
      cause && typeof cause === "object" && typeof cause.code === "string"
        ? cause.code
        : null;
    const upstreamType =
      cause && typeof cause === "object" && typeof cause.type === "string"
        ? cause.type
        : null;
    const upstreamMessage =
      cause && typeof cause === "object" && typeof cause.message === "string"
        ? cause.message
        : null;

    return res.status(upstreamStatus || 500).json({
      error: "Failed to contact Anthropic API",
      status: upstreamStatus || 500,
      type: upstreamType || networkCode || "network_error",
      message: upstreamMessage || (error instanceof Error ? error.message : "Unknown error"),
      network_code: networkCode || undefined
    });
  }
}
