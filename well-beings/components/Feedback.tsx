"use client";

import { useEffect, useRef } from "react";
import { tick, type TickKind } from "@/lib/haptics";
import { sfx, unlockSfx, type Sfx } from "@/lib/sfx";

/**
 * Feedback you can see, hear and (where the phone allows) feel, on every
 * page. One component in the root layout. It is Ronak's feel, brought to
 * Arun so the sister apps answer a touch the same way:
 *
 *   A tap: a ring of light where the finger lands (a bigger, pinker one on
 *   the big choices), a soft sound that says what kind of thing happened
 *   (a click, a pick, a page turning forward, a door closing, something
 *   kept), and a light tick.
 *
 *   Another room: a sweep of light down the screen, a page-turn sound and
 *   a double tick (HavenShell sends ROOM_EVENT).
 *
 *   Scrolling: a line of sunrise across the top fills as you go, and each
 *   card is outlined in dawn light as it arrives. The first time a card
 *   below the fold arrives it also glides up into place.
 *
 * WHAT IT COSTS. Everything that moves here is transform or opacity on
 * its own element, so the graphics chip does the work and the page is not
 * repainted. The first version drew the arrival glow as an animated
 * box-shadow on the card itself, which repainted the whole card on every
 * frame (measured: the largest single cost of a scroll on a 4x-slowed
 * phone). The glow is now its own element laid over the card. The scroll
 * line is driven by the browser itself where it can be (scroll-driven
 * animations), with no script at all.
 *
 * WHAT IT NEVER DOES. It only answers something the person just did; it
 * never fades text (the glow is drawn over the card's edge, and a card
 * glides at full contrast); a phone-number link and the urgent screen are
 * silent and still. Under prefers-reduced-motion nothing moves, but the
 * light stays: the ring and the glow fade in place, and the sweep becomes
 * a soft wash. None of it flashes more than once a second.
 */
export const ROOM_EVENT = "arun:room";

const TAPPABLE =
  "button, a[href], [role='switch'], [role='tab'], [role='radio'], summary, label.choice, .choice, input[type='checkbox'], input[type='radio']";
/* The big targets: the check-in answers, the choices, Ooh's bubble and
   the sun's own buttons get the bigger ring. */
const STRONG = ".choice, .tile, [role='radio'], .ooh-say, .ooh-go, .intro-wake, .btn-sun";
const SECTIONS =
  ".panel, .scene, .shelf, .deck, .hope-hero, .card, .install-panel, .sky, .site-main .prose > h2, .site-main .prose > .callout";
const NEVER = ".intro, .dialog, .urgent, .ooh-strip, .ooh-dock, .ooh-guide, .tabbar";
/* Only while scrolling: what is on screen when a page opens stays still. */
const SCROLL_WINDOW_MS = 450;
const GLOW_AGAIN_MS = 5000;
const MAX_GLOWS = 3;
const MAX_RINGS = 5;

function reduced() {
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function label(el: Element) {
  return `${el.getAttribute("aria-label") ?? ""} ${el.textContent ?? ""}`.trim().toLowerCase();
}

/** What a tap on this control sounds and feels like. */
function answer(t: Element): { sound: Sfx | null; feel: TickKind | null } | null {
  const href = t.getAttribute("href") ?? "";
  /* A phone number is serious: no sound, no buzz. So is the crisis strip. */
  if (href.startsWith("tel:") || href.startsWith("sms:") || t.closest(".crisis-strip, .urgent")) return null;
  /* Ooh makes its own sounds (next line, close); a tap on Ooh is felt faintly. */
  if (t.closest(".ooh-strip, .ooh-guide, .ooh-dock")) return { sound: null, feel: "soft" };
  /* Changing room has its own sound, sweep and double tick (ROOM_EVENT);
     a tick here as well would land within 60ms and swallow the double. */
  if (t.closest(".tabbar")) return { sound: null, feel: null };
  if (t.matches(".choice, [role='radio'], input[type='radio'], label.choice")) return { sound: "select", feel: "select" };
  if (t.matches("input[type='checkbox']")) return { sound: "check", feel: "select" };
  if (t.matches("summary")) {
    const open = (t.parentElement as HTMLDetailsElement | null)?.open;
    return { sound: open ? "collapse" : "expand", feel: "light" };
  }
  const pressed = t.getAttribute("aria-pressed") ?? t.getAttribute("aria-checked");
  if (t.matches("[role='switch']") || pressed !== null) {
    return { sound: pressed === "true" ? "toggle-off" : "toggle-on", feel: "select" };
  }
  const words = label(t);
  if (/^(delete|remove|clear|forget|erase)\b/.test(words)) return { sound: "delete", feel: "select" };
  if (/^(keep|save|add|done|i did it|set )/.test(words) || t.matches("[type='submit']")) return { sound: "success", feel: "success" };
  if (/^(close|×|not now|cancel|back|skip|hide)\b/.test(words) || t.matches(".dialog-close")) return { sound: "close", feel: "light" };
  if (/^(settings|help now|need help now|menu)/.test(words) || t.getAttribute("aria-haspopup") || t.getAttribute("aria-expanded") === "false") {
    return { sound: "open", feel: "light" };
  }
  if (t.matches("a[href]") && !href.startsWith("#")) return { sound: "forward", feel: "light" };
  return { sound: "press", feel: "light" };
}

export function Feedback() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);

  /* Taps: a ring on the way down; sound and tick on the click itself (a
     click is what browsers count as permission to sound and vibrate). */
  useEffect(() => {
    let rings = 0;
    const ring = (x: number, y: number, strong: boolean) => {
      const layer = layerRef.current;
      if (!layer || rings >= MAX_RINGS) return;
      const r = document.createElement("span");
      r.className = strong ? "fx-ring strong" : "fx-ring";
      r.style.left = `${x}px`;
      r.style.top = `${y}px`;
      layer.append(r);
      rings++;
      let gone = false;
      const end = () => {
        if (gone) return;
        gone = true;
        r.remove();
        rings--;
      };
      r.addEventListener("animationend", end, { once: true });
      setTimeout(end, 900);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button > 0) return;
      const t = (e.target as Element | null)?.closest?.(TAPPABLE);
      if (!t || t.closest(".haptic-switch, .urgent")) return;
      ring(e.clientX, e.clientY, !!t.closest(STRONG));
    };
    const onClick = (e: MouseEvent) => {
      const t = (e.target as Element | null)?.closest?.(TAPPABLE);
      if (!t || t.closest(".haptic-switch")) return;
      const a = answer(t);
      if (!a) return;
      if (a.feel) tick(a.feel);
      if (a.sound) sfx(a.sound);
    };
    /* The first touch anywhere is the permission to make sound at all. */
    const unlock = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(".haptic-switch")) return;
      unlockSfx();
    };
    window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    window.addEventListener("click", onClick, true);
    for (const t of ["pointerdown", "touchend", "keydown", "click"]) window.addEventListener(t, unlock, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("click", onClick, true);
      for (const t of ["pointerdown", "touchend", "keydown", "click"]) window.removeEventListener(t, unlock, true);
    };
  }, []);

  /* Another room: a sweep of light, a page turning, a double tick. */
  useEffect(() => {
    const onRoom = () => {
      const layer = layerRef.current;
      tick("nav");
      sfx("forward");
      if (!layer) return;
      const s = document.createElement("span");
      s.className = reduced() ? "fx-sweep still" : "fx-sweep";
      layer.append(s);
      s.addEventListener("animationend", () => s.remove(), { once: true });
      setTimeout(() => s.remove(), 1400);
    };
    window.addEventListener(ROOM_EVENT, onRoom);
    return () => window.removeEventListener(ROOM_EVENT, onRoom);
  }, []);

  /* The line of sunrise across the top. Where the browser can drive it from
     the scroll position itself, it does, and no script runs per frame. */
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const native = typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: scroll()");
    if (native) {
      el.classList.add("native");
      return;
    }
    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* Cards arriving as the page scrolls: outlined in dawn light every time
     one comes into view (no more than once every few seconds each), and,
     the first time only, gliding up into place if it started below the
     fold. */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const seen = new WeakSet<Element>();
    const lastGlow = new WeakMap<Element, number>();
    let glows = 0;
    let lastScroll = 0;
    let lastTick = 0;

    const glow = (el: HTMLElement, gliding: boolean) => {
      if (glows >= MAX_GLOWS) return;
      const r = el.getBoundingClientRect();
      /* A gliding card is caught mid-glide, shifted down 26px and scaled
         to 0.975 about its centre (see revealUp). The glow is laid where
         the card will land, at its real size, and runs the same glide, so
         the two move as one. */
      const w = gliding ? el.offsetWidth : r.width;
      const h = gliding ? el.offsetHeight : r.height;
      const left = r.left + r.width / 2 - w / 2;
      const top = r.top + r.height / 2 - h / 2 - (gliding ? 26 : 0);
      if (w < 40 || h < 24) return;
      const g = document.createElement("span");
      g.className = gliding ? "fx-glow gliding" : "fx-glow";
      g.style.cssText = `left:${left + window.scrollX}px;top:${top + window.scrollY}px;width:${w}px;height:${h}px;border-radius:${getComputedStyle(el).borderRadius || "18px"}`;
      document.body.append(g);
      glows++;
      let gone = false;
      const end = () => {
        if (gone) return;
        gone = true;
        g.remove();
        glows--;
      };
      g.addEventListener("animationend", (e) => e.animationName === "fxGlow" && end());
      setTimeout(end, 1600);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const gliding = el.dataset.reveal === "pending";
          if (gliding) el.dataset.reveal = "in";
          if (!gliding && now - lastScroll > SCROLL_WINDOW_MS) continue;
          if (now - (lastGlow.get(el) ?? -Infinity) < GLOW_AGAIN_MS) continue;
          lastGlow.set(el, now);
          glow(el, gliding && !reduced());
          if (now - lastTick > 350) {
            lastTick = now;
            tick("light");
          }
        }
      },
      { threshold: 0.3 },
    );

    const scan = () => {
      const vh = window.innerHeight;
      const still = reduced();
      document.querySelectorAll<HTMLElement>(SECTIONS).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.closest(NEVER)) return;
        if (!still && el.getBoundingClientRect().top > vh) el.dataset.reveal = "pending";
        io.observe(el);
      });
    };
    scan();
    const onScroll = () => {
      lastScroll = performance.now();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    /* New cards: a room switch, a panel opening. Batched. */
    let timer: ReturnType<typeof setTimeout> | null = null;
    const mo = new MutationObserver((records) => {
      /* Its own lights coming and going are not new cards. */
      const fx = (n: Node) => n instanceof Element && n.matches(".fx-glow, .fx-ring, .fx-sweep");
      if (records.every((r) => [...r.addedNodes, ...r.removedNodes].every(fx))) return;
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        scan();
      }, 150);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div className="scroll-dawn" ref={barRef} aria-hidden="true" />
      <div className="tap-layer" ref={layerRef} aria-hidden="true" />
    </>
  );
}
