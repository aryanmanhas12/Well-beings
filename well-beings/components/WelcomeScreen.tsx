import { Lang, t } from "@/lib/i18n";
import { StatementIntro } from "./StatementIntro";
import { InstallApp } from "./InstallApp";
import { Depth } from "@/lib/lifestyle";
import { DailyLight } from "./DailyLight";
import { HelplineRegion } from "@/lib/types";

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
  resumable,
  onResume,
  onDiscardDraft,
  region,
}: {
  region: HelplineRegion;
  lang?: Lang;
  showCitations?: boolean;
  onStartChat: (depth: Depth) => void;
  onStartDemo: () => void;
  onOpenHelp: () => void;
  /** An unfinished check-in saved on this device, or null. */
  resumable: { answered: number; depth: Depth } | null;
  onResume: () => void;
  onDiscardDraft: () => void;
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

  /* Layout lives in CSS now, not in inline styles. It had to: the page
     needed different spacing on a phone than on a desktop, and an inline
     style cannot carry a media query. See `.wel-*` in globals.css. */
  return (
    <main data-screen-label="Welcome" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* The front door comes first: a line for today, one good thing, and
          someone to sit with. The check-in below is still here for anyone
          who wants a closer look, but it no longer opens the app. */}
      <DailyLight lang={lang} region={region} />
      <h2 className="wel-more">When you want a closer look at how you are living</h2>
      <div className="wel-band wel-hero">
        <div className="wel-hero-main">
          {/* A decorative orbit used to sit here: three rotating rings and a
              radial glow that breathed on a ten-second cycle. It was the
              single clearest "generated page" tell left in the app — a
              glowing orb is decoration that communicates nothing, animates
              for its own sake, and cost a compositor layer on the first
              screen a phone renders. The claim below is the thing worth
              looking at, and it is now the first thing on the page. */}
          <StatementIntro lang={lang} showCitations={showCitations} onStartChat={onStartChat} />
        </div>

        {/* The rail. It holds what someone standing in front of the deck would
            reasonably ask next — what is this, can I see one first, can I keep
            it — and nothing else. The lead paragraph and the preview button
            used to sit under the deck, which made the left column about twice
            the height of this one and left the whole right side of a desktop
            window empty once the research figures moved out. */}
        <div className="wel-rail">
          {/* Offered, never auto-resumed. Dropping someone back into question
              fourteen of a form they may have walked away from on purpose is
              its own kind of rude, and the discard option has to be as easy to
              reach as the resume one. */}
          {resumable && (
            <div className="card" style={{ padding: 16, border: "1px solid var(--color-accent-700)" }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                You have a check-in in progress
              </div>
              <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 12, textWrap: "pretty" }}>
                {resumable.answered} {resumable.answered === 1 ? "answer" : "answers"} saved on this
                device from your {resumable.depth === "quick" ? "quick" : "detailed"} check. Nothing
                was sent anywhere.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={onResume} style={{ fontSize: 12.5 }}>
                  Pick up where I left off
                </button>
                <button className="btn btn-secondary" onClick={onDiscardDraft} style={{ fontSize: 12.5 }}>
                  Start over
                </button>
              </div>
            </div>
          )}

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
      <section className="wel-band wel-research" aria-label={s.researchKicker}>
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
        <div className="wel-stats">
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

      {/* Band 3: how the thing behaves.
          This was three equal tiles in a row, which is the shape of a
          template rather than a thought — the grid was doing the talking and
          the three items had nothing in common except being three. They are
          properties of the tool, so they are a definition list: term, then
          what it means. It is the correct semantics, it collapses to a
          readable single column on a phone instead of squeezing three tiles
          into 390px, and it stops implying the three are equally weighted
          selling points. */}
      <section className="wel-band wel-how" aria-labelledby="how-h">
        <h2
          id="how-h"
          style={{
            fontSize: 10.5,
            color: "var(--color-neutral-500)",
            letterSpacing: ".08em",
            textTransform: "uppercase",
            margin: "0 0 14px",
            fontWeight: 600,
          }}
        >
          {s.howItBehaves}
        </h2>
        <dl className="spec-list">
          {features.map((f) => (
            <div key={f.title} data-tour={f.anchor} className="spec-row">
              <dt>{f.title}</dt>
              <dd>{f.body}</dd>
            </div>
          ))}
        </dl>
      </section>

    </main>
  );
}
