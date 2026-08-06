"use client";

import { useWellBeings } from "@/hooks/useWellBeings";
import { Header } from "./Header";
import { WelcomeScreen } from "./WelcomeScreen";
import { ChatScreen } from "./ChatScreen";
import { ResultsScreen } from "./ResultsScreen";
import { AppScreen } from "./AppScreen";
import { HelpDialog, BreathDialog } from "./dialogs";
import { PsychHandoffBanner } from "./PsychHandoffBanner";

export function WellBeingsApp() {
  const wb = useWellBeings();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
        fontSize: 14.5,
        lineHeight: 1.55,
      }}
    >
      <Header onHelp={wb.openHelp} />

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
        <WelcomeScreen onStartChat={wb.startChat} onStartDemo={wb.startDemo} onOpenHelp={wb.openHelp} />
      )}
      {wb.screen === "chat" && <ChatScreen wb={wb} />}
      {wb.screen === "results" && wb.profile && (
        <ResultsScreen
          profile={wb.profile}
          crisis={wb.crisis}
          calm={wb.settings.calmMode}
          region={wb.region}
          onBuildSystem={wb.buildSystem}
          onOpenHelp={wb.openHelp}
        />
      )}
      {wb.screen === "app" && wb.profile && <AppScreen wb={wb} />}

      {wb.helpOpen && <HelpDialog region={wb.region} onClose={wb.closeHelp} />}
      {wb.breathOpen && <BreathDialog onClose={wb.closeBreath} />}

      <footer
        style={{
          borderTop: "1px solid var(--color-divider)",
          padding: "14px 24px",
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--color-neutral-600)",
        }}
      >
        <span>Well-Beings — a self-guidance prototype. Not a medical device; screeners signal, they don&apos;t diagnose.</span>
        <span>All data stays on this device.</span>
      </footer>
    </div>
  );
}
