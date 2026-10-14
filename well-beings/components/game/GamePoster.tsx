"use client";

import { useEffect, useRef } from "react";
import { drawCone, drawCritter, drawSkyline, drawSnowball } from "@/lib/game/art";

/**
 * The game's picture in the Watch room: the skyline at the hour it is (day
 * or night, by the phone's clock), Biscuit and Miso mid-throw. Drawn once,
 * still: the Watch room is for calm, and the moving version is inside the
 * game.
 */
export function GamePoster() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const paint = () => {
      const rect = c.getBoundingClientRect();
      if (!rect.width) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(rect.width * dpr);
      c.height = Math.round(rect.height * dpr);
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const hour = new Date().getHours();
      drawSkyline(ctx, w, h, !(hour >= 6 && hour < 18), 0);
      const sc = Math.max(1.2, Math.min(2.2, w / 260));
      const gy = h * 0.93;
      for (const [x, look, face] of [[w * 0.2, "biscuit", 1], [w * 0.8, "miso", -1]] as const) {
        ctx.save();
        ctx.translate(x, gy);
        ctx.scale(sc, sc);
        drawCritter(ctx, look, { t: 2, walk: 0, moving: false, face, hitT: 0, throwT: 0.14, sit: false, stains: [], happy: false, hold: false, hop: 0, chilly: false, scale: 1, seed: face });
        ctx.restore();
      }
      ctx.save();
      ctx.translate(w * 0.42, h * 0.5);
      drawCone(ctx, "#FF7AB0", 0.6, sc * 0.9);
      ctx.restore();
      ctx.save();
      ctx.translate(w * 0.6, h * 0.42);
      ctx.scale(sc * 0.9, sc * 0.9);
      drawSnowball(ctx, 8, 0);
      ctx.restore();
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  return <canvas ref={ref} className="play-poster" aria-hidden="true" data-tilt="" />;
}
