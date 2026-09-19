export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const rawApiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const apiKey = typeof rawApiKey === "string"
    ? rawApiKey.trim().replace(/^([\"'])(.*)\1$/, "$2").trim()
    : "";

  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      aiConfigured: false,
      code: "MISSING_ANTHROPIC_API_KEY"
    });
  }

  return res.status(200).json({
    ok: true,
    aiConfigured: true,
    provider: "anthropic",
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6"
  });
}
