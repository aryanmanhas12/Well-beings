import { KeyboardEvent, useEffect, useRef } from "react";
import { LockIcon } from "./icons";
import { ChatMessage } from "@/lib/types";
import { WellBeings } from "@/hooks/useWellBeings";

function BotBubble({ text }: { text: string }) {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        maxWidth: "86%",
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        borderRadius: "12px 12px 12px 4px",
        padding: "10px 14px",
        animation: "msgIn .25s ease",
        whiteSpace: "pre-line",
      }}
    >
      {text}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div
      style={{
        alignSelf: "flex-end",
        maxWidth: "86%",
        background: "var(--color-accent-900)",
        border: "1px solid var(--color-accent-800)",
        borderRadius: "12px 12px 4px 12px",
        padding: "10px 14px",
        animation: "msgIn .25s ease",
        color: "var(--color-accent-100)",
      }}
    >
      {text}
    </div>
  );
}

function CrisisBubble({ m }: { m: ChatMessage }) {
  return (
    <div
      style={{
        alignSelf: "stretch",
        background: "linear-gradient(135deg,var(--color-section),var(--color-section-glow))",
        border: "1px solid var(--color-accent-500)",
        borderRadius: 12,
        padding: "16px 18px",
        animation: "msgIn .3s ease",
        margin: "4px 0",
      }}
    >
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 6 }}>
        You matter — and support exists right now.
      </div>
      <div style={{ fontSize: 13, color: "var(--color-accent-200)", marginBottom: 12, textWrap: "pretty" }}>
        Thanks for being honest. That answer isn&apos;t stored anywhere but this device — and it deserves a
        human, not an app. If these thoughts get heavy, please reach out:
      </div>
      {(m.lines || []).map((h) => (
        <div
          key={h.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "7px 0",
            borderTop: "1px solid color-mix(in srgb, var(--color-accent-300) 25%, transparent)",
            fontSize: 13,
          }}
        >
          <span>{h.name}</span>
          <span style={{ fontWeight: 500, color: "var(--color-accent-200)", whiteSpace: "nowrap" }}>{h.contact}</span>
        </div>
      ))}
      <div style={{ fontSize: 11.5, color: "var(--color-accent-300)", marginTop: 10 }}>
        Free · confidential · 24/7. If you&apos;re in immediate danger, call your local emergency number.
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        borderRadius: "12px 12px 12px 4px",
        padding: "12px 16px",
        display: "flex",
        gap: 5,
      }}
    >
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--color-neutral-400)",
            animation: `dotPulse 1.2s ${delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function ChatScreen({ wb }: { wb: WellBeings }) {
  const q = wb.currentQuestion;
  const hasOptions = !!q && q.type === "choice";
  const awaitingText = !!q && q.type === "text";
  const chatRef = useRef<HTMLDivElement | null>(null);
  const { messages, typing } = wb;

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  return (
    <main
      data-screen-label="Check-in chat"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        maxWidth: 680,
        width: "100%",
        margin: "0 auto",
        padding: "0 16px",
        boxSizing: "border-box",
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 4px 10px" }}>
        <span className="tag tag-accent" style={{ fontSize: 10.5 }}>
          {wb.progSec}
        </span>
        <div style={{ flex: 1, height: 2, background: "var(--color-neutral-900)", borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg,var(--color-accent-700),var(--color-accent-400))",
              width: wb.progPct + "%",
              transition: "width .4s ease",
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>{wb.progLabel}</span>
      </div>

      <div
        ref={chatRef}
        style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "8px 4px 16px", minHeight: 0 }}
      >
        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column" }}>
            {m.isBot && <BotBubble text={m.text || ""} />}
            {m.isUser && <UserBubble text={m.text || ""} />}
            {m.isCrisis && <CrisisBubble m={m} />}
          </div>
        ))}
        {typing && <TypingDots />}
      </div>

      <div style={{ padding: "10px 4px 18px", borderTop: "1px solid var(--color-divider)" }}>
        {q?.sub && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--color-neutral-500)", marginBottom: 9 }}>
            <LockIcon style={{ color: "var(--color-accent-400)" }} />
            {q.sub}
          </div>
        )}
        {hasOptions && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(q!.opts || []).map((opt) => (
              <button
                key={String(opt.value)}
                className="btn btn-secondary"
                onClick={() => wb.answer(opt.value, opt.label)}
                style={{ fontSize: 12.5, flex: "0 1 auto" }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {awaitingText && (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              value={wb.draft}
              onChange={(e) => wb.setDraft(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => wb.onDraftKeyDown(e)}
              placeholder="Type here… (or just send to skip)"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={wb.sendDraft}>
              Send
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
