"use client";

import { useEffect, useState } from "react";
import { getString, getLanguage, type Language } from "@/lib/i18n";

interface OpeningQuestionsOverlayProps {
  onAnswersChanged?: (answers: (boolean | null)[]) => void;
  onComplete?: () => void;
}

export function OpeningQuestionsOverlay({
  onAnswersChanged,
  onComplete,
}: OpeningQuestionsOverlayProps) {
  const [isHidden, setIsHidden] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null]);
  const [isDeepLink, setIsDeepLink] = useState(false);
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    // Detect if this is a deep link (path !== "/")
    const isDeepLink = typeof window !== "undefined" && window.location.pathname !== "/";
    setIsDeepLink(isDeepLink);

    // Check if user has already answered
    const stored = localStorage.getItem("well-beings-intro-answers");
    const hasAnswered = !!stored;

    if (hasAnswered || isDeepLink) {
      setIsHidden(true);
      // Load stored answers if available
      if (stored) {
        const storedAnswers = JSON.parse(stored);
        setAnswers(storedAnswers);
        onAnswersChanged?.(storedAnswers);
      }
    } else {
      setIsHidden(false);
    }

    setLang(getLanguage());
  }, [onAnswersChanged]);

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
    onAnswersChanged?.(newAnswers);

    if (currentQuestion < 2) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Store answers and close overlay
      localStorage.setItem("well-beings-intro-answers", JSON.stringify(newAnswers));
      setIsHidden(true);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    // Mark as completed without full answers
    localStorage.setItem("well-beings-intro-answers", JSON.stringify(answers));
    setIsHidden(true);
    onComplete?.();
  };

  const statements = getString("introStatements", lang) as string[];

  return (
    <div
      className="intro-overlay"
      hidden={isHidden}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: isHidden ? "none" : "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        overscrollBehavior: "contain",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="intro-content"
        style={{
          background: "var(--color-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          maxWidth: "600px",
          width: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          margin: "auto",
          overscrollBehavior: "contain",
          border: `1px solid var(--color-divider)`,
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "var(--color-text)",
            }}
          >
            {getString("introQuestion", lang)}
          </h2>
          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.6,
              color: "var(--color-neutral-400)",
              margin: 0,
            }}
          >
            {statements[currentQuestion]}
          </p>
        </div>

        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "1.5rem",
            justifyContent: "center",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  i === currentQuestion
                    ? "var(--color-accent)"
                    : i < currentQuestion
                      ? "var(--color-accent-500)"
                      : "var(--color-neutral-700)",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
            minHeight: "44px",
          }}
        >
          <button
            onClick={() => handleAnswer(true)}
            className="btn btn-primary"
            style={{
              padding: "12px 24px",
              minHeight: "44px",
              fontSize: "14px",
              flex: "0 1 auto",
            }}
          >
            {getString("introYes", lang)}
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="btn btn-secondary"
            style={{
              padding: "12px 24px",
              minHeight: "44px",
              fontSize: "14px",
              flex: "0 1 auto",
            }}
          >
            {getString("introNo", lang)}
          </button>
          <button
            onClick={handleSkip}
            className="btn btn-tertiary"
            style={{
              padding: "12px 24px",
              minHeight: "44px",
              fontSize: "14px",
              flex: "0 1 auto",
            }}
          >
            {getString("introSkip", lang)}
          </button>
        </div>

        {/* Crisis line notice */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--color-divider)",
            fontSize: "12px",
            color: "var(--color-neutral-600)",
            textAlign: "center",
          }}
        >
          If you're in crisis, please reach out immediately to your local crisis support.
        </div>
      </div>
    </div>
  );
}
