import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";

const PATH = "/guides/sleep/";
export const metadata: Metadata = metadataFor(PATH);

export default function SleepGuide() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <article className="prose">
        <h1>Sleep: timing beats hours</h1>
        <p className="lede">
          Most sleep advice starts with how long you sleep. The stronger finding is about when. A
          window you keep to every day, weekends included, does more for mood than hitting eight
          hours on an unpredictable schedule.
        </p>

        <h2>What the evidence supports</h2>
        <p>
          In a cohort of 79,666 adults tracked with wrist accelerometers over seven and a half years,
          people with regular sleep timing were 38% less likely to develop depression and 33% less
          likely to develop anxiety. Hitting the recommended number of hours did not rescue an
          all-over-the-place schedule. Regularity mattered on its own.{" "}
          <span className="cite-note">(Li et al., 2025, Psychological Medicine)</span>
        </p>
        <p>
          A separate wearable study of roughly 100,000 people found the same ordering, and put a
          number on the weekend problem: more than a quarter of people abandon their routine on
          Saturday and Sunday, and that alone was associated with about 10% higher risk.{" "}
          <span className="cite-note">(Moebus et al., 2025, BMC Public Health)</span>
        </p>
        <p>
          The direction of cause is the part that usually gets hand-waved, so it is worth being
          precise. Cohort studies like those two show sleep and mood travelling together. A
          meta-analysis of 65 <strong>randomised trials</strong> covering 8,608 people is what lets
          anyone say sleep drives the change: improving sleep measurably lifted depression, anxiety
          and rumination, and the more sleep improved, the more the mind did.{" "}
          <span className="cite-note">(Scott et al., 2021, Sleep Medicine Reviews)</span>
        </p>

        <h2>What to change first</h2>
        <p>
          One thing, and it is not bedtime. Bedtime is hard to control because you cannot force
          sleepiness. Wake time you can simply set.
        </p>
        <ul>
          <li>
            <strong>Pick one wake time and keep it within about 30 minutes, all seven days.</strong>{" "}
            This is the whole intervention. Everything below only supports it.
          </li>
          <li>
            <strong>Get daylight within half an hour of waking.</strong> Light is the signal your body
            clock actually reads; an alarm is not. Outdoors beats a window, and a window beats
            indoor lighting.
          </li>
          <li>
            <strong>Let bedtime drift earlier on its own.</strong> If the wake time holds, sleep
            pressure does the rest within a week or two. Forcing an early bedtime usually produces
            an hour of lying awake, which teaches your brain that bed is where you think.
          </li>
        </ul>

        <h2>If falling asleep is the problem</h2>
        <p>
          Lying awake for a long stretch most nights is a different problem from a shifting schedule,
          and it responds to a different approach. The behavioural technique with the strongest
          evidence is stimulus control: keeping bed associated with sleep and nothing else.
        </p>
        <ul>
          <li>Awake and frustrated after about twenty minutes? Get up, low light, something dull.</li>
          <li>Phone charges out of arm&apos;s reach, not on the pillow.</li>
          <li>Same short wind-down every night, so it becomes a cue rather than a decision.</li>
        </ul>
        <p>
          Sleep programmes built specifically for university students improved sleep and improved
          anxiety and depression alongside it, and the gains were still measurable when researchers
          checked back later.{" "}
          <span className="cite-note">(Chandler et al., 2022, Sleep Medicine, 11 studies, 5,267 students)</span>
        </p>

        <h2>How much sleep is enough</h2>
        <p>
          Under 18, around nine hours. Adults, around seven to eight. These are population averages,
          not targets to hit exactly, and there is real individual variation. The practical test is
          simpler than any number: do you wake up feeling restored most mornings, without needing an
          alarm to drag you out? If yes, your hours are probably fine and regularity is the thing to
          work on.
        </p>

        <div className="callout">
          <h3>When this stops being a habit question</h3>
          <p>
            Persistent difficulty sleeping for more than a few weeks, loud snoring with daytime
            sleepiness, or waking unrefreshed no matter how long you are in bed are worth raising
            with a GP rather than solving with a routine. Insomnia and sleep apnoea are treatable
            conditions with specific treatments, and neither is diagnosed by a questionnaire. If low
            mood is in the picture too, the <Link href="/resources/">support page</Link> lists
            free lines and directories.
          </p>
        </div>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/guides/stress/">Stress and recovery</Link> — why an unfinished workday
            follows you to bed.
          </li>
          <li>
            <Link href="/guides/nutrition/">Food and drink</Link> — caffeine timing and alcohol, both
            of which land on sleep before they land anywhere else.
          </li>
          <li>
            <Link href="/">The Wellbeings check</Link> — five minutes, and it tells you whether sleep
            is actually your weak link or whether something else is.
          </li>
        </ul>
      </article>
    </PageShell>
  );
}
