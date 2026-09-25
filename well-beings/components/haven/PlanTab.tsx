"use client";

import { useState } from "react";
import type { Wellbeings } from "@/hooks/useWellbeings";
import type { Haven } from "@/hooks/useHaven";
import { crisisLines, helplineHref } from "@/lib/helplines";
import type { HelplineRegion } from "@/lib/types";
import { EMPTY_PLAN, planIsWritten, type PlanContact, type SafetyPlan } from "@/lib/haven";
import { WHY } from "@/lib/havenContent";
import { AppScreen } from "../AppScreen";
import { PhoneIcon } from "./icons";
import { formatDay, GoTo, Why } from "./shared";

type View = "safety" | "use" | "daily";

/**
 * The safety plan, and the daily plan from the wellbeing check.
 *
 * The safety plan has two modes on purpose. Writing one is a calm-day job,
 * with room to think. Using one happens in the worst hour of someone's
 * week, when reading a form is too much, so "use it now" shows the same
 * plan as six big steps in order, with every phone number already a button.
 */
export function PlanTab({
  wb,
  haven,
  region,
  view,
  goTo,
}: {
  wb: Wellbeings;
  haven: Haven;
  region: HelplineRegion;
  view?: string;
  goTo: GoTo;
}) {
  const written = planIsWritten(haven.state.plan);
  /* A written plan opens ready to use, never as a form: someone reaching for
     it in a bad hour should see their own steps, not input boxes. Editing
     is one tap away. */
  const initial: View = view === "daily" ? "daily" : written && view !== "edit" ? "use" : "safety";
  /* Read once, at mount. HavenShell remounts the tab on every navigation,
     so a new `view` always arrives as a fresh mount rather than a change. */
  const [tab, setTab] = useState<View>(initial);

  return (
    <div className="haven-stack">
      <h1 style={{ fontSize: 28, margin: "6px 0 0" }}>Plan</h1>
      <div className="subnav" role="group" aria-label="Plan sections">
        <button type="button" aria-pressed={tab === "use" || tab === "safety"} onClick={() => setTab(written ? "use" : "safety")}>
          Safety plan
        </button>
        <button type="button" aria-pressed={tab === "daily"} onClick={() => setTab("daily")}>
          Daily plan
        </button>
      </div>

      {tab === "use" && written && (
        <UsePlan plan={haven.state.plan} region={region} onEdit={() => setTab("safety")} goTo={goTo} />
      )}
      {tab === "safety" && (
        <EditPlan
          initial={haven.state.plan}
          region={region}
          onSave={(p) => {
            haven.savePlan(p);
            if (planIsWritten(p)) setTab("use");
          }}
        />
      )}
      {tab === "daily" &&
        (wb.profile ? (
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <AppScreen wb={wb} embedded />
          </div>
        ) : (
          <section className="panel" aria-labelledby="daily-none">
            <h2 id="daily-none">Your daily plan starts with a check</h2>
            <p className="panel-lede">
              A few minutes on sleep, movement, food, stress and routine turns into a small daily plan with two or
              three things worth trying. Save it for a day with a bit more room.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn-soft" onClick={() => wb.startChat("quick")}>
                Quick check, about 3 min
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => wb.startChat("detailed")}>
                Detailed, about 5 min
              </button>
            </div>
          </section>
        ))}
    </div>
  );
}

const STEPS: { key: keyof SafetyPlan; title: string; hint: string; placeholder: string }[] = [
  {
    key: "warningSigns",
    title: "1. Signs a hard time is starting",
    hint: "Thoughts, feelings, places or times of day that tell you things are sliding.",
    placeholder: "e.g. Not replying to anyone. Lying awake after 2am. Thinking 'what's the point'.",
  },
  {
    key: "coping",
    title: "2. Things I can do on my own",
    hint: "Small things that take the edge off, even a little.",
    placeholder: "e.g. Cold water on my face. A walk round the block. That one playlist. A hot shower.",
  },
  {
    key: "distractions",
    title: "3. People and places that give me a lift",
    hint: "You don't have to tell them anything. Just being around them helps.",
    placeholder: "e.g. The chai stall near college. Calling my cousin about cricket. The library.",
  },
];

function EditPlan({ initial, region, onSave }: { initial: SafetyPlan; region: HelplineRegion; onSave: (p: SafetyPlan) => void }) {
  const [plan, setPlan] = useState<SafetyPlan>({ ...EMPTY_PLAN, ...initial });
  const [saved, setSaved] = useState("");
  const set = <K extends keyof SafetyPlan>(k: K, v: SafetyPlan[K]) => {
    setPlan((p) => ({ ...p, [k]: v }));
    setSaved("");
  };
  const suggestions = crisisLines(region).filter((l) => l.tel && !plan.professionals.some((p) => p.name === l.name));

  return (
    <form
      className="haven-stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(plan);
        setSaved("Saved on this phone.");
      }}
    >
      <section className="panel panel-pink" aria-labelledby="plan-intro">
        <h2 id="plan-intro">Your safety plan</h2>
        <p className="panel-lede">
          A short list, in your own words, of what to do if things get really dark. Make it on a calmer day. Fill
          in what you can; even two steps is a plan.
        </p>
        {initial.updatedAt && <p className="eyebrow">Last saved {formatDay(initial.updatedAt)}</p>}
        <Why>{WHY.plan}</Why>
      </section>

      <section className="panel">
        {STEPS.map((s) => (
          <div key={s.key}>
            <label className="field-label" htmlFor={`plan-${s.key}`}>
              {s.title}
            </label>
            <span className="field-hint" id={`plan-${s.key}-hint`}>
              {s.hint}
            </span>
            <textarea
              id={`plan-${s.key}`}
              aria-describedby={`plan-${s.key}-hint`}
              className="textarea"
              value={plan[s.key] as string}
              placeholder={s.placeholder}
              maxLength={1200}
              onChange={(e) => set(s.key, e.target.value as never)}
            />
          </div>
        ))}

        <Contacts
          title="4. People I can ask for help"
          hint="People you could actually tell. Two or three is plenty."
          list={plan.helpers}
          onChange={(v) => set("helpers", v)}
          idBase="helper"
        />

        <Contacts
          title="5. Professionals and services"
          hint="A counsellor, a doctor, a helpline. Tap a suggestion to add it."
          list={plan.professionals}
          onChange={(v) => set("professionals", v)}
          idBase="pro"
        />
        {suggestions.length > 0 && (
          <div className="btn-row" style={{ marginTop: 6 }}>
            {suggestions.map((l) => (
              <button
                key={l.name}
                type="button"
                className="btn btn-quiet"
                style={{ fontSize: 13 }}
                onClick={() => set("professionals", [...plan.professionals, { name: l.name, phone: l.contact.split(" · ")[0] }])}
              >
                + {l.name}
              </button>
            ))}
          </div>
        )}

        <label className="field-label" htmlFor="plan-safer">
          6. Making where I am safer
        </label>
        <span className="field-hint" id="plan-safer-hint">
          Ways to keep yourself safe while it passes. Asking someone to hold onto things for a while, or not being
          alone tonight.
        </span>
        <textarea
          id="plan-safer"
          aria-describedby="plan-safer-hint"
          className="textarea"
          value={plan.saferSurroundings}
          maxLength={1200}
          onChange={(e) => set("saferSurroundings", e.target.value)}
        />

        <label className="field-label" htmlFor="plan-reason">
          The thing most worth staying for
        </label>
        <span className="field-hint" id="plan-reason-hint">
          One person, one hope, one reason. It goes at the top of your plan.
        </span>
        <textarea
          id="plan-reason"
          aria-describedby="plan-reason-hint"
          className="textarea"
          style={{ minHeight: 64 }}
          value={plan.reason}
          maxLength={400}
          onChange={(e) => set("reason", e.target.value)}
        />
      </section>

      <div className="btn-row" style={{ position: "sticky", bottom: "calc(66px + env(safe-area-inset-bottom, 0px))", zIndex: 5 }}>
        <button type="submit" className="btn btn-sun" style={{ boxShadow: "var(--shadow-md)" }}>
          Save my plan
        </button>
        <span className="saved-note" role="status">
          {saved}
        </span>
      </div>
    </form>
  );
}

function Contacts({
  title,
  hint,
  list,
  onChange,
  idBase,
}: {
  title: string;
  hint: string;
  list: PlanContact[];
  onChange: (v: PlanContact[]) => void;
  idBase: string;
}) {
  const rows = list.length ? list : [];
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="field-label">{title}</legend>
      <span className="field-hint">{hint}</span>
      {rows.map((c, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, marginBottom: 6 }}>
          <label htmlFor={`${idBase}-name-${i}`} className="sr-only">
            Name
          </label>
          <input
            id={`${idBase}-name-${i}`}
            className="input"
            placeholder="Name"
            value={c.name}
            maxLength={60}
            autoComplete="off"
            onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
          />
          <label htmlFor={`${idBase}-phone-${i}`} className="sr-only">
            Phone
          </label>
          <input
            id={`${idBase}-phone-${i}`}
            className="input"
            placeholder="Phone"
            type="tel"
            inputMode="tel"
            value={c.phone}
            maxLength={30}
            autoComplete="off"
            onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, phone: e.target.value } : r)))}
          />
          <button
            type="button"
            className="btn btn-quiet"
            aria-label={`Remove ${c.name || "this contact"}`}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            style={{ minWidth: 44, paddingInline: 8 }}
          >
            ✕
          </button>
        </div>
      ))}
      {rows.length < 4 && (
        <button type="button" className="btn btn-quiet" onClick={() => onChange([...rows, { name: "", phone: "" }])}>
          + Add someone
        </button>
      )}
    </fieldset>
  );
}

function UsePlan({ plan, region, onEdit, goTo }: { plan: SafetyPlan; region: HelplineRegion; onEdit: () => void; goTo: GoTo }) {
  const [copied, setCopied] = useState("");
  const blocks: { title: string; body?: string; contacts?: PlanContact[] }[] = [
    { title: "Signs a hard time is starting", body: plan.warningSigns },
    { title: "Things I can do on my own", body: plan.coping },
    { title: "People and places that give me a lift", body: plan.distractions },
    { title: "People I can ask for help", contacts: plan.helpers },
    { title: "Professionals and services", contacts: plan.professionals },
    { title: "Making where I am safer", body: plan.saferSurroundings },
  ];

  async function copyPlan() {
    const text = [
      "My safety plan",
      plan.reason ? `Most worth staying for: ${plan.reason}` : "",
      ...blocks.map((b, i) => {
        const content = b.contacts ? b.contacts.map((c) => `${c.name} ${c.phone}`.trim()).join(", ") : b.body;
        return content?.trim() ? `${i + 1}. ${b.title}: ${content.trim()}` : "";
      }),
      `Crisis lines: ${crisisLines(region).map((l) => `${l.name} ${l.contact}`).join(" · ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "My safety plan", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied("Copied. Paste it into your notes, or send it to someone you trust.");
    } catch {
      /* Share sheet dismissed, or clipboard blocked: neither is an error
         worth telling someone about in the middle of this. */
    }
  }

  return (
    <>
      {plan.reason.trim() && (
        <section className="panel panel-sun" aria-label="Most worth staying for">
          <p className="eyebrow">Most worth staying for</p>
          <p className="quote-line" style={{ whiteSpace: "pre-wrap" }}>
            {plan.reason}
          </p>
        </section>
      )}
      <section className="panel" aria-labelledby="use-title">
        <h2 id="use-title">Take it one step at a time</h2>
        <p className="panel-lede">Start at the top. If a step isn&apos;t enough, move to the next one.</p>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
          {blocks.map((b, i) => {
            const has = b.contacts ? b.contacts.some((c) => c.name.trim() || c.phone.trim()) : !!b.body?.trim();
            return (
              <li key={b.title}>
                <p className="eyebrow" style={{ marginBottom: 2 }}>
                  Step {i + 1}
                </p>
                <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: 16 }}>{b.title}</p>
                {b.contacts ? (
                  has ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      {b.contacts
                        .filter((c) => c.name.trim() || c.phone.trim())
                        .map((c, j) =>
                          c.phone.trim() ? (
                            <a key={j} className="btn btn-soft" style={{ justifyContent: "space-between" }} href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>
                              <span>
                                {c.name || "Call"} · {c.phone}
                              </span>
                              <PhoneIcon width={18} height={18} />
                            </a>
                          ) : (
                            <span key={j}>{c.name}</span>
                          )
                        )}
                    </div>
                  ) : (
                    <p className="panel-lede" style={{ margin: 0 }}>
                      Not filled in yet.
                    </p>
                  )
                ) : has ? (
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 15.5 }}>{b.body}</p>
                ) : (
                  <p className="panel-lede" style={{ margin: 0 }}>
                    Not filled in yet.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="panel panel-pink" aria-labelledby="lines-title">
        <h2 id="lines-title">If it&apos;s still too much</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {crisisLines(region).map((l) => {
            const href = helplineHref(l);
            return href ? (
              <a key={l.name} className="btn btn-sun" style={{ justifyContent: "space-between" }} href={href}>
                <span>
                  {l.name} · {l.contact}
                </span>
                <PhoneIcon width={18} height={18} />
              </a>
            ) : (
              <span key={l.name}>
                {l.name} · {l.contact}
              </span>
            );
          })}
        </div>
      </section>

      <div className="btn-row">
        <button type="button" className="btn btn-soft" onClick={onEdit}>
          Edit my plan
        </button>
        <button type="button" className="btn btn-quiet" onClick={copyPlan}>
          Share or copy it
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => goTo("calm", "breathe")}>
          Breathe first
        </button>
      </div>
      {copied && (
        <p className="saved-note" role="status">
          {copied}
        </p>
      )}
    </>
  );
}
