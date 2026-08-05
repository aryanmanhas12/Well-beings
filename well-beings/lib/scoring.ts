import { Intervention, PlanIntensity, Profile, RawAnswers, ScheduleBlock } from "./types";

export const SCALE: [string, number][] = [
  ["Not at all", 0],
  ["Several days", 1],
  ["More than half the days", 2],
  ["Nearly every day", 3],
];

export const FREQ: [string, number][] = [
  ["Never", 0],
  ["Rarely", 1],
  ["Sometimes", 2],
  ["Often", 3],
  ["Almost always", 4],
];

const sum = (a: number[]) => a.reduce((x, y) => x + (y || 0), 0);

export function buildProfile(raw: RawAnswers): Profile {
  const phqScore = sum(raw.phq);
  const gadScore = sum(raw.gad);
  const boScore = sum(raw.bo);
  const auditScore = sum(raw.audit);
  const need = raw.age === "u16" || raw.age === "16-18" ? 9 : 8;
  const sleepFlag =
    (raw.sleepHours <= 6.5 ? 2 : raw.sleepHours <= 7.5 && need === 9 ? 1 : 0) +
    (raw.sleepReg || 0) +
    (raw.sleepQual >= 2 ? 2 : raw.sleepQual || 0) +
    ((raw.sleepLatency ?? 0) >= 3 ? 1 : 0) +
    ((raw.sleepScreens ?? 0) >= 3 ? 1 : 0);

  return {
    ...raw,
    phqScore,
    gadScore,
    boScore,
    need,
    sleepScore: Math.min(sleepFlag, 10),
    moodFlag: raw.phqExpanded ? phqScore >= 10 : false,
    moodWatch: raw.phqExpanded ? phqScore >= 5 : phqScore >= 2,
    anxFlag: raw.gadExpanded ? gadScore >= 10 : false,
    anxWatch: raw.gadExpanded ? gadScore >= 5 : gadScore >= 2,
    sleepBad: sleepFlag >= 4,
    sleepWatch: sleepFlag >= 2,
    boHigh: boScore >= 8,
    boWatch: boScore >= 5,
    overloaded: (raw.workload || 0) >= 2,
    auditScore,
    /* This app never asks sex, so it can't use the sex-specific AUDIT-C
       cutoffs (≥4 men / ≥3 women) some guidelines recommend. It uses a
       single youth-calibrated cutoff instead: ≥3 is the sensitivity-optimised
       threshold found in 12–19 year olds (Liskola et al., 2018), ≥6 sits at
       the higher end of cutoffs found across young-adult samples (Skogen et
       al., 2024). Less precise for some people — an honest tradeoff for
       asking for less. See the Evidence tab for both citations. */
    auditWatch: auditScore >= 3,
    auditFlag: auditScore >= 6,
  };
}

/** Formats a fractional 24h hour (e.g. 7.5) as "7:30 am". */
export function fmt(h: number): string {
  h = ((h % 24) + 24) % 24;
  const m = Math.round((h % 1) * 60);
  const hh = Math.floor(h);
  const ap = hh >= 12 ? "pm" : "am";
  const h12 = ((hh + 11) % 12) + 1;
  return h12 + (m ? ":" + String(m).padStart(2, "0") : ":00") + " " + ap;
}

/** Local-date key (YYYY-MM-DD) offset by `offset` days from today. */
export function dateKey(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function buildSchedule(p: Profile, intensity: PlanIntensity): ScheduleBlock[] {
  const wake = p.wake || 7;
  const owl = p.chrono === "owl";
  const lightsOut = (wake - p.need + 24) % 24;
  const blocks: ScheduleBlock[] = [];
  const add = (t: number, label: string, note = "") => blocks.push({ t: fmt(t), label, note });

  add(wake, "Wake — daylight + water, before the phone", "Light within 30 min anchors your body clock");
  if (!owl) {
    add(wake + 0.75, "Deep block 1 — the hardest thing", "50 on / 10 off; your if-then starts it");
    add(wake + 2.75, "Micro-break — move, water, window", "3 min is enough to reset");
    add(wake + 3, "Deep block 2", "Protect it: notifications off");
  } else {
    add(wake + 0.75, "Shallow start — admin, notes, small tasks", "Your peak comes later; don’t fight it");
    add(wake + 2.5, "Deep block 1 — the hardest thing", "50 on / 10 off; your if-then starts it");
  }
  add(wake + 5, "Lunch + 10-min walk outside", "Daylight + movement: a two-for-one");
  if (intensity !== "gentle") {
    add(
      wake + 6,
      owl ? "Deep block 2 — your real peak" : "Deep block 3 — or admin if tank is low",
      "50 on / 10 off"
    );
  }
  if (intensity === "driven") {
    add(
      wake + 7.5,
      "Deep block " + (owl ? "3" : "4") + " — optional overdrive",
      "Skip it the moment quality drops — hours ≠ output"
    );
  }
  if (intensity === "gentle") {
    add(wake + 7, "Recovery slot — pick any channel", "Detach, relax, mastery or control — your choice");
  }
  add(
    wake + 9,
    p.moodWatch || p.moodFlag ? "Movement — 30 min, moderate, any kind" : "Movement / sport — 30 min",
    p.moodWatch || p.moodFlag
      ? "Your mood scores make this the highest-leverage block"
      : "Protects mood and focus"
  );
  add(lightsOut - 1.25, "Hard shutdown — write tomorrow’s one-line if-then", "Closes the mental tabs so your brain can detach");
  add(
    lightsOut - 0.75,
    "Wind-down — screens dim, lights low",
    (p.sleepScreens ?? 0) >= 3 ? "Your phone-in-bed habit flagged: charge it out of reach" : "Same ritual nightly = faster sleep onset"
  );
  add(lightsOut, "Lights out", "Window: " + fmt(lightsOut) + " – " + fmt(wake) + ", all 7 days");
  return blocks;
}

export function buildInterventions(p: Profile): Intervention[] {
  const iv: Intervention[] = [];
  if (p.sleepWatch || p.sleepBad) {
    iv.push({
      title: "Fix the window, not the hours",
      tag: "Sleep",
      why: "Your sleep flagged mostly on regularity. In 79,666 adults, a regular sleep window cut depression risk 38% — even when total hours were fine.",
      steps: [
        "Pick one wake time; keep it within ±30 min, weekends too",
        "Anchor it: daylight within 30 min of waking",
        "Let bedtime drift earlier naturally — never force it",
      ],
      src: "Li et al. 2025 · Moebus et al. 2025",
      tryBreath: false,
    });
  }
  if (p.sleepBad) {
    iv.push({
      title: "Stimulus control basics",
      tag: "Sleep",
      why: "Bed stays for sleep only — the strongest-evidence behavioural insomnia tool, and the core of what worked in the student sleep trials.",
      steps: [
        "In bed >20 min and wide awake? Get up, low light, boring task",
        "Phone charges out of arm’s reach",
        "Same wind-down ritual nightly — it becomes the cue",
      ],
      src: "Chandler et al. 2022 · Kodsi et al. 2021",
      tryBreath: false,
    });
  }
  if (p.moodWatch || p.moodFlag) {
    iv.push({
      title: "Movement as mood medicine",
      tag: "Mood",
      why: "In trials with 12–25 year olds, exercise lifted low mood by about as much as front-line treatments do. Roughly 8 in 10 young people who moved regularly did better than those who didn't.",
      steps: [
        "30 min, moderate — brisk walk, cycle, gym, sport, dance",
        "3× a week minimum; scheduled, not \"when I feel like it\"",
        "Pair it with people when you can — double benefit",
      ],
      src: "Bailey et al. 2017 · Singh et al. 2025",
      tryBreath: false,
    });
  }
  if (p.anxWatch || p.anxFlag) {
    iv.push({
      title: "Cyclic sighing — 5 min/day",
      tag: "Stress",
      why: "Exhale-weighted breathing beat mindfulness meditation for daily mood in a month-long RCT. Evidence is young — treat it as a state-shifter, not a cure.",
      steps: [
        "Two nose inhales (second one short), long mouth exhale",
        "5 minutes daily, or ~6 breaths before stressful moments",
        "Stack it onto an anchor — after sitting down to study",
      ],
      src: "Balban et al. 2023 · Fincham et al. 2023",
      tryBreath: true,
    });
  }
  if (p.boWatch || p.boHigh || p.bo[2] >= 3) {
    iv.push({
      title: "The hard shutdown ritual",
      tag: "Burnout",
      why: "Psychological detachment — actually stopping work thoughts after hours — is the recovery channel that most strongly predicts lower exhaustion across 99,329 people.",
      steps: [
        "Fixed end time; write tomorrow’s one-line if-then",
        "Say it out loud: \"done for today\" — corny, effective",
        "No study/work apps after shutdown; separate spaces if you can",
      ],
      src: "Headrick et al. 2022 · Sonnentag & Fritz 2015",
      tryBreath: false,
    });
  }
  if (p.auditFlag) {
    iv.push({
      title: "Worth a straight conversation",
      tag: "Habits",
      why: "Your drinking answers landed in the range where a GP or counsellor can help you look at it properly — not because a number decided anything, but because that's exactly what this screen is designed to catch early.",
      steps: [
        "No judgement, no diagnosis here — just a number worth a second look",
        "A GP, campus health service or the lines under Help & privacy can talk it through confidentially",
        "Cutting back before it's a crisis is far easier than after",
      ],
      src: "Liskola et al. 2018 · Skogen et al. 2024",
      tryBreath: false,
    });
  }
  if (p.overloaded) {
    iv.push({
      title: "Subtract before you add",
      tag: "Load",
      why: "Workload is the #1 predictor of failed detachment — no tactic outruns a crushing load. Recovery starts with the calendar, not willpower.",
      steps: [
        "List commitments; mark the two lowest-value ones",
        "Drop, shrink or defer one this week",
        "Guard the freed slot for a recovery channel",
      ],
      src: "Sonnentag & Fritz 2015",
      tryBreath: false,
    });
  }
  iv.push({
    title: "If-then your first block",
    tag: "Focus",
    why: "Deciding the exact when and where in advance beats deciding in the moment — across 94 studies, about 7 in 10 people did better with a plan than without. It works even better when mood is low, because the plan removes the decision.",
    steps: [
      "Tonight: \"If it’s [time] and I’m at [place], then I open [exact task]\"",
      "One line, absurdly specific, rehearse it once",
      "The morning follows the sentence — not the mood",
    ],
    src: "Gollwitzer & Sheeran 2006 · Toli et al. 2016",
    tryBreath: false,
  });
  iv.push({
    title: "The 50/10 rhythm",
    tag: "Focus",
    why: "Micro-breaks reliably restore vigor and cut fatigue; heavy cognitive work needs the longer 10-min kind between blocks.",
    steps: [
      "50 min single-task, notifications off",
      "10 min genuinely off — move, window, water; not another feed",
      "After 2–3 cycles, take a real 30-min break",
    ],
    src: "Albulescu et al. 2022",
    tryBreath: false,
  });
  return iv.slice(0, 6);
}
