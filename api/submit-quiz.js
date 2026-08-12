// ---------------------------------------------------------------------------
// Vercel serverless function. Receives one quiz submission (from either
// quiz.js or quiz-provider.js) and appends it to a Redis list.
//
// Setup (one-time, in the Vercel dashboard for this project):
//   1. Storage tab -> Browse Marketplace -> Upstash (for Redis) -> connect
//      it to this project. That auto-injects UPSTASH_REDIS_REST_URL and
//      UPSTASH_REDIS_REST_TOKEN as env vars, nothing to copy/paste by hand.
//      (Vercel's own first-party "KV" product has been discontinued; Upstash
//      via the Marketplace is the direct replacement and speaks the same
//      Redis REST protocol, see api/_kv.js.)
//   2. Redeploy so the function picks up the new env vars.
// That's it — no npm install needed, this only uses the built-in fetch.
//
// To see stored submissions, use /api/list-submissions (see that file for
// the one extra env var it needs).
// ---------------------------------------------------------------------------

const { resolveRedisCredentials, redisCommand } = require("./_kv.js");

const SUBMISSIONS_KEY = "quiz_submissions";
const MAX_BODY_BYTES = 200_000; // generous; a submission is a few KB of JSON

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!resolveRedisCredentials()) {
    console.error("submit-quiz: no Redis credentials found — connect Upstash for Redis to this project from the Storage tab.");
    return res.status(500).json({ error: "Storage not configured yet" });
  }

  let record;
  try {
    record = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (!record || typeof record !== "object" || !record.role || !record.answers) {
    return res.status(400).json({ error: "Expected { role, answers, result }" });
  }
  if (record.role !== "seeker" && record.role !== "provider") {
    return res.status(400).json({ error: "role must be 'seeker' or 'provider'" });
  }

  const entry = JSON.stringify({ ...record, receivedAt: new Date().toISOString() });
  if (entry.length > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Submission too large" });
  }

  try {
    await redisCommand(["LPUSH", SUBMISSIONS_KEY, entry]);
  } catch (err) {
    console.error("submit-quiz: Redis write failed", err);
    return res.status(502).json({ error: "Storage write failed" });
  }

  return res.status(200).json({ ok: true });
};
