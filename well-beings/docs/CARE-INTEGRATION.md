# Care integration: how professionals can be involved without anyone being watched

Ronak is planned to connect people with mental-health professionals who can step in when someone
cannot find hope. Wellbeings is where people check in day to day. This document is the contract
between those two ideas: what Wellbeings can hand to a care team, how, and the rules any future
integration has to keep.

It exists because "monitor the person" and "a safe place" pull in opposite directions, and the
only way they sit together is if the person is the one holding the switch.

## The rules

1. **Nothing leaves the device except by the person's own action.** No background sync, no
   scheduled upload, no automatic alert on any answer. The app has no server, so today this is
   true by construction. A future integration must keep it true by design.
2. **The person sees exactly what is sent, every time, before it goes.** The summary is shown in
   full, in plain words, with room to add a note.
3. **Consent is specific and removable.** It is recorded as a date against one named contact on
   this device (`care.agreedAt` in `wellbeings-safe-v1`). Removing the contact removes the offer
   to send. A broader consent (for example, a clinic receiving summaries directly) must be asked
   for separately, on the Reach out screen, and described on the privacy page before it ships.
4. **The app never implies someone is watching.** The crisis screen says nobody has been alerted.
   If an integration ever does alert someone, that sentence must change in the same release, and
   the person must have agreed to exactly that in advance.
5. **Self-report, never diagnosis.** A summary is what the person said. It is labelled as such,
   and it must never be relabelled as an assessment, a score of risk, or a clinical finding.

## What exists today

The Reach out screen has a single care-team contact: a name, a role (therapist or counsellor,
doctor or psychiatrist, someone I trust), and optionally a phone number and email. From it the
person can:

- send a plain-text summary through the phone's share sheet, a text message, an email, or a copy;
- save the same summary as a JSON file (`wellbeings-care-summary.json`).

After a run of heavy days, the home screen offers to help them send it. The offer can be switched
off. It is an offer, not a send.

## The summary

Built by `buildCareSummary()` in `lib/care.ts` and tested in `scripts/test-care.mjs`. The window
is the last 14 days.

```jsonc
{
  "schema": "wellbeings.care-summary/1",
  "generatedAt": "2026-09-25T21:00:00.000Z",
  "windowDays": 14,
  "checkins": 6,
  "mood": { "mean": 2.2, "lowest": 1, "scale": "1-5, 1 = really heavy" },
  "hope": { "mean": 1.8, "lowest": 1, "trend": "lower", "scale": "1-5, 1 = can't see a way forward" },
  "thoughtsReported": 2,       // check-ins where thoughts of suicide were reported
  "unsafeReported": 0,         // of those, how many said "I don't feel safe"
  "lastThoughtsAt": "2026-09-24T22:10:00.000Z",
  "safetyPlan": { "written": true, "updatedAt": "2026-09-20T18:00:00.000Z" },
  "daily": [                   // one per calendar day, oldest first, the LOWEST point of each day
    { "date": "2026-09-12", "mood": null, "hope": null, "thoughts": false, "unsafe": false }
  ],
  "note": "Exams start next week and I'm not sleeping."
}
```

Field notes:

- `mood` and `hope` are the app's own single items, not validated instruments. Their words are
  "Really heavy / Low / Getting through / Okay / Good" and "I can't see a way forward / Hard to
  picture / Not sure / Some light / Hopeful".
- The suicide question is only asked when mood or hope is 2 or lower. A day without a report is
  not a day with a "no".
- `trend` compares this week's mean hope with last week's and reports `lower` or `higher` only on
  a difference of a whole point with at least two check-ins in each week; otherwise `similar` or
  `unknown`.
- `daily` takes the lowest point of each day on purpose. A day with one terrible hour was not a
  fine day.
- The contents of the hope box, the good things, the note for later, photos and the text of the
  safety plan are **never** included. They are the person's, and a summary does not need them.

`schema` is versioned. A breaking change becomes `/2`, and a consumer must reject versions it
does not know.

## What a Ronak professional integration would need to add

In order, and none of it before the one above it:

1. A consent screen in Wellbeings naming the clinic or professional, what they receive, how often,
   what they do with it and what they do not (for example: "this is not monitored overnight").
2. The same wording on `/privacy/` and `/terms/`, shipped in the same release.
3. A transport the person triggers. The simplest honest version is still the share sheet, with the
   JSON attached. Any server-side receiver belongs to Ronak or the clinic, never to Wellbeings, and
   carries its own privacy policy.
4. A clear way to stop: revoking consent on the Reach out screen ends any further sending, and the
   screen says what the receiving side keeps.
5. A change to the crisis screen's "nobody has been alerted" sentence only if, and exactly when,
   that stops being true for this person.

## What will not be built

- Silent or covert monitoring of any kind.
- Risk scores, "risk levels" shown to the person, or any label that sorts people.
- Sending the contents of the hope box, the safety plan, photos or free-text entries.
- Anything that makes help conditional on sharing. Helplines and the safety plan are always one
  tap away, whether or not a care team exists.
