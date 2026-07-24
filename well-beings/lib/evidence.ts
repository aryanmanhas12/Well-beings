import { EvidenceItem } from "./types";

export const EVIDENCE: EvidenceItem[] = [
  {
    tag: "Screening",
    design: "IPD meta-analysis · 100 studies · N=44,318",
    finding:
      "Starting with the 2-item PHQ-2 and expanding to the full PHQ-9 only when flagged matches full-screening sensitivity with better specificity — and cuts questions by ~57%.",
    use: "why the chat starts short and goes deeper only if something flags.",
    cite: "Levis et al., 2020, JAMA",
    url: "https://consensus.app/papers/details/6ceb082f92f259f59c2fa9d8fa960712/",
  },
  {
    tag: "Screening",
    design: "Clinical cohort · 2,183 visits, ages 12–25",
    finding:
      "In adolescents and young adults, a PHQ-2 score of ≥2 caught 89% of people with moderate-or-greater depressive symptoms.",
    use: "the youth-calibrated cutoff that triggers the deeper mood questions.",
    cite: "Pitts et al., 2023, J. Adolescent Health",
    url: "https://consensus.app/papers/details/d1249c895e1d5747b54ccb24654945fa/",
  },
  {
    tag: "Sleep",
    design: "Meta-analysis · 65 RCTs · N=8,608",
    finding:
      "Improving sleep causes medium-sized improvements in depression (g −0.63), anxiety (g −0.51) and rumination — with a dose-response: better sleep, better mind.",
    use: "sleep is pillar #1 of every plan, before any productivity tactic.",
    cite: "Scott et al., 2021, Sleep Medicine Reviews",
    url: "https://consensus.app/papers/details/14ed5f49d1765b1ebef825aa4216a8f3/",
  },
  {
    tag: "Sleep",
    design: "Accelerometer cohort · N=79,666 · 7.5 yrs",
    finding:
      "Regular sleepers had 38% lower risk of developing depression and 33% lower anxiety risk. Meeting duration guidelines did not cancel the risk of an irregular schedule.",
    use: "your plan fixes the window first, the hours second.",
    cite: "Li et al., 2025, Psychological Medicine",
    url: "https://consensus.app/papers/details/7ab87f554d8854c4bb416480de802a17/",
  },
  {
    tag: "Sleep",
    design: "Wearable cohort · N≈100,000",
    finding:
      "A consistent nightly window beat raw duration for preventing mental disorders; 25%+ of people break routine on weekends, raising risk ~10%.",
    use: "the weekend rule: keep your window within ±30 min, all 7 days.",
    cite: "Moebus et al., 2025, BMC Public Health",
    url: "https://consensus.app/papers/details/480edbdabe4f58a8867a727589630ee6/",
  },
  {
    tag: "Sleep",
    design: "Meta-analysis · 11 studies · N=5,267 students",
    finding:
      "Sleep programs for university students moderately reduced sleep disturbance and also improved anxiety and depression, holding at follow-up.",
    use: "evidence the sleep-first approach works for this app’s core audience.",
    cite: "Chandler et al., 2022, Sleep Medicine",
    url: "https://consensus.app/papers/details/c754d2b6e8925e2a954b02f32d937a51/",
  },
  {
    tag: "Burnout",
    design: "Meta-analysis · 316 samples · N=99,329",
    finding:
      "Psychologically detaching after work reduces exhaustion; relaxation and mastery raise engagement and well-being. The four recovery channels are distinct — not interchangeable.",
    use: "the shutdown ritual and the four-channel weekly recovery quota.",
    cite: "Headrick et al., 2022, J. Business & Psychology",
    url: "https://consensus.app/papers/details/b4b32af90fcd550d93e987eff3b59f43/",
  },
  {
    tag: "Burnout",
    design: "Review · stressor–detachment model",
    finding:
      "High workload predicts low detachment, and low detachment predicts strain, burnout and lower life satisfaction — a loop that compounds if unbroken.",
    use: "the burnout radar watches your drain trend so you can break the loop early.",
    cite: "Sonnentag & Fritz, 2015, J. Organizational Behavior",
    url: "https://consensus.app/papers/details/a7fcb2608dea5efb8b589f690f2c76f5/",
  },
  {
    tag: "Focus",
    design: "Meta-analysis · 22 samples · N=2,335",
    finding:
      "Micro-breaks (~2–10 min) reliably boosted vigor (d=.36) and cut fatigue (d=.35); recovery from heavy cognitive work needs longer than 10 minutes.",
    use: "the 50-on / 10-off rhythm inside your deep blocks.",
    cite: "Albulescu et al., 2022, PLoS ONE",
    url: "https://consensus.app/papers/details/ad9eb8a31f8e5a589ac6eecae765a6bb/",
  },
  {
    tag: "Goals",
    design: "Meta-analysis · 94 tests",
    finding:
      "\"If-then\" plans (implementation intentions) improved goal attainment with a medium-to-large effect (d=.65) by automating the start of the behaviour.",
    use: "the one-line if-then you write at shutdown for tomorrow’s first block.",
    cite: "Gollwitzer & Sheeran, 2006, Adv. Exp. Soc. Psych.",
    url: "https://consensus.app/papers/details/5f23556f39a35b74957933d9aac4c90f/",
  },
  {
    tag: "Goals",
    design: "Meta-analysis · 29 experiments, clinical samples",
    finding:
      "If-then planning worked even better for people with mental-health difficulties (d≈.99) — structure compensates when self-regulation is depleted.",
    use: "plans get more specific, not more ambitious, when your scores are elevated.",
    cite: "Toli et al., 2016, Brit. J. Clinical Psychology",
    url: "https://consensus.app/papers/details/d8ccca83d3525ab09af97d4c7f3a3830/",
  },
  {
    tag: "Habits",
    design: "Daily-tracking field studies · N=96 & 192",
    finding:
      "New habits took 18–254 days to become automatic (median ≈2 months); missing a single day made no measurable difference; stable context cues sped everything up.",
    use: "streaks that forgive misses, and habits anchored to routines you already have.",
    cite: "Lally et al., 2010, EJSP · Keller et al., 2021",
    url: "https://consensus.app/papers/details/c8c012abb9895e38bfd6d92c34b47a3e/",
  },
  {
    tag: "Mood",
    design: "Meta-analysis · 16 RCTs, ages 12–25",
    finding:
      "Physical activity had a large effect on depression symptoms in young people (SMD −0.82); a 375-RCT umbrella review confirms benefits for anxiety too.",
    use: "the 30-min movement block, 3× a week, in mood-flagged plans.",
    cite: "Bailey et al., 2017, Psych. Medicine · Singh et al., 2025, JAACAP",
    url: "https://consensus.app/papers/details/3ee0b6c765075a05b08fbf5f9938dfcc/",
  },
  {
    tag: "Mood",
    design: "Prospective cohorts · 49 studies · N=266,939",
    finding:
      "People with high physical activity had 17% lower odds of developing depression over the years — protection held across ages and regions.",
    use: "movement is prevention, not just treatment — it stays in every plan.",
    cite: "Schuch et al., 2018, Am. J. Psychiatry",
    url: "https://consensus.app/papers/details/ae4cd4ca223353a6a231e0fe11dd44f8/",
  },
  {
    tag: "Stress",
    design: "RCT · 1 month · daily 5-min practices",
    finding:
      "Five minutes of exhale-weighted \"cyclic sighing\" daily improved mood and lowered resting respiratory rate more than mindfulness meditation.",
    use: "the 1-minute breathing tool. Honesty note: a placebo-controlled trial of a related technique found no benefit over placebo — so we treat breathwork as a quick state-shifter, not a cure.",
    cite: "Balban et al., 2023, Cell Reports Medicine",
    url: "https://consensus.app/papers/details/252fb4e9655a544f84d9b7d7bef57bdc/",
  },
  {
    tag: "Stress",
    design: "Meta-analysis · 12 RCTs · N=785",
    finding:
      "Breathwork showed small-to-medium reductions in subjective stress (g −0.35), anxiety and depressive symptoms versus controls.",
    use: "why the breathing tool is offered for acute stress, with expectations set honestly.",
    cite: "Fincham et al., 2023, Scientific Reports",
    url: "https://consensus.app/papers/details/47b3b407e9505d2298d4ed70da367884/",
  },
];
