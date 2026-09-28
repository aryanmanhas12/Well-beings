"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { oohSvg } from "@/lib/ooh.mjs";
import { OohLine, OohScene, oohScript } from "@/lib/oohScript";
import { OOH_SERVER, markOohSeen, readOoh, subscribeOoh } from "@/lib/oohStore";
import { chime } from "@/lib/ambient";

/**
 * Ooh, narrating the page like the guide in a game.
 *
 * WHERE OOH SPEAKS, and why it moved. The first version floated Ooh and
 * its bubble in the corner of the screen, and on a phone the bubble landed
 * right on top of "How are you arriving?", the one thing a struggling
 * person most needs to tap. So Ooh now speaks in the page itself, at the
 * top, where it pushes things down instead of covering them, and it stays
 * until tapped away, so nothing ever shifts under someone's thumb.
 *
 * Once the lines are done, Ooh tucks into the corner (above the tab bar on
 * a phone) as a small figure. Tapping it there brings the bubble back as a
 * float, which is fine to cover things with because the person asked.
 *
 * The first time on a page Ooh says a few lines; after that, one. The
 * words and the rules they keep are in lib/oohScript.ts. A screen reader
 * hears each line once through a polite live region, and every control is
 * a real button.
 */
export function OohGuide({ scene, dock = "corner" }: { scene: OohScene; dock?: "corner" | "tabbar" }) {
  const prefs = useSyncExternalStore(subscribeOoh, readOoh, () => OOH_SERVER);
  if (prefs.hidden) return null;
  const script = oohScript(scene);
  /* Keyed by the script, so a new page or a new check-in starts fresh. */
  return <OohRun key={script.id} script={script} seen={prefs.seen.includes(script.id)} dock={dock} />;
}

const TYPE_MS = 26;
const FLOAT_LINGER_MS = 10_000;
const SCROLL_CLOSE_PX = 200;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

type Phase = "inline" | "tucked" | "float";

function OohRun({ script, seen, dock }: { script: ReturnType<typeof oohScript>; seen: boolean; dock: string }) {
  const [lines, setLines] = useState<OohLine[]>(() => (seen ? [script.short] : script.lines));
  const [phase, setPhase] = useState<Phase>(script.quiet ? "tucked" : "inline");
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(() => (reducedMotion() ? Infinity : 0));
  const scrollStart = useRef(0);

  const talking = phase !== "tucked";
  const line = lines[Math.min(index, lines.length - 1)];
  const done = typed >= line.text.length;
  const last = index >= lines.length - 1;

  /* A soft bowl tone when Ooh starts speaking, if the music is on. */
  useEffect(() => {
    if (talking) chime();
  }, [talking]);

  /* Behind the first-visit sunrise Ooh is hidden (see the CSS). When the
     sunrise lifts, Ooh starts from the first letter, not mid-sentence. */
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro !== "pending") return;
    const mo = new MutationObserver(() => {
      if (root.dataset.intro === "pending") return;
      mo.disconnect();
      setIndex(0);
      setTyped(reducedMotion() ? Infinity : 0);
      chime();
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-intro"] });
    return () => mo.disconnect();
  }, []);

  /* The typewriter. */
  useEffect(() => {
    if (!talking || done) return;
    const t = setInterval(() => setTyped((n) => n + 1), TYPE_MS);
    return () => clearInterval(t);
  }, [talking, done, index]);

  /* Heard in full once the last line is out, so next time is one line. */
  useEffect(() => {
    if (done && last) markOohSeen(script.id);
  }, [done, last, script.id]);

  /* Only the float tidies itself away. The in-page bubble never collapses
     by itself: a block of the page vanishing mid-read would move whatever
     someone was about to tap. */
  useEffect(() => {
    if (phase !== "float" || !done || !last) return;
    const t = setTimeout(() => setPhase("tucked"), FLOAT_LINGER_MS);
    return () => clearTimeout(t);
  }, [phase, done, last]);

  useEffect(() => {
    if (phase !== "float") return;
    scrollStart.current = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - scrollStart.current) > SCROLL_CLOSE_PX) setPhase("tucked");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase]);

  function restart() {
    setIndex(0);
    setTyped(reducedMotion() ? Infinity : 0);
  }

  function tuck() {
    markOohSeen(script.id);
    setPhase("tucked");
  }

  function advance() {
    if (!done) return setTyped(Infinity);
    if (last) return tuck();
    setIndex((i) => i + 1);
    setTyped(reducedMotion() ? Infinity : 0);
  }

  const shown = Math.min(typed, line.text.length);
  const bubble = (
    <div className="ooh-bubble">
      <button type="button" className="ooh-say" onClick={advance}>
        <span className="ooh-name" aria-hidden="true">
          Ooh
        </span>
        <span className="ooh-text">
          {line.text.slice(0, shown)}
          {/* The rest is there but invisible, so the bubble is its final
              size from the first letter and nothing below it jumps. */}
          <span className="ooh-rest" aria-hidden="true">
            {line.text.slice(shown)}
          </span>
        </span>
        <span className="ooh-next" data-ready={done}>
          {last ? "Got it" : "Next"}
          <span aria-hidden="true"> ▸</span>
        </span>
      </button>
      <button type="button" className="ooh-x" aria-label="Close what Ooh is saying" onClick={tuck}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
  const live = (
    <p className="sr-only" aria-live="polite">
      {talking ? `Ooh says: ${line.text}` : ""}
    </p>
  );

  if (phase === "inline")
    return (
      <section className="ooh-strip" aria-label="Ooh, your guide">
        <span
          className="ooh-figure"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: oohSvg({ mood: line.mood, size: lines.length > 1 || !seen ? 84 : 66 }) }}
        />
        {bubble}
        {live}
      </section>
    );

  return (
    <div className={`ooh-guide ooh-dock-${dock}`} data-open={phase === "float"}>
      {phase === "float" && bubble}
      {live}
      <button
        type="button"
        className="ooh-me"
        aria-expanded={phase === "float"}
        aria-label={phase === "float" ? "Ooh, your guide. Hide what Ooh says" : "Ooh, your guide. Hear what Ooh says"}
        onClick={() => {
          if (phase === "float") return tuck();
          setLines([script.short]);
          restart();
          setPhase("float");
        }}
        dangerouslySetInnerHTML={{ __html: oohSvg({ mood: phase === "float" ? line.mood : lines[lines.length - 1].mood, size: phase === "float" ? 72 : 54 }) }}
      />
    </div>
  );
}
