# Standalone Life Coach bridge

The Life Command Centre and `thamizh-life-coach` are separate applications. This bridge publishes only a versioned, whitelisted plan pack to private Vercel Blob; it does not expose `life-memory-v2` as a whole.

## Environment variables
Configure the following in Vercel for the Life Command Centre project:
- `LIFE_COACH_SYNC_TOKEN` — a long, random, dedicated token. Use the same value in the setup utility and Windows app. Do not commit or paste it into source.
- Existing private Blob store ID environment variable: `thamizh_app_memory_06_STORE_ID` or `BLOB_STORE_ID`.
- Existing `GEMINI_API_KEY` and optional `GEMINI_MODEL` are reused for the authenticated coach chat proxy.

## Setup
1. Deploy the bridge and publisher from the `feature/life-coach-sync-bridge` branch after reviewing and merging its pull request.
2. Visit `/coach-sync-setup.html` on the deployed Life Command Centre.
3. Enter the dedicated sync token and explicitly enable sharing. Add only the high-level personal context you choose to share; health context is a separate checkbox and is never inferred from the raw Health log.
4. In the Windows app, set endpoint to `https://thamizh-app.vercel.app/api/coach-sync` and enter the same token.
5. Verify the returned timestamp and plan records.

The API endpoint also accepts authenticated `POST`NaN`PUT` calls with `{action:'chat', messages, system, max_tokens}` to proxy Gemini without putting an API key in the Windows app. Tokens are compared with a constant-time digest check. Responses are `no-store`.

## Data minimization
Allowed: profile coaching preferences, selected goals, structured tasks, projects, deadlines, and optional high-level health context that is explicitly shared. Excluded by design: raw Journal notes, daily Health logs, AI chat history, resumes/JDs, sync/API credentials, and the entire `life-memory-v2` snapshot.
