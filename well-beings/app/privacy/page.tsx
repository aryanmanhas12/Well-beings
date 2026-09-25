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
          Wellbeings has no account, no server, no database and no analytics. Everything you enter
          stays in your own browser on your own device. This page says exactly what that means, and
          exactly where it stops, without the words that usually get used loosely.
        </p>

        <h2>What is stored, and where</h2>
        <p>
          Everything lives in your browser&apos;s <code>localStorage</code>, under these keys and
          nowhere else:
        </p>
        <ul>
          <li>
            <code>wellbeings-safe-v1</code>: the safe place. Your check-ins (how you were arriving, how
            the days ahead looked, and your answer to the question about thoughts of suicide when it
            was asked), your good things, your hope box, your note for a heavier day, your safety plan,
            a care-team contact if you added one, the region used to choose helplines, and whether you
            have seen the opening sunrise.
          </li>
          <li>
            <code>wellbeings-photos-v1</code>: photos you added to your hope box. They are shrunk on
            your device before they are stored, and the original file is never kept or uploaded.
          </li>
          <li>
            <code>wellbeings-v1</code>: the wellbeing check, the daily plan built from it, daily
            check-ins, habit ticks, journal entries and your display settings.
          </li>
          <li>
            <code>wellbeings-draft-v1</code>: an unfinished wellbeing check, so a refresh does not lose
            it. Removed when the check is finished.
          </li>
          <li>
            <code>wellbeings-tour-seen-v1</code>: whether you have seen the tour of the daily plan.
          </li>
        </ul>
        <p>
          There is no cookie, no session storage, no IndexedDB and no fingerprinting. Nothing is
          loaded from anyone else&apos;s server when the app opens, with one exception you choose
          yourself, covered below.
        </p>
        <p>
          The region used to show you helplines is first guessed from your device&apos;s time zone.
          That guess is made on your device and never sent anywhere, and you can change it on the
          Reach out screen.
        </p>

        <h2>What is never sent anywhere</h2>
        <p>
          All of it. The app is a static site: once the page has loaded, it makes no network requests
          of its own. There is no endpoint to send answers to, because there is no server. You can
          verify this yourself. Open your browser&apos;s developer tools, go to the Network tab, and
          check in. Nothing goes out.
        </p>
        <p>
          Your answers also never reach a URL, a page title, a share preview or an error message.
          The check-in, your hope box and your plan are states inside the app rather than separate
          addresses, so there is no link that could carry them and nothing personalised in any social
          preview.
        </p>

        <h2>Telling the app you are not safe does not alert anyone</h2>
        <p>
          This matters enough to say on its own. If you tell the check-in you are having thoughts of
          suicide, or that you do not feel safe, the app changes what it shows you: your safety plan,
          free helplines and the people in your plan move to the top. It does not contact anyone,
          because it cannot. No one is watching these answers. If you need someone to know, the app
          will help you tell them, but you have to be the one who presses call or send.
        </p>

        <h2>Sharing with a care team</h2>
        <p>
          On the Reach out screen you can add one person: a therapist, a doctor, or someone you trust.
          Their name and, if you give them, their phone number and email are stored in{" "}
          <code>wellbeings-safe-v1</code> on your device, together with the date you agreed to how
          sharing works.
        </p>
        <p>
          When you choose to, the app writes a short summary of your last two weeks of check-ins for
          you to send them. You see every word before it goes, you can add a note, and you choose how
          it is sent: your phone&apos;s share sheet, a text, an email, a copy you paste yourself, or a
          file you save. Whatever you choose is an ordinary message sent by you, through your own
          apps, and from then on it is covered by the privacy terms of those apps and whoever you sent
          it to. Wellbeings keeps no record that anything was sent.
        </p>
        <p>
          The app never sends a summary on its own, on a schedule, or in response to an answer. If
          things have been heavy for a while it may <em>offer</em> to help you send one; that offer can
          be switched off, and removing the contact removes it.
        </p>
        <p>
          {COMPANION_NAME} is working toward connecting people with mental-health professionals. If
          that ever reaches this app, it will need your explicit agreement on this screen first, and
          this page will be updated to say exactly what would be shared, with whom, and how to stop it.
        </p>

        <h2>Videos are the one thing that loads from elsewhere</h2>
        <p>
          The Calm screen lists a few videos. None of them loads until you tap it and agree, and the
          thumbnails are drawn by the app rather than fetched. When you do choose to play one, it is
          played from YouTube&apos;s privacy-enhanced domain (<code>youtube-nocookie.com</code>). That
          request goes to Google, which will see your IP address and may set cookies once you press
          play, under{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Google&apos;s privacy policy
          </a>
          . Nothing you have written in the app goes with it. Breathing and grounding work without any
          connection at all.
        </p>

        <h2>Words this page is careful with</h2>
        <p>
          Plenty of tools describe themselves as anonymous, encrypted or confidential. Here is what
          is and is not true here:
        </p>
        <ul>
          <li>
            <strong>Anonymous</strong>: accurate in the sense that the app never asks for or derives
            any identifier. It does ask for a first name in the wellbeing check if you want to give
            one, and a care-team contact if you choose to add one, and both are stored in your browser
            with everything else.
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
            <strong>Monitored</strong>: <em>not</em> claimed, and not true. See above: nobody sees your
            answers unless you send them.
          </li>
          <li>
            <strong>Deleted</strong>: accurate. Deleting removes every key above from this browser,
            and because no copy was ever made anywhere else, there is nothing left to delete. A
            summary you already sent to someone is theirs to delete, not the app&apos;s.
          </li>
        </ul>

        <h2>Things worth knowing</h2>
        <ul>
          <li>
            <strong>A shared device shares the data.</strong> Anyone using the same browser profile
            can open the app and read your check-ins, your hope box and your plan. On a shared or
            family phone, delete your data when you finish, or use a private window.
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
            loads. That is hosting, not Wellbeings, and it happens before any of your answers exist.
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
            <strong>Outbound links are ordinary links.</strong> Helplines, directories, WhatsApp and
            cited papers are other people&apos;s sites with their own policies. Tapping one is a normal
            visit to them; nothing about you is passed along unless you type it there yourself.
          </li>
        </ul>

        <h2>Moving between Wellbeings and {COMPANION_NAME}</h2>
        <p>
          The two apps link to each other. That handoff passes one URL parameter naming which app you
          came from, and at most a single coarse severity band in the other direction. No answers, no
          scores, no identifiers, and nothing that could be traced back to you.
        </p>
        <p>
          One correction to what this page used to say. It claimed that neither app could read the
          other&apos;s storage. That was not accurate: both are served from the same web address
          (<code>aryanmanhas12.github.io</code>), and browsers keep local storage per address, not per
          app, so the two share one storage area on your device. What is true is that each app only
          ever reads and writes its own keys, which is something you can check in the source of
          either. Wellbeings never reads {COMPANION_NAME}&apos;s safety plan or results, and deleting
          your data here removes only the keys listed above.
        </p>

        <h2>Deleting everything</h2>
        <p>
          Open <strong>Settings</strong> (the gear at the top of every screen) and choose{" "}
          <strong>Delete all my data</strong>, then confirm. It removes every key listed on this page,
          immediately and irreversibly. The same button is also inside the daily plan, under Help
          &amp; privacy. Clearing site data for this site in your browser settings does the same
          thing, and also clears {COMPANION_NAME}&apos;s data, because of the shared address above.
        </p>

        <div className="callout">
          <p>
            Wellbeings is not a healthcare provider, so health-record protections such as HIPAA or
            the NHS confidentiality framework do not apply to it and this page does not claim they
            do. That is one of the reasons nothing is stored off your device.{" "}
            <Link href="/about/">More about what the tool is and is not</Link>.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
