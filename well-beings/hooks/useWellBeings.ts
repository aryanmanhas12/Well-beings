"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { buildFlow, SECTION_OF, TOTAL_SECTIONS } from "@/lib/chatFlow";
import { HELPLINES } from "@/lib/helplines";
import { PERSONAS } from "@/lib/personas";
import { buildProfile, dateKey } from "@/lib/scoring";
import { DEFAULT_SETTINGS, loadState, PersistedState, saveState, clearState, Settings } from "@/lib/storage";
import { CheckinEntry, ChatMessage, FlowCtx, PlanIntensity, Profile, Question, RawAnswers } from "@/lib/types";

export type Screen = "welcome" | "chat" | "results" | "app";
export type Tab = "today" | "plan" | "burnout" | "library" | "help";

let msgSeq = 0;
const nextMsgId = () => "m" + msgSeq++;

function computeStreak(habitsDone: Record<string, string[]>, id: string): number {
  const done = new Set(habitsDone[id] || []);
  let n = 0;
  let misses = 0;
  for (let i = 0; i < 60; i++) {
    if (done.has(dateKey(-i))) n++;
    else {
      misses++;
      if (misses > 1) break;
    }
  }
  return n;
}

export function useWellBeings() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [tab, setTab] = useState<Tab>("today");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [draft, setDraft] = useState("");
  const [progSec, setProgSec] = useState("Basics");
  const [progN, setProgN] = useState(1);

  const [helpOpen, setHelpOpen] = useState(false);
  const [breathOpen, setBreathOpen] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [demoProfile, setDemoProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<Record<string, CheckinEntry>>({});
  const [habitsDone, setHabitsDone] = useState<Record<string, string[]>>({});
  const [weeklyDone, setWeeklyDone] = useState<Record<string, boolean>>({});
  const [crisis, setCrisis] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const pendingRef = useRef<Question[]>([]);
  const answersRef = useRef<Record<string, string | number | undefined>>({});

  /** One snapshot per answered question, so "change that" can rewind exactly. */
  const historyRef = useRef<
    {
      q: Question;
      pending: Question[];
      answers: Record<string, string | number | undefined>;
      messages: ChatMessage[];
      crisis: boolean;
    }[]
  >([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const crisisRef = useRef(false);
  crisisRef.current = crisis;

  // Hydrate any saved session from localStorage after mount — deliberate:
  // the server render must always paint "welcome" or hydration mismatches.
  useEffect(() => {
    const saved = loadState();
    if (saved && saved.profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(saved.profile);
      setCheckins(saved.checkins);
      setHabitsDone(saved.habitsDone);
      setWeeklyDone(saved.weeklyDone);
      setCrisis(saved.crisis);
      setSettings(saved.settings);
      setScreen("app");
    } else if (saved) {
      setSettings(saved.settings);
    }
  }, []);

  function persist(next: Partial<PersistedState>) {
    const state: PersistedState = {
      profile: next.profile !== undefined ? next.profile : profile,
      checkins: next.checkins ?? checkins,
      habitsDone: next.habitsDone ?? habitsDone,
      weeklyDone: next.weeklyDone ?? weeklyDone,
      crisis: next.crisis !== undefined ? next.crisis : crisis,
      settings: next.settings ?? settings,
    };
    saveState(state);
  }

  function push(m: Omit<ChatMessage, "id">) {
    setMessages((prev) => [...prev, { ...m, id: nextMsgId() }]);
  }

  function say(list: string[], done?: () => void) {
    setTyping(true);
    setCurrentQuestion(null);
    const step = (i: number) => {
      if (i >= list.length) {
        setTyping(false);
        done?.();
        return;
      }
      setTimeout(() => {
        push({ isBot: true, text: list[i] });
        setTyping(i + 1 < list.length);
        step(i + 1);
      }, i === 0 ? 500 : 850);
    };
    step(0);
  }

  function ask(q: Question) {
    setProgSec(q.section);
    setProgN(SECTION_OF[q.section] || 1);
    say([q.text], () => setCurrentQuestion(q));
  }

  function next() {
    const q = pendingRef.current.shift();
    if (!q) {
      finishChat();
      return;
    }
    ask(q);
  }

  function triggerCrisis() {
    setCrisis(true);
    const region = HELPLINES[(answersRef.current.region as keyof typeof HELPLINES) || "intl"] || HELPLINES.intl;
    push({ isCrisis: true, lines: region.lines });
  }

  function answer(value: string | number, label: string) {
    const q = currentQuestion;
    if (!q) return;
    // Snapshot before anything mutates — this is what `back()` restores.
    historyRef.current.push({
      q,
      pending: [...pendingRef.current],
      answers: { ...answersRef.current },
      messages: messagesRef.current,
      crisis: crisisRef.current,
    });
    push({ isUser: true, text: label });
    answersRef.current[q.id] = value;
    setCurrentQuestion(null);
    if (q.after) {
      const ctx: FlowCtx = {
        answers: answersRef.current,
        insertNext: (qs: Question[]) => pendingRef.current.unshift(...qs),
        triggerCrisis,
      };
      q.after(value, ctx);
    }
    setTimeout(next, 250);
  }

  /** Rewind one question. Restores the queue too, so adaptive follow-ups
      enqueued by the answer we're undoing disappear with it. */
  function back() {
    const snap = historyRef.current.pop();
    if (!snap) return;
    pendingRef.current = snap.pending;
    answersRef.current = snap.answers;
    setMessages(snap.messages);
    setCrisis(snap.crisis);
    setTyping(false);
    setDraft("");
    setCurrentQuestion(snap.q);
    setProgSec(snap.q.section);
    setProgN(SECTION_OF[snap.q.section] || 1);
  }

  function startChat() {
    answersRef.current = {};
    pendingRef.current = buildFlow();
    historyRef.current = [];
    setMessages([]);
    setCrisis(false);
    setDemoProfile(null);
    setScreen("chat");
    say(
      [
        "Hey — I’m your Well-Beings check-in. About five minutes, mostly taps. You can change any answer as you go, and there’s a help button on every screen.",
        "The important bit first: nothing leaves this device. No account, no server, no third parties — and you can delete all of it with one tap, whenever you want.",
        "The questions come from screeners clinicians actually use. They signal what’s worth attention — they don’t diagnose you. Any question can tell you why it’s being asked.",
      ],
      next
    );
  }

  function startDemo() {
    const p = buildProfile(PERSONAS["running-hot"]);
    setDemoProfile(p);
    setCrisis(false);
    setScreen("results");
  }

  function finishChat() {
    const A = answersRef.current;
    const phqKeys = ["phq1", "phq2", "phq3", "phq4", "phq5", "phq6", "phq7", "phq8", "phq9"];
    const gadKeys = ["gad1", "gad2", "gad3", "gad4", "gad5", "gad6", "gad7"];
    const auditKeys = ["audit1", "audit2", "audit3"];
    const raw: RawAnswers = {
      name: (A.name as string) || "",
      age: A.age as RawAnswers["age"],
      region: A.region as RawAnswers["region"],
      situation: A.situation as RawAnswers["situation"],
      sleepHours: Number(A.sleepHours),
      sleepReg: Number(A.sleepReg),
      sleepQual: Number(A.sleepQual),
      sleepLatency: A.sleepLatency !== undefined ? Number(A.sleepLatency) : undefined,
      sleepScreens: A.sleepScreens !== undefined ? Number(A.sleepScreens) : undefined,
      chrono: A.chrono as RawAnswers["chrono"],
      wake: Number(A.wake),
      workload: Number(A.workload),
      phq: phqKeys.map((k) => A[k]).filter((v) => v !== undefined).map(Number),
      phqExpanded: A.phq3 !== undefined,
      gad: gadKeys.map((k) => A[k]).filter((v) => v !== undefined).map(Number),
      gadExpanded: A.gad3 !== undefined,
      bo: [Number(A.bo1) || 0, Number(A.bo2) || 0, Number(A.bo3) || 0],
      audit: auditKeys.map((k) => A[k]).filter((v) => v !== undefined).map(Number),
      goal: (A.goal as string) || "",
    };
    const builtProfile = buildProfile(raw);
    say(["Done — thank you for being straight with me.", "Crunching your read-out…"], () => {
      setTimeout(() => {
        setProfile(builtProfile);
        setScreen("results");
        persist({ profile: builtProfile });
      }, 700);
    });
  }

  const isDemo = demoProfile !== null;
  const activeProfile = demoProfile ?? profile;
  const activeCrisis = isDemo ? false : crisis;

  function buildSystem() {
    setScreen("app");
    setTab("today");
    if (!isDemo) persist({});
  }

  function deleteData() {
    clearState();
    answersRef.current = {};
    pendingRef.current = [];
    setProfile(null);
    setDemoProfile(null);
    setCheckins({});
    setHabitsDone({});
    setWeeklyDone({});
    setCrisis(false);
    setSettings(DEFAULT_SETTINGS);
    setScreen("welcome");
    setTab("today");
    setMessages([]);
  }

  function onDraftKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendDraft();
  }
  function sendDraft() {
    const v = draft.trim();
    setDraft("");
    answer(v, v || "(skipped)");
  }

  function logCheckin(field: keyof CheckinEntry, value: number) {
    const k = dateKey(0);
    setCheckins((prev) => {
      const next = { ...prev, [k]: { ...(prev[k] || {}), [field]: value } };
      persist({ checkins: next });
      return next;
    });
  }

  function toggleHabit(id: string) {
    const k = dateKey(0);
    setHabitsDone((prev) => {
      const arr = new Set(prev[id] || []);
      if (arr.has(k)) arr.delete(k);
      else arr.add(k);
      const next = { ...prev, [id]: [...arr] };
      persist({ habitsDone: next });
      return next;
    });
  }

  function toggleWeekly(id: string) {
    setWeeklyDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      persist({ weeklyDone: next });
      return next;
    });
  }

  function setPlanIntensity(v: PlanIntensity) {
    setSettings((prev) => {
      const next = { ...prev, planIntensity: v };
      persist({ settings: next });
      return next;
    });
  }
  function setCalmMode(v: boolean) {
    setSettings((prev) => {
      const next = { ...prev, calmMode: v };
      persist({ settings: next });
      return next;
    });
  }

  const region = useMemo(
    () => HELPLINES[(activeProfile?.region as keyof typeof HELPLINES) || "intl"] || HELPLINES.intl,
    [activeProfile]
  );

  const todayKey = dateKey(0);
  const todayCheckin = checkins[todayKey] || {};

  return {
    screen,
    setScreen,
    tab,
    setTab,
    messages,
    typing,
    currentQuestion,
    draft,
    setDraft,
    onDraftKeyDown,
    sendDraft,
    answer,
    back,
    canGoBack: historyRef.current.length > 0,
    progSec,
    progPct: Math.round((progN / TOTAL_SECTIONS) * 100),
    progLabel: `part ${progN} of ${TOTAL_SECTIONS}`,
    helpOpen,
    openHelp: () => setHelpOpen(true),
    closeHelp: () => setHelpOpen(false),
    breathOpen,
    openBreath: () => setBreathOpen(true),
    closeBreath: () => setBreathOpen(false),
    startChat,
    startDemo,
    buildSystem,
    deleteData,
    profile: activeProfile,
    isDemo,
    crisis: activeCrisis,
    region,
    checkins,
    todayCheckin,
    logCheckin,
    habitsDone,
    toggleHabit,
    streakFor: (id: string) => computeStreak(habitsDone, id),
    doneToday: (id: string) => (habitsDone[id] || []).includes(todayKey),
    weeklyDone,
    toggleWeekly,
    settings,
    setPlanIntensity,
    setCalmMode,
  };
}

export type WellBeings = ReturnType<typeof useWellBeings>;
