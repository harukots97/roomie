// Celebration burst: characters and hearts flying out from a point.
// burstItems() gives the layout so Preact (quizzes) and plain DOM (landing)
// render the same animation.

// The design also lists c182, which wasn't in the handoff assets.
const IMGS = ['c176', 'c179', 'c184', 'c185', 'c187', 'c189', 'c190', 'c191', 'c188', 'c186'];

export function burstItems(key, n) {
  return Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 + key, dist = 120 + ((i * 37 + key * 13) % 90);
    return {
      heart: i % 3 === 0,
      src: `/assets/${IMGS[(i + key) % IMGS.length]}.svg`,
      style: {
        '--dx': Math.cos(ang) * dist + 'px',
        '--dy': Math.sin(ang) * dist - 40 + 'px',
        '--rot': ((i * 47) % 90 - 45) + 'deg',
        'animation-duration': 1 + (i % 4) * .15 + 's',
        'animation-delay': (i % 5) * 30 + 'ms'
      }
    };
  });
}

export function burst(key, n) {
  const wrap = document.createElement('div');
  wrap.className = 'burst';
  wrap.setAttribute('aria-hidden', 'true');
  burstItems(key, n).forEach(it => {
    const el = it.heart ? document.createElement('span') : document.createElement('img');
    if (it.heart) el.textContent = '♥'; else { el.src = it.src; el.alt = ''; }
    Object.entries(it.style).forEach(([k, v]) => el.style.setProperty(k, v));
    wrap.appendChild(el);
  });
  setTimeout(() => wrap.remove(), 2500);
  return wrap;
}
