"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { buildFlow, SECTION_OF, totalSections } from "@/lib/chatFlow";
import { Depth } from "@/lib/lifestyle";
import { answerLabel, clearDraft, loadDraft, replayFlow, saveDraft } from "@/lib/draft";
import { InboundHandoff, readInboundHandoff } from "@/lib/bridge";
import { crisisLines, DEFAULT_REGION, HELPLINES } from "@/lib/helplines";
import { PERSONAS } from "@/lib/personas";
import { buildProfile, dateKey } from "@/lib/scoring";
import { applyDisplayPrefs, DEFAULT_SETTINGS, loadState, PersistedState, saveState, clearState, Settings, Theme } from "@/lib/storage";
import { JournalEntry, countWords, mentionsCrisis } from "@/lib/journal";
import { Lang, t } from "@/lib/i18n";
import { CheckinEntry, ChatMessage, FlowCtx, PlanIntensity, Profile, Question, RawAnswers } from "@/lib/types";

/* "home" is the safe place. "app" is a one-shot signal meaning "the check
   just finished, show the daily plan it built": the safe place reads it,
   opens its Plan tab and sets the screen back to "home". */
export type Screen = "home" | "chat" | "results" | "app";
export type Tab = "today" | "journal" | "plan" | "burnout" | "library" | "help";

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

export function useWellbeings() {
  const [screen, setScreen] = useState<Screen>("home");
  const [tab, setTab] = useState<Tab>("today");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [draft, setDraft] = useState("");
  const [progSec, setProgSec] = useState("Basics");
  const [progN, setProgN] = useState(1);
  /* Which version of the check-in is running. Held in state as well as in
     the draft because the progress indicator and the section count both
     depend on it, and a quick check that reported "6 of 7" would look
     broken at the exact moment it finished. */
  const [depth, setDepth] = useState<Depth>("detailed");
  /* A saved, unfinished check-in found on this device. Offered, never
     auto-resumed: silently dropping someone back into question 14 of a form
     they may have abandoned on purpose is its own kind of rude. */
  const [resumable, setResumable] = useState<{ answered: number; depth: Depth } | null>(null);

  const [helpOpen, setHelpOpen] = useState(false);
  const [breathOpen, setBreathOpen] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [demoProfile, setDemoProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<Record<string, CheckinEntry>>({});
  const [habitsDone, setHabitsDone] = useState<Record<string, string[]>>({});
  const [weeklyDone, setWeeklyDone] = useState<Record<string, boolean>>({});
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [crisis, setCrisis] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [handoff, setHandoff] = useState<InboundHandoff | null>(null);

  /* Mirrors `depth` for the callbacks that run outside React's render
     cycle. saveDraft is called from `answer`, which closes over whatever
     depth was current when the handler was created; the ref is what keeps a
     quick check from being saved as a detailed one. */
  const depthRef = useRef<Depth>("detailed");
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
  // the server render must always paint "home" or hydration mismatches.
  //
  // A finished profile no longer sends someone straight to the lifestyle
  // dashboard. Everyone lands in the safe place; the daily plan is one tap
  // away in its Plan tab. The front door of an app a person might open in
  // crisis should not be a habit tracker.
  useEffect(() => {
    const saved = loadState();
    if (saved && saved.profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(saved.profile);
      setCheckins(saved.checkins);
      setHabitsDone(saved.habitsDone);
      setWeeklyDone(saved.weeklyDone);
      setJournal(saved.journal);
      setCrisis(saved.crisis);
      setSettings(saved.settings);
      applyDisplayPrefs(saved.settings);
    } else if (saved) {
      setSettings(saved.settings);
      applyDisplayPrefs(saved.settings);
    }
  }, []);

  // An unfinished check-in from a previous visit. Only offered when there is
  // no finished profile — a completed result is the more useful thing to show
  // and the draft is cleared on completion anyway.
  useEffect(() => {
    const d = loadDraft();
    if (!d) return;
    if (loadState()?.profile) {
      clearDraft();
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResumable({ answered: Object.keys(d.answers).length, depth: d.depth });
  }, []);

  // Arriving from the Ronak's results view: read the severity band
  // it passed once, then let the URL go back to plain — a refresh or a
  // shared link should never re-show the banner this drives.
  useEffect(() => {
    const h = readInboundHandoff();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (h) setHandoff(h);
  }, []);

  function persist(next: Partial<PersistedState>) {
    const state: PersistedState = {
      profile: next.profile !== undefined ? next.profile : profile,
      checkins: next.checkins ?? checkins,
      habitsDone: next.habitsDone ?? habitsDone,
      weeklyDone: next.weeklyDone ?? weeklyDone,
      journal: next.journal ?? journal,
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
    const region =
      HELPLINES[(answersRef.current.region as keyof typeof HELPLINES) || DEFAULT_REGION] || HELPLINES[DEFAULT_REGION];
    // The short list, not the directory: a crisis card with eight numbers on
    // it is a card nobody rings.
    push({ isCrisis: true, lines: crisisLines(region) });
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
    /* Written on every answer, not at the end. This is the whole fix for
       answers vanishing on a refresh, and it is cheap: one small JSON write
       per tap, to the same storage the rest of the app already uses. */
    saveDraft(depthRef.current, answersRef.current);
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
    // Rewind the saved copy as well, otherwise an answer someone deliberately
    // undid would reappear after a reload.
    saveDraft(depthRef.current, snap.answers);
    setMessages(snap.messages);
    setCrisis(snap.crisis);
    setTyping(false);
    setDraft("");
    setCurrentQuestion(snap.q);
    setProgSec(snap.q.section);
    setProgN(SECTION_OF[snap.q.section] || 1);
  }

  /**
   * Starts a fresh check-in at the chosen depth.
   *
   * The opening lines differ by depth because the two versions genuinely
   * promise different things, and saying "about five minutes" before a
   * twelve-minute form is the kind of small dishonesty that makes people
   * stop trusting the rest of it.
   */
  function startChat(chosen: Depth = "detailed") {
    answersRef.current = {};
    pendingRef.current = buildFlow(chosen);
    historyRef.current = [];
    depthRef.current = chosen;
    setDepth(chosen);
    setResumable(null);
    clearDraft();
    setMessages([]);
    setCrisis(false);
    setDemoProfile(null);
    setScreen("chat");
    say(
      chosen === "quick"
        ? [
            "Hey there. This is the quick version: about three minutes, mostly taps, covering sleep, movement, food, time to yourself and how the week is going.",
            "Nothing leaves this device. No account, no server, no third parties, and one tap deletes all of it whenever you want. Your answers save as you go, so a refresh will not lose them.",
            "It gives you a snapshot and two or three things worth trying. It is not a diagnosis of anything, and any question can tell you why it is being asked.",
          ]
        : [
            "Hey there. I’m your Wellbeings check-in. It takes about five minutes, mostly taps. You can change any answer as you go, your answers save as you go, and there’s a help button on every screen.",
            "The important bit first: nothing leaves this device. No account, no server, no third parties. You can delete all of it with one tap, whenever you want.",
            "It covers sleep, movement, food, stress, time to yourself and how your week is shaped. A few questions borrow wording from screeners clinicians use. Those signal what is worth attention, they do not diagnose you.",
          ],
      next
    );
  }

  /**
   * Picks a saved check-in back up.
   *
   * The queue is rebuilt by replaying the saved answers through a fresh flow
   * rather than being restored from storage, because questions carry
   * callbacks that JSON cannot hold. Replaying re-runs those callbacks, which
   * is what brings back every adaptive branch and, importantly, the crisis
   * flag — losing that on a reload would be the one unacceptable outcome.
   */
  function resumeChat() {
    const saved = loadDraft();
    if (!saved) {
      setResumable(null);
      return;
    }
    const { asked, pending, crisis: wasCrisis } = replayFlow(saved.depth, saved.answers);

    answersRef.current = { ...saved.answers };
    pendingRef.current = pending;
    historyRef.current = [];
    depthRef.current = saved.depth;
    setDepth(saved.depth);
    setResumable(null);
    setDemoProfile(null);
    setCrisis(wasCrisis);

    // A compact transcript of what was already answered, so the thread reads
    // continuously instead of starting mid-sentence with no context.
    const restored: ChatMessage[] = [];
    for (const q of asked) {
      const v = saved.answers[q.id];
      if (v === undefined) continue;
      restored.push({ id: nextMsgId(), isBot: true, text: q.text });
      restored.push({ id: nextMsgId(), isUser: true, text: answerLabel(q, v) });
    }
    setMessages(restored);
    setScreen("chat");
    say(["Picking up where you left off. Everything you answered is still here."], next);
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
    /* Optional lifestyle items: `undefined` where a question was never asked,
       which is not the same as a zero. The snapshot renders only the domains
       it actually has answers for, so a quick check reports a smaller picture
       honestly rather than filling the gaps with assumed good scores. */
    const num = (k: string) => (A[k] !== undefined ? Number(A[k]) : undefined);
    const raw: RawAnswers = {
      depth: depthRef.current,
      move: num("move"),
      meals: num("meals"),
      hydrate: num("hydrate"),
      social: num("social"),
      screenEve: num("screenEve"),
      recovery: num("recovery"),
      environment: num("environment"),
      purpose: num("purpose"),
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
    clearDraft();
    setResumable(null);
    say(["Done. Thank you for being straight with me.", "Putting your snapshot together…"], () => {
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
    // The draft lives under its own key, so a delete that skipped it would
    // leave a half-finished check-in behind after the app promised otherwise.
    clearDraft();
    setResumable(null);
    answersRef.current = {};
    pendingRef.current = [];
    setProfile(null);
    setDemoProfile(null);
    setCheckins({});
    setHabitsDone({});
    setWeeklyDone({});
    setJournal([]);
    setCrisis(false);
    setSettings(DEFAULT_SETTINGS);
    setScreen("home");
    /* The safe place keeps its own keys (lib/haven.ts) and its own state.
       "Delete all my data" has to mean all of it, so it is told directly
       rather than trusted to notice. */
    if (typeof window !== "undefined") window.dispatchEvent(new Event("wellbeings:delete-all"));
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
  /** Saves an entry and reports back whether the text tripped the crisis
      check, so the caller can offer helplines rather than storing silently. */
  function addJournalEntry(promptId: string, kind: JournalEntry["kind"], text: string): { flagged: boolean } {
    const entry: JournalEntry = {
      at: new Date().toISOString(),
      promptId,
      kind,
      text,
      words: countWords(text),
    };
    const nextJournal = [...journal, entry];
    setJournal(nextJournal);
    persist({ journal: nextJournal });
    return { flagged: mentionsCrisis(text) };
  }

  function deleteJournalEntry(at: string) {
    const nextJournal = journal.filter((e) => e.at !== at);
    setJournal(nextJournal);
    persist({ journal: nextJournal });
  }

  function setTheme(v: Theme) {
    setSettings((prev) => {
      const next = { ...prev, theme: v };
      persist({ settings: next });
      applyDisplayPrefs(next);
      return next;
    });
  }
  function setScale(v: number) {
    setSettings((prev) => {
      const next = { ...prev, scale: v };
      persist({ settings: next });
      applyDisplayPrefs(next);
      return next;
    });
  }
  function setContrast(v: boolean) {
    setSettings((prev) => {
      const next = { ...prev, contrast: v };
      persist({ settings: next });
      applyDisplayPrefs(next);
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

  function setLang(v: Lang) {
    setSettings((prev) => {
      const next = { ...prev, lang: v };
      persist({ settings: next });
      applyDisplayPrefs(next);
      return next;
    });
  }

  function setShowCitations(v: boolean) {
    setSettings((prev) => {
      const next = { ...prev, showCitations: v };
      persist({ settings: next });
      return next;
    });
  }

  const region = useMemo(
    () => HELPLINES[(activeProfile?.region as keyof typeof HELPLINES) || DEFAULT_REGION] || HELPLINES[DEFAULT_REGION],
    [activeProfile]
  );

  const todayKey = dateKey(0);
  const todayCheckin = checkins[todayKey] || {};

  return {
    screen,
    setScreen,
    tab,
    setTab,
    handoff,
    dismissHandoff: () => setHandoff(null),
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
    depth,
    /* Null unless an unfinished check-in is sitting on this device. The
       welcome screen offers it; nothing resumes on its own. */
    resumable,
    resumeChat,
    discardDraft: () => {
      clearDraft();
      setResumable(null);
    },
    progSec,
    progPct: Math.round((progN / totalSections(depth)) * 100),
    progLabel: t(settings.lang).partOf(progN, totalSections(depth)),
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
    setTheme,
    setScale,
    setContrast,
    setLang,
    setShowCitations,
    /** Translated UI strings for the current language — see lib/i18n.ts. */
    s: t(settings.lang),
    journal,
    addJournalEntry,
    deleteJournalEntry,
  };
}

export type Wellbeings = ReturnType<typeof useWellbeings>;
