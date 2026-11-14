"use client";

import { useState } from "react";

/**
 * A message, shown in full, and a button that hands it to the phone's own
 * share sheet (or copies it). The person picks who gets it and presses
 * send themselves; Arun sends nothing and knows nothing about where it
 * went.
 */
export function Send({ text, label, copied, onSent }: { text: string; label: string; copied: string; onSent?: () => void }) {
  const [note, setNote] = useState("");

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ text });
        onSent?.();
        return;
      }
      await navigator.clipboard.writeText(text);
      setNote(copied);
      onSent?.();
    } catch {
      // Dismissed. Nothing to say about it.
    }
  }

  return (
    <div className="send">
      <blockquote className="send-text">{text}</blockquote>
      <div className="send-row">
        <button type="button" className="stage-btn" data-answer="success" onClick={share}>
          {label}
        </button>
        <span className="send-note" role="status">
          {note}
        </span>
      </div>
    </div>
  );
}
