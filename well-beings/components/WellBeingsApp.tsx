"use client";

import { useEffect, useState } from "react";
import { useWellBeings } from "@/hooks/useWellBeings";
import { Header } from "./Header";
import { WelcomeScreen } from "./WelcomeScreen";
import { ChatScreen } from "./ChatScreen";
import { ResultsScreen } from "./ResultsScreen";
import { AppScreen } from "./AppScreen";
import { HelpDialog, BreathDialog } from "./dialogs";
import { SettingsDialog } from "./SettingsDialog";
import { PsychHandoffBanner } from "./PsychHandoffBanner";
import { TourInvite } from "./TourInvite";
import { Tour } from "./Tour";
import { WELCOME_TOUR, hasSeenWelcomeTour, markWelcomeTourSeen } from "@/lib/tour";

export function WellBeingsApp() {
  const wb = useWellBeings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* The welcome tour and the offer that starts it.
     Both default to hidden and are switched on from an effect, never during
     render: hasSeenWelcomeTour() reads localStorage, which the server cannot
     do, so deriving it inline would make the first client render disagree
     with the server markup. */
  const [inviteOpen, setInviteOpen] = useState(false);
  const [welcomeTourOpen, setWelcomeTourOpen] = useState(false);

  useEffect(() => {
    if (wb.screen !== "welcome") return;
    if (hasSeenWelcomeTour()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInviteOpen(true);
  }, [wb.screen]);

  function startWelcomeTour() {
    markWelcomeTourSeen();
    setInviteOpen(false);
    setWelcomeTourOpen(true);
  }

  function dismissInvite() {
    markWelcomeTourSeen();
    setInviteOpen(false);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
        fontSize: 14.5,
        lineHeight: 1.55,
      }}
    >
      <Header
        s={wb.s}
        lang={wb.settings.lang}
        setLang={wb.setLang}
        onHelp={wb.openHelp}
        onSettings={() => setSettingsOpen(true)}
      />

      {wb.handoff && (
        <PsychHandoffBanner
          handoff={wb.handoff}
          screen={wb.screen}
          onStartChat={wb.startChat}
          onGoToday={() => wb.setTab("today")}
          onOpenHelp={wb.openHelp}
          onDismiss={wb.dismissHandoff}
        />
      )}

      {wb.screen === "welcome" && (
        <WelcomeScreen
          lang={wb.settings.lang}
          showCitations={wb.settings.showCitations}
          onStartChat={wb.startChat}
          onStartDemo={wb.startDemo}
          onOpenHelp={wb.openHelp}
        />
      )}
      {wb.screen === "chat" && <ChatScreen wb={wb} />}
      {wb.screen === "results" && wb.profile && (
        <ResultsScreen
          profile={wb.profile}
          crisis={wb.crisis}
          calm={wb.settings.calmMode}
          region={wb.region}
          lang={wb.settings.lang}
          showCitations={wb.settings.showCitations}
          onBuildSystem={wb.buildSystem}
          onOpenHelp={wb.openHelp}
        />
      )}
      {wb.screen === "app" && wb.profile && <AppScreen wb={wb} />}

      {/* The offer, then the tour itself. WELCOME_TOUR ends on the start
          button, so finishing it hands straight into the check-in —
          `onComplete` fires only on Done, never on Skip or Escape. */}
      {wb.screen === "welcome" && inviteOpen && !welcomeTourOpen && (
        <TourInvite onStart={startWelcomeTour} onDismiss={dismissInvite} />
      )}
      {wb.screen === "welcome" && welcomeTourOpen && (
        <Tour
          steps={WELCOME_TOUR}
          onFinish={() => setWelcomeTourOpen(false)}
          onComplete={wb.startChat}
          finishLabel={wb.s.startCheckin}
        />
      )}

      {wb.helpOpen && <HelpDialog region={wb.region} lang={wb.settings.lang} onClose={wb.closeHelp} />}
      {wb.breathOpen && <BreathDialog onClose={wb.closeBreath} />}
      {settingsOpen && <SettingsDialog wb={wb} onClose={() => setSettingsOpen(false)} />}

      <footer
        style={{
          borderTop: "1px solid var(--color-divider)",
          padding: "14px 24px calc(14px + env(safe-area-inset-bottom))",
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--color-neutral-600)",
        }}
      >
        <span>{wb.s.footerDisclaimer}</span>
        <span>{wb.s.footerPrivacy}</span>
      </footer>
    </div>
  );
}
