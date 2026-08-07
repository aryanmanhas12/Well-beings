import { LogoIcon, ShieldIcon } from "./icons";
import { Lang, LANGS, Strings } from "@/lib/i18n";

export function Header({
  s,
  lang,
  setLang,
  onHelp,
}: {
  s: Strings;
  lang: Lang;
  setLang: (l: Lang) => void;
  onHelp: () => void;
}) {
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
        <span
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "var(--font-display-tracking)",
            fontSize: 19,
            whiteSpace: "nowrap",
          }}
        >
          Well-Beings
        </span>
      </div>
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
          already localised and reachable by keyboard and screen reader. */}
      <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          aria-label={s.language}
          style={{
            font: "inherit",
            fontSize: 12.5,
            color: "var(--color-neutral-300)",
            background: "transparent",
            border: "1px solid var(--color-divider)",
            borderRadius: "var(--radius-md)",
            padding: "5px 7px",
            cursor: "pointer",
          }}
        >
          {LANGS.map((l) => (
            <option key={l.value} value={l.value} style={{ color: "initial" }}>
              {l.native}
            </option>
          ))}
        </select>

      <button className="btn btn-ghost" data-tour="help-now" onClick={onHelp} style={{ fontSize: 12.5 }}>
        <ShieldIcon style={{ color: "currentColor", marginRight: 6, verticalAlign: -2 }} />
        {s.helpNow}
      </button>
    </header>
  );
}
