// ---------------------------------------------------------------------------
// Quiz content for both quizzes, plus the shared scoring that turns answers
// into a flatmate type. Copy, options and scores come from the design files.
//
// A quiz is a list of steps. Each step belongs to a section and holds one or
// more parts (questions). The seeker quiz has one part per step; the
// provider quiz groups several parts on some steps.
// ---------------------------------------------------------------------------

export const COLS = [
  { c: '#FF46B7', tint: '#FFE3F3', ink: '#B8006F' },
  { c: '#22B573', tint: '#DDF5E8', ink: '#0F7A4A' },
  { c: '#FFB21E', tint: '#FFF4C9', ink: '#8A5700' },
  { c: '#7B6CFF', tint: '#E6E3FF', ink: '#4B3DD6' },
  { c: '#2FA8F5', tint: '#DDF0FD', ink: '#0B6EAD' },
  { c: '#FF7A3D', tint: '#FFE6DA', ink: '#B23F00' },
  { c: '#14B8A6', tint: '#D5F5F1', ink: '#0B7A6E' }
];

const OT = 'Other';
const norm = o => Array.isArray(o) ? { l: o[0], s: o[1] } : typeof o === 'string' ? { l: o, s: 0 } : o;
const txt = (id, label, ph, x) => ({ id, type: 'text', label, ph, ...x });
const area = (id, label, ph, x) => ({ id, type: 'area', label, ph, ...x });
const num = (id, label, x) => ({ id, type: 'num', label, ...x });
const tog = (id, label) => ({ id, type: 'toggle', label });
const one = (id, label, opts, x) => ({ id, type: 'single', label, opts: opts.map(norm), ...x });
const many = (id, label, opts, x) => ({ id, type: 'multi', label, sub: 'Select all that apply.', opts: opts.map(norm), ...x });
const P = (sec, ...parts) => ({ sec, parts });

// Behaviour questions -------------------------------------------------------
// Shared by both quizzes; the result type is computed from these.
const BEHAV = [
  [1, one('clean1', "What's your cleaning style?", [['Little and often, whenever something looks dirty', 4], ['A fixed routine, same day every week', 4], ['A big clean every couple of weeks', 2], ['When it gets bad or someone mentions it', 1], ["I'd rather split the cost of a cleaner", 4]])],
  [1, one('clean2', "You've just eaten. You are in a rush. The dishes get washed…", [['Straight away, before I do anything else', 4], ['Same day, a few hours later', 3], ['Tomorrow, they can sit in the sink overnight', 2], ['When I finally have time and/or there are too many dishes in the sink', 0]])],
  [1, one('clean3', "The bin's full and it's not your turn. What do you do?", [["Take it out. Whose turn it is doesn't matter", 4], ['Take it out, and mention it to your roommates', 3], ["Tell whoever's turn it is", 2], ['Press it down so it fits a bit more', 1], ['I might not have noticed', 0]])],
  [1, one('clean4', 'The toilet brush is broken but it still works. Who should fix it?', [['What works is not broken.', 0], ['I order a new one.', 4], ['Who broke it?', 1], ['When the next toilet cleaning arrives, we will replace it', 3]])],
  [2, one('soc1', 'How often do friends come over to your place?', [['A few times a week', 4], ['About once a week', 3], ['Every couple of weeks', 2], ['Once a month or less', 1], ['Almost never', 0]])],
  [2, one('soc2', "A flatmate's partner or friend wants to stay for a couple of nights. How do you feel about it?", [['Totally fine, the more the merrier', 4], ["Fine, as long as it's not every week", 3], ['Okay once in a while, with a heads-up', 2], ["I'd rather it stayed rare", 1], ["I'd prefer no overnight guests", 0]])],
  [2, one('soc3', "Someone suggests a spontaneous house dinner tonight. What's your instinct?", [["I'm in", 4], ["Probably, if I'm not wiped out", 3], ['Depends on my mood', 2], ["I'd probably pass", 1], ["Shared dinners aren't really my thing", 0]])],
  [2, one('soc4', "There's a house group chat. How do you use it?", [['Memes, plans, random updates, all of it', 4], ['I chat now and then', 3], ['I mostly react and read', 2], ['Logistics only: bills, repairs, the bin', 1], ["I'd mute it", 0]])],
  [2, one('soc5', "You get home after a long day. What's your first move?", [["Living room or kitchen, see who's around", 4], ['Say hi, then head to my room', 3], ['Depends on the day', 2], ['Straight to my room', 0]])],
  [3, one('rh1', "It's 7:30 on a weekday. Where are you?", ['Already up and going', 'Just getting out of bed', 'Snoozing the alarm', 'Fast asleep', 'It changes a lot'])],
  [3, one('rh2', "It's 23:30 on a weeknight. Where are you?", ['Asleep', 'In bed, winding down', 'Still up, relaxing', 'Just getting started', 'It changes a lot'])],
  [4, one('money', 'A shared bill is overdue. What do you do?', ['Message the group about it right away', 'Pay it myself and sort out the split later', 'Give it a few days, then bring it up', 'Wait for someone else to mention it'])],
  [4, one('conflict', 'Something small about a flatmate is bugging you. What do you do?', ['Bring it up with them directly', 'Drop a light hint through a joke', 'Let it go, unless it keeps happening', "Say nothing, I choose peace: it's not the hill I want to die on"])]
].map(([sec, q]) => P(sec, q));

// Seeker -------------------------------------------------------------------
const SEEKER_STEPS = [
  P(0, many('loc', 'Where are you looking?', ['Amsterdam', 'Rotterdam', 'Utrecht', 'The Hague', 'Somewhere else'], { other: 'Somewhere else', ph: 'Which city?' })),
  P(0, { id: 'budget', type: 'budget', label: "What's your max monthly budget?" }),
  P(0, one('move', 'When do you want to move in?', ['ASAP, within 2 weeks', 'Within a month', 'In 1 to 3 months', 'Just exploring for now', OT], { other: OT })),
  P(0, one('stay', 'How long do you want to stay?', ['Under 6 months', '6 to 12 months', '1 to 2 years', "Long-term, I'm open", OT], { other: OT })),
  P(0, one('setup', 'What kind of setup are you looking for?', ['Private room, shared bathroom', 'Private room with my own bathroom', 'Studio or self-contained unit', 'No strong preference', OT], { other: OT })),
  P(0, one('mates', 'How many flatmates sounds right?', ['Just one other person', '2 to 3 flatmates', '4 or more, proper house share', 'No preference', OT], { other: OT })),
  P(0, one('pets', 'Where do you stand on pets?', ['I have a pet who would live with us', "I'm fine with pets", "I'd prefer pet-free", 'Pet-free is a must (e.g. allergy)', OT], { other: OT, extraOn: 'I have a pet who would live with us', extraPh: 'What kind of pet?' })),
  P(0, one('smoke', 'And smoking?', ['I smoke and would like to smoke in my house', "I don't smoke, but I'm fine with others smoking", 'Fine with smoking outside or on the balcony only', "I'd prefer smoke-free", 'Smoke-free is a must', OT], { other: OT })),
  P(0, one('situation', "What's your situation right now?", ["Bachelor's student", "Master's student", 'PhD student', 'Other student (exchange, vocational, language course)', 'Working professional', 'Freelancer or self-employed', 'Between jobs or relocating', OT], { other: OT })),
  P(0, one('income', 'Can you show proof of income if a landlord asks?', ['Yes, payslips or an employment contract', 'Yes, through a guarantor', 'Yes, proof of savings or a scholarship', 'Not yet', OT], { other: OT })),
  P(0, many('lang', 'What languages do you speak day to day?', ['Dutch', 'English', OT], { other: OT, ph: 'Which language(s)?' })),
  ...BEHAV
];

// Provider -----------------------------------------------------------------
const PROVIDER_STEPS = [
  P(0, txt('where', "Where's the place?", 'e.g. Amsterdam, De Pijp')),
  P(0, num('rent', "What's the monthly rent?", { prefix: '€', suffix: '/ month', ph: '750' }), tog('billsInc', 'Bills included?'),
    num('utilities', 'Roughly how much are utilities?', { prefix: '€', suffix: '/ month', ph: '120', showIf: qa => !(qa.billsInc || {}).on })),
  P(0, num('deposit', "What's the deposit?", { prefix: '€', ph: '1500', check: 'No deposit' }),
    one('avail', "When's it available from?", ['ASAP', 'Within a month', 'Specific date'], { extraOn: 'Specific date', extraType: 'date', extraPh: 'Pick a date' })),
  P(0, one('minstay', 'Is there a minimum stay?', ['No minimum, flexible', 'Minimum 6 months', 'Minimum 1 year', 'Fixed end date'], { extraOn: 'Fixed end date', extraType: 'date', extraPh: 'End date' })),
  P(0, num('roomSize', 'How big is the room?', { suffix: 'm²', ph: '14' }), one('furnished', 'Furnished?', ['Furnished', 'Unfurnished', 'Partially furnished']),
    tog('privBath', 'Private bathroom?'), tog('privOut', 'Private outdoor space?')),
  P(0, one('building', 'What kind of building?', ['Apartment', 'House']), num('floor', 'Which floor?', { suffix: 'floor', ph: '2', sub: 'Use 0 for the ground floor.' }),
    tog('lift', 'Elevator in the building?'), tog('sharedOut', 'Shared outdoor space?')),
  P(0, many('incl', "What's included?", ['Washing machine', 'Dishwasher', 'Bike storage', 'Parking', 'High-speed internet included', 'Communal outdoor space', OT], { other: OT })),
  P(0, num('mates', 'How many flatmates are there right now?', { suffix: 'flatmates', ph: '2' }),
    txt('hhAge', 'Rough age range of the household?', 'e.g. 24 to 30', { optional: true, sub: 'Optional.' }),
    txt('hhVibe', 'Describe the household vibe in one line.', 'e.g. Chill, mostly keep to ourselves')),
  P(0, one('hhPets', 'Any pets in the house?', ['Yes', 'No'], { extraOn: 'Yes', extraPh: 'What kind of pet?' }),
    one('hhSmoke', "What's the smoking policy?", ['Smokes indoors okay', 'Smokes outside or on the balcony only', 'Smoke-free household'])),
  { sec: 0, info: true, parts: [] },
  ...BEHAV,
  P(5, one('wTidy', 'How tidy does your next flatmate need to be?', ['Needs to be structured', 'Balanced is fine', 'Relaxed is fine too', 'Any is fine']),
    one('wSocial', 'What social energy are you after?', ['Communal', 'Independent', 'A bit of both', 'Open to any'])),
  P(5, one('wPets', 'How open are you to a flatmate with a pet?', ['Yes, no issue', 'Depends on the pet or size', 'Prefer not', 'Hard no']),
    one('wSmoke', 'And a flatmate who smokes?', ['Yes, indoors fine', 'Yes, outside only', 'Prefer a non-smoker', 'Hard requirement: non-smoker'])),
  P(5, txt('wAge', 'Any age range in mind?', 'e.g. 22 to 30', { optional: true, sub: 'Optional.' }),
    one('wSit', 'Any preference on their situation?', ["Bachelor's student", "Master's student", 'PhD student', 'Other student', 'Working professional', 'Freelancer or self-employed', 'No preference'])),
  P(5, many('wLang', 'Any language requirement?', ['Dutch', 'English', OT, { l: 'No requirement', s: 0, excl: true }], { other: OT, ph: 'Which language(s)?' }),
    area('deal', 'Any dealbreakers?', 'e.g. No drum practice at midnight', { optional: true, sub: 'Optional. Used for matching only, never shown on the public listing.' })),
  P(6, txt('quiet', 'Are there quiet hours?', 'e.g. None, or after 11pm on weekdays'), txt('guests', "What's the guest policy?", 'e.g. Anytime is fine, just give a heads up')),
  P(6, one('split', 'How are bills split?', ['Equal split', 'Usage-based', 'Informal, case by case', OT], { other: OT }),
    one('chores', 'How do chores get done?', ['Rotating schedule', 'Everyone handles their own mess', 'Informal', OT], { other: OT }))
];

function build(meta, steps) {
  const secs = meta.sections;
  steps = steps.map(s => ({ ...s })); // BEHAV steps are shared; number each quiz's own copies
  let n = 0;
  steps.forEach(s => { if (!s.info) s.num = ++n; });
  return {
    ...meta, steps, total: n,
    start: secs.map((_, i) => steps.findIndex(s => s.sec === i)),
    len: secs.map((_, i) => steps.filter(s => s.sec === i).length),
    count: secs.map((_, i) => steps.filter(s => s.sec === i && !s.info).length),
    allParts: steps.flatMap(s => s.parts)
  };
}

export const SEEKER = build({
  role: 'seeker',
  layout: 'single',
  sections: ['The basics', 'Order & cleanliness', 'Social energy & guests', 'Your rhythm', 'Money & conflict'],
  countWord: ['question', 'questions'],
  introImg: '/assets/c191.svg', introBg: '#FFE3F3',
  badge: 'A quick, honest quiz',
  title: 'What kind of flatmate are you, really?',
  sub: "Answer honestly, not aspirationally. It's how we find people who'll actually fit with you.",
  time: 'Takes about 3 minutes',
  emailTitle: 'Where should we send your result and matches?',
  okTitle: "You're all set.",
  okBody: "Your quiz is in. We're matching you with people who actually fit your answers, and we'll email you the moment we've got someone."
}, SEEKER_STEPS);

export const PROVIDER = build({
  role: 'provider',
  layout: 'parts',
  sections: ['The apartment', 'Order & cleanliness', 'Social energy & guests', 'Your rhythm', 'Money & conflict', "What you're looking for", 'House rules & dynamics'],
  countWord: ['step', 'steps'],
  introImg: '/assets/c188.svg', introBg: '#FFF4C9',
  badge: 'For people with a room',
  title: 'Tell us about your place, and about you.',
  sub: "First the room, then how you live, then who you're hoping to find. Honest answers get better matches.",
  time: 'Takes about 6 minutes',
  emailTitle: 'Where should we send your matches?',
  okTitle: 'Your listing is in.',
  okBody: "We're matching your place with seekers whose answers actually fit your household. We'll email you the moment we've got someone good."
}, PROVIDER_STEPS);

// Result types --------------------------------------------------------------
// c182, c183 and c66b from the design weren't in the handoff assets, so The
// Free Spirit, The Balancer and the success screen use stand-in characters.
export const TYPES = {
  anchor: { name: 'The Anchor', line: "Keeps the house running and the group chat alive. Cleans on a schedule, hosts often, notices when something's off before it becomes a problem.", great: 'People who want a home that feels lived-in and cared for.', know: 'Can come across as intense to flatmates who want more privacy or a looser vibe.', img: '/assets/c186.svg', bg: '#FFE3F3' },
  curator: { name: 'The Curator', line: "Keeps things quiet and pristine, respects boundaries, isn't looking to build a house friend group.", great: 'People who want calm, order, and low social overhead.', know: 'Might read as distant to flatmates hoping for more warmth or spontaneity.', img: '/assets/c184.svg', bg: '#E6E3FF' },
  connector: { name: 'The Connector', line: 'Easygoing about mess, brings the energy, the one who makes a random Tuesday feel social.', great: 'People who want a warm, low-pressure, social house.', know: 'Cleanliness standards can clash with flatmates who need more order to feel comfortable.', img: '/assets/c190.svg', bg: '#FFF4C9' },
  free: { name: 'The Free Spirit', line: 'Low-maintenance, does their own thing, genuinely unbothered by clutter or house drama.', great: 'People who want minimal friction and minimal expectations.', know: 'Can feel checked-out to flatmates hoping for more shared house life.', img: '/assets/c176.svg', bg: '#DDF5E8' },
  balancer: { name: 'The Balancer', line: "Adapts to whoever they're living with, moderately tidy, moderately social, flexes to the house's tone.", great: 'Almost anyone, which is exactly the point.', know: "Can be harder to read since there's no strong default, pairs well with someone who has a clearer style.", img: '/assets/c185.svg', bg: '#DDF0FD' }
};
export const SUCCESS_IMG = '/assets/c179.svg';

export function computeResult(quiz, qa) {
  const idx = id => {
    const p = quiz.allParts.find(x => x.id === id), a = qa[id];
    return p && a ? p.opts.findIndex(o => o.l === a.v) : -1;
  };
  const score = ids => ids.reduce((t, id) => {
    const p = quiz.allParts.find(x => x.id === id), i = idx(id);
    return t + (i >= 0 ? p.opts[i].s : 0);
  }, 0);
  const clean = score(['clean1', 'clean2', 'clean3', 'clean4']) / 16;
  const social = score(['soc1', 'soc2', 'soc3', 'soc4', 'soc5']) / 20;
  const order = clean >= .7 ? 'Structured' : clean <= .4 ? 'Relaxed' : 'Balanced';
  const soc = social >= .6 ? 'Communal' : social <= .35 ? 'Independent' : 'Balanced';
  const key = order === 'Balanced' || soc === 'Balanced' ? 'balancer'
    : order === 'Structured' ? (soc === 'Communal' ? 'anchor' : 'curator') : (soc === 'Communal' ? 'connector' : 'free');
  const a = idx('rh1'), b = idx('rh2');
  const traits = [b === 3 || (b === 2 && a >= 2) ? 'Night owl' : a === 0 || b === 0 ? 'Early bird' : 'Flexible rhythm'];
  const m = idx('money'), c = idx('conflict');
  if (m >= 0) traits.push(['Pays on the dot', 'Covers it first', 'Relaxed about bills', 'Lets others lead'][m]);
  if (c >= 0) traits.push(['Direct talker', 'Jokes it out', 'Picks their battles', 'Chooses peace'][c]);
  return { key, orderScore: clean, socialScore: social, orderTier: order, socialTier: soc, traits };
}

// Flatten answers into {id, question, answer} rows so the database export is
// readable without knowing the quiz structure.
export function summarize(quiz, qa) {
  const rows = [];
  quiz.steps.forEach(st => st.parts.forEach(p => {
    if (p.showIf && !p.showIf(qa)) return;
    const a = qa[p.id] || {};
    let ans = '';
    if (p.type === 'budget') ans = a.amount ? `€${a.amount}/month, bills ${a.bills ? 'included' : 'not included'}` : '';
    else if (p.type === 'toggle') ans = a.on ? 'Yes' : 'No';
    else if (p.type === 'num') ans = p.check && a.check ? p.check : (a.num ?? '');
    else if (p.type === 'text' || p.type === 'area') ans = (a.text || '').trim();
    else if (p.type === 'multi') ans = (a.v || []).map(v => v === p.other ? `${v}: ${(a.other || '').trim()}` : v).join('; ');
    else if (a.v) {
      ans = a.v;
      if (a.v === p.other) ans += `: ${(a.other || '').trim()}`;
      if (a.v === p.extraOn) ans += `: ${(a.extra || '').trim()}`;
    }
    rows.push({ id: p.id, question: p.label, answer: String(ans) });
  }));
  return rows;
}
