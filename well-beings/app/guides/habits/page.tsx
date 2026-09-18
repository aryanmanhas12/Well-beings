import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";

const PATH = "/guides/habits/";
export const metadata: Metadata = metadataFor(PATH);

export default function HabitsGuide() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <article className="prose">
        <h1>Habits that survive a bad week</h1>
        <p className="lede">
          Two findings do most of the work here, and both contradict advice you have probably been
          given. Habits take far longer than 21 days. And missing one does not undo them.
        </p>

        <h2>It is not 21 days</h2>
        <p>
          In daily-tracking field studies, habits took between 18 and 254 days to feel automatic,
          with a median around two months. The famous three-week figure has no research behind it.{" "}
          <span className="cite-note">(Lally et al., 2010, EJSP · Keller et al., 2021)</span>
        </p>
        <p>
          The more useful finding from the same work, and the reason streak apps get this wrong:
          missing a single day made no measurable difference to whether the habit eventually formed.
          A broken streak is a broken counter, not a broken habit. If a tool makes you feel like
          starting over, the tool is wrong.
        </p>

        <h2>Decide the when and where in advance</h2>
        <p>
          The best-evidenced technique for actually starting something is unglamorous: write a single
          sentence specifying the trigger and the action. &quot;If it is 9am and I am at my desk,
          then I open the draft.&quot; Across 94 separate tests, about 7 in 10 people did better with
          a plan in that form than without one.{" "}
          <span className="cite-note">(Gollwitzer &amp; Sheeran, 2006, Adv. Exp. Soc. Psych.)</span>
        </p>
        <p>
          It works because starting is where most intentions die, and naming the exact moment removes
          the decision. And it works <em>more</em>, not less, when things are hard: pooling 29
          experiments in clinical samples, if-then planning had a larger effect for people with
          mental-health difficulties than for the general population, because external structure does
          the work that depleted self-regulation cannot.{" "}
          <span className="cite-note">(Toli et al., 2016, British Journal of Clinical Psychology)</span>{" "}
          That is close to the opposite of the &quot;just try harder&quot; advice usually aimed at
          people who are struggling.
        </p>

        <h2>Making one stick</h2>
        <ul>
          <li>
            <strong>Anchor it to something already in your day.</strong> After brushing your teeth,
            after the first lecture, when the kettle goes on. An existing routine is a free cue and
            you do not have to remember it.
          </li>
          <li>
            <strong>Make the first version embarrassingly small.</strong> Small enough that a bad day
            does not give you an excuse. You can grow it once it is automatic; you cannot grow one
            that never happened.
          </li>
          <li>
            <strong>Pick one at a time.</strong> Three new habits at once is a plan to keep none of
            them.
          </li>
          <li>
            <strong>Expect to miss days and plan the restart, not the perfection.</strong> The
            question that predicts success is what happens on day two after a miss.
          </li>
        </ul>

        <h2>What habits will not fix</h2>
        <p>
          A habit is a tool for consistency, not a treatment. If you have been trying for weeks and
          cannot start anything at all, that is usually a signal about capacity rather than
          discipline — exhaustion, low mood, or a load that genuinely does not fit — and the answer
          is to look at that, not to design a better system. The{" "}
          <Link href="/guides/stress/">stress and recovery guide</Link> covers the load side, and
          the <Link href="/">Wellbeings check</Link> will tell you which of those is most likely.
        </p>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/guides/activity/">Movement</Link> — usually the first habit worth building.
          </li>
          <li>
            <Link href="/guides/sleep/">Sleep</Link> — a fixed wake time is a habit like any other.
          </li>
        </ul>
      </article>
    </PageShell>
  );
}
