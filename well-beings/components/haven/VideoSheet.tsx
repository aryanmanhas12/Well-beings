"use client";

import { useEffect, useState } from "react";
import { embedUrl, sourceName, watchUrl, type Video } from "@/lib/havenContent";
import { useDialogBehaviour } from "../dialogs";
import { SCENE_BG, SceneArt } from "./SceneArt";

/**
 * One place every video opens: the featured deck, the shelves, and the
 * "video for right now" on the home screen.
 *
 * It asks once per visit before loading anything from YouTube or
 * Instagram, and says which company will see the request. After a "yes"
 * the video plays in the sheet; "Open on YouTube" is always there for
 * anyone who would rather leave the app than let it embed.
 *
 * A bottom sheet on a phone, a centred panel on a wide screen, and a real
 * dialog either way: focus moves in, Tab stays in, Escape closes, and
 * focus goes back to the card that opened it.
 */
export function VideoSheet({
  video,
  consented,
  onConsent,
  onPlay,
  onClose,
}: {
  video: Video;
  consented: boolean;
  onConsent: () => void;
  onPlay: () => void;
  onClose: () => void;
}) {
  const ref = useDialogBehaviour(onClose);
  const [playing, setPlaying] = useState(false);
  const [online, setOnline] = useState(true);
  const src = sourceName(video);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  function play() {
    onConsent();
    setPlaying(true);
    onPlay();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
        lang={video.lang === "hi" ? "hi" : undefined}
      >
        <div className="sheet-media" style={{ background: video.scene ? SCENE_BG[video.scene.kind] : `linear-gradient(145deg, ${video.tint[0]}, ${video.tint[1]})` }}>
          {playing ? (
            <iframe
              className="sheet-frame"
              src={embedUrl(video)}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : video.scene ? (
            <SceneArt kind={video.scene.kind} className="sheet-art" />
          ) : null}
        </div>

        <div className="sheet-body">
          <h2 id="sheet-title" className="sheet-title">
            {video.title}
          </h2>
          <p className="sheet-by">
            {video.by} · {video.length}
          </p>
          <p className="sheet-when">{video.when}</p>

          {!online && !playing && (
            <p className="aside-note" role="status">
              You&apos;re offline, so this can&apos;t load right now. Breathing and grounding on the Watch screen work
              without a connection.
            </p>
          )}

          {!playing && online && (
            <>
              {!consented && (
                <p className="sheet-consent">
                  This plays from {src.app}, so {src.company} will see your IP address and may set cookies. Nothing
                  you&apos;ve written here goes with it.
                </p>
              )}
              <div className="btn-row">
                <button type="button" className="btn btn-sun" onClick={play}>
                  {consented ? "Play" : "Play it here"}
                </button>
                <a className="btn btn-soft" href={watchUrl(video)} target="_blank" rel="noopener noreferrer">
                  Open on {src.app}
                </a>
                <button type="button" className="btn btn-quiet" onClick={onClose}>
                  Not now
                </button>
              </div>
            </>
          )}

          {playing && (
            <div className="btn-row">
              <button type="button" className="btn btn-soft" onClick={onClose}>
                Done
              </button>
              <a
                className="btn btn-quiet"
                href={
                  video.source === "youtube"
                    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(video.title + " " + video.by)}`
                    : watchUrl(video)
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Won&apos;t play? Find it on {src.app}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
