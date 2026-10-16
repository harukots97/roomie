# Roomie

Marketing site for Roomie, a flatmate-matching service launching in the Netherlands. It has a landing page, two quizzes (room seekers and room providers) and a legal page.

It's a static site with a few Vercel serverless functions. There's no build step and nothing to `npm install`.

```
index.html            landing page
quiz.html             seeker quiz        → /quiz
quiz-provider.html    provider quiz      → /quiz-provider
legal.html            legal pages        → /legal
admin.html            private responses viewer → /admin
css/                  base.css (tokens, shared bits) + one file per page
js/config.js          ← public settings: Stripe links, analytics IDs
js/consent.js         cookie consent + consent-gated analytics, track()
js/landing.js         landing page behaviour
js/quiz-data.js       quiz questions, result types, scoring
js/quiz-app.js        quiz UI (Preact + htm, vendored in js/vendor)
js/admin.js           responses viewer
api/submit-quiz.js    saves a quiz submission, sends confirmation email
api/list-submissions.js  admin export (JSON or CSV)
```

## Run it locally

Any static server works for the pages:

```bash
python3 -m http.server 8000
```

Use `vercel dev` instead if you also want the `/api` functions and clean URLs (`/quiz` instead of `/quiz.html`).

## Connect the services

### 1. Database for quiz answers (Upstash Redis)

1. In Vercel, open the project, then **Storage → Browse Marketplace → Upstash for Redis**. Create a database and connect it to this project. That adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for you.
2. Under **Settings → Environment Variables**, add `ADMIN_TOKEN` and set it to a long random string.
3. Redeploy.

Each submission is stored with a confirmation number (`RM-XXXXXX`), the email, the flatmate type and scores, a readable question/answer list, and the raw answers.

To read submissions, open **`https://<domain>/admin`** and enter the `ADMIN_TOKEN`. You get:

- totals for seekers, providers and the last 7 days;
- one card per response with the key facts, a seeker/provider filter, and a search across emails, confirmation numbers and every answer;
- the full question-and-answer list, scores and traits when you open a card, plus Email and Copy email buttons;
- a Download CSV button.

The page isn't linked anywhere and isn't indexed by search engines. Without the token it shows nothing.

Other ways to read them:

- JSON: `https://<domain>/api/list-submissions?token=<ADMIN_TOKEN>`
- CSV, one column per question: `...&format=csv&role=seeker` (or `role=provider`)
- Live Google Sheet: put this in cell A1:
  `=IMPORTDATA("https://<domain>/api/list-submissions?token=<ADMIN_TOKEN>&format=csv&role=seeker")`

Use one sheet per role, because the two quizzes ask different questions.

### 2. Confirmation emails (optional, Resend)

1. Create a [Resend](https://resend.com) account and verify your sending domain.
2. Add these env vars: `RESEND_API_KEY` and `EMAIL_FROM` (for example `Roomie <hello@roomie.app>`).

Without them, submissions are still saved. The success screen still shows the confirmation number, but no email goes out.

### 3. Donations (Stripe Payment Links)

1. In Stripe, go to **Payment Links** and create one link per amount: €3, €5 and €10.
2. In each link, set **After payment → Don't show confirmation page → Redirect** to `https://<domain>/?donated=1#back`. The page then shows "Thank you! ♥" with a burst animation.
3. Paste the links into `stripeLinks` in `js/config.js`.

The links already in that file are the ones from the previous site.

### 4. Analytics and marketing pixels

Fill in whichever tools you use in `js/config.js`:

| Setting | Tool | What to do |
| --- | --- | --- |
| `analytics.vercel: true` | Vercel Web Analytics | Enable Analytics in the Vercel project first |
| `analytics.plausibleDomain` | Plausible | Your site domain as added in Plausible |
| `analytics.ga4Id` | Google Analytics 4 | The `G-…` measurement ID |
| `marketing.metaPixelId` | Meta Pixel | The pixel ID |

None of these scripts load until the visitor allows that category in the cookie banner. That's a GDPR requirement in the design. Every tool gets these events:

| Event | Props |
| --- | --- |
| `path_pick` | `role` |
| `quiz_start` | `role` |
| `quiz_step` | `role`, `step` (use it for a drop-off funnel) |
| `quiz_complete` | `role`, `type` |
| `quiz_submit_error` | `role` |
| `donate_click` | `amount` |
| `donate_success` | `amount` |

Once you know which tools you'll use, update the `[analytics tool]` and `[ad platform]` placeholders in `legal.html`.

## Before launch

- [ ] Fill in every `[bracketed]` placeholder in `legal.html` (company, KvK, address, dates, processors) and have a lawyer review it.
- [ ] Add the TikTok URL in the `index.html` footer. It's commented out until then.
- [ ] Replace the stand-in illustrations. The design used `c182.svg` (Free Spirit), `c183.svg` (Balancer) and `c66b.svg` (success screen), but those weren't in the handoff. See `TYPES` and `SUCCESS_IMG` in `js/quiz-data.js`.
- [ ] Do one real €3 payment end to end and refund it.
- [ ] Submit each quiz once on the production domain and check it shows up in `/api/list-submissions`.
