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
}

function loadAnalytics() {
  if (loaded.analytics) return;
  loaded.analytics = true;
  const a = CONFIG.analytics;
  if (a.vercel) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    addScript('/_vercel/insights/script.js', { defer: '' });
  }
  if (a.plausibleDomain) {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    addScript('https://plausible.io/js/script.js', { defer: '', 'data-domain': a.plausibleDomain });
  }
  if (a.ga4Id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', a.ga4Id, { anonymize_ip: true });
    addScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(a.ga4Id));
  }
}

function loadMarketing() {
  if (loaded.marketing) return;
  loaded.marketing = true;
  const id = CONFIG.marketing.metaPixelId;
  if (id) {
    const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    addScript('https://connect.facebook.net/en_US/fbevents.js');
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
  }
  if (loaded.marketing && window.fbq) {
    if (name === 'quiz_complete') window.fbq('track', 'CompleteRegistration', { content_name: props.role });
    if (name === 'donate_success') window.fbq('track', 'Donate', { currency: 'EUR', value: props.amount || 0 });
  }
}

applyConsent();
