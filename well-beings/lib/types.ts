export type Region = "us" | "uk" | "ca" | "au" | "in" | "nz" | "intl";

export type Age = "u16" | "16-18" | "19-25" | "26+";
export type Chrono = "morning" | "between" | "owl";
export type Situation = "School" | "University" | "Working" | "A mix";
export type Section = "Basics" | "Sleep" | "Rhythm" | "Mood" | "Stress";
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

export interface EvidenceItem {
  tag: string;
  design: string;
  finding: string;
  use: string;
  cite: string;
  url: string;
}
