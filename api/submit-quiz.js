// ---------------------------------------------------------------------------
// Vercel serverless function. Receives one quiz submission from either quiz
// (js/quiz-app.js), gives it a confirmation number, appends it to a Redis
// list and, if email is configured, sends the person a confirmation email.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   required, see _kv.js
//   RESEND_API_KEY   optional, enables the confirmation email (resend.com)
//   EMAIL_FROM       optional, e.g. "Roomie <hello@roomie.app>" (a domain
//                    verified in Resend). Both are needed to send email.
//
// To read submissions, use /api/list-submissions (see that file).
// ---------------------------------------------------------------------------

const crypto = require("crypto");
const { resolveRedisCredentials, redisCommand } = require("./_kv.js");

const SUBMISSIONS_KEY = "quiz_submissions";
const MAX_BODY_BYTES = 200_000; // generous; a submission is a few KB of JSON
const RATE_LIMIT_PER_HOUR = 20;  // per IP, stops someone flooding the list
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

function confirmationCode() {
  const bytes = crypto.randomBytes(6);
  let code = "RM-";
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}

const isEmail = (e) => typeof e === "string" && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function overRateLimit(req) {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const key = `rl:submit:${ip}:${Math.floor(Date.now() / 3_600_000)}`;
  try {
    const { result } = await redisCommand(["INCR", key]);
    if (result === 1) await redisCommand(["EXPIRE", key, "3600"]);
    return result > RATE_LIMIT_PER_HOUR;
  } catch (err) {
    return false; // never block a real submission because the limiter failed
  }
}

async function sendConfirmationEmail({ email, role, code, typeName }) {
  const { RESEND_API_KEY, EMAIL_FROM } = process.env;
  if (!RESEND_API_KEY || !EMAIL_FROM) return false;

  const intro = role === "provider"
    ? "Your listing is in. We're matching your place with seekers whose answers actually fit your household."
    : "Your quiz is in. We're matching you with people who actually fit your answers.";
  const photos = role === "provider"
    ? `<p>Want to add photos? Send them to <strong>@roomie.nl</strong> on Instagram with your confirmation number and we'll add them to your listing.</p>`
    : "";
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1C1519;max-width:520px">
    <p>Hi there,</p>
    <p>${intro} We'll email you the moment we've got someone.</p>
    <p>Your confirmation number: <strong style="font-size:18px;letter-spacing:.04em">${escapeHtml(code)}</strong></p>
    ${typeName ? `<p>Your flatmate type: <strong>${escapeHtml(typeName)}</strong></p>` : ""}
    ${photos}
    <p>Questions, or want your answers deleted? Just reply to this email.</p>
    <p>The Roomie team</p>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [email], subject: `You're in. Your Roomie confirmation number is ${code}`, html }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return true;
  } catch (err) {
    console.error("submit-quiz: confirmation email failed", err);
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!resolveRedisCredentials()) {
    console.error("submit-quiz: no Redis credentials found — connect Upstash for Redis to this project from the Storage tab.");
    return res.status(500).json({ error: "Storage not configured yet" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (!body || typeof body !== "object" || typeof body.answers !== "object" || !body.answers) {
    return res.status(400).json({ error: "Expected { role, email, answers }" });
  }
  if (body.role !== "seeker" && body.role !== "provider") {
    return res.status(400).json({ error: "role must be 'seeker' or 'provider'" });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  // Honeypot: the hidden "website" field is only ever filled in by bots.
  // Pretend it worked so they don't retry.
  if (body.website) {
    return res.status(200).json({ ok: true, confirmationCode: confirmationCode(), emailSent: false });
  }

  if (await overRateLimit(req)) {
    return res.status(429).json({ error: "Too many submissions, try again later" });
  }

  const code = confirmationCode();
  const result = body.result && typeof body.result === "object" ? body.result : {};
  const entry = JSON.stringify({
    confirmationCode: code,
    role: body.role,
    email,
    result,
    summary: Array.isArray(body.summary) ? body.summary : [],
    answers: body.answers,
    locale: typeof body.locale === "string" ? body.locale.slice(0, 35) : "",
    submittedAt: new Date().toISOString(),
  });
  if (entry.length > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Submission too large" });
  }

  try {
    await redisCommand(["LPUSH", SUBMISSIONS_KEY, entry]);
  } catch (err) {
    console.error("submit-quiz: Redis write failed", err);
    return res.status(502).json({ error: "Storage write failed" });
  }

  const emailSent = await sendConfirmationEmail({ email, role: body.role, code, typeName: result.typeName });

  return res.status(200).json({ ok: true, confirmationCode: code, emailSent });
};
