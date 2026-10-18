import crypto from "node:crypto";
import { del, get, put } from "@vercel/blob";

const MAX_BODY_BYTES = 2_000_000;
const STORE_ID = process.env.thamizh_app_memory_06_STORE_ID || process.env.BLOB_STORE_ID;

function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
}
function sameToken(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  return crypto.timingSafeEqual(crypto.createHash("sha256").update(a).digest(), crypto.createHash("sha256").update(b).digest());
}
function text(v, limit) {
  if (v == null) return "";
  if (typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean") return "";
  return String(v).trim().slice(0, limit || 3000);
}
function normalizeRecord(item, i, group) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const title = text(item.title ?? item.name ?? item.desc ?? item.description, 300);
  if (!title) return null;
  return {
    id: text(item.id ?? (group + "-" + i), 150),
    area: text(item.area ?? item.category ?? group, 100),
    title,
    details: text(item.details ?? item.description ?? item.notes, 3000),
    status: text(item.status ?? "Planned", 80),
    priority: text(item.priority ?? "Normal", 50),
    target_date: text(item.target_date ?? item.due ?? item.due_at, 80),
    source: text(item.source ?? "Life Command Centre", 100),
    source_url: text(item.source_url, 500)
  };
}
function normalizeRecords(records, group) {
  if (!Array.isArray(records)) return [];
  return records.slice(0, 300).map((item, i) => normalizeRecord(item, i, group)).filter(Boolean);
}
function normalizePack(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid sync payload.");
  if (raw.schema_version != null && Number(raw.schema_version) !== 1) throw new Error("Unsupported sync schema version.");
  const p = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
  const shareHealth = p.share_health_context === true;
  return {
    schema_version: 1,
    source: "Thamizh Life Command Centre",
    updated_at: new Date().toISOString(),
    profile: {
      display_name: text(p.display_name, 100),
      coaching_style: text(p.coaching_style, 100) || "Friendly mentor",
      language: text(p.language, 40) || "English",
      personal_traits: text(p.personal_traits, 3000),
      coaching_preferences: text(p.coaching_preferences, 3000),
      constraints: text(p.constraints, 3000),
      share_health_context: shareHealth,
      health_context: shareHealth ? text(p.health_context, 2000) : ""
    },
    goals: normalizeRecords(raw.goals, "Goal"),
    tasks: normalizeRecords(raw.tasks, "Task"),
    projects: normalizeRecords(raw.projects, "Project"),
    deadlines: normalizeRecords(raw.deadlines, "Deadline")
  };
}
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let value = "";
  for await (const chunk of req) {
    value += chunk.toString("utf8");
    if (Buffer.byteLength(value, "utf8") > MAX_BODY_BYTES) throw new Error("Request body too large.");
  }
  return value ? JSON.parse(value) : {};
}
function bearer(req) {
  const value = String(req.headers.authorization || req.headers.Authorization || "");
  const m = value.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}
async function geminiChat(body) {
  const rawKey = process.env.GEMINI_API_KEY;
  const key = typeof rawKey === "string" ? rawKey.trim().replace(/^(['"])(.*)\1$/, "$2").trim() : "";
  const model = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();
  if (!key) return { status: 503, payload: { error: "AI service is not configured on Life Command Centre." } };
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const contents = messages.map(m => {
    const role = m && (m.role === "assistant" || m.role === "model") ? "model" : "user";
    const c = m && m.content;
    const s = typeof c === "string" ? c : Array.isArray(c) ? c.map(part => typeof part === "string" ? part : (part && part.text) || "").join("") : "";
    return { role, parts: [{ text: s.slice(0, 6000) }] };
  }).filter(m => m.parts[0].text.trim());
  if (!contents.length) return { status: 400, payload: { error: "No usable chat messages supplied." } };
  const payload = {
    contents,
    ...(typeof body.system === "string" && body.system.trim() ? { systemInstruction: { parts: [{ text: body.system.slice(0, 24000) }] } } : {}),
    generationConfig: { maxOutputTokens: Number.isInteger(body.max_tokens) ? Math.max(1, Math.min(body.max_tokens, 2000)) : 800 }
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(payload), signal: controller.signal
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!response.ok) return { status: response.status, payload: { error: "Gemini request failed.", message: (data.error && data.error.message) || "Upstream error." } };
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const answer = parts.map(part => part.text || "").join("").trim();
    return answer ? { status: 200, payload: { text: answer, model, updated_at: new Date().toISOString() } } : { status: 502, payload: { error: "Gemini returned an empty response." } };
  } finally { clearTimeout(timer); }
}

export default async function handler(req, res) {
  const configured = process.env.LIFE_COACH_SYNC_TOKEN || "";
  if (!sameToken(bearer(req), configured)) return json(res, 401, { error: "Unauthorized. Configure the Life Coach sync token." });
  if (!STORE_ID) return json(res, 503, { error: "Private Vercel Blob store ID is not configured." });
  const id = crypto.createHash("sha256").update(configured).digest("hex").slice(0, 40);
  const pathname = "life-coach-sync/" + id + ".json";
  try {
    if (req.method === "GET") {
      const found = await get(pathname, { access: "private", useCache: false, storeId: STORE_ID });
      if (!found || !found.stream) return json(res, 404, { error: "No plan published from the Life Command Centre browser yet." });
      const raw = await new Response(found.stream).text();
      const pack = normalizePack(JSON.parse(raw));
      if (raw && JSON.parse(raw).updated_at) pack.updated_at = String(JSON.parse(raw).updated_at);
      return json(res, 200, pack);
    }
    if (req.method === "DELETE") {
      await del(pathname, { storeId: STORE_ID });
      return json(res, 200, { ok: true, deleted: true });
    }
    if (req.method === "POST" || req.method === "PUT") {
      const body = await readBody(req);
      if (body.action === "chat") {
        const result = await geminiChat(body);
        return json(res, result.status, result.payload);
      }
      const pack = normalizePack(body.snapshot || body);
      await put(pathname, JSON.stringify(pack), { access: "private", allowOverwrite: true, contentType: "application/json", storeId: STORE_ID });
      return json(res, 200, { ok: true, updated_at: pack.updated_at, counts: { goals: pack.goals.length, tasks: pack.tasks.length, projects: pack.projects.length, deadlines: pack.deadlines.length } });
    }
    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return json(res, 405, { error: "Method not allowed." });
  } catch (err) {
    const message = (err && err.message) || "Sync bridge failed.";
    return json(res, message.includes("too large") ? 413 : 400, { error: message });
  }
}
