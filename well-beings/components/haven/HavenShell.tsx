"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Wellbeings } from "@/hooks/useWellbeings";
import type { Haven } from "@/hooks/useHaven";
import type { HelplineRegion } from "@/lib/types";
import type { Video } from "@/lib/havenContent";
import { HereTab } from "./HereTab";
import { HereIcon, MeIcon, ReachIcon } from "./icons";
import { IntroDawn } from "./IntroDawn";
import { MeTab } from "./MeTab";
import { PlanTab } from "./PlanTab";
import { ReachTab } from "./ReachTab";
import { HOME_EVENT, sectionOf, useNow, type HavenSection, type HavenTab } from "./shared";
import { UrgentCare } from "./UrgentCare";
import { HopeTab, MinuteFlow, ReelFlow, WatchTab } from "../lazyParts";
import { VideoSheet } from "./VideoSheet";
import { OohGuide } from "../OohGuide";
import { ROOM_EVENT } from "../Feedback";
import type { OohScene } from "@/lib/oohScript";
import { planIsWritten } from "@/lib/haven";
import { soundWanted } from "@/lib/ambient";
import { watchReturns } from "@/lib/intro";
import { energyFor, minuteOffer } from "@/lib/care";
import { minuteLang, type TopicId } from "@/lib/minute";
import { t } from "@/lib/i18n";

const TABS: { id: HavenSection; label: string; Icon: typeof HereIcon }[] = [
  { id: "here", label: "Home", Icon: HereIcon },
  { id: "me", label: "Me", Icon: MeIcon },
  { id: "reach", label: "Talk", Icon: ReachIcon },
];

const ROOMS: HavenTab[] = ["here", "watch", "me", "hope", "plan", "reach"];

/** The rooms behind a door, and the tab the back chip returns to. */
const BACK: Partial<Record<HavenTab, { to: HavenSection; label: string }>> = {
  watch: { to: "here", label: "Home" },
  hope: { to: "me", label: "Me" },
  plan: { to: "me", label: "Me" },
};

/**
 * The safe place: three tabs, and the rooms behind them.
 *
 * Home, Me, Talk, at the owner's request (November 2026: "it's hard to
 * navigate through the app"). There were five tabs with poetic names
 * (Here, Watch, Hope, Plan, Reach out), and a person in a hurry had to
 * learn which word hid the safety plan. Now the three answer three plain
 * questions: what can I do right now (Home), what is mine (Me), who can I
 * talk to (Talk). Watch is a door on Home; Hope and Plan are rows in Me,
 * each with a chip that leads back. The room ids did not change, so every
 * link written before this still lands where it did. On a phone the tabs
 * sit at the bottom where a thumb is; on a wider screen they move up
 * under the header.
 *
 * One minute and the reel open as a stage over whichever room is showing
 * (components/minute), owned here like the urgent screen, which "Help now"
 * on the stage opens over it.
 *
 * The urgent screen and the intro sit above everything and are owned here,
 * so any tab can raise the urgent screen and the intro can be replayed from
 * settings.
 */
export function HavenShell({
  wb,
  haven,
  region,
  replayIntro,
  onReplayIntro,
}: {
  wb: Wellbeings;
  haven: Haven;
  region: HelplineRegion;
  replayIntro: number;
  onReplayIntro: () => void;
}) {
  const [tab, setTab] = useState<HavenTab>("here");
  const [view, setView] = useState<string | undefined>(undefined);
  const [urgent, setUrgent] = useState(false);
  /* Bumped on every navigation and used as the key of <main>, so each goTo
     mounts its tab fresh: asking for the same sub-view twice still lands on
     it, and nothing half-typed in one room leaks into the next. */
  const [nav, setNav] = useState(0);
  /* One video sheet for the whole safe place, and one "yes" to loading
     videos per visit, held here so the home screen's card and the Watch
     screen share it. Never persisted: tomorrow's visit asks again. */
  const [sheet, setSheet] = useState<Video | null>(null);
  const [videoConsent, setVideoConsent] = useState(false);
  /* One minute or the reel, on its stage. `n` remounts it, so "Take one
     minute" at the end of the reel starts clean. */
  const [stage, setStage] = useState<{ kind: "minute"; topic: TopicId | null; n: number } | { kind: "reel"; n: number } | null>(null);

  const goTo = useCallback((t: HavenTab, v?: string) => {
    setTab(t);
    setView(v);
    setNav((n) => n + 1);
    window.scrollTo({ top: 0 });
    /* The sweep of light, the page-turn and the double tick (Feedback). */
    window.dispatchEvent(new Event(ROOM_EVENT));
  }, []);

  // Coming back from the wellbeing check lands on the plan it built.
  useEffect(() => {
    if (wb.screen === "app") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      goTo("plan", "daily");
      wb.setScreen("home");
    }
  }, [wb.screen, wb, goTo]);

  /* Ooh's "Go to Plan" from a guide or the privacy page arrives as
     ?room=plan (and maybe &view=daily). Read once, then taken out of the
     address bar so a refresh or a shared link does not replay it. Only
     these two keys are touched; Ronak's ref= handoff has its own reader. */
  useEffect(() => {
    const u = new URL(window.location.href);
    const room = u.searchParams.get("room");
    if (!room || !ROOMS.includes(room as HavenTab)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    goTo(room as HavenTab, u.searchParams.get("view") ?? undefined);
    u.searchParams.delete("room");
    u.searchParams.delete("view");
    window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
  }, [goTo]);

  /* The "arun" wordmark in the header is the way home from any room. It
     lives outside this component, so it asks by event rather than being
     handed goTo. Already on Here, it glides back to the top instead of
     remounting the room, so nothing half-typed there is lost. */
  useEffect(() => {
    const home = () => {
      if (tab === "here" && !view) {
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        return;
      }
      goTo("here");
    };
    window.addEventListener(HOME_EVENT, home);
    return () => window.removeEventListener(HOME_EVENT, home);
  }, [tab, view, goTo]);

  /* Back after 20 minutes or more away counts as opening Arun again,
     which an installed app on a phone mostly never is: it just returns
     from the background. */
  const replayRef = useRef(onReplayIntro);
  useEffect(() => {
    replayRef.current = onReplayIntro;
  });
  useEffect(() => watchReturns(() => replayRef.current()), []);

  // The replay button in settings.
  useEffect(() => {
    if (replayIntro <= 0) return;
    const root = document.documentElement;
    root.setAttribute("data-intro", "pending");
    /* Music on: wait for a tap so the music can rise with the sun. */
    if (soundWanted()) root.setAttribute("data-intro-gate", "1");
    else root.removeAttribute("data-intro-gate");
  }, [replayIntro]);

  /* What Ooh narrates: the tab, and on Here the level of the check-in if
     there is a recent one (the same three hours Here uses). */
  const now = useNow();
  const recent = !!(haven.latest && now && now.getTime() - Date.parse(haven.latest.at) < 3 * 3_600_000);
  const scene: OohScene =
    tab === "here"
      ? { kind: "here", level: recent ? haven.level : null, returning: !!haven.returning && !recent, hour: now ? now.getHours() : null }
      : tab === "plan"
        ? { kind: "plan", written: planIsWritten(haven.state.plan) }
        : { kind: tab };

  const section = sectionOf(tab);
  const back = BACK[tab];
  /* Held back after a report of thoughts of suicide or of not feeling
     safe (lib/care.ts). Home does not show the tiles then; this is the
     second lock, for a stage that was already open when that was said. */
  const offer = minuteOffer(haven.level);
  const energy = energyFor(haven.level);
  const stageEnergy = energy === "bright" ? "bright" : "calm";
  const lang = minuteLang(wb.settings.lang);
  const helpLabel = t(wb.settings.lang).helpNow;

  return (
    <>
      <nav className="tabbar" aria-label="Safe place">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" aria-current={section === id ? "page" : undefined} onClick={() => goTo(id)}>
            <span className="tab-ico" aria-hidden="true">
              <Icon />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <main className={`haven haven-${tab}`} key={nav} id="main" data-moved={nav > 0 ? "true" : undefined} data-energy={energy}>
        {/* A room behind a door says where it is and how to get back. */}
        {back && (
          <button type="button" className="back-chip" onClick={() => goTo(back.to)}>
            <span aria-hidden="true">←</span> {back.label}
          </button>
        )}
        {/* Ooh speaks at the top of each room; on Here, just under the sky,
            which HereTab places itself. */}
        {tab !== "here" && <OohGuide scene={scene} dock="tabbar" onGo={goTo} />}
        {tab === "here" && (
          <HereTab
            ooh={<OohGuide scene={scene} dock="tabbar" onGo={goTo} />}
            wb={wb}
            haven={haven}
            region={region}
            goTo={goTo}
            openUrgent={() => setUrgent(true)}
            openMinute={(topic) => setStage({ kind: "minute", topic, n: Date.now() })}
            openReel={() => setStage({ kind: "reel", n: Date.now() })}
            onReplayIntro={onReplayIntro}
          />
        )}
        {tab === "me" && <MeTab wb={wb} haven={haven} goTo={goTo} />}
        {tab === "watch" && <WatchTab haven={haven} view={view} lang={wb.settings.lang} openVideo={setSheet} openUrgent={() => setUrgent(true)} />}
        {tab === "hope" && <HopeTab haven={haven} view={view} goTo={goTo} lang={wb.settings.lang} />}
        {tab === "plan" && <PlanTab wb={wb} haven={haven} region={region} view={view} goTo={goTo} />}
        {tab === "reach" && <ReachTab haven={haven} region={region} view={view} goTo={goTo} />}
      </main>

      {stage?.kind === "minute" && offer !== "held" && (
        <MinuteFlow
          key={stage.n}
          haven={haven}
          lang={lang}
          topic={stage.topic}
          gentle={offer === "gentle"}
          energy={stageEnergy}
          helpLabel={helpLabel}
          onClose={() => setStage(null)}
          openUrgent={() => setUrgent(true)}
          goTo={goTo}
        />
      )}
      {stage?.kind === "reel" && offer !== "held" && (
        <ReelFlow
          key={stage.n}
          haven={haven}
          lang={lang}
          level={haven.level}
          india={(haven.state.region ?? "in") === "in"}
          energy={stageEnergy}
          helpLabel={helpLabel}
          backLabel="Home"
          canMinute
          onClose={() => setStage(null)}
          onMinute={() => setStage({ kind: "minute", topic: null, n: Date.now() })}
          openUrgent={() => setUrgent(true)}
        />
      )}

      {urgent && (
        <UrgentCare
          region={region}
          helpers={haven.state.plan.helpers}
          onClose={() => setUrgent(false)}
          onOpenPlan={() => {
            setUrgent(false);
            goTo("plan", "use");
          }}
        />
      )}

      {sheet && (
        <VideoSheet
          key={sheet.id}
          video={sheet}
          consented={videoConsent}
          onConsent={() => setVideoConsent(true)}
          onPlay={() => haven.markStep("watch")}
          onClose={() => setSheet(null)}
        />
      )}

      <IntroDawn replayKey={replayIntro} onDone={haven.markIntroSeen} onHelp={wb.openHelp} />
    </>
  );
}
