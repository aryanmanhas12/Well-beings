import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";

const PATH = "/guides/activity/";
export const metadata: Metadata = metadataFor(PATH);

export default function ActivityGuide() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <article className="prose">
        <h1>Movement: the most reliable lever there is</h1>
        <p className="lede">
          If you only change one thing and you are not already moving regularly, this is the one with
          the widest evidence base behind it. It is also the one most likely to be described in a way
          that makes it sound harder than it is.
        </p>

        <h2>What the evidence supports</h2>
        <p>
          In trials with 12 to 25 year olds, exercise lifted low mood by roughly as much as
          front-line treatments do. About 8 in 10 young people who moved regularly did better than
          those who did not.{" "}
          <span className="cite-note">(Bailey et al., 2017, Psychological Medicine · Singh et al., 2025, JAACAP)</span>
        </p>
        <p>
          It also appears to be protective rather than only corrective. Pooling prospective cohort
          studies, people who were physically active were meaningfully less likely to go on to
          develop depression, across age groups and continents.{" "}
          <span className="cite-note">(Schuch et al., 2018, American Journal of Psychiatry)</span>
        </p>
        <p>
          Two honest caveats. Trials of exercise cannot be blinded, so some of the effect is likely to
          be expectation rather than physiology, and nobody can cleanly separate the two. And
          &quot;exercise helps mood&quot; is a statement about averages: it does not mean a walk will
          fix a depressive episode, and being told to go for a run when you cannot get out of bed is
          not help.
        </p>

        <h2>How much, realistically</h2>
        <p>
          The public-health figure is around 150 minutes of moderate activity a week for adults, and
          around an hour a day for under-18s. Moderate means you are breathing harder and could talk
          but not sing.
        </p>
        <p>
          The more useful framing for anyone starting from nothing: the largest single gain in the
          research is between doing almost nothing and doing something. Going from zero to two short
          walks a week is a bigger change than going from four sessions to five.
        </p>
        <ul>
          <li>
            <strong>Put it in the calendar, not in your intentions.</strong> &quot;When I feel like
            it&quot; reliably loses to a scheduled slot.
          </li>
          <li>
            <strong>Attach it to something already fixed.</strong> After a lecture, before dinner, on
            the way back from the station. An existing routine is a free cue.
          </li>
          <li>
            <strong>Count the walking.</strong> A brisk twenty minutes to somewhere you were going
            anyway is real activity and it does not require a kit bag.
          </li>
          <li>
            <strong>Pair it with a person when you can.</strong> Movement and social contact are two
            separate levers and this is the one way to pull both at once.
          </li>
        </ul>

        <h2>Why it tends to be the first thing dropped</h2>
        <p>
          Movement is the flexible item in most weeks: it has no deadline and nobody notices when you
          skip it. That is exactly why it disappears first under load, and why it is worth protecting
          deliberately rather than leaving to whatever time is left over. If your week is genuinely
          full, the honest move is to shrink the session rather than cancel it. Ten minutes kept is
          worth more than forty minutes intended.
        </p>

        <div className="callout">
          <h3>When to check with someone first</h3>
          <p>
            Chest pain, breathlessness out of proportion to the effort, fainting, or joint pain that
            worsens over days are reasons to speak to a GP before increasing activity, not reasons to
            push through. The same applies if you are managing a heart, lung or metabolic condition,
            or recovering from an injury. This is general guidance and it is not tailored to your
            medical history.
          </p>
        </div>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/guides/sleep/">Sleep</Link>: daylight and movement reinforce each other; a
            walk outside in the morning does both jobs.
          </li>
          <li>
            <Link href="/guides/habits/">Habits</Link>: how to make a session survive a bad week.
          </li>
          <li>
            <Link href="/">The Arun check</Link>: see where movement sits against everything
            else going on.
          </li>
        </ul>
      </article>
    </PageShell>
  );
}
