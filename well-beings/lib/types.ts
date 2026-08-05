export type Region = "us" | "uk" | "ca" | "au" | "in" | "nz" | "intl";

export type Age = "u16" | "16-18" | "19-25" | "26+";
export type Chrono = "morning" | "between" | "owl";
export type Situation = "School" | "University" | "Working" | "Between things" | "Caregiving" | "A mix";
export type Section = "Basics" | "Sleep" | "Rhythm" | "Mood" | "Stress" | "Habits";
export type PlanIntensity = "gentle" | "balanced" | "driven";

export interface HelplineEntry {
  name: string;
  contact: string;
}

export interface HelplineRegion {
  label: string;
  lines: HelplineEntry[];
}

export interface ChoiceOption {
  label: string;
  value: string | number;
}

export interface Question {
  id: string;
  section: Section;
  type: "choice" | "text";
  text: string;
  sub?: string;
  /** Answers "why are you asking me this?" — shown on demand, never forced. */
  why?: string;
  opts?: ChoiceOption[];
  /** Runs after the user answers; may enqueue deeper follow-up questions. */
  after?: (value: string | number, ctx: FlowCtx) => void;
}

export interface FlowCtx {
  answers: Record<string, string | number | undefined>;
  insertNext: (qs: Question[]) => void;
  triggerCrisis: () => void;
}

/** Raw answers collected from the chat, before scoring. */
export interface RawAnswers {
  name: string;
  age: Age;
  region: Region;
  situation: Situation;
  sleepHours: number;
  sleepReg: number;
  sleepQual: number;
  sleepLatency?: number;
  sleepScreens?: number;
  chrono: Chrono;
  wake: number;
  workload: number;
  phq: number[];
  phqExpanded: boolean;
  gad: number[];
  gadExpanded: boolean;
  bo: [number, number, number];
  /** AUDIT-C, adaptive: [0] alone if "never drinks"; all 3 items otherwise. */
  audit: number[];
  goal: string;
}

/** A scored, derived profile — everything the app screens read from. */
export interface Profile extends RawAnswers {
  phqScore: number;
  gadScore: number;
  boScore: number;
  need: number;
  sleepScore: number;
  moodFlag: boolean;
  moodWatch: boolean;
  anxFlag: boolean;
  anxWatch: boolean;
  sleepBad: boolean;
  sleepWatch: boolean;
  boHigh: boolean;
  boWatch: boolean;
  overloaded: boolean;
  auditScore: number;
  auditWatch: boolean;
  auditFlag: boolean;
}

export interface ChatMessage {
  id: string;
  isBot?: boolean;
  isUser?: boolean;
  isCrisis?: boolean;
  text?: string;
  lines?: HelplineEntry[];
}

export interface CheckinEntry {
  mood?: number;
  energy?: number;
  sleep?: number;
}

export interface ScheduleBlock {
  t: string;
  label: string;
  note: string;
}

export interface Intervention {
  title: string;
  tag: string;
  why: string;
  steps: string[];
  src: string;
  tryBreath: boolean;
}

/** How big the effect is, in words rather than notation. */
export type EvidenceStrength = "large" | "moderate" | "small" | "mixed";

export interface EvidenceItem {
  tag: string;
  design: string;
  /** Headline number, e.g. "38%" or "8 in 10" — the one figure worth remembering. */
  figure: string;
  /** What that number actually means, in plain words. */
  caption: string;
  strength: EvidenceStrength;
  /** The finding in plain English — no bare effect sizes. */
  finding: string;
  /** The original statistic, kept for anyone who wants it, always glossed. */
  technical?: string;
  use: string;
  cite: string;
  url: string;
}
