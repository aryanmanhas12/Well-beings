import { EvidenceItem } from "./types";

/**
 * Plain-language rule for this file: no bare effect sizes in `finding`.
 * A reader should never meet "d=.65" cold. Each card leads with one figure
 * and says what it means; the original statistic lives in `technical`,
 * always with a gloss. See EFFECT_SCALE below for the shared explainer.
 */

/** How to read effect sizes — shown once, at the top of the Evidence tab. */
export const EFFECT_SCALE = {
  intro:
    "Research papers measure “how much did this help?” with a number called an effect size (written d, g or SMD). It isn’t a percentage and it isn’t a score out of 10, which is what makes it confusing. Here’s the honest translation:",
  rows: [
    {
      band: "around 0.2",
      word: "Small",
      plain: "Real, but you might not notice it day to day. Worth doing when it’s free and easy.",
    },
    {
      band: "around 0.5",
      word: "Moderate",
      plain: "A difference most people can feel. The typical person doing it ends up better off than about 7 in 10 who don’t.",
    },
    {
      band: "0.8 and up",
      word: "Large",
      plain: "A difference that changes your week. Comparable to the effect sizes reported for front-line treatments.",
    },
  ],
  note:
    "A minus sign just means the thing went down — for symptoms, down is good. And an effect size is an average across many people, not a promise about you.",
} as const;

export const EVIDENCE: EvidenceItem[] = [
  {
    tag: "Screening",
    design: "IPD meta-analysis · 100 studies · N=44,318",
    figure: "57%",
    caption: "Fewer questions asked, with no loss of accuracy",
    strength: "large",
    finding:
      "Starting with the 2-item PHQ-2 and opening the full PHQ-9 only when something flags catches just as many people as asking everyone everything — while cutting the number of questions by more than half.",
    use: "why the chat starts short and goes deeper only if something flags.",
    cite: "Levis et al., 2020, JAMA",
    url: "https://consensus.app/papers/details/6ceb082f92f259f59c2fa9d8fa960712/",
  },
  {
    tag: "Screening",
    design: "Clinical cohort · 2,183 visits, ages 12–25",
    figure: "89%",
    caption: "Of young people with real depressive symptoms were caught by 2 questions",
    strength: "large",
    finding:
      "In 12–25 year olds, answering “yes, more than a few days” to either of the first two mood questions caught 89% of those who turned out to have moderate-or-worse depression. Two questions, nearly nine in ten found.",
    use: "the youth-calibrated cutoff that triggers the deeper mood questions.",
    cite: "Pitts et al., 2023, J. Adolescent Health",
    url: "https://consensus.app/papers/details/d1249c895e1d5747b54ccb24654945fa/",
  },
  {
    tag: "Sleep",
    design: "Meta-analysis · 65 randomised trials · N=8,608",
    figure: "7 in 10",
    caption: "Do better on depression after fixing sleep than those who don't",
    strength: "moderate",
    finding:
      "Fixing sleep doesn’t just make you less tired — it measurably lifts depression, anxiety and rumination. And it’s dose-response: the more sleep improved, the more the mind improved. Because these were randomised trials, this is one of the few places research can say sleep causes the change rather than just travelling with it.",
    technical: "Hedges’ g −0.63 for depression, −0.51 for anxiety — a moderate effect, meaning most people notice it.",
    use: "sleep is pillar #1 of every plan, before any productivity tactic.",
    cite: "Scott et al., 2021, Sleep Medicine Reviews",
    url: "https://consensus.app/papers/details/14ed5f49d1765b1ebef825aa4216a8f3/",
  },
  {
    tag: "Sleep",
    design: "Accelerometer cohort · N=79,666 · 7.5 yrs",
    figure: "38%",
    caption: "Lower risk of developing depression among regular sleepers",
    strength: "large",
    finding:
      "People with regular sleep timing were 38% less likely to develop depression and 33% less likely to develop anxiety over seven years. Hitting the recommended hours did not rescue an all-over-the-place schedule — regularity mattered on its own.",
    use: "your plan fixes the window first, the hours second.",
    cite: "Li et al., 2025, Psychological Medicine",
    url: "https://consensus.app/papers/details/7ab87f554d8854c4bb416480de802a17/",
  },
  {
    tag: "Sleep",
    design: "Wearable cohort · N≈100,000",
    figure: "1 in 4",
    caption: "People break their sleep routine at weekends — and pay about 10% more risk",
    strength: "moderate",
    finding:
      "A consistent nightly window beat raw hours for preventing mental-health problems. More than a quarter of people abandon their routine on weekends, and that alone raised risk by roughly 10%.",
    use: "the weekend rule: keep your window within ±30 min, all 7 days.",
    cite: "Moebus et al., 2025, BMC Public Health",
    url: "https://consensus.app/papers/details/480edbdabe4f58a8867a727589630ee6/",
  },
  {
    tag: "Sleep",
    design: "Meta-analysis · 11 studies · N=5,267 students",
    figure: "Held",
    caption: "Gains were still there at follow-up, not just straight after",
    strength: "moderate",
    finding:
      "Sleep programmes built for university students improved sleep — and improved anxiety and depression alongside it. The gains were still measurable when researchers checked back later, which is where a lot of wellbeing interventions quietly fail.",
    use: "evidence the sleep-first approach works for this app’s core audience.",
    cite: "Chandler et al., 2022, Sleep Medicine",
    url: "https://consensus.app/papers/details/c754d2b6e8925e2a954b02f32d937a51/",
  },
  {
    tag: "Burnout",
    design: "Meta-analysis · 316 samples · N=99,329",
    figure: "4",
    caption: "Distinct kinds of recovery — and they don't substitute for each other",
    strength: "large",
    finding:
      "Mentally switching off after work reduces exhaustion; relaxation and mastery raise engagement and wellbeing. Crucially, the four recovery channels are not interchangeable — a weekend of doing nothing does not deliver what learning something does. You need each kind.",
    use: "the shutdown ritual and the four-channel weekly recovery quota.",
    cite: "Headrick et al., 2022, J. Business & Psychology",
    url: "https://consensus.app/papers/details/b4b32af90fcd550d93e987eff3b59f43/",
  },
  {
    tag: "Burnout",
    design: "Review · stressor–detachment model",
    figure: "A loop",
    caption: "Heavy workload → can't switch off → strain → heavier workload",
    strength: "moderate",
    finding:
      "High workload makes it harder to switch off, and not switching off predicts strain, burnout and lower life satisfaction — which makes the workload feel heavier still. It compounds until something breaks the circuit.",
    use: "the burnout radar watches your drain trend so you can break the loop early.",
    cite: "Sonnentag & Fritz, 2015, J. Organizational Behavior",
    url: "https://consensus.app/papers/details/a7fcb2608dea5efb8b589f690f2c76f5/",
  },
  {
    tag: "Focus",
    design: "Meta-analysis · 22 samples · N=2,335",
    figure: "2–10 min",
    caption: "Break length that reliably restores energy and cuts fatigue",
    strength: "small",
    finding:
      "Short breaks of two to ten minutes reliably lifted energy and reduced fatigue. The effect is modest but dependable. One honest caveat from the same work: after genuinely heavy cognitive effort, ten minutes isn’t enough — that needs a real break.",
    technical: "d = 0.36 for vigour, 0.35 for fatigue — small effects, but consistent across studies.",
    use: "the 50-on / 10-off rhythm inside your deep blocks.",
    cite: "Albulescu et al., 2022, PLoS ONE",
    url: "https://consensus.app/papers/details/ad9eb8a31f8e5a589ac6eecae765a6bb/",
  },
  {
    tag: "Goals",
    design: "Meta-analysis · 94 tests",
    figure: "7 in 10",
    caption: "Do better at reaching a goal with an if-then plan than without one",
    strength: "moderate",
    finding:
      "Writing “if it’s 9am, then I open the document” beats deciding in the moment. Naming the when and where in advance automates the start, so beginning costs no willpower — and starting is where most plans die.",
    technical: "d = 0.65 — a moderate-to-large effect across 94 separate tests.",
    use: "the one-line if-then you write at shutdown for tomorrow’s first block.",
    cite: "Gollwitzer & Sheeran, 2006, Adv. Exp. Soc. Psych.",
    url: "https://consensus.app/papers/details/5f23556f39a35b74957933d9aac4c90f/",
  },
  {
    tag: "Goals",
    design: "Meta-analysis · 29 experiments, clinical samples",
    figure: "8 in 10",
    caption: "It works better, not worse, when mental health is poor",
    strength: "large",
    finding:
      "If-then planning worked even better for people with mental-health difficulties than for everyone else. When self-regulation is depleted, external structure does the work your brain is too tired to do. This is the opposite of the “try harder” advice usually aimed at struggling people.",
    technical: "d ≈ 0.99 — a large effect, bigger than in the general population.",
    use: "plans get more specific, not more ambitious, when your scores are elevated.",
    cite: "Toli et al., 2016, Brit. J. Clinical Psychology",
    url: "https://consensus.app/papers/details/d8ccca83d3525ab09af97d4c7f3a3830/",
  },
  {
    tag: "Habits",
    design: "Daily-tracking field studies · N=96 & 192",
    figure: "~2 months",
    caption: "Typical time for a habit to feel automatic — not 21 days",
    strength: "moderate",
    finding:
      "Habits took between 18 and 254 days to become automatic, with a median around two months. The famous “21 days” is a myth. Best finding for anyone who’s broken a streak: missing a single day made no measurable difference to whether the habit formed.",
    use: "streaks that forgive misses, and habits anchored to routines you already have.",
    cite: "Lally et al., 2010, EJSP · Keller et al., 2021",
    url: "https://consensus.app/papers/details/c8c012abb9895e38bfd6d92c34b47a3e/",
  },
  {
    tag: "Mood",
    design: "Meta-analysis · 16 randomised trials, ages 12–25",
    figure: "8 in 10",
    caption: "Young people exercising do better on mood than those who don't",
    strength: "large",
    finding:
      "For 12–25 year olds, physical activity had a large effect on depressive symptoms — large enough that head-to-head reviews put it in the same conversation as front-line treatments. An umbrella review across 375 trials finds the same for anxiety.",
    technical: "SMD −0.82 — a large effect. The minus sign means symptoms went down.",
    use: "the 30-min movement block, 3× a week, in mood-flagged plans.",
    cite: "Bailey et al., 2017, Psych. Medicine · Singh et al., 2025, JAACAP",
    url: "https://consensus.app/papers/details/3ee0b6c765075a05b08fbf5f9938dfcc/",
  },
  {
    tag: "Mood",
    design: "Prospective cohorts · 49 studies · N=266,939",
    figure: "17%",
    caption: "Lower odds of ever developing depression, in active people",
    strength: "moderate",
    finding:
      "Across a quarter of a million people, those who were physically active had 17% lower odds of developing depression in the years that followed — protection that held across ages and regions. Movement isn’t only a treatment; it lowers the odds of getting ill in the first place.",
    use: "movement is prevention, not just treatment — it stays in every plan.",
    cite: "Schuch et al., 2018, Am. J. Psychiatry",
    url: "https://consensus.app/papers/details/ae4cd4ca223353a6a231e0fe11dd44f8/",
  },
  {
    tag: "Stress",
    design: "Randomised trial · 1 month · daily 5-min practice",
    figure: "5 min",
    caption: "Daily breathing that beat meditation on mood in a head-to-head trial",
    strength: "mixed",
    finding:
      "Five minutes a day of exhale-weighted “cyclic sighing” improved mood and lowered resting breathing rate more than mindfulness meditation did. Being honest about the other side: a placebo-controlled trial of a related technique found no benefit over placebo. So we treat breathwork as a quick way to shift your state, not a treatment.",
    use: "the 1-minute breathing tool — offered for acute stress, with expectations set honestly.",
    cite: "Balban et al., 2023, Cell Reports Medicine",
    url: "https://consensus.app/papers/details/252fb4e9655a544f84d9b7d7bef57bdc/",
  },
  {
    tag: "Stress",
    design: "Meta-analysis · 12 randomised trials · N=785",
    figure: "6 in 10",
    caption: "Do better on stress with breathwork — a small but real edge",
    strength: "small",
    finding:
      "Pooling twelve trials, breathwork produced small-to-moderate reductions in stress, anxiety and low mood compared with control groups. Real, but modest — which is exactly why it sits in this app as a one-minute tool rather than a centrepiece.",
    technical: "Hedges’ g −0.35 — a small effect.",
    use: "why the breathing tool is offered for acute stress, with expectations set honestly.",
    cite: "Fincham et al., 2023, Scientific Reports",
    url: "https://consensus.app/papers/details/47b3b407e9505d2298d4ed70da367884/",
  },
];
