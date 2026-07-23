// ---------------------------------------------------------------------------
// CONFIG — drop your real links in here once you have them.
// ---------------------------------------------------------------------------
const CONFIG = {
  typeform: {
    landlord: "https://c15iv32y3tm.typeform.com/to/zjX7zwV7", // "I have a flat that needs the right people"
    seeker: "https://c15iv32y3tm.typeform.com/to/rOkKucdL",   // "I'm ready to find my new home"
  },
  stripe: {
    3: "https://buy.stripe.com/00wbJ05OxcpZ8BH2gQgQE00",
    5: "https://buy.stripe.com/cNi6oGfp74Xxg495t2gQE01",
    10: "https://buy.stripe.com/cNi5kC1yhcpZbNT4oYgQE02",
  },
};

document.querySelectorAll("[data-typeform]").forEach((el) => {
  const key = el.getAttribute("data-typeform");
  const url = CONFIG.typeform[key];
  if (url && url !== "#") el.href = url;
});

document.querySelectorAll("[data-stripe]").forEach((el) => {
  const key = el.getAttribute("data-stripe");
  const url = CONFIG.stripe[key];
  if (url && url !== "#") el.href = url;
});

// ---------------------------------------------------------------------------
// Pledge tier selector — updates the single CTA to match the chosen amount
// ---------------------------------------------------------------------------
const pledgeRadios = document.querySelectorAll(".pledge-radio");
const pledgeSubmit = document.getElementById("pledge-submit");

if (pledgeRadios.length && pledgeSubmit) {
  pledgeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const amount = radio.value;
      const tier = radio.getAttribute("data-tier");
      pledgeSubmit.textContent = `Pay €${amount} as a ${tier}`;
      pledgeSubmit.setAttribute("data-stripe", amount);
      const url = CONFIG.stripe[amount];
      pledgeSubmit.href = url && url !== "#" ? url : "#";
    });
  });
}

// ---------------------------------------------------------------------------
// Hero portrait parallax — circles drift opposite the mouse position
// ---------------------------------------------------------------------------
const heroEl = document.querySelector(".hero");
const portraitFrames = document.querySelectorAll(".portrait-frame");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (heroEl && portraitFrames.length && !prefersReducedMotion) {
  let pointerX = 0;
  let pointerY = 0;
  let rafId = null;

  const applyParallax = () => {
    portraitFrames.forEach((frame) => {
      const depth = Number(frame.getAttribute("data-depth")) || 12;
      frame.style.transform = `translate3d(${pointerX * depth}px, ${pointerY * depth}px, 0)`;
    });
    rafId = null;
  };

  heroEl.addEventListener("mousemove", (event) => {
    const rect = heroEl.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    if (rafId === null) rafId = requestAnimationFrame(applyParallax);
  });

  heroEl.addEventListener("mouseleave", () => {
    pointerX = 0;
    pointerY = 0;
    if (rafId === null) rafId = requestAnimationFrame(applyParallax);
  });
}

// ---------------------------------------------------------------------------
// Mobile nav toggle
// ---------------------------------------------------------------------------
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ---------------------------------------------------------------------------
// Reveal-on-scroll (purely cosmetic — .js-ready is what hides elements
// pre-reveal, so content stays visible if this script never runs)
// ---------------------------------------------------------------------------
document.documentElement.classList.add("js-ready");

const revealTargets = document.querySelectorAll(
  ".section-header, .tinted-card, .step-card, .cta-card, .roadmap-card, .pledge-grid, .pledge-benefits, .pledge-cta"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
  );

  revealTargets.forEach((el) => observer.observe(el));

  // Safety net: never leave content hidden if the observer misses an element.
  window.setTimeout(() => {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }, 2500);
} else {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
}
