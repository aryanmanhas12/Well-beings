import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";
import { GUIDE_PAGES } from "@/lib/site";

const PATH = "/guides/";
export const metadata: Metadata = metadataFor(PATH);

export default function GuidesPage() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <div className="prose">
        <h1>Wellbeing guides</h1>
        <p className="lede">
          Six areas that move day-to-day wellbeing more than anything else, and what the research
          actually supports in each. No lists of twenty tips. Each guide names the one or two changes
          worth making first and says how confident anyone should be about them.
        </p>

        <p>
          These are the same areas the{" "}
          <Link href="/">Wellbeings check</Link> asks about. Reading first is a perfectly good way to
          start, and so is taking the check and coming back to whichever guide it points you at.
        </p>

        <ul className="card-grid">
          {GUIDE_PAGES.map((p) => (
            <li key={p.path}>
              <Link href={p.path} className="card-link">
                <span className="card-link-title">{p.nav}</span>
                <span className="card-link-body">{p.description}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="callout">
          <p>
            None of this is medical advice, and none of it is a substitute for talking to someone
            qualified. If something has been affecting your daily life for a few weeks, that is the
            point where a GP or a counsellor changes the odds more than any habit change will. The{" "}
            <Link href="/resources/">support page</Link> lists free lines you can call today.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
