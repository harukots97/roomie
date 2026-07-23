// ---------------------------------------------------------------------------
// CONFIG — drop your real links in here once you have them.
// ---------------------------------------------------------------------------
const CONFIG = {
  typeform: {
    landlord: "#", // "I have a flat that needs the right people"
    seeker: "#",   // "I'm ready to find my new home"
  },
  stripe: {
    3: "#",
    5: "#",
    10: "#",
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
  ".section-header, .tinted-card, .step-card, .cta-card, .roadmap-card, .support-block"
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
