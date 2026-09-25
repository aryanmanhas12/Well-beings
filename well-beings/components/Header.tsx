import { GearIcon, ShieldIcon } from "./icons";
import { BloomSun } from "./haven/BloomSun";
import { Lang, LANGS, Strings } from "@/lib/i18n";

export function Header({
  s,
  lang,
  setLang,
  onHelp,
  onSettings,
  onHome,
}: {
  s: Strings;
  lang: Lang;
  setLang: (l: Lang) => void;
  onHelp: () => void;
  onSettings: () => void;
  onHome?: () => void;
}) {
  return (
    <header
      className="nav"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 22px",
        /* Not sticky any more: the crisis strip above is the pinned thing,
           and two pinned bars would take a sixth of a phone screen. */
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* The wordmark doubles as the way home from the wellbeing check,
          which is a full screen of its own with no tab bar. */}
      <button
        type="button"
        className="nav-brand"
        onClick={onHome}
        aria-label="Wellbeings, go to your safe place"
        style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", padding: 0, minHeight: 44, minWidth: 44, color: "inherit", cursor: "pointer" }}
      >
        <BloomSun size={30} />
        <span
          className="nav-wordmark"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "var(--font-display-tracking)",
            fontWeight: 600,
            fontSize: 22,
            whiteSpace: "nowrap",
          }}
        >
          Wellbeings
        </span>
      </button>
      {/* Hidden below 520px via .nav-privacy-tag — at phone widths it wrapped
          to two cramped lines between the logo and Help now. The same
          promise already lives in the footer and throughout the app, so
          hiding it here loses nothing, not just moves the wrap elsewhere. */}
      <span className="tag tag-neutral nav-privacy-tag" style={{ fontSize: 10.5, whiteSpace: "nowrap" }}>
        {s.brandTag}
      </span>
      <div style={{ flex: 1 }} />

      {/* A native select, not a custom menu: it's two options, it needs to
          work before anyone has learned this UI, and the OS picker is
          already localised and reachable by keyboard and screen reader.

          Hidden below 520px via .nav-lang — four controls do not fit a
          360px header, and Settings carries language as its first row, so
          nothing becomes unreachable on a phone. Explicit background and
          color because a transparent native select renders unreadable in
          Windows dark mode. */}
      <select
        className="nav-lang"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label={s.language}
        style={{
          font: "inherit",
          fontSize: 12.5,
          color: "var(--color-neutral-300)",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-divider)",
          borderRadius: "var(--radius-md)",
          padding: "5px 7px",
          cursor: "pointer",
        }}
      >
        {LANGS.map((l) => (
          <option key={l.value} value={l.value} style={{ color: "initial", backgroundColor: "Canvas" }}>
            {l.native}
          </option>
        ))}
      </select>

      <button className="btn btn-ghost btn-icon" onClick={onSettings} aria-label="Settings" title="Settings" style={{ width: 44, height: 44 }}>
        <GearIcon style={{ color: "currentColor" }} />
      </button>

      {/* Help is the one control that is never more than one tap away, on
          every screen, so it gets the only filled button in the header. */}
      <button className="btn btn-sun" data-tour="help-now" onClick={onHelp} style={{ fontSize: 13, minHeight: 44, padding: "8px 12px" }}>
        <ShieldIcon style={{ color: "currentColor", marginRight: 6, verticalAlign: -2 }} />
        <span className="nav-help-label">{s.helpNow}</span>
      </button>
    </header>
  );
}
