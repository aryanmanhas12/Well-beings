"use client";

import { useEffect, useRef } from "react";
import { tick } from "@/lib/haptics";

/**
 * Feedback you can see (and, where the phone allows, feel) as you move
 * through Arun. One component in the root layout, so every page has it.
 *
 *   A tap: a warm ripple of dawn light where the finger landed, and a
 *   light tick. The ripple is drawn in its own layer at the tap point, not
 *   inside the button, so no button needs its overflow or position changed
 *   to carry it.
 *
 *   Scrolling: a thin line of sunrise across the top of the screen fills
 *   as you go down the page. Each section glides up into place with a
 *   short glow of dawn around it as it arrives, with a light tick on
 *   phones that can.
 *
 * None of it changes the opacity of text: sections move and glow, they
 * never fade, so every word is at full contrast at every moment (the
 * contrast checks run mid-scroll too). Everything here stops under
 * prefers-reduced-motion, and the ticks stop with "Vibration" off.
 */
const TAPPABLE = "button, a[href], [role='switch'], [role='tab'], summary, label.choice, .choice, input[type='checkbox'], input[type='radio']";
const SECTIONS = ".panel, .scene, .shelf, .deck, .hope-hero, .card, .install-panel, .site-main .prose > h2, .site-main .prose > .callout";

function reduced() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function Feedback() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);

  /* Taps: ripple on the way down, tick on the click itself (a click is
     what browsers count as permission to vibrate). */
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (reduced() || !layerRef.current) return;
      const target = (e.target as Element | null)?.closest?.(TAPPABLE);
      if (!target) return;
      const dot = document.createElement("span");
      dot.className = "tap-ripple";
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      layerRef.current.append(dot);
      dot.addEventListener("animationend", () => dot.remove(), { once: true });
      setTimeout(() => dot.remove(), 900);
    };
    const onClick = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest?.(TAPPABLE);
      if (target) tick("select");
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  /* The sunrise line across the top. */
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = 0;
      const el = barRef.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
      el.dataset.on = p > 0.01 ? "true" : "false";
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

  /* Sections glide in with a glow as they arrive. Only sections that start
     below the fold are held back, so nothing already on screen jumps. */
  useEffect(() => {
    if (reduced() || typeof IntersectionObserver === "undefined") return;
    const seen = new WeakSet<Element>();
    let lastTick = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          if (el.dataset.reveal !== "pending") continue;
          el.dataset.reveal = "in";
          if (Date.now() - lastTick > 350) {
            lastTick = Date.now();
            tick("light");
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    const scan = () => {
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>(SECTIONS).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.closest(".intro, .dialog, .ooh-strip, .ooh-dock, .ooh-guide")) return;
        if (el.getBoundingClientRect().top > vh) {
          el.dataset.reveal = "pending";
          io.observe(el);
        }
      });
    };
    scan();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const mo = new MutationObserver(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        scan();
      }, 120);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div className="scroll-dawn" ref={barRef} aria-hidden="true" data-on="false" />
      <div className="tap-layer" ref={layerRef} aria-hidden="true" />
    </>
  );
}
