"use client";

import { useRef, useState } from "react";
import { MAX_PHOTOS, type Haven } from "@/hooks/useHaven";
import { mentionsCrisis } from "@/lib/journal";
import { HOPE_KINDS, WHY } from "@/lib/havenContent";
import type { HopeKind } from "@/lib/haven";
import { formatDay, GoTo, Why } from "./shared";

type View = "good" | "box" | "note";

/**
 * The things worth holding onto, kept where a bad minute can reach them.
 *
 * Three parts. Good things are the daily practice. The hope box is the
 * collection: people, plans, memories, proof of hard times survived, songs,
 * photos. The note is a letter from a steadier day to a heavier one, and
 * the app puts it in front of the person on a low check-in.
 *
 * Anything written here is checked for words that suggest someone is in
 * danger, the same check the journal has always had, and if it trips, the
 * app offers help instead of silently filing the words away.
 */
export function HopeTab({ haven, view, goTo }: { haven: Haven; view?: string; goTo: GoTo }) {
  const [tab, setTab] = useState<View>(view === "box" || view === "note" ? view : "good");
  const [flagged, setFlagged] = useState(false);

  const check = (text: string) => {
    if (mentionsCrisis(text)) setFlagged(true);
  };

  return (
    <div className="haven-stack">
      <h1 style={{ fontSize: 28, margin: "6px 0 0" }}>Hope</h1>
      <div className="subnav" role="group" aria-label="Hope sections">
        {(
          [
            ["good", "Good things"],
            ["box", "Hope box"],
            ["note", "A note for later"],
          ] as [View, string][]
        ).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {flagged && (
        <section className="panel panel-pink" role="status" aria-labelledby="flag-title">
          <h2 id="flag-title">That sounded really hard</h2>
          <p className="panel-lede">
            It&apos;s saved, and only you can see it. If you&apos;re thinking about ending your life, you don&apos;t have
            to hold that alone. Someone can talk with you right now.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-sun" onClick={() => goTo("reach")}>
              Talk to someone
            </button>
            <button type="button" className="btn btn-soft" onClick={() => goTo("plan", "use")}>
              Open my safety plan
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setFlagged(false)}>
              I&apos;m okay
            </button>
          </div>
        </section>
      )}

      {tab === "good" && <GoodThings haven={haven} check={check} />}
      {tab === "box" && <HopeBox haven={haven} check={check} />}
      {tab === "note" && <Letter haven={haven} check={check} />}
    </div>
  );
}

function GoodThings({ haven, check }: { haven: Haven; check: (t: string) => void }) {
  const [items, setItems] = useState(["", "", ""]);
  const [saved, setSaved] = useState(false);
  const days = [...haven.state.goodThings].sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = days.reduce((n, d) => n + d.items.length, 0);

  return (
    <>
      <section className="panel panel-pink" aria-labelledby="three-title">
        <h2 id="three-title">Three good things</h2>
        <p className="panel-lede">
          Up to three things from today that went okay, however small. One is plenty on a hard day.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const clean = items.filter((x) => x.trim());
            if (!clean.length) return;
            clean.forEach(check);
            haven.addGoodThings(clean);
            setItems(["", "", ""]);
            setSaved(true);
          }}
        >
          {items.map((v, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <label htmlFor={`good-${i}`} className="sr-only">
                Good thing {i + 1}
              </label>
              <input
                id={`good-${i}`}
                className="input"
                value={v}
                maxLength={200}
                autoComplete="off"
                placeholder={["Something that went okay…", "Someone who was kind…", "Something you noticed…"][i]}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  setItems(next);
                  setSaved(false);
                }}
              />
            </div>
          ))}
          <div className="btn-row">
            <button type="submit" className="btn btn-sun">
              Keep them
            </button>
            <span className="saved-note" role="status">
              {saved ? "Kept. They'll come back to you on a harder day." : ""}
            </span>
          </div>
        </form>
        <Why>{WHY.gratitude}</Why>
      </section>

      {days.length > 0 && (
        <section className="panel" aria-labelledby="jar-title">
          <h2 id="jar-title">Your jar</h2>
          <p className="panel-lede">
            {total} good thing{total === 1 ? "" : "s"} kept, over {days.length} day{days.length === 1 ? "" : "s"}.
          </p>
          {days.slice(0, 14).map((d) => (
            <div key={d.date} style={{ marginBottom: 12 }}>
              <p className="eyebrow">{formatDay(d.date + "T12:00:00")}</p>
              <ul className="hope-list" style={{ marginTop: 0 }}>
                {d.items.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

function HopeBox({ haven, check }: { haven: Haven; check: (t: string) => void }) {
  return (
    <>
      <section className="panel panel-lilac" aria-labelledby="box-title">
        <h2 id="box-title">Your hope box</h2>
        <p className="panel-lede">
          Reasons, people and memories to reach for when the future goes dark. Fill it on a steadier day; open it
          on a heavy one.
        </p>
        <Why>{WHY.hopebox}</Why>
      </section>

      <Photos haven={haven} />

      {HOPE_KINDS.map((k) => (
        <HopeSection key={k.kind} kind={k.kind} haven={haven} check={check} />
      ))}
    </>
  );
}

function HopeSection({ kind, haven, check }: { kind: HopeKind; haven: Haven; check: (t: string) => void }) {
  const meta = HOPE_KINDS.find((k) => k.kind === kind)!;
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const items = haven.state.hope.filter((h) => h.kind === kind);
  const id = `hope-${kind}`;

  return (
    <section className="panel" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>{meta.title}</h3>
      <p className="panel-lede" style={{ marginBottom: 10 }}>
        {meta.prompt}
      </p>
      {items.length > 0 && (
        <ul className="hope-list" style={{ marginBottom: 12 }}>
          {items.map((h) => (
            <li key={h.id}>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                {h.url ? (
                  <a href={h.url} target="_blank" rel="noopener noreferrer">
                    {h.text || h.url}
                  </a>
                ) : (
                  h.text
                )}
              </span>
              <button
                type="button"
                className="btn btn-quiet"
                style={{ minHeight: 44, padding: "2px 8px", flex: "none", fontSize: 13 }}
                onClick={() => haven.removeHope(h.id)}
                aria-label={`Remove: ${h.text}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          const u = url.trim();
          if (!t && !u) return;
          const safeUrl = u && /^https?:\/\//i.test(u) ? u : u ? `https://${u}` : undefined;
          check(t);
          haven.addHope({ kind, text: t || (safeUrl ?? ""), ...(safeUrl ? { url: safeUrl } : {}) });
          setText("");
          setUrl("");
        }}
        style={{ display: "grid", gap: 8 }}
      >
        <label htmlFor={`${id}-text`} className="sr-only">
          {meta.title}
        </label>
        <input
          id={`${id}-text`}
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={meta.placeholder}
          maxLength={240}
          autoComplete="off"
        />
        {kind === "sounds" && (
          <>
            <label htmlFor={`${id}-url`} className="sr-only">
              Link
            </label>
            <input
              id={`${id}-url`}
              className="input"
              /* Text, not type="url": a url input rejects "open.spotify.com/…"
                 without a scheme, and the browser then blocks the whole form
                 with no visible reason. The scheme is added on save. */
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a link (YouTube, Spotify…)"
              autoComplete="off"
            />
          </>
        )}
        <button type="submit" className="btn btn-soft" style={{ justifySelf: "start" }}>
          Add
        </button>
      </form>
    </section>
  );
}

function Photos({ haven }: { haven: Haven }) {
  const input = useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <section className="panel" aria-labelledby="photos-title">
      <h3 id="photos-title">Photos that help</h3>
      <p className="panel-lede" style={{ marginBottom: 10 }}>
        Faces you love, a place you felt free, a pet. Photos are shrunk and kept on this phone only; nothing is
        uploaded. Up to {MAX_PHOTOS}.
      </p>
      {haven.photos.length > 0 && (
        <div className="photo-grid">
          {haven.photos.map((p) => (
            <figure key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL; next/image cannot optimise it and would only add weight */}
              <img src={p.src} alt={p.caption || "A photo from your hope box"} />
              <figcaption style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center" }}>
                <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{p.caption}</span>
                <button
                  type="button"
                  className="btn btn-quiet"
                  style={{ minHeight: 44, padding: "2px 6px", fontSize: 13 }}
                  onClick={() => haven.removePhoto(p.id)}
                  aria-label={`Remove photo${p.caption ? `: ${p.caption}` : ""}`}
                >
                  Remove
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {haven.photos.length < MAX_PHOTOS && (
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <label htmlFor="photo-caption" className="sr-only">
            Caption
          </label>
          <input
            id="photo-caption"
            className="input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="A caption, if you like"
            maxLength={80}
            autoComplete="off"
          />
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            id="photo-file"
            aria-label="Choose a photo for your hope box"
            tabIndex={-1}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setBusy(true);
              const r = await haven.addPhoto(f, caption);
              setBusy(false);
              setMsg(r.ok ? "Added." : r.reason);
              if (r.ok) setCaption("");
            }}
          />
          <button type="button" className="btn btn-soft" style={{ justifySelf: "start" }} onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "Adding…" : "Choose a photo"}
          </button>
          <span className="saved-note" role="status">
            {msg}
          </span>
        </div>
      )}
    </section>
  );
}

function Letter({ haven, check }: { haven: Haven; check: (t: string) => void }) {
  const existing = haven.state.letter;
  const [editing, setEditing] = useState(!existing);
  const [text, setText] = useState(existing?.text ?? "");

  return (
    <section className="panel panel-sun" aria-labelledby="letter-title">
      <h2 id="letter-title">A note for a heavier day</h2>
      <p className="panel-lede">
        Write this when you&apos;re feeling steadier. On a low check-in, the app will show it to you. You know what
        you&apos;ll need to hear better than anyone.
      </p>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            check(text);
            haven.setLetter(text);
            setEditing(!text.trim());
          }}
        >
          <label htmlFor="letter" className="sr-only">
            Your note
          </label>
          <textarea
            id="letter"
            className="textarea"
            style={{ minHeight: 160 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Hey. I know it feels endless right now. Remember…"}
            maxLength={2000}
          />
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-sun">
              Keep this note
            </button>
            {existing && (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setText(existing.text);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : existing ? (
        <>
          <blockquote className="keepsake" style={{ whiteSpace: "pre-wrap" }}>
            <small>Written {formatDay(existing.at)}</small>
            {existing.text}
          </blockquote>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-soft" onClick={() => setEditing(true)}>
              Rewrite it
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                haven.setLetter("");
                setText("");
                setEditing(true);
              }}
            >
              Delete it
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
