// ---------------------------------------------------------------------------
// /admin: a private, readable view of quiz submissions for manual matching.
// Data comes from /api/list-submissions, authorised with the ADMIN_TOKEN env
// var. The token is kept in this browser only (sessionStorage, or
// localStorage if "Remember on this device" is ticked).
// ---------------------------------------------------------------------------

import { html, render, useState, useEffect, useMemo } from './vendor/preact-htm.module.js';

const KEY = 'roomie-admin-token';
const API = '/api/list-submissions';

// The few answers shown on each card before you expand it.
const KEY_FACTS = {
  seeker: ['loc', 'budget', 'move', 'situation'],
  provider: ['where', 'rent', 'avail', 'roomSize']
};
const TYPE_BG = { anchor: '#FFE3F3', curator: '#E6E3FF', connector: '#FFF4C9', free: '#DDF5E8', balancer: '#DDF0FD' };
// Old submissions stored only the key (and called Free Spirit "freeSpirit").
const TYPE_NAMES = { anchor: 'The Anchor', curator: 'The Curator', connector: 'The Connector', free: 'The Free Spirit', freeSpirit: 'The Free Spirit', balancer: 'The Balancer' };

const readToken = () => { try { return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
const storeToken = (t, remember) => {
  try {
    sessionStorage.setItem(KEY, t);
    if (remember) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY);
  } catch (e) {}
};
const clearToken = () => { try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch (e) {} };

const when = iso => {
  if (!iso) return '';
  const d = new Date(iso), s = (Date.now() - d) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  if (s < 86400 * 7) return Math.floor(s / 86400) + ' d ago';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
const fullDate = iso => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';

// Normalise new-format and pre-redesign entries into one shape.
function normalise(e, i) {
  const a = e.answers || {}, r = e.result || {};
  return {
    id: (e.confirmationCode || a.confirmationCode || 'n' + i) + ':' + (e.submittedAt || e.receivedAt || i),
    role: e.role || 'unknown',
    email: e.email || a.email || '',
    code: e.confirmationCode || a.confirmationCode || '',
    at: e.submittedAt || e.receivedAt || '',
    type: r.type === 'freeSpirit' ? 'free' : (r.type || ''),
    typeName: r.typeName || TYPE_NAMES[r.type] || r.type || '',
    orderScore: r.orderScore, socialScore: r.socialScore,
    orderTier: r.orderTier || '', socialTier: r.socialTier || '',
    traits: Array.isArray(r.traits) ? r.traits : [],
    summary: Array.isArray(e.summary) ? e.summary : [],
    raw: a
  };
}

async function fetchAll(token) {
  const res = await fetch(API, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
  if (res.status === 401) throw Object.assign(new Error("That token didn't work. It must match ADMIN_TOKEN or ANALYTICS_TOKEN in Vercel exactly, and the variable must be enabled for Production."), { auth: true });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not load responses (' + res.status + ').');
  return (data.submissions || []).map(normalise);
}

async function downloadCsv(token, role) {
  const q = new URLSearchParams({ format: 'csv' });
  if (role !== 'all') q.set('role', role);
  const res = await fetch(API + '?' + q, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
  if (!res.ok) throw new Error('CSV download failed (' + res.status + ').');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = `roomie-${role === 'all' ? 'responses' : role + 's'}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Login({ onToken, error }) {
  const [t, setT] = useState('');
  const [remember, setRemember] = useState(false);
  const submit = e => { e.preventDefault(); if (t.trim()) onToken(t.trim(), remember); };
  return html`<main class="login">
    <img src="/assets/logo.svg" alt="Roomie" class="login-logo" />
    <h1>Quiz responses</h1>
    <p>Enter the token you saved in Vercel as <code>ANALYTICS_TOKEN</code> (or <code>ADMIN_TOKEN</code>).</p>
    <form onSubmit=${submit}>
      <label class="sr-only" for="tok">Admin token</label>
      <input id="tok" type="password" autocomplete="current-password" placeholder="Admin token" value=${t} onInput=${e => setT(e.target.value)} />
      <label class="remember"><input type="checkbox" checked=${remember} onChange=${e => setRemember(e.target.checked)} /> Remember on this device</label>
      ${error && html`<p class="err" role="alert">${error}</p>`}
      <button class="btn btn-pink" type="submit">Show responses</button>
    </form>
  </main>`;
}

function Meter({ label, score, tier, color }) {
  if (typeof score !== 'number') return null;
  return html`<div class="meter">
    <div class="meter-top"><span>${label}</span><span>${tier} · ${Math.round(score * 100)}%</span></div>
    <div class="meter-track"><i style=${{ width: Math.max(4, score * 100) + '%', background: color }}></i></div>
  </div>`;
}

function Card({ s, open, onToggle }) {
  const facts = (KEY_FACTS[s.role] || []).map(id => s.summary.find(r => r.id === id)).filter(r => r && r.answer);
  const [copied, setCopied] = useState('');
  const copy = (what, text) => async e => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1200); } catch (err) {}
  };
  return html`<article class=${'card' + (open ? ' open' : '')}>
    <button class="card-head" aria-expanded=${open} onClick=${onToggle}>
      <span class=${'role ' + s.role}>${s.role === 'seeker' ? 'Seeker' : s.role === 'provider' ? 'Provider' : s.role}</span>
      <span class="who">
        <b>${s.email || 'No email'}</b>
        <small>${s.code}${s.code && s.at ? ' · ' : ''}<time datetime=${s.at} title=${fullDate(s.at)}>${when(s.at)}</time></small>
      </span>
      ${s.typeName && html`<span class="type" style=${{ background: TYPE_BG[s.type] || '#F3E4EC' }}>${s.typeName}</span>`}
      <span class="chev" aria-hidden="true">${open ? '−' : '+'}</span>
    </button>
    ${facts.length > 0 && html`<dl class="facts">
      ${facts.map(f => html`<div><dt>${f.question}</dt><dd>${f.answer}</dd></div>`)}
    </dl>`}
    ${open && html`<div class="detail">
      <div class="detail-top">
        <div class="meters">
          <${Meter} label="Order" score=${s.orderScore} tier=${s.orderTier} color="#22B573" />
          <${Meter} label="Social" score=${s.socialScore} tier=${s.socialTier} color="#FFB21E" />
        </div>
        ${s.traits.length > 0 && html`<ul class="traits">${s.traits.map(t => html`<li>${t}</li>`)}</ul>`}
        <div class="actions">
          ${s.email && html`<a class="act" href=${'mailto:' + s.email + '?subject=' + encodeURIComponent('Your Roomie match' + (s.code ? ' (' + s.code + ')' : ''))}>Email</a>`}
          ${s.email && html`<button class="act" onClick=${copy('email', s.email)}>${copied === 'email' ? 'Copied' : 'Copy email'}</button>`}
          ${s.code && html`<button class="act" title="Paste into Amplitude's user search to see this person's events and session replay" onClick=${copy('code', s.code)}>${copied === 'code' ? 'Copied' : 'Copy code'}</button>`}
        </div>
      </div>
      ${s.summary.length > 0
        ? html`<table class="qa"><tbody>
            ${s.summary.map(r => html`<tr><th scope="row">${r.question}</th><td class=${r.answer ? '' : 'empty'}>${r.answer || '—'}</td></tr>`)}
          </tbody></table>`
        : html`<p class="old">Saved before the redesign, so only the raw answers are available:</p><pre>${JSON.stringify(s.raw, null, 2)}</pre>`}
    </div>`}
  </article>`;
}

function Dashboard({ token, onLogout }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  const [csvBusy, setCsvBusy] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try { setRows(await fetchAll(token)); }
    catch (err) { if (err.auth) return onLogout(err.message); setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const all = rows || [], week = Date.now() - 7 * 86400e3;
    return {
      all: all.length,
      seeker: all.filter(r => r.role === 'seeker').length,
      provider: all.filter(r => r.role === 'provider').length,
      week: all.filter(r => r.at && new Date(r.at) > week).length
    };
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows || []).filter(r => (role === 'all' || r.role === role) && (!needle ||
      [r.email, r.code, r.typeName, ...r.traits, ...r.summary.map(x => x.answer)].join(' ').toLowerCase().includes(needle)));
  }, [rows, role, q]);

  const csv = async () => {
    setCsvBusy(true);
    try { await downloadCsv(token, role); } catch (err) { setError(err.message); } finally { setCsvBusy(false); }
  };

  return html`<div class="page">
    <header class="top">
      <div class="top-in">
        <a href="/" class="top-logo"><img src="/assets/logo.svg" alt="Roomie" width="99" height="24" /></a>
        <span class="top-title">Responses</span>
        <button class="link" onClick=${() => onLogout()}>Sign out</button>
      </div>
    </header>
    <main class="wrap">
      <section class="stats" aria-label="Totals">
        <div><b>${counts.all}</b><span>Total</span></div>
        <div><b>${counts.seeker}</b><span>Seekers</span></div>
        <div><b>${counts.provider}</b><span>Providers</span></div>
        <div><b>${counts.week}</b><span>Last 7 days</span></div>
      </section>

      <div class="toolbar">
        <div class="tabs" role="tablist" aria-label="Filter by role">
          ${[['all', 'All'], ['seeker', 'Seekers'], ['provider', 'Providers']].map(([v, l]) =>
            html`<button role="tab" aria-selected=${role === v} class=${role === v ? 'on' : ''} onClick=${() => setRole(v)}>${l}</button>`)}
        </div>
        <input class="search" type="search" placeholder="Search email, code, city, any answer…" value=${q} onInput=${e => setQ(e.target.value)} aria-label="Search responses" />
        <button class="tool" onClick=${load} disabled=${loading}>${loading ? 'Loading…' : 'Refresh'}</button>
        <button class="tool dark" onClick=${csv} disabled=${csvBusy || !rows || !rows.length}>${csvBusy ? 'Preparing…' : 'Download CSV'}</button>
      </div>
      ${role === 'all' && rows && rows.length > 0 && html`<p class="hint">Tip: pick Seekers or Providers before downloading the CSV, so the columns match one quiz.</p>`}

      ${error && html`<p class="err" role="alert">${error}</p>`}
      ${rows === null && !error && html`<p class="empty-state">Loading responses…</p>`}
      ${rows && rows.length === 0 && html`<p class="empty-state">No responses yet. They'll show up here as soon as someone finishes a quiz.</p>`}
      ${rows && rows.length > 0 && shown.length === 0 && html`<p class="empty-state">Nothing matches that search.</p>`}

      <div class="list">
        ${shown.map(s => html`<${Card} key=${s.id} s=${s} open=${openId === s.id} onToggle=${() => setOpenId(openId === s.id ? null : s.id)} />`)}
      </div>
    </main>
  </div>`;
}

function App() {
  const [token, setToken] = useState(readToken());
  const [error, setError] = useState('');
  if (!token) return html`<${Login} error=${error} onToken=${(t, remember) => { storeToken(t, remember); setError(''); setToken(t); }} />`;
  return html`<${Dashboard} token=${token} onLogout=${msg => { clearToken(); setError(msg || ''); setToken(''); }} />`;
}

render(html`<${App} />`, document.getElementById('app'));
