import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { HelplineList } from "@/components/HelplineList";
import { metadataFor } from "@/lib/seo";
import { GLOBAL_LINKS, HELPLINES } from "@/lib/helplines";
import { Region } from "@/lib/types";
import { COMPANION_NAME } from "@/lib/site";

const PATH = "/resources/";
export const metadata: Metadata = metadataFor(PATH);

/* India first: it is the app's default region and its largest audience, and
   the first block on a page is the one people scan. The rest follow in the
   order the in-app region picker uses, so the two surfaces agree. */
const ORDER: Region[] = ["in", "uk", "us", "ca", "au", "nz", "intl"];

export default function ResourcesPage() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <div className="prose">
        <h1>Support lines and directories</h1>
        <p className="lede">
          Free, confidential and open to anyone. You do not have to be in crisis to call one, and you
          do not need a score from any tool to qualify. Not knowing what to say is a normal reason to
          ring.
        </p>

        <div className="callout">
          <p>
            <strong>If you are in immediate danger, call your local emergency number.</strong> In
            India that is 112, in the UK 999, in the US and Canada 911, in Australia 000 and in New
            Zealand 111.
          </p>
        </div>

        <p>
          These are listed here as static information, so the page works with no connection and
          nothing you do on it is recorded. Arun does not know which region you are reading,
          does not log which number you tap, and has no analytics of any kind. See the{" "}
          <Link href="/privacy/">privacy page</Link>.
        </p>

        {ORDER.map((r) => {
          const region = HELPLINES[r];
          return (
            <section key={r}>
              <h2>{region.label}</h2>
              <HelplineList lines={region.lines} />
              {region.links.length > 0 && (
                <ul>
                  {region.links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer">
                        {l.name}
                      </a>{" "}
                      : {l.note}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <h2>Worldwide directories</h2>
        <p>
          If your country is not listed above, these directories cover far more of the world than any
          single page can.
        </p>
        <ul>
          {GLOBAL_LINKS.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.name}
              </a>{" "}
              : {l.note}
            </li>
          ))}
        </ul>

        <h2>When a professional is the right call</h2>
        <p>
          Arun is built for patterns in ordinary life: sleep, movement, food, stress,
          connection, routine. There is a point where that stops being the useful lens, and it is
          worth naming rather than leaving you to guess:
        </p>
        <ul>
          <li>
            Something has been affecting your daily life for more than about two weeks and is not
            shifting.
          </li>
          <li>
            You are avoiding things you used to manage, such as lectures, work, people or leaving
            the house.
          </li>
          <li>
            Sleep stays broken even with a steady schedule, or you are exhausted no matter how long
            you are in bed.
          </li>
          <li>Drinking or anything else has become the way you get through the evening.</li>
          <li>You are having thoughts of hurting yourself.</li>
        </ul>
        <p>
          A GP, a counsellor, or a school or university wellbeing service will do more with any of
          those than a habit tracker will. If you want a more specific mental-health screening before
          that conversation, {COMPANION_NAME} is the companion tool built for it. It covers depression,
          anxiety and wellbeing instruments properly, in six languages, and it is a separate app that
          shares no data with this one.
        </p>
      </div>
    </PageShell>
  );
}
