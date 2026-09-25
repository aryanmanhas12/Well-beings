"use client";

import { useCallback, useEffect, useState } from "react";
import type { Wellbeings } from "@/hooks/useWellbeings";
import type { Haven } from "@/hooks/useHaven";
import type { HelplineRegion } from "@/lib/types";
import type { Video } from "@/lib/havenContent";
import { HereTab } from "./HereTab";
import { HopeTab } from "./HopeTab";
import { HereIcon, HopeIcon, PlanIcon, ReachIcon, WatchIcon } from "./icons";
import { IntroDawn } from "./IntroDawn";
import { PlanTab } from "./PlanTab";
import { ReachTab } from "./ReachTab";
import type { HavenTab } from "./shared";
import { UrgentCare } from "./UrgentCare";
import { VideoSheet } from "./VideoSheet";
import { WatchTab } from "./WatchTab";

const TABS: { id: HavenTab; label: string; Icon: typeof HereIcon }[] = [
  { id: "here", label: "Here", Icon: HereIcon },
  { id: "watch", label: "Watch", Icon: WatchIcon },
  { id: "hope", label: "Hope", Icon: HopeIcon },
  { id: "plan", label: "Plan", Icon: PlanIcon },
  { id: "reach", label: "Reach out", Icon: ReachIcon },
];

/**
 * The safe place: five rooms and a way between them.
 *
 * Labels are wellness words rather than feature names. "Here" is where you
 * land and check in; "Watch" is talks and stories for hard days, with
 * breathing and grounding under them; "Hope" holds what is worth keeping;
 * "Plan" is the safety plan and the daily plan; "Reach out" is people. On a phone they sit at the bottom where a thumb is; on a
 * wider screen they move up under the header.
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

  const goTo = useCallback((t: HavenTab, v?: string) => {
    setTab(t);
    setView(v);
    setNav((n) => n + 1);
    window.scrollTo({ top: 0 });
  }, []);

  // Coming back from the wellbeing check lands on the plan it built.
  useEffect(() => {
    if (wb.screen === "app") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      goTo("plan", "daily");
      wb.setScreen("home");
    }
  }, [wb.screen, wb, goTo]);

  // The replay button in settings.
  useEffect(() => {
    if (replayIntro > 0) document.documentElement.setAttribute("data-intro", "pending");
  }, [replayIntro]);

  return (
    <>
      <nav className="tabbar" aria-label="Safe place">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => goTo(id)}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <main className={`haven haven-${tab}`} key={nav} id="main">
        {tab === "here" && (
          <HereTab
            wb={wb}
            haven={haven}
            region={region}
            goTo={goTo}
            openUrgent={() => setUrgent(true)}
            openVideo={setSheet}
            onReplayIntro={onReplayIntro}
          />
        )}
        {tab === "watch" && <WatchTab haven={haven} view={view} lang={wb.settings.lang} openVideo={setSheet} />}
        {tab === "hope" && <HopeTab haven={haven} view={view} goTo={goTo} />}
        {tab === "plan" && <PlanTab wb={wb} haven={haven} region={region} view={view} goTo={goTo} />}
        {tab === "reach" && <ReachTab haven={haven} region={region} view={view} goTo={goTo} />}
      </main>

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

      <IntroDawn replayKey={replayIntro} onDone={haven.markIntroSeen} />
    </>
  );
}
