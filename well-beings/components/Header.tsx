import { LogoIcon, ShieldIcon } from "./icons";

export function Header({ onHelp, onSettings }: { onHelp: () => void; onSettings?: () => void }) {
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
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, letterSpacing: ".01em", whiteSpace: "nowrap" }}>
          Well-Beings
        </span>
      </div>
      {/* Hidden below 520px via .nav-privacy-tag — at phone widths it wrapped
          to two cramped lines between the logo and Help now. The same
          promise already lives in the footer and throughout the app, so
          hiding it here loses nothing, not just moves the wrap elsewhere. */}
      <span className="tag tag-neutral nav-privacy-tag" style={{ fontSize: 10.5, whiteSpace: "nowrap" }}>
        On-device · no third parties
      </span>
      <div style={{ flex: 1 }} />
      {onSettings && (
        <button className="btn btn-ghost" onClick={onSettings} style={{ fontSize: 12.5 }}>
          ⚙️
        </button>
      )}
      <button className="btn btn-ghost" data-tour="help-now" onClick={onHelp} style={{ fontSize: 12.5 }}>
        <ShieldIcon style={{ color: "currentColor", marginRight: 6, verticalAlign: -2 }} />
        Help now
      </button>
    </header>
  );
}
