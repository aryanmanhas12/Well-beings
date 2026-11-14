"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "./gsap";

/**
 * A line whose words rise into place, one after another.
 *
 * After React Bits' SplitText (reactbits.dev, MIT with the Commons Clause),
 * which is GSAP's SplitText driven from React props. Two things are changed
 * for this house. Theirs fades each piece in from nothing; here every word
 * slides up from under a mask at full contrast, because text never fades
 * in Arun. And it splits by word only: split by letter, a screen reader is
 * handed confetti unless the label is rebuilt, and Devanagari must never be
 * cut between a consonant and its matra.
 *
 * GSAP's own SplitText keeps the whole line as the element's aria-label
 * and hides the pieces, so it is read once, as written. Under reduced
 * motion nothing is split and the line is plain text.
 */
export function RiseText({ text, as: Tag = "h2", className, delay = 0, calm = false, id }: { text: string; as?: "h1" | "h2" | "p"; className?: string; delay?: number; calm?: boolean; id?: string }) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = ref.current;
        if (!el) return;
        const split = SplitText.create(el, { type: "words", mask: "words", wordsClass: "rise-word" });
        gsap.from(split.words, { yPercent: 115, duration: calm ? 0.8 : 0.6, ease: calm ? "power2.out" : "power3.out", stagger: calm ? 0.09 : 0.06, delay });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { dependencies: [text, calm, delay] },
  );

  return (
    <Tag ref={ref} className={className} id={id}>
      {text}
    </Tag>
  );
}
