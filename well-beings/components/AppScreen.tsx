import { Tab, WellBeings } from "@/hooks/useWellBeings";
import { TodayTab } from "./tabs/TodayTab";
import { PlanTab } from "./tabs/PlanTab";
import { BurnoutTab } from "./tabs/BurnoutTab";
import { LibraryTab } from "./tabs/LibraryTab";
import { HelpTab } from "./tabs/HelpTab";

const TAB_DEFS: [Tab, string][] = [
  ["today", "Today"],
  ["plan", "My system"],
  ["burnout", "Burnout radar"],
  ["library", "Evidence"],
  ["help", "Help & privacy"],
];

export function AppScreen({ wb }: { wb: WellBeings }) {
  return (
    <main data-screen-label="App" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ borderBottom: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto" }}>
          {TAB_DEFS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => wb.setTab(id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: wb.tab === id ? "2px solid var(--color-accent)" : "2px solid transparent",
                color: wb.tab === id ? "var(--color-text)" : "var(--color-neutral-500)",
                font: "500 13px/1 var(--font-body)",
                padding: "13px 14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1060, width: "100%", margin: "0 auto", padding: "30px 24px 70px", boxSizing: "border-box" }}>
        {wb.tab === "today" && <TodayTab wb={wb} />}
        {wb.tab === "plan" && <PlanTab wb={wb} />}
        {wb.tab === "burnout" && <BurnoutTab wb={wb} />}
        {wb.tab === "library" && <LibraryTab />}
        {wb.tab === "help" && <HelpTab wb={wb} />}
      </div>
    </main>
  );
}
