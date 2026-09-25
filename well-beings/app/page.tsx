import type { Metadata } from "next";
import { WellbeingsApp } from "@/components/WellbeingsApp";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";

/* The home route carries the application itself. Its metadata comes from the
   same route table as every static page, so the title and description a
   crawler sees are maintained in one place with the rest of the site.

   The JSON-LD here describes the page — what Arun is and who publishes
   it. It never describes a result: results exist only as client state on this
   one URL, so there is nothing per-person for structured data to expose. */
export const metadata: Metadata = metadataFor("/");

/* Decides, before anything paints, whether this is a first visit and the
   sunrise intro should play. Lives here rather than in the root layout so
   it can only ever affect this page: the intro locks body scrolling while
   it is up, and a stale attribute on /guides/ would freeze a page that has
   no intro to dismiss. Reads the one flag it needs and nothing else. */
const INTRO_BOOTSTRAP = `(function(){try{var s=JSON.parse(localStorage.getItem("wellbeings-safe-v1")||"null");if(!s||!s.introSeen)document.documentElement.setAttribute("data-intro","pending");}catch(e){}})();`;

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_BOOTSTRAP }} />
      <JsonLd path="/" />
      <WellbeingsApp />
    </>
  );
}
