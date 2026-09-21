import { get, put } from "@vercel/blob";

function cleanId(v) { return String(v || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
function json(res, status, body) { res.status(status).setHeader("Content-Type", "application/json"); return res.end(JSON.stringify(body)); }

export default async function handler(req, res) {
  // The Blob store is connected to this Vercel project using OIDC.
  // Pass the connected store ID explicitly so @vercel/blob can select the
  // correct private store when using the Vercel OIDC credential.
  const storeId =
    process.env.thamizh_app_memory_06_STORE_ID ||
    process.env.BLOB_STORE_ID;

  const id = cleanId(req.query?.id);
  if (!id || id.length < 16) return json(res, 400, { error: "Invalid sync id." });
  if (!storeId) return json(res, 500, { error: "Vercel Blob store ID is not configured." });

  const pathname = `life-sync/${id}.json`;

  try {
    if (req.method === "GET") {
      const found = await get(pathname, {
        access: "private",
        useCache: false,
        storeId,
      });
      if (!found?.stream) return json(res, 404, { error: "No cloud snapshot exists for this sync link yet." });
      const text = await new Response(found.stream).text();
      return json(res, 200, { data: JSON.parse(text) });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body?.ciphertext || !body?.iv || !body?.salt) {
        return json(res, 400, { error: "Encrypted snapshot is incomplete." });
      }

      const payload = JSON.stringify({
        version: 1,
        updatedAt: Number(body.updatedAt) || Date.now(),
        ciphertext: body.ciphertext,
        iv: body.iv,
        salt: body.salt,
      });

      await put(pathname, payload, {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json",
        storeId,
      });

      return json(res, 200, { ok: true, updatedAt: JSON.parse(payload).updatedAt });
    }

    res.setHeader("Allow", "GET,PUT,POST");
    return json(res, 405, { error: "Method not allowed." });
  } catch (err) {
    return json(res, 500, { error: err?.message || "Cloud sync failed." });
  }
}
