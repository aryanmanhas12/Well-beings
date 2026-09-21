"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWellbeings } from "@/hooks/useWellbeings";
import { Header } from "./Header";
import { WelcomeScreen } from "./WelcomeScreen";
import { ChatScreen } from "./ChatScreen";
import { ResultsScreen } from "./ResultsScreen";
import { AppScreen } from "./AppScreen";
import { HelpDialog, BreathDialog } from "./dialogs";
import { SettingsDialog } from "./SettingsDialog";
import { RonakHandoffBanner } from "./RonakHandoffBanner";
import { TourInvite } from "./TourInvite";
import { Tour } from "./Tour";
import { WELCOME_TOUR, hasSeenWelcomeTour, markWelcomeTourSeen } from "@/lib/tour";

/** Kept short on purpose. The footer of a working app is not the place for a
    sitemap; these are the four destinations someone mid-check-in might
    actually want, and the guides index fans out to the rest. */
const SITE_LINKS = [
  { href: "/guides/", label: "Guides" },
  { href: "/resources/", label: "Support lines" },
  { href: "/about/", label: "About" },
  { href: "/privacy/", label: "Privacy" },
  { href: "/terms/", label: "Terms" },
];

export function WellbeingsApp() {
  const wb = useWellbeings();
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
        <RonakHandoffBanner
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
          resumable={wb.resumable}
          onResume={wb.resumeChat}
          onDiscardDraft={wb.discardDraft}
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
          onComplete={() => wb.startChat("detailed")}
          finishLabel={wb.s.startCheckin}
        />
      )}

      {wb.helpOpen && <HelpDialog region={wb.region} lang={wb.settings.lang} onClose={wb.closeHelp} />}
      {wb.breathOpen && <BreathDialog onClose={wb.closeBreath} />}
      {settingsOpen && <SettingsDialog wb={wb} onClose={() => setSettingsOpen(false)} />}

      {/* The app's footer is also the only route out of the application and
          into the written guides, so it carries real links rather than two
          lines of small print. Without these the content pages would be
          reachable from search but not from the product, which is the usual
          way a "content section" ends up orphaned from the thing it explains. */}
      <footer
        style={{
          borderTop: "1px solid var(--color-divider)",
          padding: "16px 24px calc(16px + env(safe-area-inset-bottom))",
          display: "flex",
          gap: "10px 18px",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 11,
          color: "var(--color-neutral-600)",
        }}
      >
        <nav aria-label="Wellbeings site" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {SITE_LINKS.map((l) => (
            /* No prefetch={false} here, deliberately. It was tried, on the
               reasoning that prefetching four routes from a working app
               wastes bandwidth on a patchy connection. An A/B measurement of
               a content page said otherwise: identical request counts with
               and without it, and no separate prefetch payloads at all in
               this static export. An optimisation that cannot be measured is
               just a slower navigation for nothing. */
            <Link key={l.href} href={l.href} className="app-site-link" style={{ fontSize: 12 }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <span style={{ maxWidth: 560 }}>
          {wb.s.footerDisclaimer} {wb.s.footerPrivacy}
        </span>
      </footer>
    </div>
  );
}
