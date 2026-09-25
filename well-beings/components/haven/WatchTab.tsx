"use client";

import { useEffect, useState } from "react";
import type { Haven } from "@/hooks/useHaven";
import { MAKER_VIDEOS, VIDEO_GROUPS, VIDEOS, WHY, type Video } from "@/lib/havenContent";
import type { Lang } from "@/lib/i18n";
import { Breathe } from "./Breathe";
import { PlayIcon } from "./icons";
import { SCENE_BG, SceneArt } from "./SceneArt";
import { Why } from "./shared";

/**
 * Videos first, because for a lot of people on a bad night a voice and a
 * face do more than a list of techniques, and because stories of getting
 * through are one of the few media effects on suicidal thinking with
 * randomised evidence behind it (see lib/havenContent.ts).
 *
 * The top is a deck of four scenes, one talk each, that swipes sideways.
 * Under it, shelves by what someone needs. At the bottom, the two things
 * that work with no connection and no screen to watch: breathing and
 * grounding.
 */
export function WatchTab({
  haven,
  view,
  lang,
  openVideo,
}: {
  haven: Haven;
  view?: string;
  lang: Lang;
  openVideo: (v: Video) => void;
}) {
  useEffect(() => {
    if (!view) return;
    document.getElementById(`watch-${view}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  const showHindi = lang === "hi" || haven.state.region === "in";
  const all = [...VIDEOS, ...MAKER_VIDEOS].filter((v) => !v.lang || v.lang === "en" || showHindi);
  const featured = all.filter((v) => v.scene);

  return (
    <div className="haven-stack">
      <div>
        <h1 className="tab-title">Watch</h1>
        <p className="panel-lede" style={{ margin: "4px 0 0" }}>
          Talks and stories for hard days. Nothing plays until you say so.
        </p>
      </div>

      <ul className="deck" aria-label="Start here">
        {featured.map((v, i) => (
          <li key={v.id} className="scene" style={{ background: SCENE_BG[v.scene!.kind] }}>
            <SceneArt kind={v.scene!.kind} className="scene-art" />
            <div className="scene-body">
              <p className="scene-kicker">{i === 0 ? "Start here" : `${i + 1} of ${featured.length}`}</p>
              <h2 className="scene-title">{v.scene!.headline}</h2>
              <p className="scene-by">
                {v.title} · {v.by}
              </p>
              <button type="button" className="btn btn-sun scene-play" onClick={() => openVideo(v)} aria-label={`Watch: ${v.title}`}>
                <span className="play-dot" aria-hidden="true">
                  <PlayIcon width={12} height={12} />
                </span>
                Watch
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="deck-hint" aria-hidden="true">
        Swipe for more
      </p>

      {VIDEO_GROUPS.map((g) => {
        const vids = all.filter((v) => v.group === g.id);
        if (!vids.length) return null;
        return (
          <section key={g.id} aria-labelledby={`shelf-${g.id}`} className="shelf">
            <h2 id={`shelf-${g.id}`} className="shelf-title">
              {g.title}
            </h2>
            <ul className="shelf-row">
              {vids.map((v) => (
                <li key={v.id} lang={v.lang === "hi" ? "hi" : undefined}>
                  <button type="button" className="tile" onClick={() => openVideo(v)}>
                    <span className="tile-thumb" style={{ background: `linear-gradient(145deg, ${v.tint[0]}, ${v.tint[1]})` }} aria-hidden="true">
                      <span className="tile-play">
                        <PlayIcon width={12} height={12} />
                      </span>
                    </span>
                    <span className="tile-title">{v.title}</span>
                    <span className="tile-by">
                      {v.by} · {v.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="panel" aria-labelledby="why-watch">
        <h2 id="why-watch" style={{ fontSize: 17 }}>
          Why stories
        </h2>
        <p className="panel-lede" style={{ marginBottom: 0 }}>
          {WHY.watch}
        </p>
      </section>

      <h2 className="tab-title" style={{ fontSize: 24, marginTop: 8 }}>
        Can&apos;t watch right now?
      </h2>

      <section className="panel panel-lilac" id="watch-breathe" aria-labelledby="breathe-title">
        <h2 id="breathe-title">Breathe with the sun</h2>
        <p className="panel-lede">In as it grows, out slowly as it settles. One minute.</p>
        <Breathe onDone={() => haven.markStep("breathe")} />
        <Why>{WHY.breathe}</Why>
      </section>

      <section className="panel panel-sun" id="watch-ground" aria-labelledby="ground-title">
        <h2 id="ground-title">Come back to the room</h2>
        <p className="panel-lede">
          When your head is loud, your senses can bring you back to where you are. Take each one slowly.
        </p>
        <Grounding onDone={() => haven.markStep("ground")} />
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
      <p className="ground-n" aria-hidden="true">
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
