// ---------------------------------------------------------------------------
// Cookie consent + consent-gated analytics.
//
// Consent lives in localStorage['roomie-consent'] as {analytics, marketing, at}.
// No analytics or marketing script is injected until the matching category
// is allowed. track() calls made before that are dropped, never queued, so
// nothing about a visitor is recorded without consent.
// ---------------------------------------------------------------------------

import { CONFIG } from './config.js';

const KEY = 'roomie-consent';
const loaded = { analytics: false, marketing: false };

// Amplitude's library loads async; calls made before it's ready wait here.
const AMP_SDK = 'analytics-browser-2.47.5-min.js.gz';
const AMP_REPLAY = 'plugin-session-replay-browser-1.36.3-min.js.gz';
let ampReady = false;
const ampQueue = [];

export function getConsent() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
}

export function saveConsent({ analytics, marketing }) {
  const c = { analytics: !!analytics, marketing: !!marketing, at: new Date().toISOString() };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
  applyConsent(c);
  return c;
}

function addScript(src, attrs = {}) {
  const s = document.createElement('script');
  s.async = true; s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
  return new Promise((resolve, reject) => { s.onload = resolve; s.onerror = reject; });
}

async function loadAmplitude({ apiKey, serverZone, sessionReplay }) {
  const cdn = serverZone === 'EU' ? 'https://cdn.eu.amplitude.com/libs/' : 'https://cdn.amplitude.com/libs/';
  try {
    await addScript(cdn + AMP_SDK);
    if (sessionReplay) {
      await addScript(cdn + AMP_REPLAY);
      // 'medium' masks the text of every input, so emails and answers typed
      // into fields never appear in recordings.
      window.amplitude.add(window.sessionReplay.plugin({ sampleRate: 1, privacyConfig: { defaultMaskLevel: 'medium' } }));
    }
    window.amplitude.init(apiKey, {
      serverZone,
      autocapture: { pageViews: true, sessions: true, attribution: true, elementInteractions: true, formInteractions: false, fileDownloads: false }
    });
    ampReady = true;
    ampQueue.splice(0).forEach(fn => fn());
  } catch (err) {
    console.warn('Roomie: Amplitude failed to load (often an ad blocker).', err);
  }
}

function loadAnalytics() {
  if (loaded.analytics) return;
  loaded.analytics = true;
  const a = CONFIG.analytics;
  if (a.vercel) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    addScript('/_vercel/insights/script.js', { defer: '' }).catch(() => {});
  }
  if (a.plausibleDomain) {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    addScript('https://plausible.io/js/script.js', { defer: '', 'data-domain': a.plausibleDomain }).catch(() => {});
  }
  if (a.ga4Id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', a.ga4Id, { anonymize_ip: true });
    addScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(a.ga4Id)).catch(() => {});
  }
  if (a.amplitude && a.amplitude.apiKey) loadAmplitude(a.amplitude);
}

function loadMarketing() {
  if (loaded.marketing) return;
  loaded.marketing = true;
  const id = CONFIG.marketing.metaPixelId;
  if (id) {
    const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    addScript('https://connect.facebook.net/en_US/fbevents.js').catch(() => {});
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }
}

export function applyConsent(c = getConsent()) {
  if (!c) return;
  if (c.analytics) loadAnalytics();
  if (c.marketing) loadMarketing();
  // Turning a category off after it loaded needs a reload to unload it.
}

// Send a named event to every analytics tool that is loaded. Props should be
// small, non-personal values (role, step number, amount); never emails.
export function track(name, props = {}) {
  if (loaded.analytics) {
    if (window.va) window.va('event', { name, data: props });
    if (window.plausible && CONFIG.analytics.plausibleDomain) window.plausible(name, { props });
    if (window.gtag && CONFIG.analytics.ga4Id) window.gtag('event', name, props);
    amp(() => window.amplitude.track(name, props));
  }
  if (loaded.marketing && window.fbq) {
    if (name === 'quiz_complete') window.fbq('track', 'CompleteRegistration', { content_name: props.role });
    if (name === 'donate_success') window.fbq('track', 'Donate', { currency: 'EUR', value: props.amount || 0 });
  }
}

// Tie this visitor's Amplitude history (events, session replay) to their quiz
// submission, so a response in /admin can be looked up in Amplitude by its
// confirmation number. Only the code and non-personal traits are sent.
export function identifySubmission(code, traits = {}) {
  if (!loaded.analytics || !code) return;
  amp(() => {
    window.amplitude.setUserId(code);
    const id = new window.amplitude.Identify();
    Object.entries(traits).forEach(([k, v]) => id.set(k, v));
    window.amplitude.identify(id);
  });
}

function amp(fn) {
  if (!CONFIG.analytics.amplitude || !CONFIG.analytics.amplitude.apiKey) return;
  if (ampReady) fn(); else ampQueue.push(fn);
}

applyConsent();
