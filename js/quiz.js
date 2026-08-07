// ---------------------------------------------------------------------------
// CONFIG — drop the real matching webhook in here once it exists.
//
// Any endpoint that accepts a JSON POST works: a Zapier/Make catch webhook,
// a Google Apps Script web app, an Airtable automation, etc. Point it at
// whatever currently turns Typeform rows into matches. Until this is set,
// every submission is still saved in the browser under the
// "roomie_quiz_submissions" localStorage key, so nothing gets lost.
// ---------------------------------------------------------------------------
const QUIZ_CONFIG = {
  webhookUrl: "",
  // Same €3 pledge link as the "Back us" section on index.html (CONFIG.stripe[3]
  // in js/script.js) — update both if the Stripe link ever changes.
  backUsUrl: "https://buy.stripe.com/00wbJ05OxcpZ8BH2gQgQE00",
};

const ACCENTS = {
  practical: "var(--color-primary-indigo)",
  order: "var(--color-forest)",
  social: "var(--color-ember)",
  rhythm: "#c4479a",
  money: "var(--color-midnight-violet)",
  email: "var(--color-primary-indigo)",
  success: "var(--color-primary-indigo)",
  result: "var(--color-primary-indigo)",
};

const SECTION_LABELS = {
  practical: "Practical basics",
  order: "Order & cleanliness",
  social: "Social energy & guests",
  rhythm: "Rhythm",
  money: "Money & conflict style",
  email: "Almost there",
  success: "All set",
  result: "Your result",
};

// ---------------------------------------------------------------------------
// Screens — each has a section, a list of fields, and a flag for whether
// selecting an answer should auto-advance (single behavioral question) or
// wait for a Continue tap (grouped practical fields, multi-select, inputs).
// ---------------------------------------------------------------------------
const SCREENS = [
  { id: "intro", type: "intro" },

  {
    id: "p1", type: "question", section: "practical", autoAdvance: false,
    fields: [
      {
        id: "location", type: "chips-multi", question: "Where are you looking?",
        options: [{ label: "Amsterdam" }, { label: "Rotterdam" }, { label: "Utrecht" }, { label: "The Hague" }],
        other: { placeholder: "Somewhere else" },
      },
      {
        id: "budgetMax", type: "budget", question: "What's your max monthly budget?",
        prefix: "€", placeholder: "800",
        toggleLabel: "Bills included in that number?",
        toggleId: "billsIncluded",
      },
    ],
  },
  {
    id: "p2", type: "question", section: "practical", autoAdvance: false,
    fields: [
      {
        id: "moveInTiming", type: "chips-single", question: "When do you want to move in?",
        options: [
          { label: "ASAP, within 2 weeks" },
          { label: "Within a month" },
          { label: "1 to 3 months" },
          { label: "Just exploring for now" },
        ],
      },
      {
        id: "stayDuration", type: "chips-single", question: "How long are you looking to stay?",
        options: [
          { label: "Under 6 months" },
          { label: "6 to 12 months" },
          { label: "1 to 2 years" },
          { label: "Long-term, I'm open" },
        ],
      },
    ],
  },
  {
    id: "p3", type: "question", section: "practical", autoAdvance: false,
    fields: [
      {
        id: "roomType", type: "chips-single", question: "What kind of room are you after?",
        options: [
          { label: "Private room, shared bathroom" },
          { label: "Private room, ensuite" },
          { label: "Private room with kitchen access" },
          { label: "Open to a studio" },
          { label: "No preference" },
        ],
      },
      {
        id: "householdSizePref", type: "chips-single", question: "How many flatmates sounds right?",
        options: [
          { label: "Just one other person" },
          { label: "2 to 3 flatmates" },
          { label: "4+ people, house share energy" },
          { label: "No preference" },
        ],
      },
    ],
  },
  {
    id: "p4", type: "question", section: "practical", autoAdvance: false,
    fields: [
      {
        id: "pets", type: "chips-single", question: "Where do you stand on pets?",
        options: [
          { label: "I have a pet and need that to be okay", reveal: { placeholder: "What kind of pet?" } },
          { label: "I'm fine with pets" },
          { label: "I'd prefer pet-free" },
          { label: "Pet-free is a hard requirement (allergy)" },
        ],
      },
      {
        id: "smoking", type: "chips-single", question: "And smoking?",
        options: [
          { label: "I smoke and want that to be okay" },
          { label: "I don't smoke but I'm fine with others" },
          { label: "I'd prefer smoke-free" },
          { label: "Smoke-free is a hard requirement" },
        ],
      },
    ],
  },
  {
    id: "p5", type: "question", section: "practical", autoAdvance: false,
    fields: [
      {
        id: "situation", type: "chips-single", question: "What's your situation right now?",
        options: [
          { label: "Student" },
          { label: "Working professional" },
          { label: "Freelancer or self-employed" },
          { label: "Between jobs or relocating" },
        ],
      },
      {
        id: "incomeProof", type: "chips-single", question: "Can you show proof of income if asked?",
        options: [
          { label: "Yes, payslips or a guarantor" },
          { label: "Income only" },
          { label: "Guarantor only" },
          { label: "Not currently" },
        ],
      },
    ],
  },
  {
    id: "p6", type: "question", section: "practical", autoAdvance: false,
    fields: [
      {
        id: "languages", type: "chips-multi", question: "What languages do you speak day to day?",
        options: [{ label: "Dutch" }, { label: "English" }],
        other: { placeholder: "Another language" },
      },
    ],
  },

  q1("a1", "order", "The bathroom needs cleaning. When does that actually happen?", [
    { label: "Same day, if it's dirty", points: 4 },
    { label: "On a weekly schedule", points: 4 },
    { label: "Every 2 to 3 weeks", points: 2 },
    { label: "When someone mentions it", points: 1 },
    { label: "Someone else handles it", points: 0 },
  ]),
  q1("a2", "order", "Dishes after you eat. What's the real timeline?", [
    { label: "Immediately", points: 4 },
    { label: "Same day, a few hours later", points: 3 },
    { label: "Can sit overnight", points: 2 },
    { label: "A multi-day pile is normal", points: 0 },
  ]),
  q1("a3", "order", "Your bedroom, most days. Which one's closest?", [
    { label: "Bed made, floor clear", points: 4 },
    { label: "Lived-in, but no floor mess", points: 3 },
    { label: "Some stuff around", points: 2 },
    { label: "Organized chaos", points: 1 },
  ]),
  q1("a4", "order", "You just finished cooking. What happens to the counters?", [
    { label: "Wiped down every time", points: 4 },
    { label: "Usually", points: 3 },
    { label: "Only if it's really messy", points: 1 },
    { label: "Not really my job", points: 0 },
  ]),

  q1("b1", "social", "How often do friends come over to your place?", [
    { label: "Multiple times a week", points: 4 },
    { label: "About weekly", points: 3 },
    { label: "Every few weeks", points: 1 },
    { label: "Rarely", points: 0 },
  ]),
  q1("b2", "social", "A flatmate's partner or friend wants to stay over for a couple of nights. How does that feel?", [
    { label: "Totally normal", points: 4 },
    { label: "Fine occasionally", points: 2 },
    { label: "I'd prefer it stayed rare", points: 1 },
    { label: "Basically never", points: 0 },
  ]),
  q1("b3", "social", "Someone suggests a spontaneous house dinner tonight. What's your instinct?", [
    { label: "Yes, love it", points: 4 },
    { label: "Depends on my energy", points: 2 },
    { label: "I'd probably pass", points: 1 },
    { label: "I'd rather it wasn't expected", points: 0 },
  ]),
  q1("b4", "social", "There's a house group chat. How do you engage with it?", [
    { label: "Love it", points: 4 },
    { label: "Fine, I react sometimes", points: 2 },
    { label: "I'd prefer logistics-only", points: 1 },
    { label: "I'd mute it", points: 0 },
  ]),
  q1("b5", "social", "You get home after a long day. What's the first move?", [
    { label: "Straight to the living room", points: 3 },
    { label: "Depends on the day", points: 2 },
    { label: "Straight to my room", points: 0 },
  ]),

  q1("c1", "rhythm", "When are you loudest, most yourself?", [
    { label: "Early morning" },
    { label: "Daytime" },
    { label: "Evening" },
    { label: "Late night" },
  ]),
  q1("c2", "rhythm", "What time do you actually wake up most days?", [
    { label: "Before 7" },
    { label: "7 to 9" },
    { label: "9 to 11" },
    { label: "No fixed time" },
  ]),

  q1("d1", "money", "A shared bill is overdue. What do you do?", [
    { label: "Message about it right away" },
    { label: "Wait a few days" },
    { label: "Just pay it and mention it later" },
    { label: "Wait for someone else to bring it up" },
  ]),
  q1("d2", "money", "Something small is bugging you about a flatmate. What's your move?", [
    { label: "Bring it up directly" },
    { label: "Drop a light hint" },
    { label: "Let it go unless it becomes a pattern" },
    { label: "Say nothing, even if it gets under my skin" },
  ]),

  { id: "email", type: "email", section: "email" },
  { id: "success", type: "success", section: "success" },
  { id: "result", type: "result", section: "result" },
];

function q1(id, section, question, options) {
  return {
    id, type: "question", section, autoAdvance: true,
    fields: [{ id, type: "chips-single", question, options }],
  };
}

// Flat lookup of every field by id, and the ordered list of the 24 scored
// spec questions (used for the "Question X of 24" progress readout).
const FIELD_BY_ID = {};
SCREENS.forEach((screen) => (screen.fields || []).forEach((f) => (FIELD_BY_ID[f.id] = f)));
const PROGRESS_FIELD_IDS = [
  "location", "budgetMax", "moveInTiming", "stayDuration", "roomType", "householdSizePref",
  "pets", "smoking", "situation", "incomeProof", "languages",
  "a1", "a2", "a3", "a4", "b1", "b2", "b3", "b4", "b5", "c1", "c2", "d1", "d2",
];
const TOTAL_QUESTIONS = PROGRESS_FIELD_IDS.length;

// ---------------------------------------------------------------------------
// Result content
// ---------------------------------------------------------------------------
const RESULTS = {
  anchor: {
    title: "The Anchor",
    accent: "var(--color-forest)",
    icon: iconAnchor,
    blurb: "Keeps the house running and the group chat alive. Cleans on a schedule, hosts often, notices when something's off before it becomes a problem.",
    greatWith: "people who want a home that feels lived-in and cared for.",
    worthKnowing: "can come across as intense to flatmates who want more privacy or a looser vibe.",
  },
  curator: {
    title: "The Curator",
    accent: "var(--color-midnight-violet)",
    icon: iconCurator,
    blurb: "Keeps things quiet and pristine, respects boundaries, isn't looking to build a house friend group.",
    greatWith: "people who want calm, order, and low social overhead.",
    worthKnowing: "might read as distant to flatmates hoping for more warmth or spontaneity.",
  },
  connector: {
    title: "The Connector",
    accent: "var(--color-ember)",
    icon: iconConnector,
    blurb: "Easygoing about mess, brings the energy, the one who makes a random Tuesday feel social.",
    greatWith: "people who want a warm, low-pressure, social house.",
    worthKnowing: "cleanliness standards can clash with flatmates who need more order to feel comfortable.",
  },
  freeSpirit: {
    title: "The Free Spirit",
    accent: "#c4479a",
    icon: iconFreeSpirit,
    blurb: "Low-maintenance, does their own thing, genuinely unbothered by clutter or house drama.",
    greatWith: "people who want minimal friction and minimal expectations.",
    worthKnowing: "can feel checked-out to flatmates hoping for more shared house life.",
  },
  balancer: {
    title: "The Balancer",
    accent: "var(--color-primary-indigo)",
    icon: iconBalancer,
    blurb: "Adapts to whoever they're living with, moderately tidy, moderately social, flexes to the house's tone.",
    greatWith: "almost anyone, which is exactly the point.",
    worthKnowing: "can be harder to read since there's no strong default, pairs well with someone who has a clearer style.",
  },
};

function iconAnchor() {
  return '<svg width="36" height="36" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v13M6 13a6 6 0 0012 0M4 13h3M17 13h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
}
function iconCurator() {
  return '<svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>';
}
function iconConnector() {
  return '<svg width="36" height="36" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="12" r="5" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="12" r="5" stroke="currentColor" stroke-width="1.8"/></svg>';
}
function iconFreeSpirit() {
  return '<svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M3 9c3-4 6-4 9 0s6 4 9 0M3 15c3-4 6-4 9 0s6 4 9 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
}
function iconBalancer() {
  return '<svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M5 8h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="5" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><circle cx="19" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>';
}

// Flavor-sentence phrase banks, parallel to the c1/c2/d1/d2 option order above.
const CHRONO_PHRASES = ["an early morning person", "steady through the day, no big peaks", "an evening person who comes alive after dinner", "a night owl"];
const WAKE_PHRASES = ["before 7am", "between 7 and 9", "closer to 9 or 11", "whenever, no fixed schedule"];
const MONEY_PHRASES = ["sort it out fast", "get to it eventually", "just handle it quietly", "aren't usually first to chase it"];
const CONFLICT_PHRASES = ["deal with it head-on", "nudge instead of confronting", "let small stuff slide", "keep it in until it builds up"];

function phraseFor(fieldId, bank, answers) {
  const field = FIELD_BY_ID[fieldId];
  const idx = field.options.findIndex((o) => o.label === answers[fieldId]);
  return bank[idx] ?? bank[bank.length - 1];
}

function buildFlavorSentence(answers) {
  const chrono = phraseFor("c1", CHRONO_PHRASES, answers);
  const wake = phraseFor("c2", WAKE_PHRASES, answers);
  const conflict = phraseFor("d2", CONFLICT_PHRASES, answers);
  const money = phraseFor("d1", MONEY_PHRASES, answers);
  return `You're ${chrono}, usually up ${wake}. When something's off, you ${conflict}, and money-wise, you ${money}.`;
}

function pointsFor(fieldId, answers) {
  const field = FIELD_BY_ID[fieldId];
  const opt = field.options.find((o) => o.label === answers[fieldId]);
  return (opt && opt.points) || 0;
}

function computeResult(answers) {
  const orderScore = ["a1", "a2", "a3", "a4"].reduce((sum, id) => sum + pointsFor(id, answers), 0);
  const socialScore = ["b1", "b2", "b3", "b4", "b5"].reduce((sum, id) => sum + pointsFor(id, answers), 0);

  const orderTier = orderScore >= 12 ? "Structured" : orderScore >= 6 ? "Balanced" : "Relaxed";
  const socialTier = socialScore >= 13 ? "Communal" : socialScore >= 6 ? "Balanced" : "Independent";

  let type = "balancer";
  if (orderTier === "Balanced" && socialTier === "Balanced") type = "balancer";
  else if (orderTier === "Structured" && socialTier === "Communal") type = "anchor";
  else if (orderTier === "Structured" && socialTier !== "Communal") type = "curator";
  else if (orderTier === "Relaxed" && socialTier === "Communal") type = "connector";
  else if (orderTier === "Relaxed" && socialTier !== "Communal") type = "freeSpirit";

  return {
    type,
    orderScore, socialScore, orderTier, socialTier,
    flavorSentence: buildFlavorSentence(answers),
  };
}

// ---------------------------------------------------------------------------
// State + navigation
// ---------------------------------------------------------------------------
const state = {
  screenIndex: 0,
  direction: 1,
  answers: {},
  result: null,
  role: new URLSearchParams(location.search).get("role"),
};

const shellEl = document.getElementById("quiz-shell");
const stageEl = document.getElementById("quiz-stage");
const backBtn = document.getElementById("quiz-back");
const progressTrack = document.getElementById("quiz-progress-track");
const progressFill = document.getElementById("quiz-progress-fill");
const progressLabel = document.getElementById("quiz-progress-label");

function currentScreen() {
  return SCREENS[state.screenIndex];
}

function goTo(index, direction) {
  state.direction = direction;
  state.screenIndex = index;
  renderScreen();
}

function next() {
  const idx = state.screenIndex + 1;
  if (idx >= SCREENS.length) return;
  goTo(idx, 1);
}

function back() {
  if (state.screenIndex <= 0) return;
  goTo(state.screenIndex - 1, -1);
}

function retake() {
  state.answers = {};
  state.result = null;
  goTo(0, -1);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function renderScreen() {
  const screen = currentScreen();
  const accent = ACCENTS[screen.section] || ACCENTS.practical;
  shellEl.style.setProperty("--quiz-accent", accent);
  shellEl.style.setProperty("--quiz-shift", state.direction < 0 ? "-14px" : "14px");

  updateTopbar(screen);

  stageEl.innerHTML = "";
  const el = document.createElement("div");
  el.className = "quiz-screen";
  el.innerHTML = buildScreenHTML(screen);
  stageEl.appendChild(el);
  bindScreenEvents(el, screen);
  refreshContinueButton(el, screen);

  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-visible")));

  const firstInput = el.querySelector("input[type='email'], input[type='number']");
  if (firstInput && screen.type !== "question") firstInput.focus({ preventScroll: true });
}

function updateTopbar(screen) {
  backBtn.hidden = screen.id === "intro";

  if (screen.type === "question") {
    const firstFieldId = screen.fields[0].id;
    const qIndex = PROGRESS_FIELD_IDS.indexOf(firstFieldId);
    const qNumber = qIndex + 1;
    progressTrack.hidden = false;
    progressLabel.hidden = false;
    progressFill.style.width = `${Math.round((qNumber / TOTAL_QUESTIONS) * 100)}%`;
    progressLabel.textContent = `Question ${qNumber} of ${TOTAL_QUESTIONS} · ${SECTION_LABELS[screen.section]}`;
  } else if (screen.id === "email") {
    progressTrack.hidden = false;
    progressLabel.hidden = false;
    progressFill.style.width = "100%";
    progressLabel.textContent = "Last step";
  } else {
    progressTrack.hidden = true;
    progressLabel.hidden = true;
  }
}

function buildScreenHTML(screen) {
  if (screen.id === "intro") return buildIntroHTML();
  if (screen.id === "email") return buildEmailHTML();
  if (screen.id === "success") return buildSuccessHTML();
  if (screen.id === "result") return buildResultHTML();
  return buildQuestionHTML(screen);
}

function buildIntroHTML() {
  return `
    <div class="quiz-intro">
      <span class="quiz-intro-badge">A quick, honest quiz</span>
      <h1 class="quiz-intro-heading">What kind of flatmate are you, really?</h1>
      <p class="quiz-intro-sub">Answer honestly, not aspirationally. It's how we find people who'll actually fit with you.</p>
      <p class="quiz-intro-meta">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        Takes about 3 minutes
      </p>
      <div class="quiz-intro-actions">
        <button type="button" class="btn btn-primary btn-lg" data-action="start">Start the quiz</button>
      </div>
    </div>
  `;
}

function buildQuestionHTML(screen) {
  const fieldsHTML = screen.fields.map(buildFieldHTML).join("");
  return `
    <span class="quiz-section-label">${SECTION_LABELS[screen.section]}</span>
    <div class="quiz-fields">${fieldsHTML}</div>
    ${screen.autoAdvance ? "" : buildFooterHTML("Continue")}
  `;
}

function buildFieldHTML(field) {
  if (field.type === "budget") return buildBudgetFieldHTML(field);

  const isMulti = field.type === "chips-multi";
  const questionMarkup = screenHasSingleField(field)
    ? `<p class="quiz-question">${field.question}</p>`
    : `<p class="quiz-field-label">${field.question}</p>`;

  const optionsHTML = field.options.map((opt, i) => buildOptionHTML(field, opt, i)).join("");
  const otherHTML = field.other
    ? buildOtherInputHTML(field, isMulti)
    : "";
  const stackClass = isMulti ? "" : "quiz-options--stack";

  return `
    <div class="quiz-field" data-field="${field.id}">
      ${questionMarkup}
      <div class="quiz-options ${stackClass}" role="group">${optionsHTML}</div>
      ${otherHTML}
    </div>
  `;
}

function screenHasSingleField(field) {
  const screen = currentScreen();
  return !!screen.fields && screen.fields.length === 1 && screen.fields[0].id === field.id;
}

function buildOptionHTML(field, opt, index) {
  const isMulti = field.type === "chips-multi";
  const selected = isMulti
    ? (state.answers[field.id] || []).includes(opt.label)
    : state.answers[field.id] === opt.label;
  const revealHTML = opt.reveal && selected
    ? `<input type="text" class="quiz-text-input quiz-option-other-input" data-detail-for="${field.id}" placeholder="${opt.reveal.placeholder}" value="${escapeAttr(state.answers[field.id + "Detail"] || "")}" />`
    : "";
  return `
    <button type="button" class="quiz-option ${isMulti ? "quiz-option--multi" : ""} ${selected ? "is-selected" : ""}"
      data-action="${isMulti ? "toggle-multi" : "select-single"}" data-field="${field.id}" data-value="${escapeAttr(opt.label)}" data-index="${index}">
      <span class="quiz-option-check" aria-hidden="true"></span>
      <span>${opt.label}</span>
    </button>
    ${revealHTML}
  `;
}

function buildOtherInputHTML(field, isMulti) {
  const isOtherSelected = isMulti
    ? (state.answers[field.id] || []).includes("Other")
    : state.answers[field.id] === "Other";
  const label = "Other";
  const selectedClass = isOtherSelected ? "is-selected" : "";
  const inputHTML = isOtherSelected
    ? `<input type="text" class="quiz-text-input quiz-option-other-input" data-detail-for="${field.id}" placeholder="${field.other.placeholder}" value="${escapeAttr(state.answers[field.id + "Detail"] || "")}" />`
    : "";
  return `
    <button type="button" class="quiz-option ${isMulti ? "quiz-option--multi" : ""} ${selectedClass}"
      data-action="${isMulti ? "toggle-multi" : "select-single"}" data-field="${field.id}" data-value="${label}">
      <span class="quiz-option-check" aria-hidden="true"></span>
      <span>Other</span>
    </button>
    ${inputHTML}
  `;
}

function buildBudgetFieldHTML(field) {
  const value = state.answers[field.id];
  const toggleValue = state.answers[field.toggleId];
  return `
    <div class="quiz-field" data-field="${field.id}">
      <p class="quiz-field-label">${field.question}</p>
      <div class="quiz-number-wrap">
        <span class="quiz-number-prefix">${field.prefix}</span>
        <input type="number" inputmode="numeric" min="0" class="quiz-number-input" data-number-for="${field.id}"
          placeholder="${field.placeholder}" value="${value != null ? value : ""}" />
      </div>
      <p class="quiz-field-label">${field.toggleLabel}</p>
      <div class="quiz-options">
        ${["Yes", "No"].map((label) => `
          <button type="button" class="quiz-option ${toggleValue === label ? "is-selected" : ""}" data-action="select-single" data-field="${field.toggleId}" data-value="${label}"
            aria-pressed="${toggleValue === label}">
            <span class="quiz-option-check" aria-hidden="true"></span>
            <span>${label}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function buildFooterHTML(label) {
  return `
    <div class="quiz-footer">
      <button type="button" class="quiz-continue" data-action="continue" disabled>${label}</button>
    </div>
  `;
}

function buildEmailHTML() {
  const value = state.answers.email || "";
  return `
    <span class="quiz-section-label">${SECTION_LABELS.email}</span>
    <p class="quiz-question">Where should we send your result and matches?</p>
    <div class="quiz-fields">
      <div class="quiz-field">
        <input type="email" class="quiz-text-input" id="quiz-email-input" placeholder="you@email.com" value="${escapeAttr(value)}" autocomplete="email" />
        <p class="quiz-email-note">We promise not to spam you. We'll only ever email you about your matches, nothing else.</p>
      </div>
    </div>
    <div class="quiz-footer">
      <button type="button" class="quiz-continue" data-action="submit-email" ${isValidEmail(value) ? "" : "disabled"}>Finish the quiz</button>
    </div>
  `;
}

function buildSuccessHTML() {
  return `
    <div class="quiz-intro">
      <div class="quiz-success-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h1 class="quiz-intro-heading">You're all set.</h1>
      <p class="quiz-intro-sub">Your quiz is in. We're matching you with people who actually fit your answers, and we'll email you the moment we've got someone.</p>
      <div class="quiz-intro-actions">
        <button type="button" class="btn btn-primary btn-lg" data-action="advance">See my flatmate type</button>
      </div>
    </div>
  `;
}

function buildResultHTML() {
  const result = state.result;
  const content = RESULTS[result.type];
  return `
    <div class="quiz-result">
      <div class="quiz-result-icon" style="background:${content.accent}">${content.icon()}</div>
      <span class="quiz-result-kicker">Your flatmate type</span>
      <h1 class="quiz-result-title">${content.title}</h1>
      <p class="quiz-result-blurb">${content.blurb}</p>

      <div class="quiz-result-card">
        <div class="quiz-result-row">
          <span class="quiz-result-row-label">Great with</span>
          <p class="quiz-result-row-text">${content.greatWith}</p>
        </div>
        <div class="quiz-result-row">
          <span class="quiz-result-row-label">Worth knowing</span>
          <p class="quiz-result-row-text">${content.worthKnowing}</p>
        </div>
        <p class="quiz-result-flavor">${result.flavorSentence}</p>
      </div>

      <p class="quiz-result-status" id="quiz-result-status">${state.submitStatus || "Saving your answers…"}</p>

      <div class="quiz-result-support">
        <p class="quiz-result-support-eyebrow">Help us build this</p>
        <p class="quiz-result-support-text">A small pledge gets you early access and first pick of matches when we launch.</p>
        <a href="${QUIZ_CONFIG.backUsUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-lg">Back us for €3</a>
      </div>

      <div class="quiz-result-actions">
        <button type="button" class="btn btn-outline btn-lg" data-action="share">Share your result</button>
      </div>
      <button type="button" class="quiz-result-retake" data-action="retake">Retake the quiz</button>
    </div>
  `;
}

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// ---------------------------------------------------------------------------
// Interaction handling
// ---------------------------------------------------------------------------
function bindScreenEvents(container, screen) {
  container.addEventListener("click", (e) => handleClick(e, container, screen));
  container.addEventListener("input", (e) => handleInput(e, container, screen));
}

function handleClick(e, container, screen) {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.getAttribute("data-action");

  if (action === "start") return next();
  if (action === "advance") return next();
  if (action === "continue") return next();
  if (action === "retake") return retake();
  if (action === "share") return handleShare();
  if (action === "submit-email") return handleEmailSubmit(container);

  if (action === "select-single") {
    const fieldId = target.getAttribute("data-field");
    const value = target.getAttribute("data-value");
    state.answers[fieldId] = value;
    const field = FIELD_BY_ID[fieldId];
    const hasReveal = field && field.options && field.options.some((o) => o.reveal);
    rerenderField(container, screen, fieldId, hasReveal || field && field.other);
    refreshContinueButton(container, screen);
    if (screen.autoAdvance) {
      window.setTimeout(() => next(), 320);
    }
    return;
  }

  if (action === "toggle-multi") {
    const fieldId = target.getAttribute("data-field");
    const value = target.getAttribute("data-value");
    const current = state.answers[fieldId] || [];
    const idx = current.indexOf(value);
    if (idx === -1) current.push(value);
    else current.splice(idx, 1);
    state.answers[fieldId] = current;
    rerenderField(container, screen, fieldId, true);
    refreshContinueButton(container, screen);
    return;
  }
}

function rerenderField(container, screen, fieldId, needsFullRerender) {
  if (!needsFullRerender) {
    // simple single-select without a reveal: just toggle classes in place.
    // Query by the button's own data-field (not a wrapper) so this also
    // covers the budget screen's Yes/No toggle, which has no .quiz-field of
    // its own — it lives inside the budgetMax field's wrapper.
    container.querySelectorAll(`[data-action="select-single"][data-field="${fieldId}"]`).forEach((btn) => {
      const isSelected = btn.getAttribute("data-value") === state.answers[fieldId];
      btn.classList.toggle("is-selected", isSelected);
    });
    return;
  }
  const field = FIELD_BY_ID[fieldId];
  const fieldEl = container.querySelector(`.quiz-field[data-field="${fieldId}"]`);
  if (fieldEl) fieldEl.outerHTML = field.type === "budget" ? buildBudgetFieldHTML(field) : buildFieldHTML(field);
}

function handleInput(e, container, screen) {
  const numberFor = e.target.getAttribute("data-number-for");
  if (numberFor) {
    const num = e.target.value === "" ? undefined : Number(e.target.value);
    state.answers[numberFor] = num;
    refreshContinueButton(container, screen);
    return;
  }
  const detailFor = e.target.getAttribute("data-detail-for");
  if (detailFor) {
    state.answers[detailFor + "Detail"] = e.target.value;
    return;
  }
}

function refreshContinueButton(container, screen) {
  const btn = container.querySelector("[data-action='continue']");
  if (btn) btn.disabled = !validateScreen(screen);
}

function validateScreen(screen) {
  if (!screen.fields) return true;
  return screen.fields.every((field) => isFieldAnswered(field));
}

function isFieldAnswered(field) {
  if (field.type === "budget") {
    const val = state.answers[field.id];
    return typeof val === "number" && !isNaN(val) && val > 0 && state.answers[field.toggleId] !== undefined;
  }
  if (field.type === "chips-multi") {
    return Array.isArray(state.answers[field.id]) && state.answers[field.id].length > 0;
  }
  return state.answers[field.id] !== undefined;
}

function handleEmailSubmit(container) {
  const input = document.getElementById("quiz-email-input");
  state.answers.email = input.value.trim();
  state.result = computeResult(state.answers);
  next();
  submitQuizResult();
}

function handleShare() {
  const content = RESULTS[state.result.type];
  const text = `I'm ${content.title} on Roomie's flatmate quiz. What kind of flatmate are you?`;
  const url = location.origin + location.pathname.replace(/quiz\.html$/, "");
  if (navigator.share) {
    navigator.share({ title: "Roomie flatmate quiz", text, url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(`${text} ${url}`).then(() => {
      const status = document.getElementById("quiz-result-status");
      if (status) status.textContent = "Copied! Paste it anywhere.";
    });
  }
}

// bind the email screen's own listeners (separate from question screens since
// it needs its own live-validation on the email input)
function attachEmailValidation() {
  document.addEventListener("input", (e) => {
    if (e.target.id !== "quiz-email-input") return;
    const btn = document.querySelector("[data-action='submit-email']");
    if (btn) btn.disabled = !isValidEmail(e.target.value);
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// ---------------------------------------------------------------------------
// Submission — saved locally first, then forwarded to the matching webhook
// (see QUIZ_CONFIG at the top) if one has been configured.
//
// This runs while the success screen is showing (submission happens right
// after email capture, but the result screen with #quiz-result-status isn't
// rendered until the user taps through). So the outcome is kept on
// state.submitStatus and read by buildResultHTML when it renders — the DOM
// update below is a bonus for the rare case a slow webhook is still pending
// once the user gets there.
// ---------------------------------------------------------------------------
async function submitQuizResult() {
  const record = {
    role: state.role || null,
    answers: state.answers,
    result: state.result,
    submittedAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem("roomie_quiz_submissions") || "[]");
    existing.push(record);
    localStorage.setItem("roomie_quiz_submissions", JSON.stringify(existing));
  } catch (err) {
    // localStorage unavailable (private mode, storage full) — nothing to do locally.
  }

  const applyStatus = (message) => {
    state.submitStatus = message;
    const statusEl = document.getElementById("quiz-result-status");
    if (statusEl) statusEl.textContent = message;
  };

  if (!QUIZ_CONFIG.webhookUrl) {
    applyStatus("You're on the list. We'll email you when we have matches.");
    return;
  }

  try {
    await fetch(QUIZ_CONFIG.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
      keepalive: true,
    });
    applyStatus("You're on the list. We'll email you when we have matches.");
  } catch (err) {
    console.warn("Roomie quiz: could not reach the matching webhook, answers are saved locally.", err);
    applyStatus("Saved on this device. We'll email you when we have matches.");
  }
}

// ---------------------------------------------------------------------------
// Global nav handlers + boot
// ---------------------------------------------------------------------------
backBtn.addEventListener("click", back);
attachEmailValidation();
renderScreen();
