// ---------------------------------------------------------------------------
// Quiz UI shared by the seeker and provider quizzes. Usage from a page:
//   import { mountQuiz } from '/js/quiz-app.js';
//   import { SEEKER } from '/js/quiz-data.js';
//   mountQuiz(SEEKER, document.getElementById('app'));
// ---------------------------------------------------------------------------

import { html, render, useState, useEffect, useRef } from './vendor/preact-htm.module.js';
import { CONFIG } from './config.js';
import { track } from './consent.js';
import { burstItems } from './burst.js';
import { COLS, TYPES, SUCCESS_IMG, computeResult, summarize } from './quiz-data.js';

const LANDING = '/';
const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const has = x => x !== undefined && x !== null && String(x).trim() !== '';
const digits = v => v.replace(/[^0-9]/g, '');
const secVars = col => ({ '--c': col.c, '--tint': col.tint, '--sink': col.ink });

function visibleParts(step, qa) { return step.parts.filter(p => !p.showIf || p.showIf(qa)); }

function validPart(p, a) {
  a = a || {};
  if (p.type === 'toggle') return true;
  if (p.type === 'budget') return +a.amount > 0;
  if (p.type === 'text' || p.type === 'area') return !!p.optional || has(a.text);
  if (p.type === 'num') return !!p.optional || (p.check && a.check) || has(a.num);
  if (p.type === 'multi') { const v = a.v || []; return v.length > 0 && (!v.includes(p.other) || has(a.other)); }
  return !!a.v && (a.v !== p.other || has(a.other)) && (!p.extraOn || a.v !== p.extraOn || has(a.extra));
}

function Burst({ k }) {
  if (!k) return null;
  return html`<div class="burst" aria-hidden="true" key=${'b' + k}>
    ${burstItems(k, 16).map((it, i) => it.heart
      ? html`<span key=${i} style=${it.style}>♥</span>`
      : html`<img key=${i} src=${it.src} alt="" style=${it.style} />`)}
  </div>`;
}

function Switch({ on, label, word, onToggle, plain }) {
  return html`<button type="button" class=${'togglebtn' + (on ? ' is-on' : '') + (plain ? ' plain' : '')} aria-pressed=${on} onClick=${onToggle}>
    <span class="tl">${label}</span>
    <span class="tw">${word}<span class="switch"></span></span>
  </button>`;
}

function App({ quiz }) {
  const { steps, sections } = quiz;
  const [stage, setStage] = useState('intro');
  const [qi, setQi] = useState(0);
  const [qa, setQa] = useState({});
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [metersOn, setMetersOn] = useState(false);
  const hpRef = useRef(null), keepRef = useRef(null), advRef = useRef(0), leavingRef = useRef(false);

  // Latest state for timers and window listeners.
  const S = useRef({}); S.current = { stage, qi, qa, confirm };

  const dirty = () => { const s = S.current; return s.stage === 'email' || (s.stage === 'q' && Object.keys(s.qa).length > 0); };
  const leave = () => { leavingRef.current = true; window.location.href = LANDING; };
  const requestClose = () => dirty() ? setConfirm(true) : leave();
  const setAns = (id, patch) => setQa(q => ({ ...q, [id]: { ...(q[id] || {}), ...patch } }));
  const validStep = (i, answers) => visibleParts(steps[i], answers).every(p => validPart(p, answers[p.id]));

  const qNext = () => {
    const s = S.current;
    if (!validStep(s.qi, s.qa)) return;
    if (s.qi < steps.length - 1) setQi(s.qi + 1); else setStage('email');
  };
  const qBack = () => { clearTimeout(advRef.current); qi > 0 ? setQi(qi - 1) : setStage('intro'); };

  useEffect(() => {
    const onBU = e => { if (dirty() && !leavingRef.current) { e.preventDefault(); e.returnValue = ''; } };
    const onKey = e => { if (e.key === 'Escape') S.current.confirm ? setConfirm(false) : requestClose(); };
    window.addEventListener('beforeunload', onBU);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('beforeunload', onBU); window.removeEventListener('keydown', onKey); clearTimeout(advRef.current); };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (stage === 'q' && !steps[qi].info) track('quiz_step', { role: quiz.role, step: steps[qi].num });
    if (stage === 'result') { setMetersOn(false); requestAnimationFrame(() => requestAnimationFrame(() => setMetersOn(true))); }
  }, [stage, qi]);

  useEffect(() => { if (confirm && keepRef.current) keepRef.current.focus(); }, [confirm]);

  const startQuiz = () => { setStage('q'); setQi(0); track('quiz_start', { role: quiz.role }); };

  const finish = async () => {
    if (sending) return;
    if (!isEmail(email)) return setEmailErr(true);
    setSending(true); setSendErr(false);
    const r = computeResult(quiz, qa);
    try {
      const res = await fetch(CONFIG.submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: quiz.role,
          email: email.trim(),
          answers: qa,
          summary: summarize(quiz, qa),
          result: { type: r.key, typeName: TYPES[r.key].name, orderScore: r.orderScore, socialScore: r.socialScore, orderTier: r.orderTier, socialTier: r.socialTier, traits: r.traits },
          website: hpRef.current ? hpRef.current.value : '',
          locale: navigator.language || ''
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'HTTP ' + res.status);
      setReceipt({ code: data.confirmationCode, emailed: !!data.emailSent });
      setStage('success');
      setBurstKey(k => k + 1);
      track('quiz_complete', { role: quiz.role, type: r.key });
    } catch (err) {
      console.error('Roomie: quiz submission failed', err);
      setSendErr(true);
      track('quiz_submit_error', { role: quiz.role });
    } finally {
      setSending(false);
    }
  };

  // Header ----------------------------------------------------------------
  const step = steps[qi], col = COLS[step.sec];
  const ok = validStep(qi, qa);
  const showProgress = stage === 'q' || stage === 'email';
  const countLabel = stage === 'email' ? 'Last' : step.info ? 'Photos' : `${step.num}/${quiz.total}`;
  const header = html`<header class="qh"><div class="qh-in">
    <a href=${LANDING} class="qh-logo" aria-label="Back to Roomie" onClick=${e => { e.preventDefault(); requestClose(); }}><img src="/assets/logo.svg" alt="Roomie" width="99" height="24" /></a>
    <div class="qh-mid">
      ${showProgress && html`
        <div class="segs" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax=${quiz.total} aria-valuenow=${stage === 'email' ? quiz.total : step.num || 0}>
          ${sections.map((_, i) => {
            const a = quiz.start[i], n = quiz.len[i];
            const f = stage === 'email' ? 1 : qi >= a + n ? 1 : qi < a ? 0 : (qi - a + (ok ? 1 : 0)) / n;
            return html`<div class="seg" style=${{ flex: n }}><i style=${{ width: f * 100 + '%', background: COLS[i].c }}></i></div>`;
          })}
        </div>
        <span class="count">${countLabel}</span>`}
    </div>
    <button type="button" class="xbtn" aria-label="Close quiz" onClick=${requestClose}>✕</button>
  </div></header>`;

  // Stages ----------------------------------------------------------------
  let body;
  if (stage === 'intro') {
    body = html`<div class="stack intro">
      <div class="panel" style=${{ background: quiz.introBg }}><img src=${quiz.introImg} alt="" /></div>
      <span class="badge">${quiz.badge}</span>
      <h1>${quiz.title}</h1>
      <p class="lead">${quiz.sub}</p>
      <ol class="seclist">
        ${sections.map((name, i) => html`<li>
          <span class="secnum" style=${{ background: COLS[i].tint, color: COLS[i].ink }}>${i + 1}</span>
          <span class="secname">${name}</span>
          <span class="seccount">${quiz.count[i]} ${quiz.count[i] === 1 ? quiz.countWord[0] : quiz.countWord[1]}</span>
        </li>`)}
      </ol>
      <div class="time"><span class="clock"></span>${quiz.time}</div>
      <button type="button" class="btn btn-pink" onClick=${startQuiz}>Start the quiz</button>
    </div>`;
  } else if (stage === 'q') {
    body = renderStep();
  } else if (stage === 'email') {
    body = html`<div class="stack email">
      <div class="panel"><img src="/assets/c187.svg" alt="" /></div>
      <h2 class="qt"><label for="q-email">${quiz.emailTitle}</label></h2>
      <p class="lead">We promise not to spam you. We'll only ever email you about your matches, nothing else.</p>
      <input id="q-email" type="email" autocomplete="email" placeholder="you@email.com" class=${'emailin' + (emailErr ? ' err' : '')}
        value=${email} aria-invalid=${emailErr} aria-describedby=${emailErr ? 'q-email-err' : undefined}
        onInput=${e => { setEmail(e.target.value); setEmailErr(false); setSendErr(false); }}
        onKeyDown=${e => { if (e.key === 'Enter') finish(); }} />
      ${emailErr && html`<span class="err-msg" id="q-email-err" role="alert">That email doesn't look quite right.</span>`}
      ${sendErr && html`<span class="err-msg" role="alert">We couldn't save your answers just now. Check your connection and try again.</span>`}
      <input ref=${hpRef} class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <p class="fine">By finishing, you agree to our <a href="/legal#terms" target="_blank">Terms</a> and confirm you've read our <a href="/legal#privacy" target="_blank">Privacy policy</a>. We use your answers only to find you matches.</p>
      <button type="button" class="btn btn-pink" onClick=${finish} disabled=${sending}>${sending ? 'Sending…' : 'Finish the quiz'}</button>
    </div>`;
  } else if (stage === 'success') {
    body = html`<div class="stack success">
      <${Burst} k=${burstKey} />
      <div class="circle"><img src=${SUCCESS_IMG} alt="" /></div>
      <h2 class="big-h">${quiz.okTitle}</h2>
      <p class="lead">${quiz.okBody}</p>
      ${receipt && receipt.code && html`<p class="code">Confirmation number <b>${receipt.code}</b>${receipt.emailed ? ' · also in your inbox' : ''}</p>`}
      <button type="button" class="btn btn-pink" onClick=${() => setStage('result')}>See my flatmate type</button>
    </div>`;
  } else {
    const r = computeResult(quiz, qa), rt = TYPES[r.key];
    const meters = [
      { label: 'Order', w: Math.max(6, r.orderScore * 100), word: r.orderTier, c: COLS[1].c },
      { label: 'Social', w: Math.max(6, r.socialScore * 100), word: r.socialTier, c: COLS[2].c }
    ];
    body = html`<div class="stack result">
      <div class="panel" style=${{ background: rt.bg }}><img src=${rt.img} alt="" /></div>
      <div class="rhead">
        <span class="eyebrow">Your flatmate type</span>
        <h2 class="big-h">${rt.name}</h2>
        <p class="lead">${rt.line}</p>
      </div>
      <div class="meters">
        ${meters.map(m => html`<div class="meter">
          <div class="meter-top"><span>${m.label}</span><span>${m.word}</span></div>
          <div class="meter-track"><i style=${{ width: metersOn ? m.w + '%' : '0%', background: m.c }}></i></div>
        </div>`)}
      </div>
      <ul class="traits">${r.traits.map(t => html`<li>${t}</li>`)}</ul>
      <div class="cards">
        <div class="card great"><b>Great with</b><p>${rt.great}</p></div>
        <div class="card know"><b>Worth knowing</b><p>${rt.know}</p></div>
      </div>
      <a href=${LANDING} class="btn btn-dark">Back to Roomie</a>
    </div>`;
  }

  function renderStep() {
    const vis = visibleParts(step, qa);
    const solo = vis.length === 1;
    const single = quiz.layout === 'single';
    const secLabel = `Section ${step.sec + 1} of ${sections.length} · ${sections[step.sec]}`;
    return html`<div class=${'stack ' + (single ? 'q-single' : 'q-parts')} style=${secVars(col)}>
      <span class="pill">${secLabel}</span>
      ${step.info && html`<div class="stack info">
        <h2 class="qt">Add some real photos.</h2>
        <p>Real photos get real matches. Send yours to <strong>${CONFIG.instagram}</strong> on Instagram along with your name or quiz confirmation number, and we'll add them to your listing.</p>
        <div class="panel"><img src="/assets/c185.svg" alt="" /></div>
      </div>`}
      ${single
        ? vis.map(p => html`<div class="contents" key=${p.id}>
            <h2 class="qt" id=${'l-' + p.id}><span>${p.label}</span></h2>
            ${p.sub && html`<p class="qsub">${p.sub}</p>`}
            ${partBody(p, true)}
          </div>`)
        : vis.map(p => html`<div class="part" key=${p.id}>
            ${p.type !== 'toggle' && html`<h2 class=${'pt' + (solo ? ' solo' : '')} id=${'l-' + p.id}>${p.label}</h2>`}
            ${p.sub && html`<p class="qsub">${p.sub}</p>`}
            ${partBody(p, solo)}
          </div>`)}
    </div>`;
  }

  function partBody(p, solo) {
    const a = qa[p.id] || {}, multi = p.type === 'multi', v = a.v;
    const lab = 'l-' + p.id;
    if (p.type === 'budget') {
      return html`<div class="budget">
        <label class=${'numbox big' + (a.amount ? ' filled' : '')}>
          <span class="pre">€</span>
          <input type="number" inputmode="numeric" min="0" placeholder="900" aria-labelledby=${lab} value=${a.amount || ''} onInput=${e => setAns(p.id, { amount: digits(e.target.value) })} />
          <span class="suf">/ month</span>
        </label>
        <${Switch} plain on=${!!a.bills} label="Does that include bills?" word=${a.bills ? 'Yes' : 'No'} onToggle=${() => setAns(p.id, { bills: !a.bills })} />
      </div>`;
    }
    if (p.type === 'text') {
      return html`<input class=${'textin' + (has(a.text) ? ' filled' : '')} placeholder=${p.ph} aria-labelledby=${lab} value=${a.text || ''} onInput=${e => setAns(p.id, { text: e.target.value })} />`;
    }
    if (p.type === 'area') {
      return html`<textarea class=${'textarea' + (has(a.text) ? ' filled' : '')} rows="4" placeholder=${p.ph} aria-labelledby=${lab} value=${a.text || ''} onInput=${e => setAns(p.id, { text: e.target.value })}></textarea>`;
    }
    if (p.type === 'toggle') {
      return html`<${Switch} on=${!!a.on} label=${p.label} word=${a.on ? 'Yes' : 'No'} onToggle=${() => setAns(p.id, { on: !a.on })} />`;
    }
    if (p.type === 'num') {
      const off = !!(p.check && a.check);
      return html`
        <label class=${'numbox' + (has(a.num) && !off ? ' filled' : '') + (off ? ' off' : '')}>
          ${p.prefix && html`<span class="pre">${p.prefix}</span>`}
          <input type="number" inputmode="numeric" min="0" placeholder=${p.ph} aria-labelledby=${lab} disabled=${off} value=${off ? '' : (a.num ?? '')} onInput=${e => setAns(p.id, { num: digits(e.target.value) })} />
          ${p.suffix && html`<span class="suf">${p.suffix}</span>`}
        </label>
        ${p.check && html`<button type="button" class=${'checkbtn' + (a.check ? ' is-on' : '')} aria-pressed=${!!a.check} onClick=${() => setAns(p.id, { check: !a.check })}>
          <span class="checkbox">${a.check ? '✓' : ''}</span>${p.check}
        </button>`}`;
    }
    // single / multi choice
    const otherOn = multi ? (v || []).includes(p.other) : (p.other && v === p.other);
    const pick = o => {
      const on = multi ? (v || []).includes(o.l) : v === o.l;
      if (multi) {
        const cur = v || [];
        const nv = on ? cur.filter(x => x !== o.l) : o.excl ? [o.l] : [...cur.filter(x => !p.opts.find(q => q.l === x && q.excl)), o.l];
        return setAns(p.id, { v: nv });
      }
      setAns(p.id, { v: o.l });
      if (solo && o.l !== p.other && o.l !== p.extraOn) {
        clearTimeout(advRef.current);
        const at = qi;
        advRef.current = setTimeout(() => { if (S.current.stage === 'q' && S.current.qi === at) qNext(); }, 380);
      }
    };
    return html`
      <div class="opts" role="group" aria-labelledby=${lab}>
        ${p.opts.map(o => {
          const on = multi ? (v || []).includes(o.l) : v === o.l;
          return html`<div class="opt-wrap" key=${o.l}>
            <button type="button" class=${'opt' + (multi ? ' multi' : '') + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => pick(o)}>
              <span class="opt-dot">${on ? '✓' : ''}</span><span class="opt-l">${o.l}</span>
            </button>
            ${on && o.l === p.extraOn && html`<input class="field extra" type=${p.extraType || 'text'} placeholder=${p.extraPh} aria-label=${p.extraPh} aria-required="true"
              value=${a.extra || ''} onInput=${e => setAns(p.id, { extra: e.target.value })} />`}
          </div>`;
        })}
      </div>
      ${otherOn && html`<input class="field" placeholder=${p.ph || 'Tell us more'} aria-label=${p.ph || 'Tell us more'} value=${a.other || ''} onInput=${e => setAns(p.id, { other: e.target.value })} />`}`;
  }

  // Bottom nav ------------------------------------------------------------
  let nextLabel = 'Next →';
  if (stage === 'q') {
    const vis = visibleParts(step, qa);
    if (step.info) nextLabel = 'Continue';
    else if (vis.length > 0 && vis.every(p => p.optional && !has((qa[p.id] || {}).text))) nextLabel = 'Skip →';
  }

  return html`<div class="qpage">
    ${header}
    <main class="qmain">${body}</main>
    ${stage === 'q' && html`<div class="qnav"><div class="qnav-in">
      <button type="button" class="backbtn" onClick=${qBack}>← Back</button>
      <button type="button" class="nextbtn" disabled=${!ok} onClick=${qNext}>${nextLabel}</button>
    </div></div>`}
    ${confirm && html`<div class="scrim" onClick=${() => setConfirm(false)}>
      <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="leave-h" onClick=${e => e.stopPropagation()}>
        <img src="/assets/c189.svg" alt="" />
        <h3 id="leave-h">Leave the quiz?</h3>
        <p>Your answers won't be saved. If you leave now, you'll have to start again from the beginning.</p>
        <button type="button" ref=${keepRef} class="btn btn-pink" onClick=${() => setConfirm(false)}>Keep going</button>
        <button type="button" class="leavebtn" onClick=${leave}>Leave and lose answers</button>
      </div>
    </div>`}
  </div>`;
}

export function mountQuiz(quiz, el) {
  render(html`<${App} quiz=${quiz} />`, el);
}
