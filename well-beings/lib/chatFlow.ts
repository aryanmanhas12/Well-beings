import { FREQ, SCALE } from "./scoring";
import { FlowCtx, Question } from "./types";

const phqSub = "PHQ — the standard clinical screener · answers never leave this device";
const gadSub = "GAD — the standard anxiety screener · answers never leave this device";

const phqWhy =
  "These are the first two items of the PHQ-9, the most-validated depression questionnaire there is — the same wording a GP would use. Asking two first and the other seven only if something flags catches just as many people while cutting the questions by more than half.";
const phqDeepWhy =
  "You're seeing the remaining PHQ-9 items because the first two flagged. Nine questions map onto the clinical criteria for depression; a score of 10 or more is the line where clinicians usually look closer. This app signals — it does not diagnose.";
const gadWhy =
  "These two open the GAD-7, the standard anxiety screener, developed across 2,740 patients and since tested in 24 languages. Same adaptive rule: two now, five more only if these flag.";

const S = SCALE.map(([label, value]) => ({ label, value }));
const F = FREQ.map(([label, value]) => ({ label, value }));

/** The full check-in flow — adaptive follow-ups are enqueued by `after` via ctx.insertNext. */
export function buildFlow(): Question[] {
  return [
    { id: "name", section: "Basics", type: "text", text: "What should I call you? (First name, nickname — or hit send to skip.)" },
    {
      id: "age",
      section: "Basics",
      type: "choice",
      text: "How old are you? This sets your sleep target — teens genuinely need more.",
      opts: [
        { label: "Under 16", value: "u16" },
        { label: "16–18", value: "16-18" },
        { label: "19–25", value: "19-25" },
        { label: "26 or older", value: "26+" },
      ],
    },
    {
      id: "region",
      section: "Basics",
      type: "choice",
      text: "Where are you based? Only used to show the right local support lines — never sent anywhere.",
      opts: [
        { label: "United States", value: "us" },
        { label: "United Kingdom", value: "uk" },
        { label: "Canada", value: "ca" },
        { label: "Australia", value: "au" },
        { label: "India", value: "in" },
        { label: "New Zealand", value: "nz" },
        { label: "Somewhere else", value: "intl" },
      ],
    },
    {
      id: "situation",
      section: "Basics",
      type: "choice",
      text: "What fills most of your week?",
      opts: [
        { label: "School", value: "School" },
        { label: "University", value: "University" },
        { label: "Working", value: "Working" },
        { label: "A mix of these", value: "A mix" },
      ],
    },
    {
      id: "sleepHours",
      section: "Sleep",
      type: "choice",
      text: "On a normal night, how much sleep do you actually get?",
      opts: [
        { label: "Under 6h", value: 5.5 },
        { label: "6–7h", value: 6.5 },
        { label: "7–8h", value: 7.5 },
        { label: "8–9h", value: 8.5 },
        { label: "9h or more", value: 9.5 },
      ],
    },
    {
      id: "sleepReg",
      section: "Sleep",
      type: "choice",
      text: "Do you fall asleep and wake at roughly the same times every day — weekends included?",
      opts: [
        { label: "Yes, within ~30 min", value: 0 },
        { label: "Weekdays yes, weekends drift", value: 1 },
        { label: "Honestly, it changes all the time", value: 2 },
      ],
    },
    {
      id: "sleepQual",
      section: "Sleep",
      type: "choice",
      text: "And the quality — do you wake up feeling actually restored?",
      opts: [
        { label: "Most mornings", value: 0 },
        { label: "Some mornings", value: 1 },
        { label: "Rarely", value: 2 },
        { label: "Basically never", value: 3 },
      ],
      after: (v, ctx: FlowCtx) => {
        if (Number(v) >= 2 || Number(ctx.answers.sleepHours) <= 6.5) {
          ctx.insertNext([
            {
              id: "sleepLatency",
              section: "Sleep",
              type: "choice",
              text: "Going a level deeper on sleep, since it flagged. How often does falling asleep take you more than 30 minutes?",
              opts: F,
            },
            {
              id: "sleepScreens",
              section: "Sleep",
              type: "choice",
              text: "How often are you on your phone in bed right up until you fall asleep?",
              opts: F,
            },
          ]);
        }
      },
    },
    {
      id: "chrono",
      section: "Rhythm",
      type: "choice",
      text: "When does your brain actually work best?",
      opts: [
        { label: "Morning person", value: "morning" },
        { label: "Somewhere in between", value: "between" },
        { label: "Night owl", value: "owl" },
      ],
    },
    {
      id: "wake",
      section: "Rhythm",
      type: "choice",
      text: "What time do you need to be up on a typical day?",
      opts: [
        { label: "Before 6:30", value: 6.25 },
        { label: "6:30–7:30", value: 7 },
        { label: "7:30–8:30", value: 8 },
        { label: "After 8:30", value: 8.75 },
      ],
    },
    {
      id: "workload",
      section: "Rhythm",
      type: "choice",
      text: "Be honest — a typical week feels…",
      opts: [
        { label: "Comfortable", value: 0 },
        { label: "Full, but doable", value: 1 },
        { label: "Overloaded", value: 2 },
        { label: "Crushing", value: 3 },
      ],
    },
    {
      id: "phq1",
      section: "Mood",
      type: "choice",
      sub: phqSub,
      why: phqWhy,
      text: "Now two standard mood questions — same ones clinicians use.\n\nOver the last 2 weeks, how often have you had little interest or pleasure in doing things?",
      opts: S,
    },
    {
      id: "phq2",
      section: "Mood",
      type: "choice",
      sub: phqSub,
      why: phqWhy,
      text: "…and how often have you felt down, depressed, or hopeless?",
      opts: S,
      after: (v, ctx: FlowCtx) => {
        if ((Number(ctx.answers.phq1) || 0) + Number(v) >= 2) {
          ctx.insertNext([
            { id: "phq3", section: "Mood", type: "choice", sub: phqSub, why: phqDeepWhy, text: "That’s worth a closer look — the full set of 7 more, then we move on. Same 2-week window.\n\nTrouble falling or staying asleep, or sleeping too much?", opts: S },
            { id: "phq4", section: "Mood", type: "choice", sub: phqSub, why: phqDeepWhy, text: "Feeling tired or having little energy?", opts: S },
            { id: "phq5", section: "Mood", type: "choice", sub: phqSub, why: phqDeepWhy, text: "Poor appetite — or overeating?", opts: S },
            { id: "phq6", section: "Mood", type: "choice", sub: phqSub, why: phqDeepWhy, text: "Feeling bad about yourself — that you’re a failure, or have let yourself or your family down?", opts: S },
            { id: "phq7", section: "Mood", type: "choice", sub: phqSub, why: phqDeepWhy, text: "Trouble concentrating on things like reading or watching a video?", opts: S },
            { id: "phq8", section: "Mood", type: "choice", sub: phqSub, why: phqDeepWhy, text: "Moving or speaking noticeably slowly — or the opposite, being fidgety and restless?", opts: S },
            {
              id: "phq9",
              section: "Mood",
              type: "choice",
              sub: phqSub,
              why: phqDeepWhy,
              text: "This one matters, and it’s safe to answer honestly here: thoughts that you’d be better off dead, or of hurting yourself in some way?",
              opts: S,
              after: (v9, ctx2: FlowCtx) => {
                if (Number(v9) >= 1) ctx2.triggerCrisis();
              },
            },
          ]);
        }
      },
    },
    { id: "gad1", section: "Stress", type: "choice", sub: gadSub, why: gadWhy, text: "Two on stress and worry.\n\nOver the last 2 weeks, how often have you felt nervous, anxious, or on edge?", opts: S },
    {
      id: "gad2",
      section: "Stress",
      type: "choice",
      sub: gadSub,
      why: gadWhy,
      text: "…and how often were you not able to stop or control worrying?",
      opts: S,
      after: (v, ctx: FlowCtx) => {
        if ((Number(ctx.answers.gad1) || 0) + Number(v) >= 2) {
          ctx.insertNext([
            { id: "gad3", section: "Stress", type: "choice", sub: gadSub, why: gadWhy, text: "Going deeper here too — 5 more, then we move on.\n\nWorrying too much about different things?", opts: S },
            { id: "gad4", section: "Stress", type: "choice", sub: gadSub, why: gadWhy, text: "Trouble relaxing?", opts: S },
            { id: "gad5", section: "Stress", type: "choice", sub: gadSub, why: gadWhy, text: "Being so restless that it’s hard to sit still?", opts: S },
            { id: "gad6", section: "Stress", type: "choice", sub: gadSub, why: gadWhy, text: "Becoming easily annoyed or irritable?", opts: S },
            { id: "gad7", section: "Stress", type: "choice", sub: gadSub, why: gadWhy, text: "Feeling afraid, as if something awful might happen?", opts: S },
          ]);
        }
      },
    },
    { id: "bo1", section: "Stress", type: "choice", text: "Last stretch — three on energy and burnout.\n\nHow often do you feel drained before the day has even started?", opts: F },
    { id: "bo2", section: "Stress", type: "choice", text: "How often do you feel cynical or detached about your study or work — a \"what’s the point\" feeling?", opts: F },
    { id: "bo3", section: "Stress", type: "choice", text: "After you stop for the day, how often does your mind keep grinding on it — unable to switch off?", opts: F },
    {
      id: "goal",
      section: "Stress",
      type: "choice",
      text: "And what should this system aim at first?",
      opts: [
        { label: "Grades / exams", value: "Grades / exams" },
        { label: "Ship a project", value: "Ship a project" },
        { label: "Build consistent routines", value: "Build consistent routines" },
        { label: "Just feel less exhausted", value: "Just feel less exhausted" },
      ],
    },
  ];
}

export const SECTION_OF: Record<string, number> = { Basics: 1, Sleep: 2, Rhythm: 3, Mood: 4, Stress: 5 };
export const TOTAL_SECTIONS = 5;
