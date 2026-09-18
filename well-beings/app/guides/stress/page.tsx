import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";
import { COMPANION_NAME } from "@/lib/site";

const PATH = "/guides/stress/";
export const metadata: Metadata = metadataFor(PATH);

export default function StressGuide() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <article className="prose">
        <h1>Stress and recovery: switching off is a skill</h1>
        <p className="lede">
          The strongest predictor of exhaustion in the recovery research is not how many hours you
          work or study. It is whether you ever mentally stop. That is a more hopeful finding than it
          sounds, because stopping is trainable and hours often are not.
        </p>

        <h2>Four kinds of recovery, and they do not substitute</h2>
        <p>
          A meta-analysis pooling 316 samples and 99,329 people found four distinct recovery
          channels, each doing a different job. Psychological detachment, meaning genuinely not
          thinking about the work, reduces exhaustion. Relaxation, mastery (learning something unrelated) and
          control over your own time raise engagement and wellbeing.{" "}
          <span className="cite-note">(Headrick et al., 2022, Journal of Business &amp; Psychology)</span>
        </p>
        <p>
          The finding people usually miss is that these are not interchangeable. A weekend of lying
          on the sofa delivers relaxation and no mastery. An intense hobby delivers mastery and no
          relaxation. If your recovery is all one channel, you will feel the gap even after a long
          break.
        </p>

        <h2>The loop worth breaking early</h2>
        <p>
          High workload makes it harder to switch off. Not switching off predicts strain, burnout and
          lower life satisfaction, which makes the same workload feel heavier, which makes switching
          off harder still.{" "}
          <span className="cite-note">(Sonnentag &amp; Fritz, 2015, Journal of Organizational Behavior)</span>
        </p>
        <p>
          This is why &quot;manage your stress better&quot; fails as advice to someone genuinely
          overloaded. No technique outruns a load that does not fit. If your week is crushing, the
          first move is subtraction from the calendar, not a better breathing exercise.
        </p>

        <h2>A shutdown that actually works</h2>
        <ul>
          <li>
            <strong>Fix an end time and write tomorrow&apos;s first move in one line.</strong> Naming
            the when and where in advance is the single best-evidenced planning technique there is:
            across 94 tests, roughly 7 in 10 people did better with an if-then plan than without one.{" "}
            <span className="cite-note">(Gollwitzer &amp; Sheeran, 2006)</span> It matters here
            because the open loop is what follows you home.
          </li>
          <li>
            <strong>Mark the end out loud.</strong> Saying &quot;done for today&quot; is faintly
            ridiculous and it works, because detachment needs a boundary it can recognise.
          </li>
          <li>
            <strong>Separate the spaces if you possibly can.</strong> Working where you sleep makes
            both harder.
          </li>
          <li>
            <strong>Take real breaks during the day too.</strong> Breaks of two to ten minutes
            reliably lift energy and cut fatigue. The effect is modest but dependable. The same work is
            honest that after genuinely heavy cognitive effort, ten minutes is not enough.{" "}
            <span className="cite-note">(Albulescu et al., 2022, PLoS ONE)</span>
          </li>
        </ul>

        <h2>Stress is not the same as anxiety</h2>
        <p>
          Stress is a response to a load, and it resolves when the load does. If worry is
          free-floating, present most days, hard to control, and does not lift when the deadline
          passes, that is a different pattern and this guide is not the right tool for it. Wellbeings
          deliberately does not screen for anxiety disorders. {COMPANION_NAME}, the companion tool, is
          built for exactly that and takes a few minutes.
        </p>

        <div className="callout">
          <h3>If it is more urgent than that</h3>
          <p>
            If you are having thoughts of harming yourself, please do not work through a guide. The{" "}
            <Link href="/resources/">support page</Link> lists free, confidential lines that are open
            right now, for India, the UK, the US, Canada, Australia, New Zealand and worldwide. If
            you are in immediate danger, local emergency services are the right call.
          </p>
        </div>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/guides/sleep/">Sleep</Link>: the first thing an unfinished day takes.
          </li>
          <li>
            <Link href="/guides/habits/">Habits</Link>: making the shutdown stick past week one.
          </li>
        </ul>
      </article>
    </PageShell>
  );
}
