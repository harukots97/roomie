import { CONFIG } from './config.js';
import { getConsent, saveConsent, track } from './consent.js';
import { burst } from './burst.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero rotating word ------------------------------------------------------
const WORDS = ['flatmate.', 'night owl.', 'plant parent.', 'early bird.', 'dog lover.'];
const wordEl = $('#hero-word');
let wi = 0;
if (!reduceMotion) {
  setInterval(() => {
    wi = (wi + 1) % WORDS.length;
    const s = document.createElement('span');
    s.textContent = WORDS[wi];
    wordEl.replaceChildren(s);
  }, 2200);
}

// Scroll reveal -----------------------------------------------------------
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.remove('pre');
    io.unobserve(e.target);
  }), { threshold: .15 });
  $$('[data-reveal]').forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight) return;
    const d = +el.dataset.reveal * 90;
    el.classList.add('pre');
    el.style.transition = `opacity .6s ${d}ms, translate .7s cubic-bezier(.2,1,.3,1) ${d}ms, transform .3s, box-shadow .3s`;
    io.observe(el);
  });
}

// Path picker -------------------------------------------------------------
$$('[data-path]').forEach(a => a.addEventListener('click', () => track('path_pick', { role: a.dataset.path })));

// Donation ----------------------------------------------------------------
let amount = 5;
const donateBtn = $('#donate-btn');
function setAmount(v) {
  amount = v;
  $$('.amount').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.amount === v)));
  donateBtn.textContent = `Donate €${v}`;
  donateBtn.href = CONFIG.stripeLinks[v] || '#';
}
$$('.amount').forEach(b => b.addEventListener('click', () => setAmount(+b.dataset.amount)));
setAmount(amount);
donateBtn.addEventListener('click', e => {
  if (!CONFIG.stripeLinks[amount]) { e.preventDefault(); return; }
  try { sessionStorage.setItem('roomie-donate-amount', String(amount)); } catch (err) {}
  track('donate_click', { amount });
});

// Stripe Payment Links redirect back here with ?donated=1 (see config.js).
const params = new URLSearchParams(location.search);
if (params.has('donated')) {
  let paid = 0;
  try { paid = +sessionStorage.getItem('roomie-donate-amount') || 0; sessionStorage.removeItem('roomie-donate-amount'); } catch (err) {}
  if (paid) setAmount(paid);
  donateBtn.textContent = 'Thank you! ♥';
  track('donate_success', { amount: paid });
  history.replaceState(null, '', location.pathname + '#back');
  const card = $('#donate-card');
  card.scrollIntoView({ block: 'center' });
  const fire = () => { if (!reduceMotion) card.appendChild(burst(1, 14)); };
  // Wait for the smooth scroll to #back so the burst is actually seen.
  setTimeout(fire, 600);
}

// Cookie banner -----------------------------------------------------------
const banner = $('#cookie'), cats = $('#cookie-cats'), secondary = $('#cookie-secondary');
let ck = { analytics: false, marketing: false }, prefsOpen = false;

function renderCats() {
  $$('[data-cat]', cats).forEach(b => {
    const on = !!ck[b.dataset.cat];
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}
function openBanner(prefs) {
  prefsOpen = prefs;
  cats.hidden = !prefs;
  secondary.textContent = prefs ? 'Save my choices' : 'Choose what to allow';
  renderCats();
  banner.hidden = false;
}
function close(choice) {
  ck = saveConsent(choice);
  banner.hidden = true;
}
$$('[data-cat]', cats).forEach(b => b.addEventListener('click', () => { ck = { ...ck, [b.dataset.cat]: !ck[b.dataset.cat] }; renderCats(); }));
$('#cookie-accept').addEventListener('click', () => close({ analytics: true, marketing: true }));
$('#cookie-reject').addEventListener('click', () => close({ analytics: false, marketing: false }));
secondary.addEventListener('click', () => prefsOpen ? close(ck) : openBanner(true));
$('#cookie-settings').addEventListener('click', () => openBanner(true));

const stored = getConsent();
if (stored) ck = { analytics: !!stored.analytics, marketing: !!stored.marketing };
else setTimeout(() => openBanner(false), 900);
