// ---------------------------------------------------------------------------
// Shared Redis REST helper for submit-quiz.js and list-submissions.js.
// Files prefixed with "_" under /api are not treated as routes by Vercel,
// so this file is safe to import without becoming its own endpoint.
//
// Vercel discontinued native "Vercel KV" as a first-party product. The
// replacement is the Upstash for Redis integration from the Vercel
// Marketplace (Project -> Storage -> Browse Marketplace -> Upstash), which
// speaks the exact same Redis REST protocol KV used, just under different
// env var names depending on how it's connected:
//   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Upstash's own
//     naming, used by most current Vercel Marketplace integrations)
//   - KV_REST_API_URL / KV_REST_API_TOKEN (legacy Vercel KV naming, kept
//     here too in case an old KV store or differently-named integration
//     is still connected)
// This checks both so setup works regardless of which the dashboard shows.
// ---------------------------------------------------------------------------

function resolveRedisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

async function redisCommand(command) {
  const creds = resolveRedisCredentials();
  if (!creds) throw new Error("NO_CREDENTIALS");

  const res = await fetch(creds.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REDIS_ERROR: ${res.status} ${text}`);
  }
  return res.json();
}

module.exports = { resolveRedisCredentials, redisCommand };
