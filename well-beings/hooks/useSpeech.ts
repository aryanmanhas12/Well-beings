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
  abort?(): void;
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

/* Apple's engine: Safari everywhere, and every browser on iPhone and iPad,
   which are all Safari underneath. iPadOS reports itself as a Mac, so a
   touch screen on "MacIntel" counts too. */
function appleEngine(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return /Safari\//.test(ua) && !/Chrome|Chromium|Edg\/|OPR\/|Firefox\//.test(ua);
}

function readConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "cloud-ok";
  } catch {
    return false;
  }
}

/* Why a session can never hang any more.

   On an iPad the microphone once sat on "Listening" forever with nothing
   written and the button apparently dead. Apple's recognition misbehaves in
   the ways the spec allows: in continuous mode it can replay results it has
   already sent, it can stop marking anything final, and after stop() it
   sometimes never fires `end`. The first version trusted all three, so a
   missing `end` left it listening for good.

   Now:
   - On Apple's engine each tap is one utterance (continuous off), which
     is the mode Safari actually handles well. Tap again to add more.
   - Finals are counted by position and never delivered twice, and a
     repeated identical final is dropped as well.
   - If a session ends with words still only "interim", they are kept: it
     is what the person said, and Safari sometimes never finalises it.
   - Seven seconds of silence, or a minute in total, stops it.
   - Stop always works: if `end` has not arrived 1.2 seconds after stop(),
     it is aborted and the button is released anyway. */
const SILENCE_MS = 7_000;
const MAX_MS = 60_000;
const STOP_GRACE_MS = 1_200;

export type SpeechStatus = "unsupported" | "idle" | "asking" | "listening" | "error";

interface Session {
  rec: RecognitionLike;
  committed: number;
  lastFinal: string;
  partial: string;
  timers: ReturnType<typeof setTimeout>[];
  silence: ReturnType<typeof setTimeout> | null;
  done: boolean;
}

export function useSpeech({ lang, onFinal }: { lang: string; onFinal: (text: string) => void }) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [interim, setInterim] = useState("");
  const [local, setLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
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

  /** Ends a session exactly once, however it ended: `end`, an error, the
      silence timer, the time limit, stop, or leaving the screen. */
  const finish = useCallback((s: Session, next: SpeechStatus = "idle", mounted = true) => {
    if (s.done) return;
    s.done = true;
    s.timers.forEach(clearTimeout);
    if (s.silence) clearTimeout(s.silence);
    s.rec.onresult = null;
    s.rec.onend = null;
    s.rec.onerror = null;
    const left = s.partial.trim();
    if (left && left !== s.lastFinal) onFinalRef.current(left);
    if (sessionRef.current === s) sessionRef.current = null;
    if (!mounted) return;
    setInterim("");
    setStatus(next);
  }, []);

  const hardStop = useCallback(
    (s: Session, next: SpeechStatus = "idle") => {
      try {
        if (s.rec.abort) s.rec.abort();
        else s.rec.stop();
      } catch {
        // Already stopped. finish() below is what matters.
      }
      finish(s, next);
    },
    [finish],
  );

  /** Asks the engine to stop politely, and stops it anyway if it will not. */
  const softStop = useCallback(
    (s: Session) => {
      try {
        s.rec.stop();
      } catch {
        hardStop(s);
        return;
      }
      s.timers.push(setTimeout(() => hardStop(s), STOP_GRACE_MS));
    },
    [hardStop],
  );

  useEffect(
    () => () => {
      const s = sessionRef.current;
      if (!s) return;
      try {
        if (s.rec.abort) s.rec.abort();
        else s.rec.stop();
      } catch {
        // Leaving the screen; nothing to tell anyone.
      }
      finish(s, "idle", false);
    },
    [finish],
  );

  const begin = useCallback(
    (onDevice: boolean) => {
      const Ctor = getCtor();
      if (!Ctor) return;
      if (sessionRef.current) hardStop(sessionRef.current);
      const rec = new Ctor();
      const apple = appleEngine();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = !apple;
      if (onDevice) rec.processLocally = true;
      const s: Session = { rec, committed: 0, lastFinal: "", partial: "", timers: [], silence: null, done: false };
      const armSilence = () => {
        if (s.silence) clearTimeout(s.silence);
        s.silence = setTimeout(() => softStop(s), SILENCE_MS);
      };
      rec.onresult = (e) => {
        if (s.done) return;
        armSilence();
        const results = e.results;
        /* A shorter list than before means the engine started a fresh one. */
        if (results.length < s.committed) s.committed = 0;
        let partial = "";
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          const text = (r?.[0]?.transcript ?? "").trim();
          if (r?.isFinal) {
            if (i >= s.committed) {
              s.committed = i + 1;
              if (text && text !== s.lastFinal) {
                s.lastFinal = text;
                onFinalRef.current(text);
              }
            }
          } else if (i >= s.committed) {
            partial += (partial ? " " : "") + text;
          }
        }
        s.partial = partial;
        setInterim(partial);
      };
      rec.onend = () => finish(s);
      rec.onerror = (e) => {
        /* "no-speech" and "aborted" are someone pausing or tapping stop, not
           failures worth a message; `end` (or the grace timer) follows. */
        if (e.error === "no-speech" || e.error === "aborted") return;
        setError(
          e.error === "not-allowed" || e.error === "service-not-allowed"
            ? "The microphone is blocked for this site, or dictation is off. You can allow it in the browser's settings (on iPhone and iPad: Settings, then Siri, then allow dictation)."
            : "Voice stopped working just now. Typing still works, and so does your keyboard's mic key.",
        );
        hardStop(s, "error");
      };
      sessionRef.current = s;
      setError(null);
      setLocal(onDevice);
      setInterim("");
      setStatus("listening");
      try {
        rec.start();
      } catch {
        setError("Voice could not start. Typing still works, and so does your keyboard's mic key.");
        finish(s, "error");
        return;
      }
      armSilence();
      s.timers.push(setTimeout(() => softStop(s), MAX_MS));
    },
    [lang, finish, hardStop, softStop],
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

  const stop = useCallback(() => {
    const s = sessionRef.current;
    if (s) softStop(s);
    else setStatus((st) => (st === "listening" ? "idle" : st));
  }, [softStop]);

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
