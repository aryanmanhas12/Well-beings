import { Lang, t } from "@/lib/i18n";
import { StatementIntro } from "./StatementIntro";
import { WelcomeAura } from "./WelcomeAura";
import { InstallApp } from "./InstallApp";

/**
 * The landing page.
 *
 * It used to open on a headline and a paragraph of claims about itself. It
 * now opens on a claim you can be wrong about — see StatementIntro. The
 * pitch didn't disappear, it moved below the fold, which is the right order:
 * the deck earns the scroll, and the paragraph explains what you scrolled to.
 *
 * Layout, and why it changed. The two research figures used to sit in the
 * right rail, stacked above the install card, which put three unrelated
 * things in one narrow column and set the two loudest numbers on the page
 * beside the statement deck — the one thing the screen is actually asking you
 * to read. On a tablet they competed with it directly.
 *
 * So the page is now three bands rather than two columns:
 *
 *   1. the deck, with only the install card and the disclaimer beside it,
 *   2. the research, full width, given room to be read as evidence,
 *   3. the three principles.
 *
 * Each band is one idea, in the order someone actually needs them: here is a
 * claim, here is what the papers say, here is how this thing behaves.
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

  /* `anchor` is what the welcome tour spotlights. Without these the tour's
     steps find nothing, time out and skip — which is exactly what happened
     when WELCOME_TOUR landed here without its targets. */
  const features = [
    { title: s.featPrivateTitle, body: s.featPrivateBody, anchor: "welcome-privacy" },
    { title: s.featAdaptiveTitle, body: s.featAdaptiveBody, anchor: undefined },
    { title: s.featEvidenceTitle, body: s.featEvidenceBody, anchor: "welcome-evidence" },
  ];

  /* The figures are literal and stay in English in every language: "7 hrs" is
     the finding, not a label, and the sentence under it carries the meaning. */
  const stats = [
    { figure: "7 hrs", body: s.statSleepBody },
    { figure: "3 for 3", body: s.statPlanBody },
  ];

  /* One measure for all three bands, so their edges line up down the page. */
  const band: React.CSSProperties = {
    maxWidth: 1060,
    width: "100%",
    margin: "0 auto",
    padding: "0 24px",
    boxSizing: "border-box",
  };

  return (
    <main data-screen-label="Welcome" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          ...band,
          padding: "48px 24px 40px",
          display: "flex",
          flexWrap: "wrap",
          gap: 48,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: "1 1 520px", minWidth: 300 }}>
          {/* The screen opened on text alone. This resolves before a word is
              read and gives the page somewhere to start — deliberately an
              orbit rather than a character, since the app's first question
              is about sleep, mood and burnout and something cheerful sets
              the wrong expectation for that. Decorative, aria-hidden, and
              composed to still read when reduced motion freezes it. */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
            <WelcomeAura size={180} />
          </div>
          <StatementIntro lang={lang} showCitations={showCitations} onStartChat={onStartChat} />
        </div>

        {/* The rail. It holds what someone standing in front of the deck would
            reasonably ask next — what is this, can I see one first, can I keep
            it — and nothing else. The lead paragraph and the preview button
            used to sit under the deck, which made the left column about twice
            the height of this one and left the whole right side of a desktop
            window empty once the research figures moved out. */}
        <div style={{ flex: "0 1 320px", minWidth: 260, display: "flex", flexDirection: "column", gap: 16 }}>
          <p
            style={{
              color: "var(--color-neutral-300)",
              fontSize: 14.5,
              margin: 0,
              textWrap: "pretty",
            }}
          >
            {s.heroLead}
          </p>

          <div>
            <button
              className="btn btn-secondary"
              data-tour="welcome-preview"
              onClick={onStartDemo}
              style={{ fontSize: 14, padding: "10px 20px" }}
            >
              {s.previewProfile}
            </button>
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

          <InstallApp tourAnchor="welcome-install" compact />

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

      {/* Band 2: the evidence. Full width and side by side, because these two
          figures are the argument the rest of the page rests on, and stacked
          in a 320px rail they read as sidebar trivia. */}
      <section style={{ ...band, paddingBottom: 44 }} aria-label={s.researchKicker}>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--color-neutral-500)",
            letterSpacing: ".08em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          {s.researchKicker}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {stats.map((st) => (
            <div key={st.figure} className="card" style={{ padding: 20, gap: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "var(--font-display-tracking)",
                  fontWeight: "var(--font-display-weight)",
                  fontSize: 40,
                  lineHeight: 1,
                  marginBottom: 8,
                  color: "var(--color-accent-300)",
                }}
              >
                {st.figure}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-neutral-400)", textWrap: "pretty" }}>{st.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Band 3: how the thing behaves. */}
      <section
        style={{
          ...band,
          paddingBottom: 48,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 18,
        }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            data-tour={f.anchor}
            style={{ borderTop: "1px solid var(--color-accent-700)", paddingTop: 12 }}
          >
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{f.title}</div>
            <div style={{ color: "var(--color-neutral-500)", fontSize: 12.5, textWrap: "pretty" }}>{f.body}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
