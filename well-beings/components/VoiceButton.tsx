"use client";

import { speechLang, useSpeech } from "@/hooks/useSpeech";

/**
 * A microphone next to a text box. Tap, talk, and the words land in the box
 * where they can be read and fixed before anything is kept or sent.
 *
 * It never submits on its own. Speech recognition mishears, and a person
 * saying something hard out loud should get to see it written down before it
 * goes anywhere, the same as if they had typed it.
 */
export function VoiceButton({
  appLang,
  onText,
  size = 44,
}: {
  appLang: string;
  onText: (text: string) => void;
  size?: number;
}) {
  const speech = useSpeech({ lang: speechLang(appLang), onFinal: onText });

  if (speech.status === "unsupported") return null;

  const listening = speech.status === "listening";

  return (
    <div className="voice">
      <button
        type="button"
        className={`btn voice-btn${listening ? " voice-btn-live" : ""}`}
        onClick={listening ? speech.stop : speech.start}
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : "Speak instead of typing"}
        title={listening ? "Stop listening" : "Speak instead of typing"}
        style={{ width: size, height: size }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
      </button>

      {/* Live region: a screen-reader user hears that listening started and
          what has been heard so far, the same feedback a sighted user gets
          from the pulsing button and the grey preview. */}
      <span className="sr-only" aria-live="polite">
        {listening ? `Listening${speech.local ? " on this device" : ""}. ${speech.interim}` : ""}
      </span>
      {listening && speech.interim && (
        <p className="voice-interim" aria-hidden="true">
          {speech.interim}
        </p>
      )}
      {listening && (
        <p className="voice-note">{speech.local ? "Listening on this phone. Nothing is sent." : "Listening through your browser's speech service."}</p>
      )}

      {speech.status === "asking" && (
        <div className="voice-ask" role="group" aria-label="Before you speak">
          <p>
            This browser cannot turn speech into text on the phone itself. If you go ahead, it sends the audio to its
            own speech service (Google in Chrome, Apple in Safari) to write it out. Arun never receives the audio. Your
            keyboard&apos;s microphone key is another way to dictate.
          </p>
          <div className="voice-ask-actions">
            <button type="button" className="btn btn-primary" onClick={speech.allowCloud}>
              Use voice anyway
            </button>
            <button type="button" className="btn btn-secondary" onClick={speech.declineCloud}>
              I&apos;ll type
            </button>
          </div>
        </div>
      )}

      {speech.status === "error" && speech.error && (
        <p className="voice-note" role="status">
          {speech.error}
        </p>
      )}
    </div>
  );
}
