"use client";

import { useSyncExternalStore } from "react";
import { setSoundWanted, soundWanted, subscribeSound } from "@/lib/ambient";

/**
 * The speaker at the top of every page: music on or off, one tap, always
 * in the same place. Ooh's first lines point at it.
 */
export function SoundToggle() {
  /* Server value true: the button is drawn as "on" in the static HTML,
     which is the default, and corrects itself on the client if not. */
  const on = useSyncExternalStore(subscribeSound, soundWanted, () => true);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon sound-toggle"
      data-sound-control
      aria-pressed={on}
      aria-label="Music"
      title={on ? "Music is on. Tap to turn it off." : "Music is off. Tap to turn it on."}
      onClick={() => setSoundWanted(!on)}
      style={{ width: 44, height: 44 }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fillOpacity="0.18" />
        {on ? (
          <>
            <path d="M15.5 9a4 4 0 0 1 0 6" />
            <path d="M18.2 6.5a7.5 7.5 0 0 1 0 11" />
          </>
        ) : (
          <>
            <path d="M16 9.5l5 5" />
            <path d="M21 9.5l-5 5" />
          </>
        )}
      </svg>
    </button>
  );
}
