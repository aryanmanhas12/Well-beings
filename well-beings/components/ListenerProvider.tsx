"use client";

import { FormEvent, ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { BloomSun } from "./haven/BloomSun";
import { HelplineList } from "./HelplineList";
import { VoiceButton } from "./VoiceButton";
import { useDialogBehaviour } from "./dialogs";
import { crisisLines } from "@/lib/helplines";
import { ronakLink } from "@/lib/bridge";
import { COMPANION_NAME } from "@/lib/site";
import { HelplineRegion } from "@/lib/types";
import {
  AI_AVAILABLE,
  ListenerTurn,
  OPENING,
  askRelay,
  isCrisis,
  loadAiPreference,
  onDeviceReply,
  saveAiPreference,
  suggestsRonak,
} from "@/lib/listener";

/**
 * "Just sit with me for a minute": the listener, available from anywhere.
 *
 * A context rather than a prop threaded through the app shell, so the front
 * door and the Today tab can both open it without every screen in between
 * changing shape. The conversation lives in memory only: close it and it is
 * gone, which is what the footer of the dialog promises.
 */
const Ctx = createContext<() => void>(() => {});

export function useOpenListener() {
  return useContext(Ctx);
}

export function ListenerProvider({
  lang,
  region,
  children,
}: {
  lang: string;
  region: HelplineRegion;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openIt = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  return (
    <Ctx.Provider value={openIt}>
      {children}
      {open && <ListenerDialog lang={lang} region={region} onClose={close} />}
    </Ctx.Provider>
  );
}

function ListenerDialog({ lang, region, onClose }: { lang: string; region: HelplineRegion; onClose: () => void }) {
  const ref = useDialogBehaviour(onClose);
  const [turns, setTurns] = useState<ListenerTurn[]>([{ role: "listener", text: OPENING }]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [ronak, setRonak] = useState(false);
  const [ai, setAi] = useState(false);
  const [aiAsk, setAiAsk] = useState(false);
  const [note, setNote] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAi(loadAiPreference());
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns, crisis, ronak]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    const userTurns = turns.filter((t) => t.role === "user").length + 1;
    const history: ListenerTurn[] = [...turns, { role: "user", text }];
    setTurns(history);
    setDraft("");
    setNote("");
    /* Safety first, in both modes and before any network call. */
    if (isCrisis(text)) setCrisis(true);
    if (suggestsRonak(text, userTurns)) setRonak(true);

    let reply = onDeviceReply(text, userTurns);
    if (ai && !isCrisis(text)) {
      setThinking(true);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20_000);
      try {
        const r = await askRelay(history, ctrl.signal);
        reply = r.reply;
        if (r.flagged) setCrisis(true);
      } catch {
        setNote("The AI listener could not be reached, so this reply was chosen on your phone.");
      } finally {
        clearTimeout(timer);
        setThinking(false);
      }
    }
    setTurns((t) => [...t, { role: "listener", text: reply }]);
  }

  return (
    <div className="dialog-backdrop listener-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="listener"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listener-h"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="listener-head">
          <BloomSun size={34} />
          <h2 id="listener-h">Sit with me</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="listener-body" aria-live="polite">
          {turns.map((t, i) => (
            <p key={i} className={`listener-turn listener-${t.role}`}>
              {t.text}
            </p>
          ))}
          {thinking && <p className="listener-turn listener-listener listener-typing">…</p>}
          {note && <p className="listener-note">{note}</p>}

          {crisis && (
            <div className="card listener-card" role="alert">
              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Please talk to a person right now. These are free and answer at any hour.</p>
              <HelplineList lines={crisisLines(region)} />
            </div>
          )}
          {ronak && !crisis && (
            <div className="card listener-card">
              <p style={{ margin: "0 0 10px" }}>
                If this has been sitting with you for a while, {COMPANION_NAME} can help you look at it more closely.
                It is private, free, and a proper check rather than a chat.
              </p>
              <a className="btn btn-secondary" href={ronakLink()} target="_blank" rel="noopener noreferrer">
                Open {COMPANION_NAME}
              </a>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="listener-compose" onSubmit={send}>
          <label htmlFor="listener-input" className="sr-only">
            What is on your mind
          </label>
          <textarea
            id="listener-input"
            className="input"
            rows={2}
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Say it or type it"
          />
          <VoiceButton appLang={lang} onText={(t) => setDraft((d) => (d.trim() ? `${d.trim()} ${t}` : t))} />
          <button type="submit" className="btn btn-sun" disabled={!draft.trim() || thinking}>
            Send
          </button>
        </form>

        <div className="listener-foot">
          {ai ? (
            <p>
              AI replies are on. What you write is sent through Arun&apos;s relay to Anthropic (Claude) to write a reply.
              Arun keeps none of it.{" "}
              <button type="button" className="linklike" onClick={() => { setAi(false); saveAiPreference(false); }}>
                Switch back to on-phone replies
              </button>
            </p>
          ) : (
            <p>
              Replies are written in advance and chosen on this phone. Nobody reads this, and it is gone when you close it.
              {AI_AVAILABLE && !aiAsk && (
                <>
                  {" "}
                  <button type="button" className="linklike" onClick={() => setAiAsk(true)}>
                    Talk to an AI listener instead
                  </button>
                </>
              )}
            </p>
          )}
          {aiAsk && !ai && (
            <div className="listener-ask">
              <p>
                An AI listener writes its replies live. To do that, what you write leaves this phone: it goes through
                Arun&apos;s relay, which stores nothing, to Anthropic, which processes it under its API privacy terms. It
                is not a therapist and it is not a person.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => { setAi(true); saveAiPreference(true); setAiAsk(false); }}>
                Turn on AI replies
              </button>{" "}
              <button type="button" className="btn btn-secondary" onClick={() => setAiAsk(false)}>
                Keep it on my phone
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
