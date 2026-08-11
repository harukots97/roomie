// ---------------------------------------------------------------------------
// Vercel serverless function. Returns every stored quiz submission as JSON.
//
// Setup: in the Vercel dashboard, add an env var ADMIN_TOKEN (any random
// string you make up) to this project, then redeploy. To view submissions,
// visit:
//   https://<your-domain>/api/list-submissions?token=<that same string>
//
// Optionally filter by role: ...&role=seeker or ...&role=provider
// ---------------------------------------------------------------------------

const SUBMISSIONS_KEY = "quiz_submissions";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { KV_REST_API_URL, KV_REST_API_TOKEN, ADMIN_TOKEN } = process.env;
  if (!ADMIN_TOKEN) {
    console.error("list-submissions: ADMIN_TOKEN not set — add it in Vercel project settings.");
    return res.status(500).json({ error: "Admin access not configured yet" });
  }
  if (req.query.token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return res.status(500).json({ error: "Storage not configured yet" });
  }

  let entries;
  try {
    const kvRes = await fetch(KV_REST_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["LRANGE", SUBMISSIONS_KEY, "0", "-1"]),
    });
    if (!kvRes.ok) return res.status(502).json({ error: "Storage read failed" });
    const data = await kvRes.json();
    entries = (data.result || []).map((s) => JSON.parse(s));
  } catch (err) {
    console.error("list-submissions: KV request threw", err);
    return res.status(502).json({ error: "Storage unreachable" });
  }

  const roleFilter = req.query.role;
  if (roleFilter === "seeker" || roleFilter === "provider") {
    entries = entries.filter((e) => e.role === roleFilter);
  }

  return res.status(200).json({ count: entries.length, submissions: entries });
};
