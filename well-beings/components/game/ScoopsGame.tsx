"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CAST,
  LEADER,
  POWER_NAMES,
  SPECIAL_NAMES,
  badges,
  emptyInput,
  newGame,
  playerOf,
  rivalOf,
  update,
  type Ammo,
  type Game,
  type GameEvent,
  type Look,
  type Pace,
  type PowerKind,
  type Sky,
  type Team,
} from "@/lib/game/engine";
import { Renderer } from "@/lib/game/render";
import { drawCone, drawCritter, drawPowerIcon, drawSkyline, drawSnowball } from "@/lib/game/art";
import { play as sound } from "@/lib/game/sound";
import { tick } from "@/lib/haptics";
import { unlockSfx } from "@/lib/sfx";
import { setMusicMood } from "@/lib/ambient";
import { moodForHour } from "@/lib/ambient-core.mjs";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Scoops & Snowballs, the game: a screen over the safe place, below the
 * crisis strip, which stays where it always is. "Help now" is in the
 * game's own top bar too, and opens the urgent screen over the game,
 * pausing it.
 *
 * Nothing about a round is kept: no scores, no streaks, no "come back
 * tomorrow". It is something to do with your hands and eyes for a few
 * minutes, which is a real way through a bad hour (distraction is a step
 * in the Stanley-Brown safety plan), and then it ends with two friends
 * holding hands. The badges on the last card are for this round only.
 *
 * The rules live in lib/game/engine.ts, the drawing in lib/game/render.ts.
 * This file is the screen round them: the choices, the controls, the bars,
 * the sounds and the card at the end. Bars and timers are written straight
 * to the page once a frame, never through React state.
 */

type SkyChoice = "clock" | "day" | "night";
const TEAM_COPY: Record<Team, { title: string; who: string }> = {
  dog: { title: "Team Dog", who: "Biscuit, with Pip and Bao" },
  cat: { title: "Team Cat", who: "Miso, with Inky and Mochi" },
};

function skyFor(choice: SkyChoice): Sky {
  if (choice !== "clock") return choice;
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "day" : "night";
}

/** Small portraits for the bars and the team choice. */
function Portrait({ looks, size, face = 1 }: { looks: Look[]; size: number; face?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = looks.join(",");
  useEffect(() => {
    const looks = key.split(",") as Look[];
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = size * (looks.length > 1 ? 2.2 : 1);
    c.width = w * dpr;
    c.height = size * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const s = size / 52;
    looks.forEach((look, i) => {
      ctx.save();
      const x = looks.length > 1 ? w * (0.5 + (i === 0 ? 0 : i === 1 ? -0.3 : 0.3)) : w / 2;
      const y = size * (looks.length > 1 && i > 0 ? 0.95 : 0.98);
      ctx.translate(x - 4 * s * face, y);
      ctx.scale(s * (i > 0 ? 0.8 : 1), s * (i > 0 ? 0.8 : 1));
      drawCritter(ctx, look, { t: 1 + i, walk: 0, moving: false, face: i === 2 ? -face : face, hitT: 0, throwT: 0, sit: false, stains: [], happy: false, hold: false, hop: 0, chilly: false, scale: 1, seed: i });
      ctx.restore();
    });
  }, [key, size, face]);
  return <canvas ref={ref} aria-hidden="true" style={{ width: size * (looks.length > 1 ? 2.2 : 1), height: size }} />;
}

function PowerChip({ kind }: { kind: PowerKind }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = 22 * dpr;
    c.height = 22 * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr * 0.7, dpr * 0.7);
    ctx.translate(15.7, 17);
    drawPowerIcon(ctx, kind, 0);
  }, [kind]);
  return <canvas ref={ref} aria-hidden="true" style={{ width: 22, height: 22 }} />;
}

interface Hud {
  ammo: Ammo;
  ready: boolean;
  powers: { kind: PowerKind; left: string }[];
}

interface Card {
  won: boolean;
  rival: string;
  me: string;
  hits: number;
  treats: number;
  pals: number;
  badges: string[];
}

export function ScoopsGame({ onClose, openUrgent }: { onClose: () => void; openUrgent: () => void }) {
  const reduced = useReducedMotion();
  const [screen, setScreen] = useState<"menu" | "play">("menu");
  const [team, setTeam] = useState<Team>("dog");
  const [skyChoice, setSkyChoice] = useState<SkyChoice>("clock");
  const [pace, setPace] = useState<Pace>("gentle");
  const [round, setRound] = useState(0);
  const [paused, setPaused] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [hud, setHud] = useState<Hud>({ ammo: "scoop", ready: false, powers: [] });
  const [say, setSay] = useState("");
  /* Only ever rendered after a tap on Play, so the window is there. */
  /* The round is over (someone is splatted out): the controls go away. */
  const [over, setOver] = useState(false);
  const [touch] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches);
  const [top, setTop] = useState(0);

  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const rendRef = useRef<Renderer | null>(null);
  const input = useRef(emptyInput());
  const keys = useRef(new Set<string>());
  const stick = useRef<{ id: number; ox: number; oy: number; x: number; y: number } | null>(null);
  const pausedRef = useRef(false);
  const meBar = useRef<HTMLSpanElement>(null);
  const rivalBar = useRef<HTMLSpanElement>(null);
  const meBarLabel = useRef<HTMLSpanElement>(null);
  const rivalBarLabel = useRef<HTMLSpanElement>(null);
  const specialBtn = useRef<HTMLButtonElement>(null);
  const toast = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /* Below the crisis strip, which stays on top of everything but the
     urgent screen. The page under the game does not scroll. */
  useEffect(() => {
    const measure = () => setTop(document.querySelector(".crisis-strip")?.getBoundingClientRect().bottom ?? 0);
    measure();
    window.addEventListener("resize", measure);
    document.documentElement.classList.add("game-open");
    root.current?.focus();
    return () => {
      window.removeEventListener("resize", measure);
      document.documentElement.classList.remove("game-open");
      setMusicMood(null);
    };
  }, []);

  const showToast = useCallback((text: string) => {
    const el = toast.current;
    if (!el) return;
    el.textContent = text;
    el.classList.remove("is-on");
    void el.offsetWidth;
    el.classList.add("is-on");
  }, []);

  /* ── the title card: the skyline, with the two of them mid-throw ── */
  useEffect(() => {
    if (screen !== "menu") return;
    const c = canvas.current;
    if (!c) return;
    const night = skyFor(skyChoice) === "night";
    let raf = 0;
    let sky: HTMLCanvasElement | null = null;
    const t0 = performance.now();
    const draw = () => {
      const rect = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = rect.width;
      const h = rect.height;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr) || !sky) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
        sky = document.createElement("canvas");
        sky.width = c.width;
        sky.height = c.height;
        const s = sky.getContext("2d")!;
        s.scale(dpr, dpr);
        drawSkyline(s, w, h, night, 0);
      }
      const ctx = c.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(sky, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = reduced ? 1.2 : (performance.now() - t0) / 1000;
      const gy = h * 0.8 + Math.min(40, h * 0.06);
      const sc = Math.max(1.4, Math.min(2.6, w / 300));
      const lx = w * 0.18;
      const rx = w * 0.82;
      const loop = (t % 2.4) / 2.4;
      for (const [x, look, face] of [[lx, "biscuit", 1], [rx, "miso", -1]] as [number, Look, number][]) {
        ctx.save();
        ctx.translate(x, gy);
        ctx.scale(sc, sc);
        drawCritter(ctx, look, { t, walk: 0, moving: false, face, hitT: 0, throwT: (look === "biscuit" ? loop < 0.12 : loop > 0.5 && loop < 0.62) ? 0.14 : 0, sit: false, stains: [], happy: false, hold: false, hop: 0, chilly: false, scale: 1, seed: face });
        ctx.restore();
      }
      /* A cone flies right, a snowball flies left, forever, gently. */
      const arc = (k: number, a: number, b: number) => ({ x: a + (b - a) * k, y: gy - 30 * sc - Math.sin(k * Math.PI) * h * 0.18 });
      const k1 = Math.min(1, loop / 0.5);
      const k2 = Math.max(0, Math.min(1, (loop - 0.5) / 0.5));
      if (loop < 0.5) {
        const p = arc(k1, lx + 20 * sc, rx - 16 * sc);
        ctx.save();
        ctx.translate(p.x, p.y);
        drawCone(ctx, "#FF7AB0", k1 * 9, sc * 0.9);
        ctx.restore();
      } else {
        const p = arc(k2, rx - 20 * sc, lx + 16 * sc);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(sc * 0.9, sc * 0.9);
        drawSnowball(ctx, 8, k2 * 6);
        ctx.restore();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(() => {
      sky = null;
      if (reduced) draw();
    });
    ro.observe(c);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [screen, skyChoice, reduced]);

  /* ── a round ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (screen !== "play") return;
    const c = canvas.current;
    if (!c) return;
    const sky = skyFor(skyChoice);
    /* The music follows the game's sky: the morning or day version under
       the sun, the night version under the snow. */
    setMusicMood(sky === "night" ? "night" : moodForHour(new Date().getHours()) === "night" ? "day" : moodForHour(new Date().getHours()));
    const g = newGame({ team, sky, pace, reduced });
    const r = new Renderer(c, sky === "night", reduced);
    r.setCity(g);
    const cs = getComputedStyle(document.documentElement);
    r.font = cs.getPropertyValue("--font-display").trim() || r.font;
    gameRef.current = g;
    rendRef.current = r;
    /* The end-to-end tests (and only they, by the same session flag that
       skips the sunrise) reach the game's state to skip to the ending. */
    try {
      if (sessionStorage.getItem("arun-intro-session") === "e2e") Object.assign(window, { __scoops: g, __scoopsTime: { update: [] as number[], draw: [] as number[] } });
    } catch {
      // No session storage: no hook.
    }
    input.current = emptyInput();
    setCard(null);
    setPaused(false);
    setOver(false);
    const fit = () => {
      const rect = c.getBoundingClientRect();
      r.resize(rect.width, rect.height, window.devicePixelRatio || 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);

    let raf = 0;
    let last = performance.now();
    let hudT = 0;
    let shown = false;
    const pads = { a: false, b: false, x: false, start: false };
    const me = playerOf(g);
    const rival = rivalOf(g);

    const onEvent = (e: GameEvent) => {
      switch (e.k) {
        case "ready":
          showToast("Ready…");
          sound("ready");
          break;
        case "go":
          showToast("Splat!");
          sound("go");
          setSay(`Go. Find ${rival.name}, and your pals on the way.`);
          break;
        case "throw":
          if (e.player) sound("throw", e.ammo === "scoop" ? 1 : 0.8);
          break;
        case "hit":
          if (e.onPlayer) {
            sound("gotHit");
            tick("light");
          } else if (e.byPlayer) {
            sound(e.ammo === "mega" ? "mega" : e.ammo === "snow" ? "snow" : "scoop", 1 + Math.min(4, e.combo - 1) * 0.08);
            tick("soft");
          }
          break;
        case "wall":
          if (e.near) sound("wall", e.ammo === "scoop" ? 1 : 1.3);
          break;
        case "pickup":
          if (e.player) {
            sound("pickup");
            tick("success");
            showToast(`${POWER_NAMES[e.kind]}!`);
            setSay(`${POWER_NAMES[e.kind]}.`);
          }
          break;
        case "recruit":
          sound(team === "dog" ? (e.player ? "woof" : "mew") : e.player ? "mew" : "woof");
          if (e.player) {
            tick("success");
            showToast(`${e.name} joined your team!`);
            setSay(`${e.name} joined your team.`);
          } else setSay(`${e.name} joined ${rival.name}.`);
          break;
        case "block":
          sound("block");
          break;
        case "special":
          sound("special");
          if (e.player) tick("success");
          showToast(`${SPECIAL_NAMES[e.team]}!`);
          setSay(`${e.player ? "Your" : `${rival.name}'s`} ${SPECIAL_NAMES[e.team]}.`);
          break;
        case "low":
          setSay(e.player ? "Your bar is getting low. A cupcake would help." : `${e.name} is nearly all splatted out.`);
          break;
        case "honk":
          if (e.near) sound("honk");
          break;
        case "out":
          setOver(true);
          sound("out");
          showToast(`${e.name} is all splatted out!`);
          setSay(`${e.name} is all splatted out. Nobody gets hurt. Watch what happens next.`);
          break;
        case "hands":
          sound("hands");
          tick("success");
          showToast("Friends again");
          setSay("They're holding hands. Friends again.");
          for (let i = 0; i < 8; i++) setTimeout(() => sound("pop", 1 + i * 0.08), 500 + i * 160);
          break;
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const inp = input.current;
      /* Keys and the on-screen stick become one movement. */
      let mx = 0;
      let my = 0;
      const k = keys.current;
      if (k.has("ArrowLeft") || k.has("a")) mx -= 1;
      if (k.has("ArrowRight") || k.has("d")) mx += 1;
      if (k.has("ArrowUp") || k.has("w")) my -= 1;
      if (k.has("ArrowDown") || k.has("s")) my += 1;
      if (mx && my) {
        mx *= Math.SQRT1_2;
        my *= Math.SQRT1_2;
      }
      const st = stick.current;
      if (st) {
        const dx = st.x - st.ox;
        const dy = st.y - st.oy;
        const len = Math.hypot(dx, dy);
        const m = Math.min(1, len / 46);
        if (len > 6) {
          mx = (dx / len) * m;
          my = (dy / len) * m;
        }
      }
      /* A game controller, if one is plugged in. */
      const gp = navigator.getGamepads?.()[0];
      if (gp) {
        const ax = gp.axes[0] ?? 0;
        const ay = gp.axes[1] ?? 0;
        if (Math.hypot(ax, ay) > 0.2) {
          mx = ax;
          my = ay;
        }
        const a = !!gp.buttons[0]?.pressed;
        const b = !!gp.buttons[1]?.pressed;
        const x = !!gp.buttons[2]?.pressed;
        const start = !!gp.buttons[9]?.pressed;
        if (a && !pads.a) inp.fire = true;
        inp.holdFire = inp.holdFire || a;
        if (b && !pads.b) inp.swap = true;
        if (x && !pads.x) inp.special = true;
        if (start && !pads.start) setPaused((p) => !p);
        Object.assign(pads, { a, b, x, start });
      }
      inp.mx = mx;
      inp.my = my;
      const timing = (window as unknown as { __scoopsTime?: { update: number[]; draw: number[] } }).__scoopsTime;
      const t0 = timing ? performance.now() : 0;
      if (!pausedRef.current) {
        update(g, dt, inp);
        if (gp && !gp.buttons[0]?.pressed && !keys.current.has(" ")) inp.holdFire = false;
      }
      inp.aim = null;
      const t1 = timing ? performance.now() : 0;
      r.draw(g, pausedRef.current ? 0 : dt);
      if (timing && timing.draw.length < 2000) {
        timing.update.push(t1 - t0);
        timing.draw.push(performance.now() - t1);
      }
      for (const e of g.events) onEvent(e);
      g.events.length = 0;

      /* The bars, written straight to the page. */
      const mp = Math.max(0, me.hp / me.maxHp);
      const rp = Math.max(0, rival.hp / rival.maxHp);
      if (meBar.current) meBar.current.style.transform = `scaleX(${mp})`;
      if (rivalBar.current) rivalBar.current.style.transform = `scaleX(${rp})`;
      specialBtn.current?.style.setProperty("--charge", String(me.special));
      hudT -= dt;
      if (hudT <= 0) {
        hudT = 0.25;
        if (meBarLabel.current) meBarLabel.current.textContent = `${Math.ceil(mp * 100)}`;
        if (rivalBarLabel.current) rivalBarLabel.current.textContent = `${Math.ceil(rp * 100)}`;
        const powers: Hud["powers"] = [];
        if (me.triple > 0) powers.push({ kind: "triple", left: `×${me.triple}` });
        if (me.mega > 0) powers.push({ kind: "mega", left: `×${me.mega}` });
        if (me.dash > 0) powers.push({ kind: "dash", left: `${Math.ceil(me.dash)}s` });
        if (me.shield > 0) powers.push({ kind: "umbrella", left: `${Math.ceil(me.shield)}s` });
        setHud((h) => {
          const ready = me.special >= 1;
          const same = h.ammo === me.ammo && h.ready === ready && h.powers.length === powers.length && h.powers.every((p, i) => p.kind === powers[i].kind && p.left === powers[i].left);
          return same ? h : { ammo: me.ammo, ready, powers };
        });
      }
      if (g.phase === "done" && !shown) {
        shown = true;
        setCard({ won: g.winner === g.playerTeam, rival: rival.name, me: me.name, hits: g.stats.hits, treats: g.stats.treats, pals: g.stats.pals, badges: badges(g) });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const hide = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", hide);
      gameRef.current = null;
      rendRef.current = null;
    };
  }, [screen, round, team, skyChoice, pace, reduced, showToast]);

  /* ── keyboard ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (screen !== "play") return;
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("button, a, input") && (e.key === " " || e.key === "Enter")) return;
      if (document.querySelector(".urgent")) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === "Escape" || key === "p") {
        e.preventDefault();
        setPaused((p) => !p);
        return;
      }
      if (pausedRef.current) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(key)) e.preventDefault();
      keys.current.add(key);
      if (!e.repeat && (key === " " || key === "j")) {
        input.current.fire = true;
        input.current.holdFire = true;
      }
      if (!e.repeat && (key === "q" || key === "k")) input.current.swap = true;
      if (!e.repeat && (key === "e" || key === "l")) input.current.special = true;
    };
    const up = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      keys.current.delete(key);
      if (key === " " || key === "j") input.current.holdFire = false;
    };
    const blur = () => {
      keys.current.clear();
      input.current.holdFire = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen]);

  /* ── touch and mouse on the city ─────────────────────────────────── */
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "play" || pausedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const r = rendRef.current;
    if (e.pointerType === "mouse") {
      if (e.button === 2) {
        input.current.swap = true;
        return;
      }
      if (r) {
        input.current.aim = r.toWorld(x, y);
        input.current.fire = true;
      }
      return;
    }
    if (x < rect.width * 0.5 && !stick.current) {
      /* Left half: a stick appears under the thumb. */
      /* Capture keeps the stick when the thumb slides off the canvas; it can
         throw for a pointer the browser no longer tracks, and the stick
         must work either way. */
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Not captured; moves over the canvas still steer.
      }
      stick.current = { id: e.pointerId, ox: x, oy: y, x, y };
      if (base.current) {
        base.current.style.transform = `translate(${x - 46}px, ${y - 46}px)`;
        base.current.classList.add("is-on");
      }
      if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
    } else if (r) {
      /* Right half: throw at the spot tapped. */
      input.current.aim = r.toWorld(x, y);
      input.current.fire = true;
    }
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = stick.current;
    if (!st || st.id !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    st.x = e.clientX - rect.left;
    st.y = e.clientY - rect.top;
    const dx = st.x - st.ox;
    const dy = st.y - st.oy;
    const len = Math.hypot(dx, dy);
    const m = Math.min(len, 40) / (len || 1);
    if (knob.current) knob.current.style.transform = `translate(${dx * m}px, ${dy * m}px)`;
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stick.current?.id !== e.pointerId) return;
    stick.current = null;
    base.current?.classList.remove("is-on");
  };

  const start = () => {
    unlockSfx();
    setScreen("play");
    setRound((n) => n + 1);
  };

  const leave = () => {
    setMusicMood(null);
    onClose();
  };

  const help = () => {
    setPaused(true);
    openUrgent();
  };

  const me = CAST[LEADER[team]];
  const rivalTeam: Team = team === "dog" ? "cat" : "dog";
  const rival = CAST[LEADER[rivalTeam]];

  /* Into the body, not the room: a room slides in on a transform, and a
     transform makes a fixed layer fixed to the room instead of the screen
     (the first build showed the game boxed inside the Watch column). */
  return createPortal(
    <div
      className={`game${screen === "play" ? " is-playing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Scoops and Snowballs"
      ref={root}
      tabIndex={-1}
      style={{ top }}
    >
      <canvas
        ref={canvas}
        className="game-canvas"
        role="img"
        aria-label={screen === "menu" ? "A city skyline. A dog and a cat throw an ice cream and a snowball at each other." : `The city. ${me.name} and ${rival.name} are splatting each other with ice cream and snowballs.`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="game-top">
        <button type="button" className="game-chip" onClick={leave}>
          <span aria-hidden="true">←</span> Back
        </button>
        {screen === "play" && (
          <div className="game-bars">
            <div className="game-bar is-me">
              <Portrait looks={[LEADER[team]]} size={30} />
              <span className="game-bar-name">{me.name}</span>
              <span className="game-track" role="img" aria-label={`${me.name}'s bar`}>
                <span className="game-fill" ref={meBar} />
              </span>
              <span className="game-num" ref={meBarLabel}>
                100
              </span>
            </div>
            <div className="game-bar is-rival">
              <Portrait looks={[LEADER[rivalTeam]]} size={30} face={-1} />
              <span className="game-bar-name">{rival.name}</span>
              <span className="game-track" role="img" aria-label={`${rival.name}'s bar`}>
                <span className="game-fill" ref={rivalBar} />
              </span>
              <span className="game-num" ref={rivalBarLabel}>
                100
              </span>
            </div>
          </div>
        )}
        <div className="game-top-end">
          {screen === "play" && !over && (
            <button type="button" className="game-chip" onClick={() => setPaused(true)} aria-label="Pause">
              <span aria-hidden="true">❚❚</span>
            </button>
          )}
          <button type="button" className="game-chip game-help" onClick={help}>
            Help now
          </button>
        </div>
      </div>

      {screen === "play" && hud.powers.length > 0 && (
        <ul className="game-powers" aria-label="Power-ups you have">
          {hud.powers.map((p) => (
            <li key={p.kind}>
              <PowerChip kind={p.kind} />
              <span>
                {POWER_NAMES[p.kind]} {p.left}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="game-toast" ref={toast} aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        {say}
      </p>

      {screen === "menu" && (
        <div className="game-menu">
          <h2 className="game-title">Scoops &amp; Snowballs</h2>
          <p className="game-sub">Dogs vs cats, all over the city. Nobody gets hurt, and everyone makes up in the end.</p>
          <fieldset className="game-pick">
            <legend>Play as</legend>
            <div className="game-teams">
              {(["dog", "cat"] as Team[]).map((t) => (
                <label key={t} className={`game-team${team === t ? " is-on" : ""}`}>
                  <input type="radio" name="game-team" value={t} checked={team === t} onChange={() => setTeam(t)} />
                  <Portrait looks={t === "dog" ? ["biscuit", "pip", "bao"] : ["miso", "inky", "mochi"]} size={44} face={t === "dog" ? 1 : -1} />
                  <span>
                    <strong>{TEAM_COPY[t].title}</strong>
                    <small>{TEAM_COPY[t].who}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="game-row">
            <fieldset className="game-pick">
              <legend>Sky</legend>
              <div className="game-seg">
                {(
                  [
                    ["clock", "My clock"],
                    ["day", "Day"],
                    ["night", "Night"],
                  ] as [SkyChoice, string][]
                ).map(([v, label]) => (
                  <label key={v} className={skyChoice === v ? "is-on" : ""}>
                    <input type="radio" name="game-sky" value={v} checked={skyChoice === v} onChange={() => setSkyChoice(v)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="game-pick">
              <legend>Pace</legend>
              <div className="game-seg">
                {(
                  [
                    ["gentle", "Gentle"],
                    ["lively", "Lively"],
                  ] as [Pace, string][]
                ).map(([v, label]) => (
                  <label key={v} className={pace === v ? "is-on" : ""}>
                    <input type="radio" name="game-pace" value={v} checked={pace === v} onChange={() => setPace(v)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <button type="button" className="btn btn-sun game-play" onClick={start}>
            Play
          </button>
          <details className="game-how">
            <summary>How to play</summary>
            <ul>
              <li>Splat {rival.name} with ice cream and snowballs until their bar runs out. Snowballs are slower and leave them chilly.</li>
              <li>Find your two pals in the streets: walk up to them and they join in. Green arrows point the way, pink ones to {rival.name}.</li>
              <li>Treats in the street: a triple scoop, a mega snowball, sprinkle dash, an umbrella that blocks, and a cupcake that perks you up.</li>
              <li>Land splats to charge your special: {SPECIAL_NAMES[team]}.</li>
              <li>On a phone: a stick under your left thumb, tap the right side to throw there, or hold Throw. On a keyboard: WASD or arrows, Space to throw, Q to swap, E for the special, P to pause.</li>
            </ul>
          </details>
        </div>
      )}

      {screen === "play" && !over && (
        <>
          <div className="game-stick" ref={base} aria-hidden="true">
            <div className="game-knob" ref={knob} />
          </div>
          <div className={`game-pad${touch ? "" : " is-keys"}`}>
            <button
              type="button"
              className="game-btn game-swap"
              onClick={() => (input.current.swap = true)}
              aria-label={hud.ammo === "scoop" ? "Switch to snowballs" : "Switch to ice cream"}
            >
              <AmmoIcon ammo={hud.ammo === "scoop" ? "snow" : "scoop"} />
            </button>
            <button
              type="button"
              className={`game-btn game-special${hud.ready ? " is-ready" : ""}`}
              ref={specialBtn}
              onClick={() => (input.current.special = true)}
              disabled={!hud.ready}
              aria-label={hud.ready ? `${SPECIAL_NAMES[team]}, ready` : `${SPECIAL_NAMES[team]}, charging`}
            >
              <span className="game-special-ring" aria-hidden="true" />
              <span aria-hidden="true">★</span>
            </button>
            <button
              type="button"
              className="game-btn game-throw"
              aria-label={hud.ammo === "scoop" ? "Throw an ice cream" : "Throw a snowball"}
              onPointerDown={(e) => {
                e.preventDefault();
                input.current.fire = true;
                input.current.holdFire = true;
              }}
              onPointerUp={() => (input.current.holdFire = false)}
              onPointerLeave={() => (input.current.holdFire = false)}
              onPointerCancel={() => (input.current.holdFire = false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  input.current.fire = true;
                }
              }}
            >
              <AmmoIcon ammo={hud.ammo} big />
            </button>
          </div>
        </>
      )}

      {paused && !card && screen === "play" && (
        <div className="game-sheet" role="dialog" aria-modal="true" aria-labelledby="game-paused">
          <h2 id="game-paused">Paused</h2>
          <div className="game-sheet-row">
            <button type="button" className="btn btn-sun" onClick={() => setPaused(false)} autoFocus>
              Keep playing
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setRound((n) => n + 1)}>
              Start over
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setScreen("menu")}>
              Change team or sky
            </button>
            <button type="button" className="btn btn-quiet" onClick={leave}>
              Leave the game
            </button>
          </div>
        </div>
      )}

      {card && (
        <div className="game-sheet game-card" role="dialog" aria-modal="true" aria-labelledby="game-card-title">
          <p className="game-card-emoji" aria-hidden="true">
            {team === "dog" ? "🐶" : "🐱"} 🤝 {team === "dog" ? "🐱" : "🐶"} 💕
          </p>
          <h2 id="game-card-title">Friends again</h2>
          <p className="game-card-line">
            {card.won ? `You splatted ${card.rival} out, and then you made up.` : `${card.rival} splatted you out, and then you made up.`} Nobody gets hurt in this
            city. Everybody gets ice cream.
          </p>
          <ul className="game-stats">
            <li>
              <strong>{card.hits}</strong> {card.hits === 1 ? "splat" : "splats"} landed
            </li>
            <li>
              <strong>{card.treats}</strong> {card.treats === 1 ? "treat" : "treats"} found
            </li>
            <li>
              <strong>{card.pals}</strong> of 2 pals found
            </li>
          </ul>
          {card.badges.length > 0 && (
            <ul className="game-badges" aria-label="This round">
              {card.badges.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          <div className="game-sheet-row">
            <button type="button" className="btn btn-sun" onClick={() => setRound((n) => n + 1)} autoFocus>
              Play again
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setScreen("menu")}>
              Change team or sky
            </button>
            <button type="button" className="btn btn-quiet" onClick={leave}>
              Back to Watch
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function AmmoIcon({ ammo, big = false }: { ammo: Ammo; big?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const size = big ? 40 : 26;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = size * dpr;
    c.height = size * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.translate(size / 2, size / 2);
    if (ammo === "scoop") {
      ctx.translate(0, -size * 0.06);
      drawCone(ctx, "#FF7AB0", -0.3, size / 26);
    } else drawSnowball(ctx, size * 0.3, 0);
  }, [ammo, size]);
  return <canvas ref={ref} aria-hidden="true" style={{ width: size, height: size }} />;
}
