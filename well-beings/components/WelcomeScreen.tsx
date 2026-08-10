"use client";

import { useEffect, useState } from "react";
import { WelcomeAura } from "./WelcomeAura";
import { TourInvite } from "./TourInvite";
import { Tour } from "./Tour";
import { WELCOME_TOUR, hasSeenWelcomeTour, markWelcomeTourSeen } from "@/lib/tour";

export function WelcomeScreen({
  onStartChat,
  onStartDemo,
  onOpenHelp,
}: {
  onStartChat: () => void;
  onStartDemo: () => void;
  onOpenHelp: () => void;
}) {
  const [tourOpen, setTourOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  /* New device, no profile: offer the tour without being asked. Runs after
     mount rather than during render because localStorage doesn't exist on
     the server, and a server/client disagreement here would flash the
     sheet at people who've already dismissed it. */
  useEffect(() => {
    if (!hasSeenWelcomeTour()) setInviteOpen(true);
  }, []);

  function startTour() {
    setInviteOpen(false);
    setTourOpen(true);
  }

  /* Dismissing and finishing both mean "don't ask again on this device".
     Anyone who wants it back has the Take a tour button, which stays put
     on the page rather than moving into a menu. */
  function closeTour() {
    setTourOpen(false);
    markWelcomeTourSeen();
  }

  function dismissInvite() {
    setInviteOpen(false);
    markWelcomeTourSeen();
  }

  return (
    <main data-screen-label="Welcome" className="welcome" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {tourOpen && (
        <Tour
          steps={WELCOME_TOUR}
          onFinish={closeTour}
          onComplete={onStartChat}
          finishLabel="Start the check-in"
        />
      )}

      <div className="welcome-wrap">
        <div className="welcome-grid">
          <div className="welcome-hero" data-tour="welcome-hero">
            {/* On a phone this leads; on a desktop it sits beside the copy.
                Either way it's the first thing that resolves on the page. */}
            <div className="welcome-aura-slot">
              <WelcomeAura />
            </div>

            <div className="tag tag-accent welcome-tag">Evidence-based · built on 15+ peer-reviewed studies</div>

            <h1 className="welcome-h1">
              A system for your energy,
              <br className="welcome-h1-break" /> not just your to-do list.
            </h1>

            <p className="welcome-lede">
              A 5-minute check-in about your sleep, mood, stress and goals — using the same short screeners
              clinicians use — then a personalised daily system designed to raise output and keep you clear of
              burnout.
            </p>

            <div className="welcome-cta">
              <button className="btn btn-primary welcome-cta-primary" onClick={onStartChat} data-tour="welcome-start">
                Start the check-in · ~5 min
              </button>
              <button className="btn btn-secondary welcome-cta-secondary" onClick={onStartDemo} data-tour="welcome-preview">
                Preview a sample profile
              </button>
              {/* Permanently on the page, not in a menu — the tour is for
                  exactly the people least likely to go looking for it. */}
              <button className="btn btn-ghost welcome-cta-tour" onClick={startTour}>
                Take a tour first
              </button>
            </div>

            <div className="welcome-trust">
              <div data-tour="welcome-privacy">
                <div className="welcome-trust-title">Private by design</div>
                <div className="welcome-trust-body">
                  Everything stays in your browser. Nothing is uploaded, shared or sold. Delete it anytime.
                </div>
              </div>
              <div>
                <div className="welcome-trust-title">Adaptive, not exhausting</div>
                <div className="welcome-trust-body">
                  Short screeners first; deeper questions only if something flags — the approach validated in JAMA.
                </div>
              </div>
              <div>
                <div className="welcome-trust-title">Research-backed only</div>
                <div className="welcome-trust-body">
                  Every practice cites its meta-analysis or trial — and says so when evidence is young.
                </div>
              </div>
            </div>
          </div>

          <div className="welcome-side" data-tour="welcome-evidence">
            <div className="card welcome-stat">
              <div className="welcome-stat-kicker">From the research inside</div>
              <div className="welcome-stat-figure">−38%</div>
              <div className="welcome-stat-body">
                depression risk for people with a regular sleep window — independent of hours slept. Cohort of
                79,666 (Psychological Medicine, 2025).
              </div>
            </div>
            <div className="card welcome-stat">
              <div className="welcome-stat-figure">7 in 10</div>
              <div className="welcome-stat-body">
                do better at reaching a goal with an &quot;if-then&quot; plan than without one — across 94 tests
                (Gollwitzer &amp; Sheeran meta-analysis).
              </div>
            </div>
            <div className="welcome-disclaimer">
              Well-Beings is a self-guidance tool, not a medical device. Its screeners signal — they don&apos;t
              diagnose. If you&apos;re in crisis, use{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenHelp();
                }}
              >
                Help now
              </a>
              .
            </div>
          </div>
        </div>
      </div>

      {inviteOpen && !tourOpen && <TourInvite onStart={startTour} onDismiss={dismissInvite} />}
    </main>
  );
}
