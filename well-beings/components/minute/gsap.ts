"use client";

/**
 * GSAP for the minute and the reel, and nowhere else.
 *
 * Added in November 2026 at the owner's request ("use the newly added
 * tools"). It earns its place in exactly one job: a card that follows a
 * finger, can be thrown, and lands where the throw was going (Draggable
 * with InertiaPlugin, both free since GSAP 3.13). Hand-written pointer
 * code for that is where the game's joystick spent a week.
 *
 * The rules it lives under here:
 *   - It is in the minute's and the reel's own lazy files, never in the
 *     first screen's script.
 *   - It is an enhancement. Every card also has buttons and arrow keys,
 *     which are plain React and work if this file never arrives.
 *   - Everything it animates is transform, on its own element. It never
 *     animates opacity on anything that carries words.
 *   - All of it sits inside gsap.matchMedia() on
 *     (prefers-reduced-motion: no-preference); under reduced motion
 *     nothing here runs and cards change in place.
 *   - Nothing it does is on the crisis strip, a helpline or the urgent
 *     screen.
 */
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(Draggable, InertiaPlugin, SplitText, useGSAP);

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, Draggable, SplitText, useGSAP };
