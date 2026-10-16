// ---------------------------------------------------------------------------
// Vercel serverless function. Returns every stored quiz submission as JSON
// (default) or CSV (?format=csv), for reading in a spreadsheet.
//
// Setup: in the Vercel dashboard, add an env var ADMIN_TOKEN (any random
// string you make up) to this project, then redeploy. To view submissions:
//   https://<your-domain>/api/list-submissions?token=<that same string>
//
// For a readable view in the browser, open https://<your-domain>/admin.
//
// Optionally filter by role: ...&role=seeker or ...&role=provider
// (recommended for CSV, since the two quizzes ask different questions).
//
// For a live Google Sheet, put this formula in cell A1 of a blank sheet:
//   =IMPORTDATA("https://<your-domain>/api/list-submissions?token=<token>&format=csv")
// Sheets re-fetches it periodically (and on file open); right-click the
// cell -> "Refresh imported data" to force it sooner.
// ---------------------------------------------------------------------------

const crypto = require("crypto");
const { resolveRedisCredentials, redisCommand } = require("./_kv.js");

const SUBMISSIONS_KEY = "quiz_submissions";

const BASE_COLUMNS = [
  "submittedAt", "role", "email", "confirmationCode",
  "resultType", "orderScore", "socialScore", "orderTier", "socialTier", "traits",
];

function csvField(value) {
  let str = value === undefined || value === null ? "" : String(value);
  // Stop spreadsheet apps from treating a typed-in answer as a formula.
  if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// One row per submission: the key fields first, then one column per quiz
// question (from the readable `summary` each submission stores), then the
// raw answers as JSON so nothing gets lost. Entries saved before the
// redesign have no summary and keep their email/code inside `answers`.
function toCsv(entries) {
  const questionCols = [];
  const seen = new Set();
  entries.slice().reverse().forEach((e) => (e.summary || []).forEach((r) => {
    if (!seen.has(r.id)) { seen.add(r.id); questionCols.push(r); }
  }));

  const header = [...BASE_COLUMNS, ...questionCols.map((q) => `${q.id}: ${q.question}`), "answers"];
  const rows = entries.map((e) => {
    const a = e.answers || {};
    const r = e.result || {};
    const byId = Object.fromEntries((e.summary || []).map((x) => [x.id, x.answer]));
    const base = {
      submittedAt: e.submittedAt || e.receivedAt || "",
      role: e.role || "",
      email: e.email || a.email || "",
      confirmationCode: e.confirmationCode || a.confirmationCode || "",
      resultType: r.typeName || r.type || "",
      orderScore: r.orderScore ?? "",
      socialScore: r.socialScore ?? "",
      orderTier: r.orderTier || "",
      socialTier: r.socialTier || "",
      traits: Array.isArray(r.traits) ? r.traits.join("; ") : "",
    };
    return [
      ...BASE_COLUMNS.map((c) => base[c]),
      ...questionCols.map((q) => byId[q.id]),
      JSON.stringify(a),
    ].map(csvField).join(",");
  });
  return [header.map(csvField).join(","), ...rows].join("\r\n");
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
  // The /admin page sends the token as a Bearer header; Google Sheets'
  // IMPORTDATA can only use the ?token= query parameter.
  const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const given = Buffer.from(bearer || String(req.query.token || ""));
  const expected = Buffer.from(ADMIN_TOKEN);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
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
