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

/* Decides, before anything paints, whether the opening sunrise plays, and
   whether it waits for a tap first. Lives here rather than in the root
   layout so it can only ever affect this page: the intro locks body
   scrolling while it is up, and a stale attribute on /guides/ would freeze
   a page that has no intro to dismiss. See lib/intro.ts for the rules:

   - once per browser session (sessionStorage "arun-intro-session"), so
     every time Arun is opened, but not on a reload;
   - never if turned off in Settings (localStorage "arun-intro-v1" = "off");
   - never on a day after a check-in in the last three days reported
     thoughts of suicide or not feeling safe: then the plan and the numbers
     come first, not an animation;
   - with music on ("arun-sound-v1" not "off"), it waits for a tap
     (data-intro-gate), because browsers will not play sound before one
     and the music is meant to rise with the sun. */
const INTRO_BOOTSTRAP = `(function(){try{
var d=document.documentElement;
if(localStorage.getItem("arun-intro-v1")==="off")return;
if(sessionStorage.getItem("arun-intro-session"))return;
var s=JSON.parse(localStorage.getItem("wellbeings-safe-v1")||"null");
var a=s&&Array.isArray(s.arrivals)?s.arrivals:[];
var cut=Date.now()-3*864e5;
for(var i=a.length-1;i>=0;i--){var x=a[i]||{};if(Date.parse(x.at)<cut)break;if(x.safety==="thoughts"||x.safety==="unsafe")return;}
d.setAttribute("data-intro","pending");
if(localStorage.getItem("arun-sound-v1")!=="off")d.setAttribute("data-intro-gate","1");
}catch(e){}})();`;

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_BOOTSTRAP }} />
      <JsonLd path="/" />
      <WellbeingsApp />
    </>
  );
}
