import { useEffect, useState } from "react";
import { Tab, WellBeings } from "@/hooks/useWellBeings";
import { TodayTab } from "./tabs/TodayTab";
import { PlanTab } from "./tabs/PlanTab";
import { BurnoutTab } from "./tabs/BurnoutTab";
import { LibraryTab } from "./tabs/LibraryTab";
import { HelpTab } from "./tabs/HelpTab";
import { Tour } from "./Tour";
import { APP_TOUR, hasTakenTour, markTourTaken } from "@/lib/tour";

const TAB_DEFS: [Tab, string][] = [
  ["today", "Today"],
  ["plan", "My system"],
  ["burnout", "Burnout radar"],
  ["library", "Evidence"],
  ["help", "Help & privacy"],
];

export function AppScreen({ wb }: { wb: WellBeings }) {
  const [tourOpen, setTourOpen] = useState(false);

  // Auto-launch once, ever, per device — never on the demo profile (a
  // sample dashboard is a strange place to be told how the real one works).
  useEffect(() => {
    if (!wb.isDemo && !hasTakenTour()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTourOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeTour() {
    setTourOpen(false);
    markTourTaken();
  }

  return (
    <main data-screen-label="App" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {tourOpen && <Tour steps={APP_TOUR} currentTab={wb.tab} setTab={wb.setTab} onFinish={closeTour} />}
      <div style={{ borderBottom: "1px solid var(--color-divider)" }}>
        <div data-tour="tabs" style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto" }}>
          {TAB_DEFS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => wb.setTab(id)}
              role="tab"
              aria-selected={wb.tab === id}
              style={{
                background: "none",
                border: "none",
                borderBottom: wb.tab === id ? "2px solid var(--color-accent)" : "2px solid transparent",
                color: wb.tab === id ? "var(--color-text)" : "var(--color-neutral-500)",
                font: "500 13px/1 var(--font-body)",
                padding: "13px 14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Keyed on the tab so switching replays the entrance — the panel reads
          as new content arriving rather than the old one being overwritten. */}
      <div
        key={wb.tab}
        className="anim-in"
        style={{ maxWidth: 1060, width: "100%", margin: "0 auto", padding: "30px 24px 70px", boxSizing: "border-box" }}
      >
        {wb.tab === "today" && <TodayTab wb={wb} />}
        {wb.tab === "plan" && <PlanTab wb={wb} />}
        {wb.tab === "burnout" && <BurnoutTab wb={wb} />}
        {wb.tab === "library" && <LibraryTab />}
        {wb.tab === "help" && <HelpTab wb={wb} onReplayTour={() => setTourOpen(true)} />}
      </div>
    </main>
  );
}
