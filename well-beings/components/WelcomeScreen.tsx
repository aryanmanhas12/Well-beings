export function WelcomeScreen({
  onStartChat,
  onStartDemo,
  onOpenHelp,
}: {
  onStartChat: () => void;
  onStartDemo: () => void;
  onOpenHelp: () => void;
}) {
  return (
    <main data-screen-label="Welcome" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          maxWidth: 1060,
          width: "100%",
          margin: "0 auto",
          padding: "64px 24px 40px",
          boxSizing: "border-box",
          display: "flex",
          flexWrap: "wrap",
          gap: 48,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: "1 1 480px", minWidth: 320 }}>
          <div className="tag tag-accent" style={{ marginBottom: 18 }}>
            Evidence-based · built on 15+ peer-reviewed studies
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 500,
              fontSize: "clamp(30px,4.5vw,44px)",
              lineHeight: 1.12,
              margin: "0 0 16px",
              letterSpacing: "-0.01em",
            }}
          >
            A system for your energy,
            <br />
            not just your to-do list.
          </h1>
          <p
            style={{
              color: "var(--color-neutral-400)",
              fontSize: 16,
              maxWidth: 520,
              margin: "0 0 26px",
              textWrap: "pretty",
            }}
          >
            A 5-minute check-in about your sleep, mood, stress and goals — using the same short screeners
            clinicians use — then a personalised daily system designed to raise output and keep you clear of
            burnout.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 34 }}>
            <button className="btn btn-primary" onClick={onStartChat} style={{ fontSize: 14, padding: "10px 20px" }}>
              Start the check-in · ~5 min
            </button>
            <button
              className="btn btn-secondary"
              onClick={onStartDemo}
              style={{ fontSize: 14, padding: "10px 20px" }}
            >
              Preview a sample profile
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
            <div style={{ borderTop: "1px solid var(--color-accent-700)", paddingTop: 10 }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>Private by design</div>
              <div style={{ color: "var(--color-neutral-500)", fontSize: 12.5 }}>
                Everything stays in your browser. Nothing is uploaded, shared or sold. Delete it anytime.
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--color-accent-700)", paddingTop: 10 }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>Adaptive, not exhausting</div>
              <div style={{ color: "var(--color-neutral-500)", fontSize: 12.5 }}>
                Short screeners first; deeper questions only if something flags — the approach validated in JAMA.
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--color-accent-700)", paddingTop: 10 }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>Research-backed only</div>
              <div style={{ color: "var(--color-neutral-500)", fontSize: 12.5 }}>
                Every practice cites its meta-analysis or trial — and says so when evidence is young.
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 18 }}>
            <div
              className="card-kicker"
              style={{ fontSize: 10.5, color: "var(--color-neutral-500)", letterSpacing: ".08em", textTransform: "uppercase" }}
            >
              From the research inside
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 26, margin: "8px 0 2px", color: "var(--color-accent-300)" }}>
              −38%
            </div>
            <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)" }}>
              depression risk for people with a regular sleep window — independent of hours slept. Cohort of
              79,666 (Psychological Medicine, 2025).
            </div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 26, margin: "0 0 2px", color: "var(--color-accent-300)" }}>
              7 in 10
            </div>
            <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)" }}>
              do better at reaching a goal with an &quot;if-then&quot; plan than without one — across 94 tests
              (Gollwitzer &amp; Sheeran meta-analysis).
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--color-neutral-600)", lineHeight: 1.5 }}>
            Well-Beings is a self-guidance tool, not a medical device. Its screeners signal — they don&apos;t
            diagnose. If you&apos;re in crisis, use{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onOpenHelp();
              }}
            >
              Help now
            </a>
            .
          </div>
        </div>
      </div>
    </main>
  );
}
