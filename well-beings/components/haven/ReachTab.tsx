"use client";

import { useEffect, useMemo, useState } from "react";
import type { Haven } from "@/hooks/useHaven";
import { GLOBAL_LINKS, HELPLINES } from "@/lib/helplines";
import type { HelplineRegion, Region } from "@/lib/types";
import { buildCareSummary, careSummaryText } from "@/lib/care";
import { planIsWritten, type CareRole, type CareTeam } from "@/lib/haven";
import { REACH_OUT_MESSAGES, WHY } from "@/lib/havenContent";
import { ronakLink } from "@/lib/bridge";
import { COMPANION_NAME } from "@/lib/site";
import { HelplineList } from "../HelplineList";
import { GoTo, Why } from "./shared";

/**
 * People. Helplines first, then the words to message someone you know, then
 * the care team.
 *
 * THE CARE TEAM, AND WHAT "MONITORING" MEANS HERE
 *
 * This app will soon sit next to professionals through Ronak. Until that
 * exists, and after it does, the rule is the same: nothing about a person
 * reaches anyone unless the person decides it should, sees exactly what it
 * says, and presses send. Wellbeings has no server, so it could not send
 * anything behind someone's back even if it wanted to, and this screen says
 * so in plain words.
 *
 * What it can do is make telling someone easy at the moment it matters.
 * After a stretch of heavy days, the home screen offers to let the care
 * contact know, with a summary already written. Consent is recorded as a
 * date on this phone, and removing the contact removes the offer.
 */
export function ReachTab({
  haven,
  region,
  view,
  goTo,
}: {
  haven: Haven;
  region: HelplineRegion;
  view?: string;
  goTo: GoTo;
}) {
  useEffect(() => {
    if (!view) return;
    document.getElementById(`reach-${view}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view]);

  const regionKey = (haven.state.region ?? "in") as Region;

  return (
    <div className="haven-stack">
      <h1 style={{ fontSize: 28, margin: "6px 0 0" }}>Reach out</h1>
      <p className="panel-lede" style={{ marginTop: -8 }}>
        You don&apos;t have to explain yourself to anyone here. These are people who want to hear from you.
      </p>

      <section className="panel panel-pink" id="reach-lines" aria-labelledby="lines-title">
        <h2 id="lines-title">Talk to someone now</h2>
        <p className="panel-lede">Free, confidential, and there for any level of not okay.</p>
        <label htmlFor="region" className="field-label" style={{ marginTop: 0 }}>
          Where you are
        </label>
        <select
          id="region"
          className="input"
          value={regionKey}
          onChange={(e) => haven.setRegion(e.target.value as Region)}
          style={{ marginBottom: 10, maxWidth: 280 }}
        >
          {(Object.keys(HELPLINES) as Region[]).map((r) => (
            <option key={r} value={r}>
              {HELPLINES[r].label}
            </option>
          ))}
        </select>
        <HelplineList lines={region.lines} />
        <details className="why" style={{ marginTop: 14 }}>
          <summary>More places to find help</summary>
          <ul style={{ paddingLeft: 18, margin: "8px 0 0" }}>
            {[...region.links, ...GLOBAL_LINKS].map((l) => (
              <li key={l.url} style={{ marginBottom: 6 }}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.name}
                </a>
                . {l.note}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <MessageSomeone onSent={() => haven.markStep("reach")} />

      <CareTeamPanel haven={haven} />

      <section className="panel" aria-labelledby="ronak-title">
        <h2 id="ronak-title">A proper check, when you want one</h2>
        <p className="panel-lede">
          {COMPANION_NAME} runs the questionnaires doctors use for mood and anxiety, privately on your phone, in six
          languages, and tells you what a score means and what to do next. It&apos;s a separate app; nothing you
          wrote here goes with you.
        </p>
        <a className="btn btn-soft" href={ronakLink()} target="_blank" rel="noopener noreferrer">
          Open {COMPANION_NAME}
        </a>
      </section>

      <button type="button" className="btn btn-quiet" style={{ alignSelf: "start" }} onClick={() => goTo("plan", "use")}>
        {planIsWritten(haven.state.plan) ? "Open my safety plan" : "Make a safety plan"}
      </button>
    </div>
  );
}

function MessageSomeone({ onSent }: { onSent: () => void }) {
  const [msg, setMsg] = useState(REACH_OUT_MESSAGES[0]);
  const [note, setNote] = useState("");

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ text: msg });
        onSent();
        return;
      }
      await navigator.clipboard.writeText(msg);
      setNote("Copied. Paste it into any chat.");
      onSent();
    } catch {
      // Dismissed. Nothing to say about it.
    }
  }

  return (
    <section className="panel panel-lilac" id="reach-message" aria-labelledby="msg-title">
      <h2 id="msg-title">Message someone you know</h2>
      <p className="panel-lede">The first sentence is the hardest part, so here are some to borrow. Edit freely.</p>
      <div className="choices" role="group" aria-label="Message ideas">
        {REACH_OUT_MESSAGES.map((m, i) => (
          <button key={i} type="button" className="choice" aria-pressed={msg === m} onClick={() => setMsg(m)} style={{ fontSize: 14.5 }}>
            {m}
          </button>
        ))}
      </div>
      <label htmlFor="msg" className="sr-only">
        Your message
      </label>
      <textarea id="msg" className="textarea" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={500} style={{ marginTop: 8 }} />
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button type="button" className="btn btn-sun" onClick={share}>
          Send it
        </button>
        <a className="btn btn-soft" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" onClick={onSent}>
          WhatsApp
        </a>
        <a className="btn btn-quiet" href={`sms:?&body=${encodeURIComponent(msg)}`} onClick={onSent}>
          Text message
        </a>
      </div>
      <p className="saved-note" role="status">
        {note}
      </p>
      <Why>{WHY.reach}</Why>
    </section>
  );
}

const ROLES: { v: CareRole; label: string; theirs: string }[] = [
  { v: "therapist", label: "My therapist or counsellor", theirs: "your therapist or counsellor" },
  { v: "doctor", label: "My doctor or psychiatrist", theirs: "your doctor or psychiatrist" },
  { v: "trusted", label: "Someone I trust", theirs: "someone you trust" },
];

function CareTeamPanel({ haven }: { haven: Haven }) {
  const care = haven.state.care;
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);

  return (
    <section className="panel" id="reach-care" aria-labelledby="care-title">
      <h2 id="care-title">Your care team</h2>
      {!care || editing ? (
        <CareForm
          initial={care}
          onSave={(c) => {
            haven.setCare(c);
            setEditing(false);
          }}
          onCancel={care ? () => setEditing(false) : undefined}
        />
      ) : (
        <>
          <p className="panel-lede">
            {care.name}, {ROLES.find((r) => r.v === care.role)?.theirs}. Agreed on{" "}
            {new Date(care.agreedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-sun" onClick={() => setPreview((p) => !p)} aria-expanded={preview}>
              {preview ? "Hide the summary" : `Send ${care.name} my summary`}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setEditing(true)} style={{ minWidth: 44, paddingInline: 10 }}>
              Edit
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => haven.setCare(null)}>
              Remove
            </button>
          </div>
          {/* The whole row is the switch, so the target is the sentence and
              not a 46×28 pill beside it. */}
          <button
            type="button"
            role="switch"
            aria-checked={care.nudge}
            onClick={() => haven.setCare({ ...care, nudge: !care.nudge })}
            className="switch-row"
          >
            <span className="switch" data-on={care.nudge} aria-hidden="true">
              <span className="switch-knob" />
            </span>
            <span>Offer to send it when things have been heavy for a while</span>
          </button>
          {preview && <SummarySender haven={haven} care={care} />}
        </>
      )}
      <p className="why" style={{ marginTop: 14 }}>
        Ronak is working toward connecting people with mental-health professionals directly. If that arrives,
        it will ask you here first and say exactly what it would share. Until then, and always, nothing leaves this
        phone unless you send it.
      </p>
    </section>
  );
}

function CareForm({ initial, onSave, onCancel }: { initial: CareTeam | null; onSave: (c: CareTeam) => void; onCancel?: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<CareRole>(initial?.role ?? "therapist");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [agree, setAgree] = useState(!!initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !agree) return;
        onSave({
          name: name.trim(),
          role,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          agreedAt: initial?.agreedAt ?? new Date().toISOString(),
          nudge: initial?.nudge ?? true,
        });
      }}
    >
      <p className="panel-lede">
        If you see a counsellor or a doctor, or have someone you trust, you can add them here. Then, whenever you
        choose, the app writes a short summary of your check-ins for you to send them: how the days have been, how
        the future&apos;s looked, and whether you&apos;ve had thoughts of suicide. You see every word first.
      </p>
      <label className="field-label" htmlFor="care-name">
        Their name
      </label>
      <input id="care-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="off" required />
      <label className="field-label" htmlFor="care-role">
        Who they are
      </label>
      <select id="care-role" className="input" value={role} onChange={(e) => setRole(e.target.value as CareRole)}>
        {ROLES.map((r) => (
          <option key={r.v} value={r.v}>
            {r.label}
          </option>
        ))}
      </select>
      <label className="field-label" htmlFor="care-phone">
        Phone, for a text <span style={{ fontWeight: 400, color: "var(--color-neutral-600)" }}>(optional)</span>
      </label>
      <input id="care-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="off" />
      <label className="field-label" htmlFor="care-email">
        Email <span style={{ fontWeight: 400, color: "var(--color-neutral-600)" }}>(optional)</span>
      </label>
      <input id="care-email" className="input" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} autoComplete="off" />

      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14, fontSize: 14 }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 4, width: 18, height: 18, flex: "none" }} />
        <span>
          I understand the app never sends anything by itself. It prepares a summary, and I decide whether to send it.
        </span>
      </label>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button type="submit" className="btn btn-sun" disabled={!name.trim() || !agree}>
          Save
        </button>
        {onCancel && (
          <button type="button" className="btn btn-quiet" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function SummarySender({ haven, care }: { haven: Haven; care: CareTeam }) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const input = useMemo(
    () => ({
      arrivals: haven.state.arrivals,
      safetyPlanWritten: planIsWritten(haven.state.plan),
      safetyPlanUpdatedAt: haven.state.plan.updatedAt,
      note,
      formatDate: (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
    }),
    [haven.state.arrivals, haven.state.plan, note]
  );
  const text = careSummaryText(input);
  const subject = "My Wellbeings check-in summary";

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: subject, text });
        setStatus("Sent from your share sheet.");
        haven.markStep("reach");
        return;
      }
      await navigator.clipboard.writeText(text);
      setStatus("Copied. Paste it into a message to them.");
      haven.markStep("reach");
    } catch {
      // Dismissed.
    }
  }

  function saveFile() {
    /* The structured version, for a clinician's system or a future Ronak
       integration. Schema documented in docs/CARE-INTEGRATION.md. */
    const blob = new Blob([JSON.stringify(buildCareSummary(input), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wellbeings-care-summary.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Saved to your downloads.");
  }

  return (
    <div style={{ marginTop: 14 }}>
      <label className="field-label" htmlFor="care-note">
        Anything you want to add? <span style={{ fontWeight: 400, color: "var(--color-neutral-600)" }}>(optional)</span>
      </label>
      <textarea id="care-note" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} placeholder="e.g. Exams start next week and I'm not sleeping." />
      <p className="eyebrow" style={{ marginTop: 12 }}>
        Exactly what {care.name} will see
      </p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          font: "inherit",
          fontSize: 13.5,
          background: "var(--color-raised)",
          padding: 14,
          borderRadius: "var(--radius-md)",
          margin: 0,
          maxHeight: 320,
          overflowY: "auto",
        }}
        tabIndex={0}
        aria-label="Summary preview"
      >
        {text}
      </pre>
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button type="button" className="btn btn-sun" onClick={share}>
          Send
        </button>
        {care.phone && (
          <a className="btn btn-soft" href={`sms:${care.phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(text)}`} onClick={() => haven.markStep("reach")}>
            Text {care.name}
          </a>
        )}
        {care.email && (
          <a
            className="btn btn-soft"
            href={`mailto:${encodeURIComponent(care.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}
            onClick={() => haven.markStep("reach")}
          >
            Email {care.name}
          </a>
        )}
        <button type="button" className="btn btn-quiet" onClick={saveFile}>
          Save as a file
        </button>
      </div>
      <p className="saved-note" role="status">
        {status}
      </p>
    </div>
  );
}
