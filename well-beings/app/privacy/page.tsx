import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";
import { COMPANION_NAME } from "@/lib/site";

const PATH = "/privacy/";
export const metadata: Metadata = metadataFor(PATH);

export default function PrivacyPage() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <div className="prose">
        <h1>Privacy</h1>
        <p className="lede">
          Arun has no account, no server, no database and no analytics. Everything you enter
          stays in your own browser on your own device. This page says exactly what that means, and
          exactly where it stops, without the words that usually get used loosely.
        </p>

        <h2>What is stored, and where</h2>
        <p>
          One entry in your browser&apos;s <code>localStorage</code>, under the key{" "}
          <code>wellbeings-v1</code>. It holds your check-in answers and the profile built from them,
          your daily check-ins and habit ticks, anything you wrote in the journal, and your display
          settings. Two smaller keys record whether you have already seen the guided tour, so it does
          not replay forever.
        </p>
        <p>
          Three more hold the front door and the listener: <code>arun-light-v1</code> keeps the good
          things you choose to keep, one line and a date each; <code>arun-voice-v1</code> remembers
          whether you agreed to your browser&apos;s online speech service; <code>arun-listener-v1</code>{" "}
          remembers whether you turned on AI replies. Conversations with the listener are not stored
          anywhere. Close it and they are gone.
        </p>
        <p>
          That is the whole list. There is no cookie, no session storage, no IndexedDB, no
          fingerprinting and no third-party script on any page of this site.
        </p>

        <h2>What is never sent anywhere</h2>
        <p>
          With the default settings, all of it. The app is a static site: once the page has loaded, it
          makes no network requests of its own. Your check-in, your good things and your
          conversations with the listener stay on the device. You can verify this yourself. Open your
          browser&apos;s developer tools, go to the Network tab, and use the app. Nothing goes out.
        </p>

        <h2>The two things that can leave the device, and only if you say yes</h2>
        <p>
          <strong>Speaking instead of typing.</strong> Where your browser can turn speech into text on
          the phone itself (recent Chrome), it does, and nothing is sent. Where it cannot, the first
          tap on the microphone explains that your browser would send the audio to its own speech
          service (Google in Chrome, Apple in Safari), and asks. Arun never receives the audio. Your
          keyboard&apos;s microphone key is always another option.
        </p>
        <p>
          <strong>The AI listener.</strong> The listener answers with replies written in advance and
          chosen on your phone. If this site has an AI listener set up, you can switch it on. Then the
          recent part of that conversation is sent through Arun&apos;s relay, a small server that stores
          nothing and logs no message content, to Anthropic, which uses Claude to write the reply and
          handles it under its API privacy terms. It is off until you turn it on, and one tap turns it
          off again.
        </p>
        <p>
          Your answers also never reach a URL, a page title, a share preview or an error message.
          The check-in and your results are states inside the app rather than separate addresses, so
          there is no link that could carry them and nothing personalised in any social preview. The
          previews are generated at build time from fixed page copy.
        </p>

        <h2>Words this page is careful with</h2>
        <p>
          Plenty of tools describe themselves as anonymous, encrypted or confidential. Here is what
          is and is not true here:
        </p>
        <ul>
          <li>
            <strong>Anonymous</strong>: accurate in the sense that the app never asks for or derives
            any identifier. It does ask for a first name if you want to give one, and that is stored
            in your browser with everything else.
          </li>
          <li>
            <strong>Encrypted</strong>: <em>not</em> claimed. Browser local storage is not
            encrypted by the app. It is protected by your device and your browser profile, which
            means anyone who can unlock your device and open your browser could read it.
          </li>
          <li>
            <strong>Confidential</strong>: used on this site only to describe the helplines, which
            are genuinely confidential services. It is not a claim about the app.
          </li>
          <li>
            <strong>Deleted</strong>: accurate. Deleting removes the key from this browser, and
            because no copy was ever made anywhere else, there is nothing left to delete.
          </li>
        </ul>

        <h2>Things worth knowing</h2>
        <ul>
          <li>
            <strong>A shared device shares the data.</strong> Anyone using the same browser profile
            can open the app and see your results. On a shared or family computer, delete your data
            when you finish, or use a private window.
          </li>
          <li>
            <strong>It is per-browser and per-device.</strong> Nothing syncs. Your phone and your
            laptop each hold their own separate copy, and clearing site data on either wipes that
            one.
          </li>
          <li>
            <strong>Installing it as an app changes nothing.</strong> Same storage, same device,
            same absence of a server.
          </li>
          <li>
            <strong>The site is hosted on GitHub Pages.</strong> Like any web host, GitHub serves the
            files and will see standard request information such as your IP address when the page
            loads. That is hosting, not Arun, and it happens before any of your answers exist.
            It is covered by{" "}
            <a
              href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub&apos;s privacy statement
            </a>
            .
          </li>
          <li>
            <strong>Outbound links are ordinary links.</strong> Helplines, directories and cited
            papers are other people&apos;s sites with their own policies. Tapping one is a normal
            visit to them; nothing about you is passed along.
          </li>
        </ul>

        <h2>Moving between Arun and {COMPANION_NAME}</h2>
        <p>
          The two apps link to each other. That handoff passes one URL parameter naming which app you
          came from, and at most a single coarse severity band in the other direction. No answers, no
          scores, no identifiers, and nothing that could be traced back to you. Each app keeps its
          own data on your own device and neither can read the other&apos;s.
        </p>

        <h2>Deleting everything</h2>
        <p>
          Open the app, go to <strong>Support and privacy</strong>, and choose{" "}
          <strong>Delete all my data</strong>. It is immediate and irreversible. Clearing site data
          for this site in your browser settings does the same thing.
        </p>

        <div className="callout">
          <p>
            Arun is not a healthcare provider, so health-record protections such as HIPAA or
            the NHS confidentiality framework do not apply to it and this page does not claim they
            do. That is one of the reasons nothing is stored off your device.{" "}
            <Link href="/about/">More about what the tool is and is not</Link>.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
