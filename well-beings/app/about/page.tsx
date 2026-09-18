import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";
import { ronakLink } from "@/lib/bridge";
import { COMPANION_NAME } from "@/lib/site";

const PATH = "/about/";
export const metadata: Metadata = metadataFor(PATH);

/* Rendered visibly below AND passed to JsonLd as FAQPage. Both read from this
   one array, which is the only way the structured data cannot drift away from
   what a person actually sees on the page. */
const FAQ = [
  {
    q: "Does Wellbeings diagnose anything?",
    a: "No. It has no diagnostic capability and makes no diagnostic claim. It reflects back what you reported, says which patterns are worth attention, and names the point at which a qualified professional is the better next step. Nothing it shows you is a medical finding.",
  },
  {
    q: "What is the wellbeing snapshot, exactly?",
    a: "It is this app's own summary of the answers you gave, grouped into areas like sleep, movement and recovery. It is not a validated instrument and it is not a percentage of health. It is a way of ordering your own report so the most useful thing to change first is visible.",
  },
  {
    q: "Where do my answers go?",
    a: "Nowhere. They are held in your own browser's local storage on the device you used. There is no account, no server, no database and no analytics, so there is nothing to transmit and nothing for anyone else to read. Clearing the data deletes it from that browser permanently.",
  },
  {
    q: "How is Wellbeings different from Ronak?",
    a: "Wellbeings looks at the breadth of daily life: sleep, movement, food and drink, stress, recovery, connection, screen use and routine. Ronak is the dedicated mental-health screening tool, covering depression, anxiety and related instruments in depth and in six languages. They are separate apps, they share no data, and each links to the other when the other is the more useful one.",
  },
  {
    q: "Is the advice evidence-based?",
    a: "The claims that carry a citation come from named studies you can open and read, and the Evidence section inside the app lists all of them with their design and sample size. Where evidence is weak or young, the app says so rather than rounding it up. General practical guidance that is not tied to a specific study is not dressed up as though it were.",
  },
];

export default function AboutPage() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} faq={FAQ} />
      <div className="prose">
        <h1>About Wellbeings</h1>
        <p className="lede">
          Wellbeings helps you understand your everyday wellbeing and turn that understanding into
          two or three changes you might actually keep. It runs entirely in your browser, it does not
          diagnose anything, and it is honest about where it stops.
        </p>

        <h2>What it looks at</h2>
        <p>
          Sleep and its timing, energy, physical activity, eating and drinking, stress and recovery,
          mood, social connection, work or study load, concentration, screen use, routine and
          environment. The point of that breadth is that the thing making your weeks hard is often
          not the thing you would have named. A schedule problem gets blamed on motivation, and a
          recovery problem gets blamed on discipline.
        </p>

        <h2>How a result is put together</h2>
        <p>
          The result separates four things that are usually mashed together, because conflating them
          is how wellbeing tools end up overclaiming:
        </p>
        <ul>
          <li>
            <strong>Observation</strong>: what you reported. &quot;You said you sleep about six
            hours and your timing shifts at weekends.&quot; No interpretation in it at all.
          </li>
          <li>
            <strong>Interpretation</strong>: what that pattern may suggest, in hedged language,
            because a questionnaire cannot know your life.
          </li>
          <li>
            <strong>Recommendation</strong>: something specific you could try, sized to what you
            told it about your time and situation.
          </li>
          <li>
            <strong>Medical concern</strong>: the separate, clearly-marked category for &quot;this
            is a point where a professional is worth talking to&quot;. It is never mixed in with a
            tip.
          </li>
        </ul>
        <p>
          There is no percentage score, because a number like &quot;73% healthy&quot; would imply a
          validated scale that does not exist. What you get is a snapshot: your own answers,
          organised, with the most useful starting point identified.
        </p>

        <h2>What it is not</h2>
        <p>
          Not a medical device. Not a diagnosis of depression, anxiety, insomnia, an eating disorder,
          ADHD, a substance-use disorder or anything else. Not a treatment plan, and never a reason
          to change or stop medication. Not a replacement for a GP, a counsellor, or a school or
          university wellbeing service. If you are struggling, those are better than this, and the{" "}
          <Link href="/resources/">support page</Link> lists free lines you can reach today.
        </p>

        <h2>Wellbeings and {COMPANION_NAME}</h2>
        <p>
          These are two tools with two jobs. Wellbeings is the broad lifestyle picture and the daily
          system built from it. {COMPANION_NAME} is the dedicated mental-health screening experience.
          Wellbeings deliberately does not try to be the second one: if what you describe looks like
          it needs a proper mental-health screen, it says so and points you there rather than
          pretending to do it itself.
        </p>
        <p>
          They share no data. Moving between them passes a single URL parameter saying which app you
          came from, and nothing else. No answers, no scores, no identifier. Each app keeps its own
          data on your own device.{" "}
          <a href={ronakLink()} target="_blank" rel="noopener noreferrer">
            Open {COMPANION_NAME}
          </a>
          .
        </p>

        <h2>Questions</h2>
        {FAQ.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}

        <h2>Who made it</h2>
        <p>
          Wellbeings is built by Aryan Manhas as part of the NeuroBioPsych project. It is not a
          clinical product, it has no institutional backing, and it carries no professional
          accreditation. Saying so plainly seems more useful than implying otherwise. More about the
          project is on the <a href="../me/">author page</a>.
        </p>
      </div>
    </PageShell>
  );
}
