import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { metadataFor } from "@/lib/seo";
import { COMPANION_NAME } from "@/lib/site";

const PATH = "/terms/";
export const metadata: Metadata = metadataFor(PATH);

export default function TermsPage() {
  return (
    <PageShell path={PATH}>
      <JsonLd path={PATH} />
      <div className="prose">
        <h1>Terms of use</h1>
        <p className="lede">
          Short, because there is very little to agree to. Arun is free, has no account, takes
          no payment and stores nothing about you anywhere but your own browser. What follows is
          mostly about what it is not.
        </p>

        <h2>What you are agreeing to</h2>
        <p>
          By using Arun you accept these terms. If you do not, the remedy is simple: close the
          page. Nothing has been created, nothing has been sent, and there is no account to close.
        </p>

        <h2>This is not healthcare</h2>
        <p>
          Arun is a self-guidance tool. It is <strong>not a medical device</strong>, not a
          diagnosis, not a treatment, and not a substitute for advice from a doctor, a nurse, a
          pharmacist, a psychologist, a counsellor or any other qualified professional.
        </p>
        <ul>
          <li>
            Nothing it shows you is a clinical finding, and no output should be read as one. It does
            not diagnose depression, anxiety disorders, insomnia, eating disorders, ADHD,
            substance-use disorders or any medical condition.
          </li>
          <li>
            Do not use it to decide whether to start, stop or change any medication or treatment.
            That decision belongs with the person who prescribed it.
          </li>
          <li>
            Do not delay seeking professional advice because of anything you read here. If something
            is affecting your daily life, speak to someone qualified.
          </li>
          <li>
            <strong>In an emergency, contact your local emergency services.</strong> In India 112, the
            UK 999, the US and Canada 911, Australia 000, New Zealand 111. The{" "}
            <Link href="/resources/">support page</Link> lists free, confidential lines that are open
            24/7.
          </li>
        </ul>
        <p>
          Some questions in the check-in borrow wording from instruments clinicians use. That borrowing
          does not make the result clinical, and it is not administered or interpreted by a
          professional. Where evidence is cited, the study is named so you can read it yourself.
        </p>

        <h2>Accuracy, and its limits</h2>
        <p>
          The guidance here is written carefully and is based on named, published research. It is
          still general information written for a wide audience, not advice about you. It cannot
          account for your medical history, your medication, your circumstances or anything you have
          not been asked about. Research also moves, and a page written today may be out of date
          before it is revised.
        </p>
        <p>
          The service is provided <strong>as is</strong> and <strong>as available</strong>, without
          warranties of any kind. It may be offline, may contain errors, and may be withdrawn or
          changed at any time without notice.
        </p>

        <h2>Your data, and your responsibility for it</h2>
        <p>
          Everything you enter stays in your own browser. There is no server copy and no backup, which
          has a consequence worth stating plainly: <strong>if you clear your browser data, use a
          private window, or switch device, your entries are gone and cannot be recovered.</strong>{" "}
          Nobody can restore them, because nobody else ever had them. The{" "}
          <Link href="/privacy/">privacy page</Link> sets out exactly what is stored and where.
        </p>
        <p>
          On a shared device, anyone using the same browser profile can open the app and read what is
          there. Deleting your data when you finish is the only protection against that, and it is one
          tap inside the app.
        </p>

        <h2>Acceptable use</h2>
        <p>Please do not:</p>
        <ul>
          <li>
            present output from Arun as a clinical assessment, a diagnosis, or evidence of
            anyone&apos;s health status, to an employer, an institution or anyone else;
          </li>
          <li>use it to screen, assess or make decisions about another person without their knowledge;</li>
          <li>
            republish the guidance with its caveats removed. Several claims here are deliberately
            hedged because the underlying evidence is observational, and stripping the hedge changes
            what the research actually said.
          </li>
        </ul>

        <h2>Liability</h2>
        <p>
          To the extent the law allows, no liability is accepted for any loss or harm arising from use
          of, or reliance on, this tool. Nothing in these terms limits liability for death or personal
          injury caused by negligence, or for fraud, where the law does not permit that limitation.
          You may also have rights as a consumer that these terms cannot override.
        </p>

        <h2>Licence and the code</h2>
        <p>
          Arun is an open-source project. The source is public and MIT licensed, so you are free
          to read it, run it and verify for yourself that nothing leaves the page. That is the point of
          publishing it: a privacy claim you can check beats one you have to take on trust.
        </p>

        <h2>{COMPANION_NAME}</h2>
        <p>
          {COMPANION_NAME} is a separate product with its own terms. Moving between the two passes a
          single URL parameter naming which app you came from, and nothing else. Neither app can read
          the other&apos;s storage.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may change. The site is a static build with a public commit history, so any
          change is visible in that history rather than announced. Continuing to use the tool after a
          change means accepting the current version.
        </p>

        <h2>Contact</h2>
        <p>
          Arun is built by Aryan Manhas. Questions, corrections and reports of anything
          inaccurate are genuinely welcome through the project&apos;s public repository or the{" "}
          <a href="../me/">author page</a>. There is no support desk and no guaranteed response time.
        </p>
      </div>
    </PageShell>
  );
}
