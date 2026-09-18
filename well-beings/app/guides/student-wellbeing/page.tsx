import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";

const PATH = "/guides/student-wellbeing/";
export const metadata: Metadata = metadataFor(PATH);

export default function StudentGuide() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <article className="prose">
        <h1>Student wellbeing</h1>
        <p className="lede">
          School and university weeks have a shape most wellbeing advice ignores: fixed timetables
          you do not control, terms that spike, and a culture that quietly treats output as the
          measure of a person. This guide is about the parts that actually bend.
        </p>

        <h2>Output is not wellbeing</h2>
        <p>
          It is worth saying plainly, because almost every study tool implies otherwise. Grades are
          one part of a life. A term where you worked constantly, slept badly, saw nobody and hit
          your targets is not a good term, and a tool that scores it as one is measuring the wrong
          thing. Wellbeings deliberately asks about sleep, food, movement, connection and recovery
          alongside workload, and it will not tell you to trade them for hours.
        </p>

        <h2>Protect sleep through exam periods, not after them</h2>
        <p>
          The instinct in a heavy term is to borrow from sleep because it is the only unbooked block
          in the day. It is also the block that pays for everything else: improving sleep in
          randomised trials measurably lifted mood, anxiety and rumination, and programmes built
          specifically for university students held their gains at follow-up.{" "}
          <span className="cite-note">(Scott et al., 2021 · Chandler et al., 2022)</span>
        </p>
        <p>
          The practical version during exams: keep the wake time fixed even when the finish time is
          not. A late night followed by the usual alarm costs you one night. A late night followed by
          a lie-in shifts the whole window and costs you the week. See the{" "}
          <Link href="/guides/sleep/">sleep guide</Link> for why timing outranks hours.
        </p>

        <h2>Eating and moving around a timetable you did not choose</h2>
        <ul>
          <li>
            <strong>Anchor meals to the timetable rather than to hunger.</strong> A gap between
            lectures is a more reliable lunch slot than an intention to eat when you notice.
          </li>
          <li>
            <strong>Use the commute.</strong> Walking part of the way is the lowest-friction
            activity available to most students and it does not need a spare hour.
          </li>
          <li>
            <strong>Put one social thing in the week on purpose.</strong> Contact is the first thing
            a heavy term deletes, and it is the one you will not notice losing until it is gone.
          </li>
          <li>
            <strong>Give recovery a slot with a name.</strong> &quot;Free time&quot; that is really
            unstarted work is not recovery. See the four channels in the{" "}
            <Link href="/guides/stress/">stress guide</Link>.
          </li>
        </ul>

        <h2>Study blocks, honestly</h2>
        <p>
          Long unbroken stretches feel productive and are not. Short breaks of two to ten minutes
          reliably restore energy and reduce fatigue, though the effect is modest, and after
          genuinely heavy cognitive work a ten-minute break is not enough.{" "}
          <span className="cite-note">(Albulescu et al., 2022, PLoS ONE)</span> Plan the break into
          the block rather than treating it as a failure of concentration.
        </p>
        <p>
          And write tomorrow&apos;s first move down before you stop. It is the technique with the
          strongest evidence behind it for actually starting, and it works better when you are
          depleted, not worse.{" "}
          <span className="cite-note">(Gollwitzer &amp; Sheeran, 2006 · Toli et al., 2016)</span>
        </p>

        <div className="callout">
          <h3>Your institution probably has more than you think</h3>
          <p>
            Most schools and universities have a counselling service, a wellbeing team, disability
            and learning support, and a route to extenuating circumstances for assessments. These are
            usually free and almost always under-used. If a term has stopped being hard and started
            being unmanageable, contacting them early gives them far more room to help than
            contacting them the week before a deadline. The{" "}
            <Link href="/resources/">support page</Link> lists free lines too, including ones
            specifically for young people.
          </p>
        </div>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/guides/habits/">Habits</Link>: why a broken streak in exam term is not a
            failure.
          </li>
          <li>
            <Link href="/">The Wellbeings check</Link>: tell it you are studying and it adapts the
            questions and the plan.
          </li>
        </ul>
      </article>
    </PageShell>
  );
}
