import { CSSProperties } from "react";
import { STANDALONE_VIEWBOX, detailFor, markSvgBody } from "@/lib/mark-geometry.mjs";

/**
 * The Arun symbol: the sun rising out of the top of a square window, with
 * a blue sky and mountains inside. Drawn from the same geometry as the app
 * icon (lib/mark-geometry.mjs), so the header and the home screen always
 * match.
 *
 * The SVG body is a string from that shared file rather than JSX, because
 * the Node icon scripts need the identical shapes and a second hand-written
 * copy is exactly how the old header glyph and the old icon drifted apart.
 * The string is built from constants in this repo, never from user input.
 *
 * `lit` (0 to 4) is the front door's weekly rays: the middle ray is always
 * lit, and each good thing kept this week lights one more.
 */
export function ArunMark({
  width = 40,
  lit,
  fluid = false,
  frame = "var(--mark-frame, #FFF1DE)",
  label,
  style,
}: {
  width?: number;
  lit?: number;
  fluid?: boolean;
  /** Frame colour. Follows the theme by default (--mark-frame). */
  frame?: string;
  label?: string;
  style?: CSSProperties;
}) {
  const [, , vw, vh] = STANDALONE_VIEWBOX.split(" ").map(Number);
  const height = Math.round((width * vh) / vw);
  return (
    <svg
      width={width}
      height={height}
      viewBox={STANDALONE_VIEWBOX}
      style={{
        display: "block",
        flex: "none",
        ...(fluid ? { width: "100%", maxWidth: width, height: "auto" } : null),
        ...style,
      }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: markSvgBody({ detail: detailFor(width), lit, frame }) }}
    />
  );
}
