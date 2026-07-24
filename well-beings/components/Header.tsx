import { LogoIcon, ShieldIcon } from "./icons";

export function Header({ onHelp }: { onHelp: () => void }) {
  return (
    <header
      className="nav"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 22px",
        borderBottom: "1px solid var(--color-divider)",
        position: "sticky",
        top: 0,
        background: "color-mix(in srgb, var(--color-bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
        zIndex: 40,
      }}
    >
      <div className="nav-brand" style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <LogoIcon style={{ color: "var(--color-accent)" }} />
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, letterSpacing: ".01em" }}>
          Well-Beings
        </span>
      </div>
      <span className="tag tag-neutral" style={{ fontSize: 10.5 }}>
        On-device · no third parties
      </span>
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onHelp} style={{ fontSize: 12.5 }}>
        <ShieldIcon style={{ color: "currentColor", marginRight: 6, verticalAlign: -2 }} />
        Help now
      </button>
    </header>
  );
}
