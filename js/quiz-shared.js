// ---------------------------------------------------------------------------
// Shared between the seeker quiz (quiz.js) and the provider quiz
// (quiz-provider.js): the Order & Cleanliness / Social Energy / Rhythm /
// Money & Conflict question set, the scoring formula, and the five result
// outcomes. Both quizzes import this module rather than redefining any of
// it, so a seeker's and a provider's flatmate type are always computed the
// exact same way and stay comparable for matching.
//
// Do not fork this file per quiz. If a question's wording, option order, or
// point values need to change, change it here once.
// ---------------------------------------------------------------------------

export function q1(id, section, question, options) {
  return {
    id, type: "question", section, autoAdvance: true,
    fields: [{ id, type: "chips-single", question, options }],
  };
}

export const BEHAVIORAL_SCREENS = [
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
];

export const BEHAVIORAL_ACCENTS = {
  order: "var(--color-forest)",
  social: "var(--color-ember)",
  rhythm: "#c4479a",
  money: "var(--color-midnight-violet)",
};

export const BEHAVIORAL_SECTION_LABELS = {
  order: "Order & cleanliness",
  social: "Social energy & guests",
  rhythm: "Rhythm",
  money: "Money & conflict style",
};

// Flat lookup of the shared behavioral fields by id, used by scoring and by
// the flavor-sentence generator. Each quiz merges this into its own full
// field lookup (which also has its quiz-specific fields).
export const BEHAVIORAL_FIELD_BY_ID = {};
BEHAVIORAL_SCREENS.forEach((screen) => screen.fields.forEach((f) => (BEHAVIORAL_FIELD_BY_ID[f.id] = f)));

export const BEHAVIORAL_QUESTION_IDS = [
  "a1", "a2", "a3", "a4", "b1", "b2", "b3", "b4", "b5", "c1", "c2", "d1", "d2",
];

// ---------------------------------------------------------------------------
// Result content — five outcomes, identical for seeker and provider.
// ---------------------------------------------------------------------------
export const RESULTS = {
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

// ---------------------------------------------------------------------------
// Flavor-sentence phrase banks, parallel to the c1/c2/d1/d2 option order
// above, plus the scoring formula.
// ---------------------------------------------------------------------------
const CHRONO_PHRASES = ["an early morning person", "steady through the day, no big peaks", "an evening person who comes alive after dinner", "a night owl"];
const WAKE_PHRASES = ["before 7am", "between 7 and 9", "closer to 9 or 11", "whenever, no fixed schedule"];
const MONEY_PHRASES = ["sort it out fast", "get to it eventually", "just handle it quietly", "aren't usually first to chase it"];
const CONFLICT_PHRASES = ["deal with it head-on", "nudge instead of confronting", "let small stuff slide", "keep it in until it builds up"];

function phraseFor(fieldId, bank, answers) {
  const field = BEHAVIORAL_FIELD_BY_ID[fieldId];
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
  const field = BEHAVIORAL_FIELD_BY_ID[fieldId];
  const opt = field.options.find((o) => o.label === answers[fieldId]);
  return (opt && opt.points) || 0;
}

// The single scoring implementation shared by both quizzes. Given the same
// a1-d2 answers, this always returns the same order/social scores and type,
// regardless of which quiz (or anything else) called it.
export function computeResult(answers) {
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
// Shared submission helper — both quizzes save to the same localStorage key
// and (optionally) the same configurable webhook, distinguished by `role`.
// See each quiz's own QUIZ_CONFIG for the webhook URL.
// ---------------------------------------------------------------------------
export async function submitQuizResponse({ webhookUrl, role, answers, result }) {
  const record = {
    role,
    answers,
    result,
    submittedAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem("roomie_quiz_submissions") || "[]");
    existing.push(record);
    localStorage.setItem("roomie_quiz_submissions", JSON.stringify(existing));
  } catch (err) {
    // localStorage unavailable (private mode, storage full) — nothing to do locally.
  }

  if (!webhookUrl) {
    return { ok: true, message: "You're on the list. We'll email you when we have matches." };
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
      keepalive: true,
    });
    return { ok: true, message: "You're on the list. We'll email you when we have matches." };
  } catch (err) {
    console.warn("Roomie quiz: could not reach the matching webhook, answers are saved locally.", err);
    return { ok: false, message: "Saved on this device. We'll email you when we have matches." };
  }
}
