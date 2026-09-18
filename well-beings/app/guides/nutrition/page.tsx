import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";

const PATH = "/guides/nutrition/";
export const metadata: Metadata = metadataFor(PATH);

export default function NutritionGuide() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <article className="prose">
        <h1>Eating, drinking and steady energy</h1>
        <p className="lede">
          This guide is about how food and drink show up in your energy, sleep and concentration. It
          is not about weight, and it does not contain a diet. Those are different questions, and the
          second one is a conversation for a GP or a dietitian rather than a web page.
        </p>

        <h2>Regularity does more than composition</h2>
        <p>
          For most people whose eating is disrupted rather than unhealthy, the problem is pattern
          rather than content: the skipped breakfast, the 4pm crash, the meal that becomes whatever
          is nearest at 10pm. Eating at roughly consistent times gives you a far steadier afternoon
          than optimising what is on the plate.
        </p>
        <p>
          A useful test, and one worth being honest about: how often do you go more than five or six
          waking hours without eating anything? If the answer is most days, that is the thing to
          change before anything else on this page.
        </p>

        <h2>Caffeine is a sleep question</h2>
        <p>
          Caffeine has a half-life of roughly five to six hours in most adults, which means a
          mid-afternoon coffee still has a meaningful amount circulating at bedtime. The effect is
          usually not that you cannot fall asleep. It is that the sleep you get is lighter, so you
          wake less restored and need more caffeine, which is a loop worth noticing.
        </p>
        <ul>
          <li>
            <strong>Set a cut-off time rather than a cup limit.</strong> Early afternoon is a common
            and workable one.
          </li>
          <li>
            <strong>Watch the sources you are not counting.</strong> Energy drinks, cola, strong tea
            and pre-workout all count.
          </li>
          <li>
            <strong>Expect a rough few days if you cut back sharply.</strong> Headache and low
            concentration for two or three days is the normal pattern, not a sign you need it.
          </li>
        </ul>

        <h2>Alcohol and sleep</h2>
        <p>
          Alcohol makes people fall asleep faster and sleep worse. It suppresses REM sleep early in
          the night and fragments the second half, which is why a heavy evening tends to produce a
          4am wake-up and a flat next day. If you are working on sleep and drinking regularly in the
          evening, those two efforts are pulling against each other.
        </p>
        <p>
          The <Link href="/">Wellbeings check</Link> asks one question about drinking, and only asks
          more if the first answer is not &quot;never&quot;. It is there because drinking shows up in
          sleep and mood, not to put a label on anyone. It does not diagnose anything.
        </p>

        <h2>Hydration, without the mythology</h2>
        <p>
          The specific claim that everyone needs eight glasses of water a day has no strong evidence
          behind it, and this guide is not going to repeat it. What is well established is that being
          noticeably dehydrated impairs concentration and mood, and that thirst is a late signal
          rather than an early one.
        </p>
        <p>
          The practical version: keep water within reach of wherever you work or study, and drink
          more in heat, during exercise and when you are unwell. Pale yellow urine is a reasonable
          rough indicator. Counting millilitres is not necessary for most people.
        </p>

        <div className="callout">
          <h3>Where this guide stops</h3>
          <p>
            Wellbeings does not assess eating disorders and this page is not written for that
            purpose. If eating, food or your body takes up a lot of your thinking, if you are
            skipping meals deliberately, or if eating is followed by guilt or compensating
            behaviour, please talk to a GP or a dedicated service rather than a wellbeing tool. That
            is not a judgement and it is not a diagnosis. It is that a questionnaire about habits is
            genuinely the wrong instrument. The{" "}
            <Link href="/resources/">support page</Link> lists free lines and directories.
          </p>
        </div>

        <h2>Related</h2>
        <ul>
          <li>
            <Link href="/guides/sleep/">Sleep</Link> — where caffeine and alcohol both actually land.
          </li>
          <li>
            <Link href="/guides/student-wellbeing/">Student life</Link> — eating around a timetable
            you do not control.
          </li>
        </ul>
      </article>
    </PageShell>
  );
}
