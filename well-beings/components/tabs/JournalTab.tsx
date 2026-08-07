import { useMemo, useState } from "react";
import { WellBeings } from "@/hooks/useWellBeings";
import { psychScreenerLink } from "@/lib/bridge";
import { KIND_LABEL, PROMPTS, countWords, nextPrompt, readCadence, recentWords } from "@/lib/journal";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function JournalTab({ wb }: { wb: WellBeings }) {
  const entries = wb.journal;
  const suggested = useMemo(() => nextPrompt(entries), [entries]);
  const [promptId, setPromptId] = useState(suggested.id);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<null | { flagged: boolean }>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [openEntry, setOpenEntry] = useState<string | null>(null);

  const prompt = PROMPTS.find((p) => p.id === promptId) ?? suggested;
  const cadence = readCadence(entries);
  const words = countWords(text);

  function save() {
    if (!text.trim()) return;
    const res = wb.addJournalEntry(prompt.id, prompt.kind, text);
    setSaved(res);
    setText("");
    // Move to the next prompt in the rotation so disclosure → reappraisal
    // pairing keeps working across sessions.
    setPromptId(nextPrompt([...entries, { at: "", promptId: prompt.id, kind: prompt.kind, text: "", words: 0 }]).id);
  }

  return (
    <div data-screen-label="Journal" style={{ display: "flex", flexWrap: "wrap", gap: 26, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 460px", minWidth: 300 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 24, margin: "0 0 4px" }}>
          Write it down
        </h2>
        <p style={{ color: "var(--color-neutral-500)", fontSize: 13, margin: "0 0 18px", maxWidth: 560, textWrap: "pretty" }}>
          This is the part of Well-Beings with the longest research history behind it. Nobody reads these entries
          but you — they never leave this device, and you can delete any of them.
        </p>

        <div className="card" data-tour="journal-write" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
            <span className="tag tag-accent" style={{ fontSize: 10 }}>
              {KIND_LABEL[prompt.kind]}
            </span>
            <button
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              style={{ all: "unset", cursor: "pointer", fontSize: 11.5, color: "var(--color-accent-400)", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              {showWhy ? "Hide" : "Why this prompt?"}
            </button>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.55, margin: "0 0 10px", textWrap: "pretty" }}>{prompt.text}</p>

          {showWhy && (
            <p
              style={{
                fontSize: 12,
                color: "var(--color-neutral-400)",
                margin: "0 0 12px",
                paddingLeft: 10,
                borderLeft: "2px solid var(--color-accent-800)",
                textWrap: "pretty",
              }}
            >
              {prompt.why}
            </p>
          )}

          <textarea
            className="input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (saved) setSaved(null);
            }}
            rows={9}
            placeholder="Start anywhere. Spelling and grammar genuinely don't matter — the trials found no link between writing quality and benefit."
            style={{ resize: "vertical", lineHeight: 1.6, minHeight: 180, padding: 12 }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, color: "var(--color-neutral-600)", fontVariantNumeric: "tabular-nums" }}>
              {words} {words === 1 ? "word" : "words"}
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => {
                const pool = PROMPTS.filter((p) => p.id !== prompt.id);
                setPromptId(pool[Math.floor(Math.random() * pool.length)].id);
              }}
              className="btn btn-secondary"
              style={{ fontSize: 12 }}
            >
              Different prompt
            </button>
            <button onClick={save} disabled={!text.trim()} className="btn btn-primary" style={{ fontSize: 12.5 }}>
              Save entry
            </button>
          </div>
        </div>

        {saved && (
          <div
            className="card anim-in"
            role="status"
            style={{
              padding: 16,
              marginBottom: 16,
              borderColor: saved.flagged ? "var(--color-accent-500)" : undefined,
            }}
          >
            {saved.flagged ? (
              <>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                  That sounded heavy — and it deserves a person, not an app
                </div>
                <p style={{ fontSize: 12.5, color: "var(--color-neutral-400)", margin: "0 0 12px", textWrap: "pretty" }}>
                  Your entry is saved and stays private. But some of what you wrote is the kind of thing worth
                  saying out loud to someone. These lines are free, confidential and open right now.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-primary" onClick={wb.openHelp} style={{ fontSize: 12 }}>
                    See support options
                  </button>
                  <a
                    className="btn btn-secondary"
                    href={psychScreenerLink({ crisis: true })}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12 }}
                  >
                    Full screener →
                  </a>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--color-neutral-400)", margin: 0, textWrap: "pretty" }}>
                Saved. One honest thing to expect: in trials the benefit showed up at follow-up, not the same
                evening — so if you don&apos;t feel lighter right now, that&apos;s the normal pattern, not a
                failure.
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: "0 1 330px", minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" data-tour="journal-cadence" style={{ padding: 18 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 6 }}>Rhythm</div>
          <p style={{ fontSize: 12.5, color: "var(--color-neutral-400)", margin: 0, textWrap: "pretty" }}>{cadence.message}</p>
          {entries.length > 0 && (
            <p style={{ fontSize: 11.5, color: "var(--color-neutral-600)", margin: "10px 0 0", fontVariantNumeric: "tabular-nums" }}>
              {recentWords(entries).toLocaleString()} words in the last 14 days · {entries.length} total{" "}
              {entries.length === 1 ? "entry" : "entries"}
            </p>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>
            Your entries
          </div>
          {!entries.length && (
            <p style={{ fontSize: 12, color: "var(--color-neutral-500)", margin: 0 }}>
              Nothing here yet. Entries stay on this device only.
            </p>
          )}
          {[...entries]
            .reverse()
            .slice(0, 12)
            .map((e) => {
              const open = openEntry === e.at;
              return (
                <div key={e.at} style={{ borderTop: "1px solid var(--color-divider)", padding: "9px 0" }}>
                  <button
                    onClick={() => setOpenEntry(open ? null : e.at)}
                    aria-expanded={open}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      display: "flex",
                      width: "100%",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 12.5, flex: 1 }}>{fmtDate(e.at)}</span>
                    <span style={{ fontSize: 10.5, color: "var(--color-neutral-600)" }}>{KIND_LABEL[e.kind]}</span>
                    <span aria-hidden="true" style={{ fontSize: 10, color: "var(--color-neutral-600)" }}>
                      {open ? "▾" : "▸"}
                    </span>
                  </button>
                  {open && (
                    <div style={{ marginTop: 8 }}>
                      <p
                        style={{
                          fontSize: 12.5,
                          color: "var(--color-neutral-300)",
                          whiteSpace: "pre-wrap",
                          margin: "0 0 8px",
                          lineHeight: 1.55,
                        }}
                      >
                        {e.text}
                      </p>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this entry? This can't be undone.")) {
                            wb.deleteJournalEntry(e.at);
                            setOpenEntry(null);
                          }
                        }}
                        style={{ all: "unset", cursor: "pointer", fontSize: 11, color: "var(--color-neutral-500)" }}
                      >
                        Delete this entry
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
