"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Speech to text, for the people who find it easier to say a thing than to
 * type it. The front door and the listener both use it.
 *
 * WHERE THE AUDIO GOES, which is the whole reason this file is careful:
 *
 *   The Web Speech API is not a local API by default. Chrome sends the audio
 *   to Google's servers to transcribe it, and Safari uses Apple's. For an app
 *   whose promise is that your words stay on your phone, silently doing that
 *   would be a lie.
 *
 *   Chrome 139 added on-device recognition: SpeechRecognition.available()
 *   says whether a local model exists for a language, install() fetches one,
 *   and `processLocally = true` pins recognition to the device. When that
 *   works, nothing leaves the phone and no question is asked.
 *
 *   When it does not (older Chrome, Safari, a language with no local model),
 *   the first tap asks once, in plain words, before anything is sent. The
 *   answer is remembered on this device and can be changed in the same
 *   place. Firefox has no recognition at all; there the button hides and the
 *   keyboard's own dictation key, which every phone has, still works.
 */

const CONSENT_KEY = "arun-voice-v1";
export const VOICE_KEY = CONSENT_KEY;

type Availability = "available" | "downloadable" | "downloading" | "unavailable";

interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  processLocally?: boolean;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}
interface RecognitionCtor {
  new (): RecognitionLike;
  available?: (o: { langs: string[]; processLocally: boolean }) => Promise<Availability>;
  install?: (o: { langs: string[]; processLocally: boolean }) => Promise<boolean>;
}

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function readConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "cloud-ok";
  } catch {
    return false;
  }
}

export type SpeechStatus = "unsupported" | "idle" | "asking" | "listening" | "error";

export function useSpeech({ lang, onFinal }: { lang: string; onFinal: (text: string) => void }) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [interim, setInterim] = useState("");
  const [local, setLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  /* Support is a client-only fact, so it is read after mount. Rendering the
     button on the server and removing it here would flash; rendering it from
     "idle" and switching to "unsupported" hides it before anyone can tap. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!getCtor()) setStatus("unsupported");
  }, []);

  useEffect(() => () => recRef.current?.stop(), []);

  const begin = useCallback(
    (onDevice: boolean) => {
      const Ctor = getCtor();
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = true;
      if (onDevice) rec.processLocally = true;
      rec.onresult = (e) => {
        let finalText = "";
        let partial = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else partial += r[0].transcript;
        }
        if (finalText.trim()) onFinalRef.current(finalText.trim());
        setInterim(partial);
      };
      rec.onend = () => {
        setInterim("");
        setStatus((s) => (s === "error" ? s : "idle"));
        recRef.current = null;
      };
      rec.onerror = (e) => {
        /* "no-speech" and "aborted" are someone pausing or tapping stop, not
           failures worth a message. */
        if (e.error === "no-speech" || e.error === "aborted") return;
        setError(
          e.error === "not-allowed" || e.error === "service-not-allowed"
            ? "The microphone is blocked for this site. You can allow it in the browser's site settings."
            : "Voice stopped working just now. Typing still works, and so does your keyboard's mic key.",
        );
        setStatus("error");
      };
      recRef.current = rec;
      setError(null);
      setLocal(onDevice);
      setStatus("listening");
      try {
        rec.start();
      } catch {
        setStatus("error");
        setError("Voice could not start. Typing still works.");
      }
    },
    [lang],
  );

  const start = useCallback(async () => {
    const Ctor = getCtor();
    if (!Ctor) return;
    let onDevice = false;
    if (Ctor.available) {
      try {
        const a = await Ctor.available({ langs: [lang], processLocally: true });
        if (a === "available") onDevice = true;
        /* Fetching the local model needs the tap we are still inside, so it
           is tried here rather than in advance. */
        else if (a === "downloadable" && Ctor.install) onDevice = await Ctor.install({ langs: [lang], processLocally: true });
      } catch {
        onDevice = false;
      }
    }
    if (!onDevice && !readConsent()) {
      setStatus("asking");
      return;
    }
    begin(onDevice);
  }, [begin, lang]);

  const allowCloud = useCallback(() => {
    try {
      window.localStorage.setItem(CONSENT_KEY, "cloud-ok");
    } catch {
      // Not remembered, but this one tap still counts as a yes.
    }
    begin(false);
  }, [begin]);

  const declineCloud = useCallback(() => setStatus("idle"), []);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { status, interim, local, error, start, stop, allowCloud, declineCloud };
}

/** The recognition language for the app's UI language. English defaults to
    Indian English because India is this app's default region and its accent
    is the one most often mis-heard by an en-US model. */
export function speechLang(appLang: string): string {
  if (appLang === "hi") return "hi-IN";
  if (typeof navigator !== "undefined" && /^en-(IN|GB|US|AU|NZ|CA)$/i.test(navigator.language)) return navigator.language;
  return "en-IN";
}
