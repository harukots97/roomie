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
// CONFIG — same shape as js/quiz.js. Drop the real matching webhook in here
// once it exists; until then everything is saved to the shared
// "roomie_quiz_submissions" localStorage key, distinguished by role.
// ---------------------------------------------------------------------------
const QUIZ_CONFIG = {
  webhookUrl: "",
};

// ---------------------------------------------------------------------------
// Section 0 — The Apartment (not scored, hard filters + listing data)
// One screen per numbered spec item (some items bundle a few short fields,
// e.g. room details or building details, exactly as grouped in the spec).
// ---------------------------------------------------------------------------
const APARTMENT_SCREENS = [
  {
    id: "o1", type: "question", section: "apartment", autoAdvance: false,
    fields: [
      { id: "location", type: "text", question: "Where's the place?", placeholder: "e.g. Amsterdam, De Pijp" },
    ],
  },
  {
    id: "o2", type: "question", section: "apartment", autoAdvance: false,
    fields: [
      {
        id: "rentAmount", type: "numberToggle", question: "What's the monthly rent?",
        prefix: "€", placeholder: "800",
        toggleLabel: "Bills included in that number?",
        toggleId: "billsIncluded",
        conditional: {
          id: "utilitiesEstimate", label: "Roughly how much are utilities?",
          prefix: "€", placeholder: "100", showWhenToggleIs: "No",
        },
      },
    ],
  },
  {
    id: "o3", type: "question", section: "apartment", autoAdvance: false,
    fields: [
      {
        id: "deposit", type: "numberOrNone", question: "What's the deposit?",
        prefix: "€", placeholder: "1000", noneFlagId: "noDeposit", noneLabel: "No deposit",
      },
      {
        id: "availableFrom", type: "chips-single", question: "When's it available from?",
        options: [
          { label: "ASAP" },
          { label: "Within a month" },
          { label: "Specific date", reveal: { type: "date", placeholder: "" } },
        ],
      },
    ],
  },
  {
    id: "o4", type: "question", section: "apartment", autoAdvance: false,
    fields: [
      {
        id: "stayDurationOffered", type: "chips-single", question: "Is there a minimum stay?",
        options: [
          { label: "No minimum, flexible" },
          { label: "Minimum 6 months" },
          { label: "Minimum 1 year" },
          { label: "Fixed end date" },
        ],
      },
    ],
  },
  {
    id: "o5", type: "question", section: "apartment", autoAdvance: false,
    fields: [
      { id: "roomSizeM2", type: "number", question: "How big is the room?", suffix: "m²", placeholder: "14" },
      {
        id: "furnishedStatus", type: "chips-single", question: "Furnished?",
        options: [{ label: "Furnished" }, { label: "Unfurnished" }, { label: "Partially furnished" }],
      },
      { id: "privateBathroom", type: "toggle", question: "Private bathroom?" },
      { id: "privateOutdoorSpace", type: "toggle", question: "Private outdoor space?" },
    ],
  },
  {
    id: "o6", type: "question", section: "apartment", autoAdvance: false,
    fields: [
      {
        id: "buildingType", type: "chips-single", question: "What kind of building?",
        options: [{ label: "Apartment" }, { label: "House" }],
      },
      { id: "floorNumber", type: "number", question: "Which floor?", placeholder: "2" },
      { id: "hasElevator", type: "toggle", question: "Elevator in the building?" },
      { id: "hasSharedOutdoorSpace", type: "toggle", question: "Shared outdoor space?" },
    ],
  },
  {
    id: "o7", type: "question", section: "apartment", autoAdvance: false,
    fields: [
      {
        id: "amenities", type: "chips-multi", question: "What's included?",
        options: [
          { label: "Washing machine" }, { label: "Dishwasher" }, { label: "Bike storage" },
          { label: "Parking" }, { label: "High-speed internet included" },
          { label: "Communal outdoor space" }, { label: "Other" },
        ],
      },
    ],
  },
  {
    id: "o8", type: "question", section: "apartment", autoAdvance: false,
    fields: [
      { id: "currentFlatmateCount", type: "number", question: "How many flatmates are there right now?", placeholder: "2" },
      { id: "householdAgeRange", type: "text", question: "Rough age range of the household?", placeholder: "e.g. 24 to 30", optional: true },
      { id: "householdVibe", type: "text", question: "Describe the household vibe in one line.", placeholder: "e.g. Chill, mostly keep to ourselves" },
    ],
  },
  {
    id: "o9", type: "question", section: "apartment", autoAdvance: false,
    fields: [
      {
        id: "hasPets", type: "chips-single", question: "Any pets in the house?",
        options: [
          { label: "Yes", reveal: { placeholder: "What kind of pet?" } },
          { label: "No" },
        ],
      },
      {
        id: "smokingPolicy", type: "chips-single", question: "What's the smoking policy?",
        options: [
          { label: "Smokes indoors okay" },
          { label: "Smokes outside or on the balcony only" },
          { label: "Smoke-free household" },
        ],
      },
    ],
  },
];

const APARTMENT_PROGRESS_IDS = [
  "location", "rentAmount", "deposit", "availableFrom", "stayDurationOffered",
  "roomSizeM2", "buildingType", "amenities", "currentFlatmateCount", "hasPets", "smokingPolicy",
];

// ---------------------------------------------------------------------------
// Photo step — no upload backend exists yet, so this is the instructional
// fallback: point people to Instagram DMs instead of a dead-end file input.
// ---------------------------------------------------------------------------
const PHOTO_SCREEN = {
  id: "photos", type: "photo", section: "photos",
  heading: "Add some real photos.",
  body: "Real photos get real matches. Send yours to <strong>@roomie.nl</strong> on Instagram along with your name or quiz confirmation number, and we'll add them to your listing.",
  ctaLabel: "Continue",
  progressPercent: 30,
  progressLabel: "Add your photos",
};

// ---------------------------------------------------------------------------
// Section E — What You're Looking For (not scored into the provider's own
// type, used as matching preferences against seekers)
// ---------------------------------------------------------------------------
const LOOKING_FOR_SCREENS = [
  {
    id: "e1", type: "question", section: "lookingFor", autoAdvance: false,
    fields: [
      {
        id: "tidinessPreference", type: "chips-single", question: "How tidy does your next flatmate need to be?",
        options: [
          { label: "Needs to be structured" }, { label: "Balanced is fine" },
          { label: "Relaxed is fine too" }, { label: "Any is fine" },
        ],
      },
      {
        id: "socialPreference", type: "chips-single", question: "What social energy are you after?",
        options: [{ label: "Communal" }, { label: "Balanced" }, { label: "Independent" }, { label: "Open to any" }],
      },
    ],
  },
  {
    id: "e2", type: "question", section: "lookingFor", autoAdvance: false,
    fields: [
      {
        id: "petOpenness", type: "chips-single", question: "How open are you to a flatmate with a pet?",
        options: [
          { label: "Yes, no issue" }, { label: "Depends on the pet or size" },
          { label: "Prefer not" }, { label: "Hard no" },
        ],
      },
      {
        id: "smokingOpenness", type: "chips-single", question: "And a flatmate who smokes?",
        options: [
          { label: "Yes, indoors fine" }, { label: "Yes, outside only" },
          { label: "Prefer a non-smoker" }, { label: "Hard requirement: non-smoker" },
        ],
      },
    ],
  },
  {
    id: "e3", type: "question", section: "lookingFor", autoAdvance: false,
    fields: [
      { id: "agePreference", type: "text", question: "Any age range in mind?", placeholder: "e.g. 22 to 30", optional: true },
      {
        id: "employmentPreference", type: "chips-single", question: "Any preference on their situation?",
        options: [{ label: "Student" }, { label: "Working professional" }, { label: "Freelancer" }, { label: "No preference" }],
      },
    ],
  },
  {
    id: "e4", type: "question", section: "lookingFor", autoAdvance: false,
    fields: [
      {
        id: "languageRequirement", type: "chips-multi", question: "Any language requirement?",
        options: [{ label: "Dutch" }, { label: "English" }, { label: "Other" }, { label: "No requirement" }],
      },
      {
        id: "dealbreakers", type: "textarea", question: "Any dealbreakers?",
        placeholder: "Optional, one or two lines is plenty",
        note: "This is used for matching only. It's never shown on the public listing.",
        optional: true,
      },
    ],
  },
];

const LOOKING_FOR_PROGRESS_IDS = [
  "tidinessPreference", "socialPreference", "petOpenness", "smokingOpenness",
  "agePreference", "employmentPreference", "languageRequirement", "dealbreakers",
];

// ---------------------------------------------------------------------------
// Section F — Current House Rules & Dynamics (not scored, surfaced to
// matched seekers later as context, not used for the provider's own type)
// ---------------------------------------------------------------------------
const HOUSE_RULES_SCREENS = [
  {
    id: "f1", type: "question", section: "houseRules", autoAdvance: false,
    fields: [
      { id: "quietHours", type: "text", question: "Are there quiet hours?", placeholder: "e.g. None, or after 11pm on weekdays" },
      { id: "guestPolicy", type: "text", question: "What's the guest policy?", placeholder: "e.g. Anytime is fine, just give a heads up" },
    ],
  },
  {
    id: "f2", type: "question", section: "houseRules", autoAdvance: false,
    fields: [
      {
        id: "billSplitting", type: "chips-single", question: "How are bills split?",
        options: [{ label: "Equal split" }, { label: "Usage-based" }, { label: "Informal, case by case" }, { label: "Other" }],
      },
      {
        id: "choreSystem", type: "chips-single", question: "How do chores get done?",
        options: [{ label: "Rotating schedule" }, { label: "Everyone handles their own mess" }, { label: "Informal" }, { label: "Other" }],
      },
    ],
  },
];

const HOUSE_RULES_PROGRESS_IDS = ["quietHours", "guestPolicy", "billSplitting", "choreSystem"];

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------
const SCREENS = [
  { id: "intro", type: "intro" },
  ...APARTMENT_SCREENS,
  PHOTO_SCREEN,
  ...BEHAVIORAL_SCREENS,
  ...LOOKING_FOR_SCREENS,
  ...HOUSE_RULES_SCREENS,
  { id: "email", type: "email", section: "email" },
  { id: "success", type: "success", section: "success" },
  { id: "result", type: "result", section: "result" },
];

const ACCENTS = {
  default: "var(--color-primary-indigo)",
  apartment: "var(--color-primary-indigo)",
  photos: "var(--color-primary-indigo)",
  ...BEHAVIORAL_ACCENTS,
  lookingFor: "var(--color-primary-indigo)",
  houseRules: "var(--color-primary-indigo)",
  email: "var(--color-primary-indigo)",
  success: "var(--color-primary-indigo)",
  result: "var(--color-primary-indigo)",
};

const SECTION_LABELS = {
  apartment: "The Apartment",
  photos: "Photos",
  ...BEHAVIORAL_SECTION_LABELS,
  lookingFor: "What you're looking for",
  houseRules: "House rules",
  email: "Almost there",
  success: "All set",
  result: "Your result",
};

const PROGRESS_FIELD_IDS = [
  ...APARTMENT_PROGRESS_IDS,
  ...BEHAVIORAL_QUESTION_IDS,
  ...LOOKING_FOR_PROGRESS_IDS,
  ...HOUSE_RULES_PROGRESS_IDS,
];

createQuizApp({
  screens: SCREENS,
  accents: ACCENTS,
  sectionLabels: SECTION_LABELS,
  progressFieldIds: PROGRESS_FIELD_IDS,
  computeResult,

  onSubmit: (answers, result) =>
    submitQuizResponse({ webhookUrl: QUIZ_CONFIG.webhookUrl, role: "provider", answers, result }),

  intro: {
    badge: "A quick, honest quiz",
    heading: "What's your place, and you, really like?",
    sub: "Tell us about the room and your own habits, honestly. It's how we match you with someone who actually fits.",
    meta: "Takes about 5 minutes",
    ctaLabel: "Start the quiz",
  },

  email: {
    sectionLabel: "Almost there",
    question: "Where should we send your matches?",
    note: "We promise not to spam you. We'll only ever email you about your matches, nothing else.",
    buttonLabel: "Finish the quiz",
  },

  success: {
    heading: "Your listing is in.",
    sub: "We're matching your place with seekers whose answers actually fit your household. We'll email you the moment we've got someone good.",
    ctaLabel: "See my flatmate type",
  },

  result: {
    kicker: "Your flatmate type",
    resultsContent: RESULTS,
    shareLabel: "Share your result",
    retakeLabel: "Retake the quiz",
    shareText: (content) => `My place matches with ${content.title} flatmates on Roomie's quiz. What kind of flatmate are you?`,
    extraHTML: () => `
      <div class="quiz-result-support">
        <p class="quiz-result-support-eyebrow">Your listing is live</p>
        <p class="quiz-result-support-text">We're matching it with seekers now. You'll hear from us by email as soon as we've got a good fit.</p>
        <a href="index.html#how-it-works" class="btn btn-primary btn-lg">See how matching works</a>
      </div>
    `,
  },
});
