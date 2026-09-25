"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Arrival, careLevel, CareLevel, dailyPattern, dawnLevel, localDateKey, Score, Safety } from "@/lib/care";
import {
  CareTeam,
  clearHaven,
  downscalePhoto,
  EMPTY_HAVEN,
  guessRegion,
  HavenState,
  HopeItem,
  loadHaven,
  loadPhotos,
  newId,
  Photo,
  SafetyPlan,
  saveHaven,
  savePhotos,
} from "@/lib/haven";
import type { Region } from "@/lib/types";

/** A photo cap, not a storage estimate: eight is enough faces to scroll
    through in a bad minute and small enough to never crowd out the rest. */
export const MAX_PHOTOS = 8;

/** Six hours away counts as coming back rather than still being here. */
const RETURN_GAP_MS = 6 * 3_600_000;

export type DawnStep = "arrive" | "breathe" | "ground" | "grateful" | "hope" | "watch" | "plan" | "reach" | "tiny" | "letter";

export function useHaven() {
  const [state, setState] = useState<HavenState>(EMPTY_HAVEN);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [ready, setReady] = useState(false);
  /* Set once per load, from what was stored before this visit touched
     anything. Drives the "welcome back" greeting after a hard stretch, the
     one place the app acts like a caring contact rather than a tool. */
  const [returning, setReturning] = useState<{ after: CareLevel } | null>(null);
  /* The latest state for writers. Kept in step by `update` and the load
     effect, never assigned during render, so two writes in one event (a
     check-in and the dawn step it earns) build on each other instead of
     the second overwriting the first. */
  const stateRef = useRef(state);

  useEffect(() => {
    const loaded = loadHaven();
    const now = new Date();
    const prevLevel = careLevel(loaded.arrivals, now);
    const away = loaded.lastVisit ? now.getTime() - Date.parse(loaded.lastVisit) : 0;
    if (loaded.lastVisit && away > RETURN_GAP_MS && (prevLevel === "heavy" || prevLevel === "thoughts" || prevLevel === "urgent")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReturning({ after: prevLevel });
    }
    const today = localDateKey(now);
    const next: HavenState = {
      ...loaded,
      region: loaded.region ?? guessRegion(),
      dawn: loaded.dawn.date === today ? loaded.dawn : { date: today, steps: [] },
      lastVisit: now.toISOString(),
    };
    stateRef.current = next;
    setState(next);
    saveHaven(next);
    setPhotos(loadPhotos());
    setReady(true);
  }, []);

  /** Every write goes through here so storage and state never disagree. */
  const update = useCallback((fn: (s: HavenState) => HavenState) => {
    const next = fn(stateRef.current);
    stateRef.current = next;
    setState(next);
    saveHaven(next);
    return next;
  }, []);

  const markStep = useCallback(
    (step: DawnStep) => {
      update((s) => {
        const today = localDateKey(new Date());
        const steps = s.dawn.date === today ? s.dawn.steps : [];
        if (steps.includes(step)) return s.dawn.date === today ? s : { ...s, dawn: { date: today, steps } };
        return { ...s, dawn: { date: today, steps: [...steps, step] } };
      });
    },
    [update]
  );

  const addArrival = useCallback(
    (mood: Score, hope: Score, safety?: Safety): CareLevel => {
      const arrival: Arrival = { at: new Date().toISOString(), mood, hope, ...(safety ? { safety } : {}) };
      const next = update((s) => ({ ...s, arrivals: [...s.arrivals, arrival] }));
      markStep("arrive");
      setReturning(null);
      return careLevel(next.arrivals);
    },
    [update, markStep]
  );

  const addGoodThings = useCallback(
    (items: string[]) => {
      const clean = items.map((x) => x.trim()).filter(Boolean);
      if (!clean.length) return;
      const today = localDateKey(new Date());
      update((s) => {
        const existing = s.goodThings.find((g) => g.date === today);
        const goodThings = existing
          ? s.goodThings.map((g) => (g.date === today ? { ...g, items: [...g.items, ...clean] } : g))
          : [...s.goodThings, { date: today, items: clean }];
        return { ...s, goodThings };
      });
      markStep("grateful");
    },
    [update, markStep]
  );

  const addHope = useCallback(
    (item: Omit<HopeItem, "id" | "at">) => {
      update((s) => ({ ...s, hope: [...s.hope, { ...item, id: newId(), at: new Date().toISOString() }] }));
      markStep("hope");
    },
    [update, markStep]
  );

  const removeHope = useCallback((id: string) => update((s) => ({ ...s, hope: s.hope.filter((h) => h.id !== id) })), [update]);

  const setLetter = useCallback(
    (text: string) => {
      update((s) => ({ ...s, letter: text.trim() ? { text: text.trim(), at: new Date().toISOString() } : null }));
      if (text.trim()) markStep("letter");
    },
    [update, markStep]
  );

  const savePlan = useCallback(
    (plan: SafetyPlan) => {
      update((s) => ({ ...s, plan: { ...plan, updatedAt: new Date().toISOString() } }));
      markStep("plan");
    },
    [update, markStep]
  );

  const setCare = useCallback((care: CareTeam | null) => update((s) => ({ ...s, care })), [update]);
  const setRegion = useCallback((region: Region) => update((s) => ({ ...s, region })), [update]);
  const markIntroSeen = useCallback(() => update((s) => ({ ...s, introSeen: true })), [update]);

  const addPhoto = useCallback(
    async (file: File, caption: string): Promise<{ ok: true } | { ok: false; reason: string }> => {
      if (photos.length >= MAX_PHOTOS) return { ok: false, reason: `The box holds ${MAX_PHOTOS} photos. Remove one to add another.` };
      let src: string;
      try {
        src = await downscalePhoto(file);
      } catch {
        return { ok: false, reason: "That file couldn't be read as a photo." };
      }
      const next = [...photos, { id: newId(), src, caption: caption.trim(), at: new Date().toISOString() }];
      if (!savePhotos(next)) return { ok: false, reason: "This browser's storage is full, so the photo wasn't saved." };
      setPhotos(next);
      markStep("hope");
      return { ok: true };
    },
    [photos, markStep]
  );

  const removePhoto = useCallback(
    (id: string) => {
      const next = photos.filter((p) => p.id !== id);
      savePhotos(next);
      setPhotos(next);
    },
    [photos]
  );

  const reset = useCallback(() => {
    clearHaven();
    const fresh = { ...EMPTY_HAVEN, introSeen: true, region: guessRegion() };
    stateRef.current = fresh;
    setState(fresh);
    setPhotos([]);
    setReturning(null);
  }, []);

  // "Delete all my data" in the lifestyle side of the app reaches here too.
  useEffect(() => {
    window.addEventListener("wellbeings:delete-all", reset);
    return () => window.removeEventListener("wellbeings:delete-all", reset);
  }, [reset]);

  const level = useMemo(() => careLevel(state.arrivals), [state.arrivals]);
  const latest = state.arrivals.length ? state.arrivals[state.arrivals.length - 1] : null;
  const pattern = useMemo(() => dailyPattern(state.arrivals), [state.arrivals]);
  const todayKey = localDateKey(new Date());
  const stepsToday = state.dawn.date === todayKey ? state.dawn.steps.length : 0;

  return {
    ready,
    state,
    photos,
    level,
    latest,
    pattern,
    returning,
    dawn: dawnLevel(stepsToday),
    stepsToday,
    goodToday: state.goodThings.find((g) => g.date === todayKey)?.items ?? [],
    addArrival,
    addGoodThings,
    addHope,
    removeHope,
    setLetter,
    savePlan,
    setCare,
    setRegion,
    markIntroSeen,
    markStep,
    addPhoto,
    removePhoto,
    reset,
  };
}

export type Haven = ReturnType<typeof useHaven>;
