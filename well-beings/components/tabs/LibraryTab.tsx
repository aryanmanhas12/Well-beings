import { EVIDENCE } from "@/lib/evidence";

export function LibraryTab() {
  return (
    <div data-screen-label="Evidence library">
      <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 22, margin: "0 0 4px" }}>
        Why each practice is here
      </h2>
      <p style={{ color: "var(--color-neutral-500)", fontSize: 13, margin: "0 0 22px", maxWidth: 620, textWrap: "pretty" }}>
        Every recommendation in Well-Beings traces to peer-reviewed research — mostly meta-analyses and large
        cohorts, sourced via PubMed &amp; Consensus. Where the evidence is young or mixed, the card says so.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 14 }}>
        {EVIDENCE.map((ev) => (
          <div key={ev.cite} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="tag tag-accent" style={{ fontSize: 10 }}>
                {ev.tag}
              </span>
              <span className="tag tag-neutral" style={{ fontSize: 10 }}>
                {ev.design}
              </span>
            </div>
            <div style={{ fontSize: 13.5, textWrap: "pretty" }}>{ev.finding}</div>
            <div style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>In Well-Beings: {ev.use}</div>
            <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, marginTop: "auto" }}>
              {ev.cite} ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
