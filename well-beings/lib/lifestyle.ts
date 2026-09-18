import { ChoiceOption, Profile, Question } from "./types";
import { COMPANION_NAME } from "./site";

/**
 * The lifestyle half of Wellbeings, and the thing that makes it a different
 * product from Psych Screener rather than a smaller copy of it.
 *
 * Before this file existed, the check-in was built almost entirely out of
 * clinical mental-health instruments — PHQ-9, GAD-7, AUDIT-C — plus sleep.
 * That is a mental-health screen, which is precisely the job the companion
 * app already does properly and in six languages. What was missing was
 * everything Wellbeings is actually for: whether you move, whether you eat at
 * something like regular times, whether you see anyone, whether any part of
 * the week is genuinely yours, whether the room you sleep in works, and
 * whether any of it feels like it is for something.
 *
 * Two conventions hold across everything below, and both matter:
 *
 *   1. Every item is scored so that HIGHER MEANS MORE STRAIN, matching
 *      sleepQual and workload, which already worked that way. Mixing
 *      directions inside one scale is how a snapshot ends up quietly
 *      recommending the opposite of what someone reported.
 *
 *   2. Nothing here is a validated instrument and the file does not pretend
 *      otherwise. These are plain questions about ordinary life, and what
 *      comes out is a way of ordering someone's own answers — not a
 *      measurement of health, not a percentage, and not a diagnosis of
 *      anything. The wording of every interpretation below is hedged on
 *      purpose.
 */

/** How much of the check-in someone opted into. Quick is a genuine snapshot;
    detailed adds the deeper follow-ups and the optional instruments. */
export type Depth = "quick" | "detailed";

export interface LifestyleAnswers {
  /** Days a week with 30+ minutes of moderate activity. 0 = 5 or more. */
  move?: number;
  /** How close to regular the day's meals are. */
  meals?: number;
  /** Whether thirst is being noticed and acted on. Detailed only. */
  hydrate?: number;
  /** Meaningful contact with another person, not counting scrolling. */
  social?: number;
  /** Evening screen use as a wind-down replacement. Detailed only. */
  screenEve?: number;
  /** Whether any part of the week is genuinely the person's own. */
  recovery?: number;
  /** Whether the physical space supports sleeping and working. Detailed only. */
  environment?: number;
  /** Whether the week feels like it is for something. Detailed only. */
  purpose?: number;
}

const never4: ChoiceOption[] = [
  { label: "Most days", value: 0 },
  { label: "A few times a week", value: 1 },
  { label: "Occasionally", value: 2 },
  { label: "Rarely or never", value: 3 },
];

/**
 * The questions themselves.
 *
 * `quick` marks the ones that run in both depths. Everything else is offered
 * only in the detailed check, which is what keeps the quick version to
 * something a person will actually finish in one sitting.
 */
export const LIFESTYLE_QUESTIONS: (Question & { quick: boolean })[] = [
  {
    id: "move",
    section: "Life",
    quick: true,
    type: "choice",
    text: "How many days in a normal week do you move for half an hour or more? Walking counts, and so does anything that leaves you slightly out of breath.",
    why: "Movement has the widest evidence base of anything in this check-in, and the biggest single gain in that research is between doing almost nothing and doing something, not between four sessions and five.",
    opts: [
      { label: "5 or more", value: 0 },
      { label: "3 or 4", value: 1 },
      { label: "1 or 2", value: 2 },
      { label: "Basically none", value: 3 },
    ],
  },
  {
    id: "meals",
    section: "Life",
    quick: true,
    type: "choice",
    text: "Do you eat at roughly regular times, or does it depend on the day?",
    why: "For most people whose eating is disrupted rather than unhealthy, the pattern matters more than what is on the plate. Long gaps are what produce the afternoon crash people usually blame on sleep.",
    opts: [
      { label: "Fairly regular times", value: 0 },
      { label: "Regular on weekdays, not weekends", value: 1 },
      { label: "Whenever I get a chance", value: 2 },
      { label: "I skip meals a lot", value: 3 },
    ],
  },
  {
    id: "social",
    section: "Life",
    quick: true,
    type: "choice",
    text: "How often do you talk properly with someone, meaning a real conversation rather than a group chat?",
    why: "Connection is usually the first thing a heavy week deletes, and the one people do not notice losing until it has been gone a while. It is asked separately from mood because the two come apart: plenty of people feel fine and are still quite alone.",
    opts: never4,
  },
  {
    id: "recovery",
    section: "Life",
    quick: true,
    type: "choice",
    text: "Is there any part of your week that is genuinely yours? Not work, not study, not chores, and not unstarted work you are avoiding.",
    why: "Recovery research separates four kinds of time off, and they do not substitute for each other. “Free time” that is really unstarted work does none of the four jobs.",
    opts: [
      { label: "Yes, most weeks", value: 0 },
      { label: "Some weeks", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "No, not really", value: 3 },
    ],
  },
  {
    id: "hydrate",
    section: "Life",
    quick: false,
    type: "choice",
    text: "Do you usually drink something before you notice you are thirsty?",
    why: "Thirst is a late signal rather than an early one. This is deliberately not the eight-glasses rule, which has no strong evidence behind it.",
    opts: [
      { label: "Usually, water is nearby", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Only when I notice", value: 2 },
      { label: "I go most of the day without", value: 3 },
    ],
  },
  {
    id: "screenEve",
    section: "Life",
    quick: false,
    type: "choice",
    text: "In the last hour before bed, are you usually on a screen?",
    why: "Asked about the evening specifically rather than about total screen time. Hours per day tells you very little; what the screen is replacing at 11pm tells you quite a lot.",
    opts: [
      { label: "Rarely, I do something else", value: 0 },
      { label: "Some nights", value: 1 },
      { label: "Most nights", value: 2 },
      { label: "Every night, right up to sleep", value: 3 },
    ],
  },
  {
    id: "environment",
    section: "Life",
    quick: false,
    type: "choice",
    text: "Do you have somewhere that actually works for sleeping, and somewhere that works for focusing?",
    why: "This one is about circumstances rather than choices. If the answer is no, several recommendations further down would be useless advice, and the read-out says so instead of repeating them.",
    opts: [
      { label: "Both are fine", value: 0 },
      { label: "One of them is a problem", value: 1 },
      { label: "Both are difficult", value: 2 },
      { label: "I share a space with no real control over it", value: 3 },
    ],
  },
  {
    id: "purpose",
    section: "Life",
    quick: false,
    type: "choice",
    text: "Setting aside whether the week went well, does what you spend it on feel like it is for something?",
    why: "A week can be perfectly organised and still feel pointless, and that shows up in wellbeing separately from mood or workload. It is here because a plan that raises your output without touching this tends not to help.",
    opts: [
      { label: "Yes, mostly", value: 0 },
      { label: "Some of it does", value: 1 },
      { label: "Not really", value: 2 },
      { label: "No, and that bothers me", value: 3 },
    ],
  },
];

export function lifestyleQuestionsFor(depth: Depth): Question[] {
  // `quick` is a selector on this list, not part of the Question shape the
  // flow consumes, so it is stripped rather than carried through.
  return LIFESTYLE_QUESTIONS.filter((q) => depth === "detailed" || q.quick).map((q) => {
    const rest: Question = {
      id: q.id,
      section: q.section,
      type: q.type,
      text: q.text,
      why: q.why,
      opts: q.opts,
    };
    return rest;
  });
}

/* ── The snapshot ──────────────────────────────────────────────────────── */

/** Four categories the read-out keeps apart, because collapsing them is how a
    wellbeing tool ends up sounding like a clinician. */
export interface DomainRead {
  id: string;
  label: string;
  /** 0 steady · 1 worth a look · 2 under strain · 3 the loudest thing here. */
  strain: number;
  /** What the person reported, with no interpretation added at all. */
  observation: string;
  /** What that pattern MAY suggest. Always hedged — a questionnaire does not
      know anyone's circumstances. */
  interpretation: string;
  /** Sized to be doable today, this week, and over a couple of months. */
  actions: { now: string; week: string; longer: string };
  /** Set only where a professional, not a habit change, is the right next
      step. Kept in its own field so it can never be rendered as a tip. */
  medical?: string;
}

const band = (n: number | undefined): number => (n === undefined ? 0 : Math.min(3, Math.max(0, n)));

/**
 * Turns a scored profile into ordered domain reads.
 *
 * Only domains that were actually asked about appear. A quick check produces
 * fewer reads than a detailed one and says so, rather than silently filling
 * the gaps with assumptions and presenting the result as equally complete.
 */
export function buildSnapshot(p: Profile): DomainRead[] {
  const reads: DomainRead[] = [];

  /* Sleep — strain comes from the existing sleepScore, which already folds in
     hours, regularity, quality and (where asked) latency and phone-in-bed. */
  const sleepStrain = p.sleepBad ? 3 : p.sleepWatch ? 2 : p.sleepReg >= 1 ? 1 : 0;
  reads.push({
    id: "sleep",
    label: "Sleep",
    strain: sleepStrain,
    observation: `You said you get about ${p.sleepHours} hours, ${
      p.sleepReg === 0 ? "at consistent times" : p.sleepReg === 1 ? "consistent on weekdays but drifting at weekends" : "at times that change a lot"
    }, and that you wake up restored ${
      ["most mornings", "some mornings", "rarely", "basically never"][band(p.sleepQual)]
    }.`,
    interpretation:
      sleepStrain >= 2
        ? "Sleep looks like the area most likely to be holding other things down. Timing is the part with the strongest evidence behind it: in a seven-year cohort of 79,666 people, regular sleep timing tracked with substantially lower risk of depression, and hitting the recommended hours did not make up for an irregular schedule."
        : sleepStrain === 1
          ? "Sleep looks broadly workable, with some drift at the edges. That drift is worth noticing because regularity appears to matter more than total hours, but this is not the area to start with."
          : "Nothing here suggests sleep is the problem, which is worth knowing. It means effort is better spent elsewhere.",
    actions: {
      now: "Tonight, put your phone to charge somewhere you cannot reach from the bed.",
      week: "Pick one wake time and keep it within about 30 minutes every day, weekends included. Get daylight within half an hour of waking.",
      longer: "Let bedtime settle earlier on its own once the wake time is fixed. Forcing an early bedtime usually just adds an hour of lying awake.",
    },
    medical:
      p.sleepBad && band(p.sleepQual) >= 2
        ? "Waking unrefreshed most mornings despite enough time in bed is worth raising with a GP. Insomnia and sleep apnoea are both treatable and neither is identified by a questionnaire."
        : undefined,
  });

  if (p.move !== undefined) {
    const s = band(p.move);
    reads.push({
      id: "movement",
      label: "Movement",
      strain: s,
      observation: `You said you move for half an hour or more on ${
        ["5 or more days", "3 or 4 days", "1 or 2 days", "basically no days"][s]
      } in a normal week.`,
      interpretation:
        s >= 2
          ? "This is the area where the research supports the largest change for the least effort, mostly because the biggest gain sits between doing almost nothing and doing something. In trials with 12 to 25 year olds, regular activity lifted low mood by roughly as much as front-line treatments. Worth saying plainly: that is a statement about averages, not a promise about you."
          : s === 1
            ? "You are already moving enough for most of the benefit. More is fine, but adding sessions is a smaller gain than what you have already got."
            : "Movement is not the gap here.",
      actions: {
        now: "Walk for ten minutes today, outdoors if you can. That is the whole task.",
        week: "Put two sessions in the calendar with a time attached, rather than an intention to go when you feel like it.",
        longer: "Build toward roughly 150 minutes a week of anything that makes you breathe harder. Attach it to something already fixed in your day so it does not need deciding.",
      },
    });
  }

  if (p.meals !== undefined || p.hydrate !== undefined) {
    const s = Math.max(band(p.meals), band(p.hydrate) - 1);
    reads.push({
      id: "food",
      label: "Food and drink",
      strain: s,
      observation: [
        p.meals !== undefined &&
          `You said your meals are ${
            ["at fairly regular times", "regular on weekdays but not weekends", "whenever you get a chance", "often skipped"][band(p.meals)]
          }.`,
        p.hydrate !== undefined &&
          `On drinking, you said ${
            ["water is usually nearby", "you drink sometimes", "you drink only when you notice thirst", "you go most of the day without"][band(p.hydrate)]
          }.`,
      ]
        .filter(Boolean)
        .join(" "),
      interpretation:
        s >= 2
          ? "Long gaps without eating are a common and easily missed cause of the mid-afternoon drop that usually gets blamed on sleep or motivation. This is about timing rather than what you eat, and it is not a comment on your diet."
          : s === 1
            ? "The weekday pattern is holding and the weekend is looser. That is normal and only worth attention if the weekend drift is costing you Monday."
            : "Eating and drinking look steady enough not to be the limiting factor.",
      actions: {
        now: "Put something you can eat without preparing into your bag or your desk drawer.",
        week: "Anchor one meal to a fixed point in the day that already exists, rather than to hunger.",
        longer: "Aim not to go more than about five or six waking hours without eating. Keep water within reach of wherever you work.",
      },
      medical:
        band(p.meals) >= 3
          ? "Wellbeings does not assess eating disorders and is the wrong tool for it. If food, eating or your body takes up a lot of your thinking, or eating is followed by guilt or compensating, please speak to a GP or a dedicated service."
          : undefined,
    });
  }

  if (p.social !== undefined) {
    const s = band(p.social);
    reads.push({
      id: "connection",
      label: "Connection",
      strain: s,
      observation: `You said you have a real conversation with someone ${
        ["most days", "a few times a week", "occasionally", "rarely or never"][s]
      }.`,
      interpretation:
        s >= 2
          ? "Contact tends to be the first thing a heavy period quietly removes, and it rarely feels like a decision at the time. It is worth treating as something to schedule rather than something that will happen on its own once things calm down."
          : s === 1
            ? "There is contact in your week without much slack in it. Worth protecting rather than building."
            : "Connection looks like one of your steadier areas.",
      actions: {
        now: "Message one person today and propose something specific, with a day in it.",
        week: "Put one social thing in the week on purpose, the same way you would a deadline.",
        longer: "Pair it with something else you are already doing. A walk with someone does two of these jobs at once.",
      },
    });
  }

  if (p.recovery !== undefined || p.bo.length) {
    const s = Math.max(band(p.recovery), p.boHigh ? 3 : p.boWatch ? 2 : 0);
    reads.push({
      id: "recovery",
      label: "Stress and recovery",
      strain: s,
      observation: [
        p.recovery !== undefined &&
          `You said part of the week is genuinely yours ${
            ["most weeks", "some weeks", "rarely", "not really"][band(p.recovery)]
          }.`,
        `On switching off, your answers about feeling drained, detached and unable to stop thinking about work put you ${
          p.boHigh ? "high" : p.boWatch ? "in the middle" : "low"
        } on that pattern.`,
      ]
        .filter(Boolean)
        .join(" "),
      interpretation:
        s >= 2
          ? "Not being able to mentally stop is a stronger predictor of exhaustion in the research than the number of hours worked, which is more hopeful than it sounds: stopping is trainable and hours often are not. The loop is worth naming, because it compounds. A heavy load makes switching off harder, and not switching off makes the same load feel heavier."
          : s === 1
            ? "There is some recovery in your week, though not much margin. The thing to watch is whether it is all one kind of rest."
            : "You appear to be getting genuine time off, which is doing more work than it gets credit for.",
      actions: {
        now: "Pick an end time for today and write tomorrow's first task in one line before you stop.",
        week: "Protect one block that is not work, not chores and not unstarted work you are avoiding.",
        longer: "Vary the kind of rest: switching off, relaxing, learning something unrelated, and having control over your own time are four different things and they do not substitute for each other.",
      },
    });
  }

  if (p.overloaded) {
    reads.push({
      id: "load",
      label: "Workload",
      strain: (p.workload || 0) >= 3 ? 3 : 2,
      observation: `You described a typical week as ${(p.workload || 0) >= 3 ? "crushing" : "overloaded"}.`,
      interpretation:
        "When the load genuinely does not fit, no technique on this page outruns it. Recovery advice given to someone in that position tends to land as one more thing they are failing at. The honest first move is subtraction from the calendar rather than a better system.",
      actions: {
        now: "Write down everything you are currently committed to. Just the list.",
        week: "Mark the two lowest-value items and drop, shrink or defer one of them.",
        longer: "Keep the freed slot rather than refilling it. If nothing on the list can move, that is worth saying out loud to someone who can change it.",
      },
    });
  }

  if (p.environment !== undefined && band(p.environment) >= 1) {
    const s = band(p.environment);
    reads.push({
      id: "environment",
      label: "Your space",
      strain: s,
      observation: `On somewhere to sleep and somewhere to focus, you said ${
        ["both are fine", "one of them is a problem", "both are difficult", "you share a space with little control over it"][s]
      }.`,
      interpretation:
        "This is circumstance rather than habit, and it changes which of the other suggestions are realistic. Advice about wind-down routines and protected deep work assumes a room you control, and it is not useful to repeat it when that is not the situation.",
      actions: {
        now: "Change one small thing you do control: an eye mask, earplugs, moving the charger, a different chair.",
        week: "Find one place outside the space that works, such as a library, a quiet room or a café with a long table, and use it once.",
        longer: "If it is shared, a direct conversation about quiet hours is worth more than any trick here. If it is housing, your school, university or local council may have routes you have not been told about.",
      },
    });
  }

  if (p.purpose !== undefined && band(p.purpose) >= 1) {
    const s = band(p.purpose);
    reads.push({
      id: "purpose",
      label: "Direction",
      strain: s,
      observation: `You said what you spend the week on feels like it is for something ${
        ["mostly", "in part", "not really", "not at all, and it bothers you"][s]
      }.`,
      interpretation:
        "A week can be well organised and still feel pointless, and that shows up separately from mood or workload. This is the one area where a schedule change is unlikely to be the answer, so the suggestions below are smaller and slower on purpose.",
      actions: {
        now: "Write down one thing you did this week that you would have done even if nobody had asked.",
        week: "Give an hour to something in that direction, even if it goes nowhere.",
        longer: "This is usually a conversation rather than a task. Someone who knows you, a mentor, or a counsellor will get further with it than a plan will.",
      },
      medical:
        s >= 3
          ? "Feeling that nothing is for anything, for weeks at a time, can be part of low mood rather than a question about direction. If that fits, a proper mental-health screen is a better next step than a planning exercise."
          : undefined,
    });
  }

  if (p.screenEve !== undefined && band(p.screenEve) >= 2) {
    reads.push({
      id: "screens",
      label: "Evening screens",
      strain: band(p.screenEve) === 3 ? 2 : 1,
      observation: `You said you are on a screen in the last hour before bed ${
        ["rarely", "some nights", "most nights", "every night, right up to sleep"][band(p.screenEve)]
      }.`,
      interpretation:
        "Total screen time tells you very little. What the screen is replacing at 11pm tells you more, and here it appears to be occupying the wind-down rather than adding to it.",
      actions: {
        now: "Charge the phone out of arm's reach tonight.",
        week: "Pick one thing that is not a screen for the last twenty minutes, and do the same one each night so it becomes a cue.",
        longer: "The aim is a consistent wind-down, not a screen ban. A repeated ritual does more than the absence of a device.",
      },
    });
  }

  /* Mood and anxiety appear as a SIGNAL only, never as a rating. Wellbeings
     does not screen for either — the companion app does — and the read here
     is deliberately shallow and points somewhere better. */
  if (p.moodWatch || p.anxWatch || p.moodFlag || p.anxFlag) {
    reads.push({
      id: "mood",
      label: "Mood and worry",
      strain: p.moodFlag || p.anxFlag ? 3 : 2,
      observation:
        "The two mood questions and the two worry questions flagged rather than passing quietly.",
      interpretation:
        "Wellbeings asks two of each as a signal, not as a screen, and two items cannot tell you anything about whether something is going on. What it can do is say that this is worth looking at properly, which is a different tool's job.",
      actions: {
        now: "Nothing on this page is the right response to this one. Read the next line instead.",
        week: "If it has been most days for a couple of weeks, put a GP appointment in the diary. That is the step that changes the odds.",
        longer: "Keep the lifestyle changes going alongside. They help, and they are not a substitute.",
      },
      medical:
        `Some of what you have described may be worth exploring more specifically than a lifestyle check can. ${COMPANION_NAME} is the companion tool built for exactly that, and speaking with a GP or a counsellor is the step this app cannot replace. Wellbeings does not diagnose anything and nothing here is a diagnosis.`,
    });
  }

  if (p.auditWatch) {
    reads.push({
      id: "drinking",
      label: "Drinking",
      strain: p.auditFlag ? 2 : 1,
      observation: "Your answers on drinking were above the low-risk range this app uses.",
      interpretation:
        "This is a habits question here, not a verdict on anyone. The reason it appears in a wellbeing check at all is that alcohol lands on sleep before it lands anywhere else: it makes people fall asleep faster and sleep worse.",
      actions: {
        now: "Notice what the drink is doing: winding down, sleeping, or getting through the evening.",
        week: "Pick two evenings with none and see what the next mornings are like.",
        longer: "If it is the thing that ends the day, that is the part worth looking at rather than the units.",
      },
      medical: p.auditFlag
        ? "Your answers landed in the range where a GP or a counsellor can help you look at this properly. That is not a diagnosis and no number here has decided anything. It is the range this short screen is designed to catch early, when it is far easier to change."
        : undefined,
    });
  }

  /* Loudest first. Ties keep the order above, which runs roughly from the
     most changeable to the least, so two equal strains put the actionable one
     in front. */
  return reads.sort((a, b) => b.strain - a.strain);
}

/** The three the read-out leads with. Three because a list of ten is a list
    nobody acts on, and because the research on changing behaviour is
    consistent that one at a time is what actually works. */
export function topPriorities(reads: DomainRead[]): DomainRead[] {
  return reads.filter((r) => r.strain >= 1).slice(0, 3);
}

/** Every medical-concern line, deduplicated, in strain order. Rendered in its
    own block and never mixed into the suggestions. */
export function medicalNotes(reads: DomainRead[]): { label: string; note: string }[] {
  return reads.filter((r) => r.medical).map((r) => ({ label: r.label, note: r.medical! }));
}
