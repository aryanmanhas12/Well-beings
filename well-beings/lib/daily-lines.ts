/**
 * The line of the day, and the small question that goes with it.
 *
 * HOW TO UPDATE THIS EACH WEEK
 *
 * Add a new block to the top of WEEKS with the date of that week's Monday
 * (YYYY-MM-DD, local time) and seven days, Monday first. That is the whole
 * job. A week with no block falls back to EVERGREEN, so a missed Monday never
 * shows an empty card, and old blocks can stay where they are: they only
 * match their own week.
 *
 * Every day has two parts, and they do different work:
 *   line    something true and steadying. Not a slogan. It should still be
 *           true on a bad day, which rules out "everything happens for a
 *           reason" and anything else that asks someone to feel a particular
 *           way.
 *   prompt  one gratitude question, specific enough to answer in a sentence.
 *           "What are you grateful for?" gets a blank stare; "Who made today
 *           a little easier?" gets an answer. Specific prompts are also what
 *           the gratitude-journaling trials actually used.
 *
 * House rules for the copy, same as the rest of the app: no em dashes, no
 * "journey", "embrace", "you are enough", "self-care Sunday", no exclamation
 * marks. Write it the way a friend who has had bad days too would say it.
 */

export interface DayLine {
  line: string;
  prompt: string;
}

export interface WeekOfLines {
  /** The Monday this week starts on, YYYY-MM-DD in local time. */
  monday: string;
  /** Seven days, Monday first. */
  days: [DayLine, DayLine, DayLine, DayLine, DayLine, DayLine, DayLine];
}

export const WEEKS: WeekOfLines[] = [
  {
    monday: "2026-09-28",
    days: [
      {
        line: "Every morning is a small door. You do not have to run through it. Opening it is enough.",
        prompt: "What is one thing you want to go easy on yourself about today?",
      },
      {
        line: "The things that weigh on you are real. So are the things that hold you up.",
        prompt: "What, or who, held you up this week?",
      },
      {
        line: "Laughing counts. So does the half-smile you did not mean to do.",
        prompt: "What made you smile today, even a little?",
      },
      {
        line: "You do not have to feel grateful to notice something good. Noticing is the whole thing.",
        prompt: "What is one ordinary thing you would miss if it were gone?",
      },
      {
        line: "Some days the win is getting through the day. That is still a win.",
        prompt: "What did you get through today?",
      },
      {
        line: "Kindness has a long memory. It tends to come back from somewhere you did not expect.",
        prompt: "What kind thing did you do, or see someone else do?",
      },
      {
        line: "Next week gets its own sunrise, whatever this one was like.",
        prompt: "What from this week would you like to carry into the next?",
      },
    ],
  },
  {
    monday: "2026-09-21",
    days: [
      {
        line: "The sun has come up every morning of your life. It came up today too.",
        prompt: "What is one small thing that went right today?",
      },
      {
        line: "A hard day is one day. It is not a verdict on you.",
        prompt: "Who made today a little easier, even without knowing it?",
      },
      {
        line: "Rest is not falling behind. It is how you get back up.",
        prompt: "What did your body let you do today that you are glad about?",
      },
      {
        line: "Small things are not small when you are tired. They are what gets you through.",
        prompt: "What is something you ate, heard or saw today that you liked?",
      },
      {
        line: "Somebody out there is glad you exist. Usually more than one somebody.",
        prompt: "Who would you tell first if something good happened?",
      },
      {
        line: "A day does not have to be productive to be a good one.",
        prompt: "What is one thing you are looking forward to, however small?",
      },
      {
        line: "Light comes back slowly, not all at once. Slow light is still light.",
        prompt: "What went a little better this week than last?",
      },
    ],
  },
];

/* Used for any week without its own block. Picked by day of the year, so
   two people using the app on the same day see the same line, which makes
   it something that can be shared rather than a slot machine. */
export const EVERGREEN: DayLine[] = [
  { line: "You made it to today. That took more than it looks like from outside.", prompt: "What is one thing that went right, however small?" },
  { line: "Feelings are weather. They are real, and they move.", prompt: "What was the best ten minutes of your day?" },
  { line: "You are allowed to take up space, including on the days you feel small.", prompt: "Who is someone you are glad is in your life?" },
  { line: "Most of what worries you at night is smaller in the morning.", prompt: "What is something you are quietly proud of?" },
  { line: "Trying again is a skill, and you have been practising it for years.", prompt: "What did you try today, whether or not it worked?" },
  { line: "There is no deadline on feeling better.", prompt: "What made the day softer, even for a moment?" },
  { line: "The people who love you do not need you to be finished.", prompt: "Who could you send a short thank you to?" },
  { line: "Sunlight takes eight minutes to reach you. Some good things take a while to arrive.", prompt: "What are you looking forward to this week?" },
  { line: "You have been through days you thought you would not get through. You got through them.", prompt: "What helped you last time things were hard?" },
  { line: "Being kind to yourself is not the same as giving up.", prompt: "What would you say to a friend who had your day?" },
  { line: "A cup of tea, a text back, a song you like. Small counts.", prompt: "What small thing did you enjoy today?" },
  { line: "You do not have to carry everything at once. Put one thing down.", prompt: "What is one worry you can leave until tomorrow?" },
  { line: "Some roots grow in the dark. Not every good change is visible yet.", prompt: "What is changing for the better, even slowly?" },
  { line: "Being tired does not mean you are doing it wrong.", prompt: "What gave you a bit of energy back today?" },
  { line: "Tomorrow is not a test you have to pass.", prompt: "What went better than you expected recently?" },
  { line: "A good day and a hard day can both happen in the same week.", prompt: "What surprised you in a good way?" },
  { line: "Asking for help is a strong thing to do, not a weak one.", prompt: "Who has helped you without being asked?" },
  { line: "You are more than the thing that went wrong.", prompt: "What is something you did well, even if nobody saw it?" },
  { line: "Even the longest night has a time the sky starts to lighten.", prompt: "Where did you find a little light today?" },
  { line: "Peace can be ten quiet seconds. Those still count.", prompt: "When did you feel calm today, even briefly?" },
  { line: "Home can be a person, a place or a song. Go towards one.", prompt: "Where, or with whom, do you feel most at home?" },
];

/** YYYY-MM-DD for a date in local time. */
export function localKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** The Monday of the week containing `d`, as YYYY-MM-DD in local time. */
export function mondayOf(d: Date): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - offset);
  return localKey(copy);
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function lineFor(d: Date = new Date()): DayLine {
  const week = WEEKS.find((w) => w.monday === mondayOf(d));
  if (week) return week.days[(d.getDay() + 6) % 7];
  return EVERGREEN[dayOfYear(d) % EVERGREEN.length];
}
