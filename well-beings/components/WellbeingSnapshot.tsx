import Link from "next/link";
import { buildSnapshot, medicalNotes, topPriorities } from "@/lib/lifestyle";
import { psychScreenerLink } from "@/lib/bridge";
import { Profile } from "@/lib/types";

/**
 * The read-out.
 *
 * What this replaces is the reason it exists. A wellbeing result that opens
 * on a number invites exactly one question — is that good? — and any answer
 * to it is a claim the app cannot support. So there is no score here, no
 * percentage, and no "your wellbeing is 73% healthy". There is a snapshot: a
 * person's own answers, ordered so the most useful place to start is the
 * first thing they read.
 *
 * The four categories are kept visually and structurally apart, because
 * running them together is how tools like this end up sounding clinical:
 *
 *   You said        the report, verbatim, no reading between the lines
 *   What that may   a hedged interpretation, never stated as fact
 *     suggest
 *   Worth trying    something specific, sized to today / this week / later
 *   Worth a         the separate, clearly-marked category for "a person,
 *     conversation    not an app, is the right next step here"
 *
 * That last one is never rendered as a tip and never sits inside the plan.
 * A line about seeing a GP formatted like a productivity suggestion reads as
 * optional, and it is not.
 */
export function WellbeingSnapshot({ profile }: { profile: Profile }) {
  const reads = buildSnapshot(profile);
  const priorities = topPriorities(reads);
  const medical = medicalNotes(reads);
  const steady = reads.filter((r) => r.strain === 0);
  const quick = profile.depth === "quick";

  return (
    <section aria-labelledby="snapshot-h" style={{ marginTop: 34 }}>
      <h2
        id="snapshot-h"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: "var(--font-display-weight)",
          letterSpacing: "var(--font-display-tracking)",
          fontSize: 24,
          margin: "0 0 6px",
        }}
      >
        Your wellbeing snapshot
      </h2>
      <p style={{ fontSize: 13, color: "var(--color-neutral-500)", maxWidth: 640, textWrap: "pretty" }}>
        This is your own answers, sorted. It is not a score, not a percentage and not a measurement
        of your health — there is no validated scale that could produce one from questions like
        these. {quick ? "You took the quick check, so this covers fewer areas than the detailed one would. " : ""}
        Nothing here is a diagnosis.
      </p>

      {priorities.length === 0 ? (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Nothing stands out as under strain</div>
          <div style={{ fontSize: 13, color: "var(--color-neutral-400)", textWrap: "pretty" }}>
            On what you reported, no area looks like the thing holding the others down. That is worth
            knowing rather than dismissing: it means effort is better spent keeping the current
            pattern than changing it. Come back if a week starts feeling different.
          </div>
        </div>
      ) : (
        <>
          <h3 style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-500)", margin: "26px 0 12px" }}>
            Top {priorities.length === 1 ? "priority" : `${priorities.length} priorities`}
          </h3>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
            {priorities.map((r, i) => (
              <li key={r.id} className="card" style={{ padding: 20, gap: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: "var(--font-display-weight)",
                      fontSize: 22,
                      color: "var(--color-accent-400)",
                      lineHeight: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{r.label}</span>
                  {/* Strain is named in words as well as ranked, so the meaning
                      never depends on position or colour alone. */}
                  <span style={{ fontSize: 11.5, color: "var(--color-neutral-500)", marginLeft: "auto" }}>
                    {r.strain >= 3 ? "loudest signal" : r.strain === 2 ? "under strain" : "worth a look"}
                  </span>
                </div>

                <Field label="You said">{r.observation}</Field>
                <Field label="What that may suggest">{r.interpretation}</Field>
                <Field label="Worth trying this week">{r.actions.week}</Field>
              </li>
            ))}
          </ol>

          <h3 style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-500)", margin: "30px 0 12px" }}>
            The plan, by how soon
          </h3>
          <p style={{ fontSize: 12.5, color: "var(--color-neutral-500)", maxWidth: 620, margin: "0 0 14px", textWrap: "pretty" }}>
            Three areas, three timescales. Deliberately not twenty suggestions: the research on
            changing behaviour is consistent that one thing at a time is what actually holds.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            <Horizon
              title="Next 24 hours"
              note="Small enough that a bad day cannot stop it."
              items={priorities.map((r) => ({ label: r.label, text: r.actions.now }))}
            />
            <Horizon
              title="Next 7 days"
              note="One week, then look again."
              items={priorities.map((r) => ({ label: r.label, text: r.actions.week }))}
            />
            <Horizon
              title="Longer term"
              note="Months, not weeks. Habits took a median of about two months to feel automatic in the tracking studies, not 21 days."
              items={priorities.map((r) => ({ label: r.label, text: r.actions.longer }))}
            />
          </div>
        </>
      )}

      {steady.length > 0 && (
        <p style={{ fontSize: 12.5, color: "var(--color-neutral-500)", marginTop: 22, textWrap: "pretty" }}>
          <strong style={{ color: "var(--color-neutral-300)" }}>Holding steady:</strong>{" "}
          {steady.map((r) => r.label.toLowerCase()).join(", ")}. Worth leaving alone.
        </p>
      )}

      {medical.length > 0 && (
        <section
          aria-labelledby="medical-h"
          style={{
            marginTop: 26,
            padding: "18px 20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-accent-700)",
            background: "color-mix(in srgb, var(--color-accent-900) 45%, transparent)",
          }}
        >
          <h3 id="medical-h" style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>
            Worth a conversation with a person, not an app
          </h3>
          <p style={{ fontSize: 12.5, color: "var(--color-neutral-400)", margin: "0 0 12px", textWrap: "pretty" }}>
            Separate from the suggestions above on purpose. These are not tasks and they are not
            diagnoses — they are the points where something outside this tool is the better next
            step.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 10 }}>
            {medical.map((m) => (
              <li key={m.label} style={{ fontSize: 13, color: "var(--color-neutral-300)", textWrap: "pretty" }}>
                <strong style={{ color: "var(--color-text)" }}>{m.label}.</strong> {m.note}
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link href="/resources/" className="btn btn-secondary" style={{ fontSize: 12.5 }}>
              Support lines
            </Link>
            <a
              href={psychScreenerLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: 12.5 }}
            >
              Open Psych Screener ↗
            </a>
          </div>
        </section>
      )}

      {quick && (
        <p style={{ fontSize: 12.5, color: "var(--color-neutral-500)", marginTop: 22, textWrap: "pretty" }}>
          The detailed check adds hydration, evening screens, your physical space and sense of
          direction, plus optional deeper questions. It takes about five minutes rather than three.
        </p>
      )}
    </section>
  );
}

/** One labelled band inside a priority card. The label is a real element
    rather than a styled prefix so the observation/interpretation boundary is
    announced, not just drawn. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: ".07em",
          textTransform: "uppercase",
          color: "var(--color-neutral-600)",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--color-neutral-300)", textWrap: "pretty" }}>{children}</div>
    </div>
  );
}

function Horizon({
  title,
  note,
  items,
}: {
  title: string;
  note: string;
  items: { label: string; text: string }[];
}) {
  return (
    <div className="card" style={{ padding: 18, gap: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", marginBottom: 12, textWrap: "pretty" }}>
        {note}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 9 }}>
        {items.map((it) => (
          <li key={it.label} style={{ fontSize: 12.5, color: "var(--color-neutral-300)", textWrap: "pretty" }}>
            <span style={{ color: "var(--color-neutral-500)" }}>{it.label}:</span> {it.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
