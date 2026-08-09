"use client";

import { useEffect, useState } from "react";
import { getString, type Language } from "@/lib/i18n";

interface TailoringNudgeProps {
  lang?: Language;
}

/**
 * Tailoring Nudge Component
 * Shows when answer[1] === true (user indicated interest in personalized approach)
 * Encourages user to use the weekly journal with personalized templates
 */
export function TailoringNudge({ lang }: TailoringNudgeProps) {
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("well-beings-intro-answers");
      if (stored) {
        const parsedAnswers = JSON.parse(stored);
        setAnswers(parsedAnswers);
        // Show nudge if answer[1] is true
        if (parsedAnswers[1] === true) {
          setShow(true);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        background: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
        border: `1px solid var(--color-accent)`,
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "20px", flex: "0 0 auto" }}>✨</span>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              margin: "0 0 0.5rem 0",
              color: "var(--color-accent)",
            }}
          >
            {getString("sheetNudge", lang) || "Personalized templates for this week"}
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-neutral-400)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Based on your answers, we've prepared some templates tailored to support your wellbeing this week. You can
            try them or create your own journal practice.
          </p>
        </div>
      </div>
    </div>
  );
}
