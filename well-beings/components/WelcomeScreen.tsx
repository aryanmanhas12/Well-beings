import { Lang, t } from "@/lib/i18n";
import { StatementIntro } from "./StatementIntro";

/**
 * The landing page.
 *
 * It used to open on a headline and a paragraph of claims about itself. It
 * now opens on a claim you can be wrong about — see StatementIntro. The
 * pitch didn't disappear, it moved below the fold, which is the right order:
 * the deck earns the scroll, and the paragraph explains what you scrolled to.
 */
export function WelcomeScreen({
  lang = "en",
  showCitations = false,
  onStartChat,
  onStartDemo,
  onOpenHelp,
}: {
  lang?: Lang;
  showCitations?: boolean;
  onStartChat: () => void;
  onStartDemo: () => void;
  onOpenHelp: () => void;
}) {
  const s = t(lang);

  const features = [
    { title: s.featPrivateTitle, body: s.featPrivateBody },
    { title: s.featAdaptiveTitle, body: s.featAdaptiveBody },
    { title: s.featEvidenceTitle, body: s.featEvidenceBody },
  ];

  return (
    <main data-screen-label="Welcome" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          maxWidth: 1060,
          width: "100%",
          margin: "0 auto",
          padding: "48px 24px 40px",
          boxSizing: "border-box",
          display: "flex",
          flexWrap: "wrap",
          gap: 48,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: "1 1 480px", minWidth: 300 }}>
          <StatementIntro lang={lang} showCitations={showCitations} onStartChat={onStartChat} />

          <p
            style={{
              color: "var(--color-neutral-400)",
              fontSize: 15,
              maxWidth: 560,
              margin: "34px 0 20px",
              textWrap: "pretty",
            }}
          >
            {s.heroLead}
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
            <button
              className="btn btn-secondary"
              onClick={onStartDemo}
              style={{ fontSize: 14, padding: "10px 20px" }}
            >
              {s.previewProfile}
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
              maxWidth: 640,
            }}
          >
            {features.map((f) => (
              <div key={f.title} style={{ borderTop: "1px solid var(--color-accent-700)", paddingTop: 10 }}>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>{f.title}</div>
                <div style={{ color: "var(--color-neutral-500)", fontSize: 12.5, textWrap: "pretty" }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 18 }}>
            <div
              className="card-kicker"
              style={{ fontSize: 10.5, color: "var(--color-neutral-500)", letterSpacing: ".08em", textTransform: "uppercase" }}
            >
              {s.researchKicker}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "var(--font-display-tracking)",
                fontSize: 38,
                lineHeight: 1,
                margin: "10px 0 4px",
                color: "var(--color-accent-300)",
              }}
            >
              −38%
            </div>
            <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}>
              {s.statSleepBody}
            </div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "var(--font-display-tracking)",
                fontSize: 38,
                lineHeight: 1,
                margin: "0 0 4px",
                color: "var(--color-accent-300)",
              }}
            >
              7 in 10
            </div>
            <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}>
              {s.statPlanBody}
            </div>
          </div>

          {/* Said here rather than discovered three questions in — see lib/i18n.ts. */}
          {lang !== "en" && (
            <div
              className="card"
              style={{ padding: 16, fontSize: 11.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}
            >
              {s.checkinEnglishOnly}
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--color-neutral-600)", lineHeight: 1.5 }}>
            {s.notMedical}{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onOpenHelp();
              }}
            >
              {s.helpNow}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
