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
    q: "Does anyone see what I tell the app?",
    a: "No. There is no server, no account and no analytics, so your check-ins, hope box, photos and safety plan exist only in your own browser. Telling the app you are not safe does not alert anyone. If you want someone to know how you have been, the app can write a summary for you to send them, and you see every word and press send yourself.",
  },
  {
    q: "Why does it ask about thoughts of suicide?",
    a: "Only when you say you are arriving heavy or cannot see a way forward. Asking directly is what clinicians are trained to do, and the research on it is consistent: asking does not put the idea in someone's head, and it can reduce distress. Your answer only changes what the app shows you next, such as your safety plan and helplines.",
  },
  {
    q: "Does Wellbeings diagnose anything?",
    a: "No. It has no diagnostic capability and makes no diagnostic claim. It reflects back what you reported, says which patterns are worth attention, and names the point at which a qualified professional is the better next step. Nothing it shows you is a medical finding.",
  },
  {
    q: "Where do my answers go?",
    a: "Nowhere. They are held in your own browser's local storage on the device you used. There is no account, no server, no database and no analytics, so there is nothing to transmit. The one thing that ever loads from elsewhere is a video on the Calm screen, and only after you tap it and agree. Deleting your data removes it from that browser permanently.",
  },
  {
    q: "How is Wellbeings different from Ronak?",
    a: "Wellbeings is the everyday safe place: checking in, calming down, keeping hope and a safety plan within reach, and a broad look at sleep, movement and routine. Ronak is the dedicated mental-health screening tool, covering depression, anxiety and related instruments in depth and in six languages. They are separate apps that link to each other; neither sends the other your answers.",
  },
  {
    q: "Is the advice evidence-based?",
    a: "Each tool in the safe place is adapted from a published approach, and the app says which, with the size of the effect in plain words, including when it is small. That evidence is for the techniques, not for this app: Wellbeings itself has not been tested in a trial, and it says so. Where evidence is weak or young, the app says that too.",
  },
];

export default function AboutPage() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} faq={FAQ} />
      <div className="prose">
        <h1>About Wellbeings</h1>
        <p className="lede">
          Wellbeings is a quiet place for hard days, and a private look at everyday wellbeing for the
          steadier ones. It runs entirely on your phone, it does not diagnose anything, and it is
          honest about where it stops.
        </p>

        <h2>The safe place</h2>
        <p>
          Opening the app lands you in the safe place, not in a questionnaire. It asks how you are
          arriving in two taps, answers in a way that fits what you said, and keeps a handful of tools
          within reach. Each one is adapted from a published approach, and the size of the evidence is
          stated as it is:
        </p>
        <ul>
          <li>
            <strong>A safety plan</strong>, following the Stanley–Brown Safety Planning Intervention:
            warning signs, things you can do alone, people and places that lift you, people to ask for
            help, professionals, and making where you are safer. In a study of 1,640 people seen in
            emergency departments for suicidal crises, safety planning with follow-up calls was linked
            to 45% fewer suicidal behaviours over six months (Stanley et al. 2018, JAMA Psychiatry).
          </li>
          <li>
            <strong>A hope box</strong>: people, plans, memories, proof of hard times you got through,
            songs and photos. In a trial with 118 veterans who had recently had suicidal thoughts, a
            phone version helped people feel more able to cope, though it did not measurably change
            suicidal thinking on its own (Bush et al. 2017, Psychiatric Services).
          </li>
          <li>
            <strong>Good things</strong>, a daily gratitude practice. Across 27 studies the effect on
            depression and anxiety was small (Cregg &amp; Cheavens 2021), so it is offered as a gentle
            habit, not a treatment.
          </li>
          <li>
            <strong>Stories and films</strong> chosen for hard days. Stories of people getting through
            a crisis were linked to a small drop in suicidal thoughts among viewers who were
            struggling, across six randomised trials (Niederkrotenthaler et al. 2022, Lancet Public
            Health).
          </li>
          <li>
            <strong>Breathing and grounding</strong> that work offline, and <strong>words to borrow</strong>{" "}
            for messaging someone, because people reliably underestimate how glad others are to hear
            from them (Liu et al. 2022).
          </li>
        </ul>

        <h2>How it responds when things are hard</h2>
        <p>
          The rules are written down in the source and tested, not hidden in a model. If you say you
          are arriving heavy or cannot see a way forward, the app asks directly whether you are having
          thoughts of suicide. If you are, your safety plan and free helplines move to the top and stay
          there for three days. If you say you do not feel safe, everything else leaves the screen and
          the numbers to call become the buttons. If the days have been heavy for a while, it says so
          and offers to help you tell someone.
        </p>
        <p>
          None of that alerts anyone. There is no server and nobody watching. If you add a therapist,
          doctor or someone you trust on the Reach out screen, the app can write a summary of your last
          two weeks for you to send them, and you see every word first. Ronak is working toward
          connecting people with professionals directly; if that ever reaches this app, it will ask you
          first and say exactly what it would share.
        </p>

        <h2>The wellbeing check</h2>
        <p>
          For a day with a bit more room, there is also a private check of everyday life: sleep and its timing, energy, physical activity, eating and drinking, stress and recovery,
          mood, social connection, work or study load, concentration, screen use, routine and
          environment. The point of that breadth is that the thing making your weeks hard is often
          not the thing you would have named. A schedule problem gets blamed on motivation, and a
          recovery problem gets blamed on discipline.
        </p>

        <h3>How a result is put together</h3>
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
          These are two tools with two jobs. Wellbeings is the everyday safe place and the broad
          lifestyle picture. {COMPANION_NAME} is the dedicated mental-health screening experience.
          Wellbeings deliberately does not try to be the second one: if what you describe looks like
          it needs a proper mental-health screen, it says so and points you there rather than
          pretending to do it itself.
        </p>
        <p>
          Neither sends the other your answers. Moving between them passes a URL parameter saying
          which app you came from, and at most one coarse severity band. No answers, no scores, no
          identifier. Each app keeps its own data on your device and reads only its own keys.{" "}
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
