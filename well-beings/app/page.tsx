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

export default function Home() {
  return (
    <>
      <JsonLd path="/" />
      <WellbeingsApp />
    </>
  );
}
