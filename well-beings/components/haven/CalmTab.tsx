"use client";

import { useEffect, useState } from "react";
import type { Haven } from "@/hooks/useHaven";
import { VIDEO_GROUPS, VIDEOS, WHY, type Video } from "@/lib/havenContent";
import type { Lang } from "@/lib/i18n";
import { Breathe } from "./Breathe";
import { PlayIcon } from "./icons";
import { Why } from "./shared";

/**
 * Things to do with the next few minutes: breathe, come back to the room,
 * or watch something kind. The first two work with no connection at all.
 */
export function CalmTab({ haven, view, lang }: { haven: Haven; view?: string; lang: Lang }) {
  useEffect(() => {
    if (!view) return;
    document.getElementById(`calm-${view}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  return (
    <div className="haven-stack">
      <h1 style={{ fontSize: 28, margin: "6px 0 0" }}>Calm</h1>
      <p className="panel-lede" style={{ marginTop: -8 }}>
        A few minutes of something steadier. None of it needs you to feel better first.
      </p>

      <section className="panel panel-lilac" id="calm-breathe" aria-labelledby="breathe-title">
        <h2 id="breathe-title">Breathe with the sun</h2>
        <p className="panel-lede">In as it grows, out slowly as it settles. One minute.</p>
        <Breathe onDone={() => haven.markStep("breathe")} />
        <Why>{WHY.breathe}</Why>
      </section>

      <section className="panel panel-sun" id="calm-ground" aria-labelledby="ground-title">
        <h2 id="ground-title">Come back to the room</h2>
        <p className="panel-lede">
          When your head is loud, your senses can bring you back to where you are. Take each one slowly.
        </p>
        <Grounding onDone={() => haven.markStep("ground")} />
      </section>

      <section className="panel" id="calm-watch" aria-labelledby="watch-title">
        <h2 id="watch-title">Watch something kind</h2>
        <p className="panel-lede">
          Chosen for hard days: stories of getting through, and a few gentle ones. They play from YouTube, and
          only once you say so.
        </p>
        <Videos haven={haven} lang={lang} />
        <Why>{WHY.watch}</Why>
      </section>
    </div>
  );
}

const SENSES: { n: number; ask: string; hint: string }[] = [
  { n: 5, ask: "Find five things you can see.", hint: "Name them, out loud or in your head. A light switch counts." },
  { n: 4, ask: "Four things you can feel.", hint: "Your feet on the floor. The fabric of your sleeve. The air on your face." },
  { n: 3, ask: "Three things you can hear.", hint: "Near or far. A fan, a vehicle, your own breathing." },
  { n: 2, ask: "Two things you can smell.", hint: "Or two smells you like, if nothing's there." },
  { n: 1, ask: "One thing you can taste.", hint: "Or take a sip of water and notice it." },
];

function Grounding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(-1);
  if (i < 0) {
    return (
      <button type="button" className="btn btn-sun" onClick={() => setI(0)}>
        Start
      </button>
    );
  }
  if (i >= SENSES.length) {
    return (
      <div role="status">
        <p className="quote-line">You&apos;re here. Right here, right now.</p>
        <button type="button" className="btn btn-quiet" onClick={() => setI(0)}>
          Go through it again
        </button>
      </div>
    );
  }
  const s = SENSES[i];
  return (
    <div className="checkin-step" key={i} aria-live="polite">
      <p style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, margin: "4px 0 6px", color: "var(--color-sun-text)" }} aria-hidden="true">
        {s.n}
      </p>
      <p className="quote-line">{s.ask}</p>
      <p className="panel-lede" style={{ marginTop: 6 }}>
        {s.hint}
      </p>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-sun"
          onClick={() => {
            if (i + 1 >= SENSES.length) onDone();
            setI(i + 1);
          }}
        >
          {i + 1 >= SENSES.length ? "Done" : "Next"}
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setI(-1)}>
          Stop
        </button>
      </div>
    </div>
  );
}

function Videos({ haven, lang }: { haven: Haven; lang: Lang }) {
  /* One "yes" covers the visit. Asking before every video would be a
     cookie banner in all but name; asking never would be loading Google
     into a page that otherwise loads nothing from anyone. */
  const [consented, setConsented] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const showHindi = lang === "hi" || haven.state.region === "in";
  const list = VIDEOS.filter((v) => !v.lang || v.lang === "en" || showHindi);

  function play(v: Video) {
    if (!consented) {
      setAsking(v.id);
      return;
    }
    setPlaying(v.id);
    haven.markStep("watch");
  }

  return (
    <div>
      {!online && (
        <p className="aside-note" role="status" style={{ marginBottom: 12 }}>
          You&apos;re offline, so videos won&apos;t load. Breathing and grounding above work without a connection.
        </p>
      )}
      {VIDEO_GROUPS.map((g) => {
        const vids = list.filter((v) => v.group === g.id);
        if (!vids.length) return null;
        return (
          <div key={g.id} style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 15.5, margin: "0 0 8px" }}>{g.title}</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {vids.map((v) => (
                <article key={v.id} className="video-row" lang={v.lang === "hi" ? "hi" : undefined}>
                  <button
                    type="button"
                    className="video-thumb"
                    onClick={() => play(v)}
                    aria-label={`Play: ${v.title}`}
                    disabled={!online}
                    style={{ background: `linear-gradient(145deg, ${v.tint[0]}, ${v.tint[1]})` }}
                  >
                    <span className="play" aria-hidden="true">
                      <PlayIcon width={16} height={16} />
                    </span>
                  </button>
                  <div className="video-meta">
                    <h4>{v.title}</h4>
                    <p>
                      {v.by} · {v.length}
                    </p>
                    <p className="video-when">{v.when}</p>
                  </div>

                  {asking === v.id && (
                    <div className="aside-note video-wide" role="group" aria-label="Before this plays">
                      <p style={{ margin: "0 0 10px" }}>
                        This plays from YouTube, so Google will see your IP address and may set cookies. Nothing
                        you&apos;ve written here goes with it.
                      </p>
                      <div className="btn-row">
                        <button
                          type="button"
                          className="btn btn-sun"
                          onClick={() => {
                            setConsented(true);
                            setAsking(null);
                            setPlaying(v.id);
                            haven.markStep("watch");
                          }}
                        >
                          Play it here
                        </button>
                        <a className="btn btn-soft" href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">
                          Open on YouTube
                        </a>
                        <button type="button" className="btn btn-quiet" onClick={() => setAsking(null)}>
                          Not now
                        </button>
                      </div>
                    </div>
                  )}

                  {playing === v.id && (
                    <div className="video-wide">
                      <iframe
                        className="video-frame"
                        src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
                        title={v.title}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                      <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--color-neutral-600)" }}>
                        Won&apos;t play?{" "}
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.title + " " + v.by)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Find it on YouTube
                        </a>
                        .
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
