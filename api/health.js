export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const rawApiKey = process.env.GEMINI_API_KEY;
  const apiKey = typeof rawApiKey === "string"
    ? rawApiKey.trim().replace(/^([\"'])(.*)\1$/, "$2").trim()
    : "";

  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      aiConfigured: false,
      code: "MISSING_GEMINI_API_KEY"
    });
  }

  return res.status(200).json({
    ok: true,
    aiConfigured: true,
    provider: "google",
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    searchGrounding: true
  });
}
