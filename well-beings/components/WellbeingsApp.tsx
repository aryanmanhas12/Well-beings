"use client";

import { useState } from "react";
import Link from "next/link";
import { useWellbeings } from "@/hooks/useWellbeings";
import { useHaven } from "@/hooks/useHaven";
import { DEFAULT_REGION, HELPLINES } from "@/lib/helplines";
import type { Region } from "@/lib/types";
import { Header } from "./Header";
import { ChatScreen } from "./ChatScreen";
import { ResultsScreen } from "./ResultsScreen";
import { HelpDialog, BreathDialog } from "./dialogs";
import { SettingsDialog } from "./SettingsDialog";
import { RonakHandoffBanner } from "./RonakHandoffBanner";
import { HavenShell } from "./haven/HavenShell";

/** Kept short on purpose. The footer of a working app is not the place for a
    sitemap; these are the destinations someone in the middle of the app
    might actually want, and the guides index fans out to the rest. */
const SITE_LINKS = [
  { href: "/guides/", label: "Guides" },
  { href: "/resources/", label: "Support lines" },
  { href: "/about/", label: "About" },
  { href: "/privacy/", label: "Privacy" },
  { href: "/terms/", label: "Terms" },
];

/**
 * The whole app on one URL.
 *
 * Home is the safe place (components/haven). The wellbeing check and its
 * results are full screens of their own, reached from inside it, and the
 * daily plan they build lives in the safe place's Plan tab.
 *
 * Which helplines to show is decided once, here, in order of what the
 * person has told us: the region they picked on Reach out, then the one
 * they gave in the wellbeing check, then a guess from their clock.
 */
export function WellbeingsApp() {
  const wb = useWellbeings();
  const haven = useHaven();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [replayIntro, setReplayIntro] = useState(0);

  const regionKey: Region = haven.state.region ?? (wb.profile?.region as Region | undefined) ?? DEFAULT_REGION;
  const region = HELPLINES[regionKey] ?? HELPLINES[DEFAULT_REGION];
  const onHome = wb.screen === "home" || wb.screen === "app";

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
        onHome={() => wb.setScreen("home")}
      />

      {wb.handoff && onHome && (
        <RonakHandoffBanner
          handoff={wb.handoff}
          onCheckIn={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          onOpenHelp={wb.openHelp}
          onDismiss={wb.dismissHandoff}
        />
      )}

      {onHome && <HavenShell wb={wb} haven={haven} region={region} replayIntro={replayIntro} />}
      {wb.screen === "chat" && <ChatScreen wb={wb} />}
      {wb.screen === "results" && wb.profile && (
        <ResultsScreen
          profile={wb.profile}
          crisis={wb.crisis}
          calm={wb.settings.calmMode}
          region={region}
          lang={wb.settings.lang}
          showCitations={wb.settings.showCitations}
          onBuildSystem={wb.buildSystem}
          onOpenHelp={wb.openHelp}
        />
      )}

      {wb.helpOpen && <HelpDialog region={region} lang={wb.settings.lang} onClose={wb.closeHelp} />}
      {wb.breathOpen && <BreathDialog onClose={wb.closeBreath} />}
      {settingsOpen && (
        <SettingsDialog
          wb={wb}
          onClose={() => setSettingsOpen(false)}
          onReplayIntro={() => {
            setSettingsOpen(false);
            wb.setScreen("home");
            setReplayIntro((n) => n + 1);
          }}
        />
      )}

      {/* The app's footer is also the only route out of the application and
          into the written guides, so it carries real links rather than two
          lines of small print. On a phone it sits above the tab bar's space,
          which .haven reserves with its bottom padding. */}
      <footer
        className={onHome ? "app-foot app-foot-tabbed" : "app-foot"}
        style={{
          borderTop: "1px solid var(--color-divider)",
          padding: "16px 24px",
          display: "flex",
          gap: "10px 18px",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 11.5,
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
            <Link key={l.href} href={l.href} className="app-site-link" style={{ fontSize: 12.5 }}>
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
