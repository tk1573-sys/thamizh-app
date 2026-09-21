import { list, put } from "@vercel/blob";

function cleanId(v) {
  return String(v || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}
function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  return res.end(JSON.stringify(body));
}
export default async function handler(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json(res, 503, { error: "Cloud sync storage is not configured yet. Add BLOB_READ_WRITE_TOKEN in Vercel." });
  const id = cleanId(req.query?.id);
  if (!id || id.length < 16) return json(res, 400, { error: "Invalid sync id." });
  const prefix = `life-sync/${id}`;
  try {
    if (req.method === "GET") {
      const found = await list({ prefix, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
      if (!found.blobs?.length) return json(res, 404, { error: "No cloud snapshot exists for this sync link yet." });
      const r = await fetch(found.blobs[0].url, { cache: "no-store" });
      if (!r.ok) return json(res, 502, { error: "Could not read the cloud snapshot." });
      return json(res, 200, { data: await r.json() });
    }
    if (req.method === "PUT" || req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body?.ciphertext || !body?.iv || !body?.salt) return json(res, 400, { error: "Encrypted snapshot is incomplete." });
      const payload = JSON.stringify({ version:1, updatedAt:Number(body.updatedAt)||Date.now(), ciphertext:body.ciphertext, iv:body.iv, salt:body.salt });
      const blob = await put(`${prefix}.json`, payload, { access:"public", addRandomSuffix:false, contentType:"application/json", token:process.env.BLOB_READ_WRITE_TOKEN });
      return json(res, 200, { ok:true, updatedAt:JSON.parse(payload).updatedAt, url:blob.url });
    }
    res.setHeader("Allow","GET,PUT,POST");
    return json(res, 405, { error:"Method not allowed." });
  } catch (err) {
    return json(res, 500, { error:err?.message || "Cloud sync failed." });
  }
}
