import { createQuizApp } from "./quiz-engine.js";
import {
  BEHAVIORAL_SCREENS,
  BEHAVIORAL_ACCENTS,
  BEHAVIORAL_SECTION_LABELS,
  BEHAVIORAL_QUESTION_IDS,
  RESULTS,
  computeResult,
  submitQuizResponse,
} from "./quiz-shared.js";

// ---------------------------------------------------------------------------
// CONFIG — webhookUrl points at this repo's own Vercel serverless function
// (api/submit-quiz.js), which writes into Vercel KV. Swap in a different
// endpoint here if matching ever moves off that. Until KV is connected in
// the Vercel dashboard, submissions are still saved in the browser under
// the "roomie_quiz_submissions" localStorage key, so nothing gets lost.
// ---------------------------------------------------------------------------
const QUIZ_CONFIG = {
  webhookUrl: "/api/submit-quiz",
  // Same €3 pledge link as the "Back us" section on index.html (CONFIG.stripe[3]
  // in js/script.js) — update both if the Stripe link ever changes.
  backUsUrl: "https://buy.stripe.com/00wbJ05OxcpZ8BH2gQgQE00",
};

// ---------------------------------------------------------------------------
// Section 0 — Practical basics (not scored, used as matching filters)
// ---------------------------------------------------------------------------
const PRACTICAL_SCREENS = [
  {
    id: "p1", type: "question", section: "practical", autoAdvance: false,
    fields: [
      {
        id: "location", type: "chips-multi", question: "Where are you looking?",
        options: [{ label: "Amsterdam" }, { label: "Rotterdam" }, { label: "Utrecht" }, { label: "The Hague" }],
        other: { placeholder: "Somewhere else" },
      },
      {
        id: "budgetMax", type: "numberToggle", question: "What's your max monthly budget?",
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
];

const SCREENS = [
  { id: "intro", type: "intro" },
  ...PRACTICAL_SCREENS,
  ...BEHAVIORAL_SCREENS,
  { id: "email", type: "email", section: "email" },
  { id: "success", type: "success", section: "success" },
  { id: "result", type: "result", section: "result" },
];

const ACCENTS = {
  default: "var(--color-primary-indigo)",
  practical: "var(--color-primary-indigo)",
  ...BEHAVIORAL_ACCENTS,
  email: "var(--color-primary-indigo)",
  success: "var(--color-primary-indigo)",
  result: "var(--color-primary-indigo)",
};

const SECTION_LABELS = {
  practical: "Practical basics",
  ...BEHAVIORAL_SECTION_LABELS,
  email: "Almost there",
  success: "All set",
  result: "Your result",
};

const PROGRESS_FIELD_IDS = [
  "location", "budgetMax", "moveInTiming", "stayDuration", "roomType", "householdSizePref",
  "pets", "smoking", "situation", "incomeProof", "languages",
  ...BEHAVIORAL_QUESTION_IDS,
];

createQuizApp({
  screens: SCREENS,
  accents: ACCENTS,
  sectionLabels: SECTION_LABELS,
  progressFieldIds: PROGRESS_FIELD_IDS,
  computeResult,

  onSubmit: (answers, result) =>
    submitQuizResponse({ webhookUrl: QUIZ_CONFIG.webhookUrl, role: "seeker", answers, result }),

  intro: {
    badge: "A quick, honest quiz",
    heading: "What kind of flatmate are you, really?",
    sub: "Answer honestly, not aspirationally. It's how we find people who'll actually fit with you.",
    meta: "Takes about 3 minutes",
    ctaLabel: "Start the quiz",
  },

  email: {
    sectionLabel: "Almost there",
    question: "Where should we send your result and matches?",
    note: "We promise not to spam you. We'll only ever email you about your matches, nothing else.",
    buttonLabel: "Finish the quiz",
  },

  success: {
    heading: "You're all set.",
    sub: "Your quiz is in. We're matching you with people who actually fit your answers, and we'll email you the moment we've got someone.",
    ctaLabel: "See my flatmate type",
  },

  result: {
    kicker: "Your flatmate type",
    resultsContent: RESULTS,
    shareLabel: "Share your result",
    retakeLabel: "Retake the quiz",
    shareText: (content) => `I'm ${content.title} on Roomie's flatmate quiz. What kind of flatmate are you?`,
    extraHTML: () => `
      <div class="quiz-result-support">
        <p class="quiz-result-support-eyebrow">Help us build this</p>
        <p class="quiz-result-support-text">A small pledge gets you early access and first pick of matches when we launch.</p>
        <a href="${QUIZ_CONFIG.backUsUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-lg">Back us for €3</a>
      </div>
    `,
  },
});
