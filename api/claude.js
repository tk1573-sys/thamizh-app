export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "AI service is not configured on the server"
    });
  }

  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON request body" });
    }

    const { model, messages, max_tokens, system } = body;
    if (typeof model !== "string" || !model.trim()) {
      return res.status(400).json({ error: "Missing or invalid model" });
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_) {
      data = {};
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Anthropic API request failed",
        status: response.status,
        type: data?.error?.type || "upstream_error",
        message: data?.error?.message || "Upstream service error"
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

    return res.status(500).json({
      error: "Failed to contact Anthropic API",
      status: 500,
      type: "network_error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
