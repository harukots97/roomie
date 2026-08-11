// ---------------------------------------------------------------------------
// Vercel serverless function. Receives one quiz submission (from either
// quiz.js or quiz-provider.js) and appends it to a Vercel KV list.
//
// Setup (one-time, in the Vercel dashboard for this project):
//   1. Storage tab -> Create Database -> KV -> connect it to this project.
//      That auto-injects KV_REST_API_URL and KV_REST_API_TOKEN as env vars,
//      nothing to copy/paste by hand.
//   2. Redeploy so the function picks up the new env vars.
// That's it — no npm install needed, this only uses the built-in fetch.
//
// To see stored submissions, use /api/list-submissions (see that file for
// the one env var it needs).
// ---------------------------------------------------------------------------

const SUBMISSIONS_KEY = "quiz_submissions";
const MAX_BODY_BYTES = 200_000; // generous; a submission is a few KB of JSON

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    console.error("submit-quiz: KV_REST_API_URL/KV_REST_API_TOKEN not set — connect Vercel KV to this project.");
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
    const kvRes = await fetch(KV_REST_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["LPUSH", SUBMISSIONS_KEY, entry]),
    });
    if (!kvRes.ok) {
      const text = await kvRes.text();
      console.error("submit-quiz: KV write failed", kvRes.status, text);
      return res.status(502).json({ error: "Storage write failed" });
    }
  } catch (err) {
    console.error("submit-quiz: KV request threw", err);
    return res.status(502).json({ error: "Storage unreachable" });
  }

  return res.status(200).json({ ok: true });
};
