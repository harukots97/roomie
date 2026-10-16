// ---------------------------------------------------------------------------
// Public site configuration. Everything here ships to the browser, so only
// put public IDs/links in this file. Secrets (database tokens, email API
// keys, admin token) live in Vercel environment variables instead. See
// README.md for how to set each of these up.
// ---------------------------------------------------------------------------

export const CONFIG = {
  // Stripe Payment Links, one per donation amount (EUR). Create them in
  // Stripe → Payment Links. Set each link's "After payment" to redirect to
  // https://<your-domain>/?donated=1#back so the page can say thank you.
  stripeLinks: {
    3: 'https://buy.stripe.com/00wbJ05OxcpZ8BH2gQgQE00',
    5: 'https://buy.stripe.com/cNi6oGfp74Xxg495t2gQE01',
    10: 'https://buy.stripe.com/cNi5kC1yhcpZbNT4oYgQE02'
  },

  // Analytics. Nothing here loads until the visitor allows "Analytics" in
  // the cookie banner. Fill in whichever you use and leave the rest empty.
  analytics: {
    vercel: true,           // Vercel Web Analytics (enabled in the Vercel project)
    plausibleDomain: '',    // e.g. 'roomie.nl'
    ga4Id: ''               // e.g. 'G-XXXXXXXXXX'
  },

  // Marketing pixels. Only load after the visitor allows "Marketing".
  marketing: {
    metaPixelId: ''         // e.g. '123456789012345'
  },

  // Where the quizzes send answers (Vercel function in /api).
  submitEndpoint: '/api/submit-quiz',

  contactEmail: 'hello@roomie.app',
  instagram: '@roomie.nl'
};
