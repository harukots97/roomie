// ---------------------------------------------------------------------------
// Vercel serverless function. Returns every stored quiz submission as JSON
// (default) or CSV (?format=csv), for reading in a spreadsheet.
//
// Setup: in the Vercel dashboard, add an env var ADMIN_TOKEN (any random
// string you make up) to this project, then redeploy. To view submissions:
//   https://<your-domain>/api/list-submissions?token=<that same string>
//
// Optionally filter by role: ...&role=seeker or ...&role=provider
//
// For a live Google Sheet, put this formula in cell A1 of a blank sheet:
//   =IMPORTDATA("https://<your-domain>/api/list-submissions?token=<token>&format=csv")
// Sheets re-fetches it periodically (and on file open); right-click the
// cell -> "Refresh imported data" to force it sooner.
// ---------------------------------------------------------------------------

const { resolveRedisCredentials, redisCommand } = require("./_kv.js");

const SUBMISSIONS_KEY = "quiz_submissions";

const CSV_COLUMNS = [
  "submittedAt", "role", "email", "confirmationCode",
  "resultType", "orderScore", "socialScore", "orderTier", "socialTier",
  "answers",
];

function csvField(value) {
  const str = value === undefined || value === null ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(entries) {
  const rows = entries.map((e) => {
    const row = {
      submittedAt: e.submittedAt || e.receivedAt || "",
      role: e.role || "",
      email: (e.answers && e.answers.email) || "",
      confirmationCode: (e.answers && e.answers.confirmationCode) || "",
      resultType: (e.result && e.result.type) || "",
      orderScore: (e.result && e.result.orderScore) ?? "",
      socialScore: (e.result && e.result.socialScore) ?? "",
      orderTier: (e.result && e.result.orderTier) || "",
      socialTier: (e.result && e.result.socialTier) || "",
      answers: JSON.stringify(e.answers || {}),
    };
    return CSV_COLUMNS.map((col) => csvField(row[col])).join(",");
  });
  return [CSV_COLUMNS.join(","), ...rows].join("\r\n");
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ADMIN_TOKEN } = process.env;
  if (!ADMIN_TOKEN) {
    console.error("list-submissions: ADMIN_TOKEN not set — add it in Vercel project settings.");
    return res.status(500).json({ error: "Admin access not configured yet" });
  }
  if (req.query.token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!resolveRedisCredentials()) {
    return res.status(500).json({ error: "Storage not configured yet" });
  }

  let entries;
  try {
    const data = await redisCommand(["LRANGE", SUBMISSIONS_KEY, "0", "-1"]);
    entries = (data.result || []).map((s) => JSON.parse(s));
  } catch (err) {
    console.error("list-submissions: Redis read failed", err);
    return res.status(502).json({ error: "Storage unreachable" });
  }

  const roleFilter = req.query.role;
  if (roleFilter === "seeker" || roleFilter === "provider") {
    entries = entries.filter((e) => e.role === roleFilter);
  }

  if (req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    return res.status(200).send(toCsv(entries));
  }

  return res.status(200).json({ count: entries.length, submissions: entries });
};
