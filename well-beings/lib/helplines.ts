import { DirectoryLink, HelplineRegion, Region } from "./types";

/**
 * Real numbers, real links — every entry here was checked against the
 * operator's own site (or a government listing) rather than remembered.
 *
 * Two rules this file exists to enforce:
 *
 *  1. A number someone can *press* beats a number they have to copy. Every
 *     entry carries `tel`/`sms` where one exists, so a phone dials straight
 *     from the crisis card. On desktop those hrefs are harmless.
 *  2. Never imply 24/7 when it isn't. Lines that keep hours carry `hours`,
 *     and the UI prints it next to the number — someone ringing CALM at 2pm
 *     and getting nothing is worse than never having seen CALM at all.
 *
 * `primary` marks the two or three lines that belong on a crisis surface,
 * where a long list is a failure mode. Everything else surfaces in Help,
 * where browsing is the point.
 */

/** Directories that work from anywhere — appended to every region. */
export const GLOBAL_LINKS: DirectoryLink[] = [
  {
    name: "Find a Helpline",
    url: "https://findahelpline.com",
    note: "Verified lines in 130+ countries, filtered by what you're going through.",
  },
  {
    name: "Befrienders Worldwide",
    url: "https://www.befrienders.org",
    note: "Emotional-support centres across ~30 countries, run by trained volunteers.",
  },
  {
    name: "IASP crisis centres",
    url: "https://www.iasp.info/crisis-centres-helplines/",
    note: "The International Association for Suicide Prevention's directory, by country.",
  },
  {
    name: "WHO — mental health",
    url: "https://www.who.int/health-topics/mental-health",
    note: "Plain-language explainers on conditions, treatment and where care comes from.",
  },
];

export const HELPLINES: Record<Region, HelplineRegion> = {
  us: {
    label: "United States",
    lines: [
      {
        name: "988 Suicide & Crisis Lifeline",
        contact: "Call or text 988",
        tel: "988",
        sms: "988",
        url: "https://988lifeline.org",
        primary: true,
      },
      {
        name: "Crisis Text Line",
        contact: "Text HOME to 741741",
        sms: "741741",
        smsBody: "HOME",
        url: "https://www.crisistextline.org",
        primary: true,
      },
      {
        name: "Trevor Project",
        contact: "1-866-488-7386",
        tel: "+18664887386",
        url: "https://www.thetrevorproject.org/get-help/",
        who: "LGBTQ+ young people · or text START to 678678",
      },
      {
        name: "Veterans Crisis Line",
        contact: "988, then press 1",
        tel: "988",
        url: "https://www.veteranscrisisline.net",
        who: "Veterans, service members and their families",
      },
      {
        name: "SAMHSA National Helpline",
        contact: "1-800-662-4357",
        tel: "+18006624357",
        url: "https://www.samhsa.gov/find-help/helplines/national-helpline",
        who: "Free treatment referrals — mental health and substance use",
      },
      { name: "Emergency", contact: "911", tel: "911", primary: true },
    ],
    links: [
      {
        name: "NAMI HelpLine",
        url: "https://www.nami.org/help",
        note: "Information, referrals and peer support — Mon–Fri, 10am–10pm ET.",
      },
    ],
  },

  uk: {
    label: "United Kingdom",
    lines: [
      {
        name: "Samaritans",
        contact: "116 123",
        tel: "116123",
        url: "https://www.samaritans.org",
        primary: true,
      },
      {
        name: "Shout",
        contact: "Text SHOUT to 85258",
        sms: "85258",
        smsBody: "SHOUT",
        url: "https://giveusashout.org",
        primary: true,
      },
      {
        name: "NHS 111",
        contact: "111 — option 2 for mental health",
        tel: "111",
        url: "https://111.nhs.uk",
        who: "Urgent NHS mental-health advice and local crisis teams",
      },
      {
        name: "Papyrus HOPELINE247",
        contact: "0800 068 4141",
        tel: "+448000684141",
        url: "https://www.papyrus-uk.org/papyrus-hopeline247/",
        who: "Under 35, or worried about someone who is · or text 88247",
      },
      {
        name: "CALM",
        contact: "0800 58 58 58",
        tel: "+448005858858",
        url: "https://www.thecalmzone.net",
        hours: "5pm–midnight, every day",
      },
      {
        name: "Mind Infoline",
        contact: "0300 102 1234",
        tel: "+443001021234",
        url: "https://www.mind.org.uk/information-support/helplines/",
        hours: "Mon–Fri, 9am–6pm",
        who: "Information rather than crisis support",
      },
      { name: "Emergency", contact: "999", tel: "999", primary: true },
    ],
    links: [
      {
        name: "NHS — find an NHS talking therapies service",
        url: "https://www.nhs.uk/service-search/mental-health/find-an-NHS-talking-therapies-service",
        note: "Self-refer for CBT and counselling in England without going through a GP.",
      },
      {
        name: "Student Space",
        url: "https://studentspace.org.uk",
        note: "Support built for university students, including what each uni offers.",
      },
    ],
  },

  ca: {
    label: "Canada",
    lines: [
      {
        name: "9-8-8 Suicide Crisis Helpline",
        contact: "Call or text 988",
        tel: "988",
        sms: "988",
        url: "https://988.ca",
        primary: true,
      },
      {
        name: "Kids Help Phone",
        contact: "1-800-668-6868",
        tel: "+18006686868",
        url: "https://kidshelpphone.ca",
        who: "Young people · or text CONNECT to 686868",
        primary: true,
      },
      {
        name: "Hope for Wellness Help Line",
        contact: "1-855-242-3310",
        tel: "+18552423310",
        url: "https://www.hopeforwellness.ca",
        who: "All Indigenous peoples across Canada · counselling in Cree, Ojibway and Inuktitut on request",
      },
      { name: "Emergency", contact: "911", tel: "911", primary: true },
    ],
    links: [
      {
        name: "Wellness Together Canada",
        url: "https://www.wellnesstogether.ca",
        note: "Free counselling, courses and self-guided programmes funded federally.",
      },
    ],
  },

  au: {
    label: "Australia",
    lines: [
      {
        name: "Lifeline",
        contact: "13 11 14",
        tel: "131114",
        url: "https://www.lifeline.org.au",
        who: "Or text 0477 13 11 14",
        primary: true,
      },
      {
        name: "Beyond Blue",
        contact: "1300 22 4636",
        tel: "1300224636",
        url: "https://www.beyondblue.org.au/get-support",
        primary: true,
      },
      {
        name: "Kids Helpline",
        contact: "1800 55 1800",
        tel: "1800551800",
        url: "https://kidshelpline.com.au",
        who: "Ages 5–25",
      },
      {
        name: "13YARN",
        contact: "13 92 76",
        tel: "139276",
        url: "https://www.13yarn.org.au",
        who: "Aboriginal and Torres Strait Islander people — yarn with a Lifeline-trained mob",
      },
      { name: "Emergency", contact: "000", tel: "000", primary: true },
    ],
    links: [
      {
        name: "Head to Health",
        url: "https://www.headtohealth.gov.au",
        note: "The federal front door to digital and in-person mental-health services.",
      },
      {
        name: "headspace",
        url: "https://headspace.org.au",
        note: "Free or low-cost support for 12–25 year olds, in person and online.",
      },
    ],
  },

  in: {
    label: "India",
    lines: [
      {
        name: "Tele-MANAS",
        contact: "14416 · 1800 891 4416",
        tel: "14416",
        url: "https://telemanas.mohfw.gov.in",
        who: "Govt. of India · English and 20 regional languages",
        primary: true,
      },
      {
        name: "KIRAN",
        contact: "1800-599-0019",
        tel: "18005990019",
        url: "https://depwd.gov.in",
        who: "Ministry of Social Justice · multilingual",
        primary: true,
      },
      {
        name: "Vandrevala Foundation",
        contact: "9999 666 555",
        tel: "+919999666555",
        url: "https://www.vandrevalafoundation.com/free-counseling",
        who: "Call or WhatsApp · 11 languages",
      },
      {
        name: "AASRA",
        contact: "+91 22 2754 6669",
        tel: "+912227546669",
        url: "https://www.aasra.info",
      },
      {
        name: "iCALL (TISS)",
        contact: "9152987821",
        tel: "+919152987821",
        url: "https://icallhelpline.org",
        hours: "Mon–Sat, 10am–8pm",
        who: "Counselling by phone, email and chat",
      },
      { name: "Emergency", contact: "112", tel: "112", primary: true },
    ],
    links: [
      {
        name: "The Live Love Laugh Foundation",
        url: "https://www.thelivelovelaughfoundation.org/find-help/helplines",
        note: "A state-by-state helpline directory, kept current.",
      },
      {
        name: "NIMHANS",
        url: "https://nimhans.ac.in",
        note: "India's national mental-health institute — services and public resources.",
      },
    ],
  },

  nz: {
    label: "New Zealand",
    lines: [
      {
        name: "Need to Talk?",
        contact: "Call or text 1737",
        tel: "1737",
        sms: "1737",
        url: "https://1737.org.nz",
        primary: true,
      },
      {
        name: "Lifeline Aotearoa",
        contact: "0800 543 354",
        tel: "0800543354",
        url: "https://www.lifeline.org.nz",
        who: "Or text HELP to 4357",
        primary: true,
      },
      {
        name: "Youthline",
        contact: "0800 376 633",
        tel: "0800376633",
        url: "https://www.youthline.co.nz",
        who: "Ages 12–24 · or text 234",
      },
      { name: "Emergency", contact: "111", tel: "111", primary: true },
    ],
    links: [
      {
        name: "Mental Health Foundation of NZ",
        url: "https://mentalhealth.org.nz/helplines",
        note: "The full national helpline list, including kaupapa Māori services.",
      },
    ],
  },

  intl: {
    label: "International",
    lines: [
      {
        name: "Find a Helpline",
        contact: "findahelpline.com",
        url: "https://findahelpline.com",
        who: "Verified lines in 130+ countries",
        primary: true,
      },
      {
        name: "Befrienders Worldwide",
        contact: "befrienders.org",
        url: "https://www.befrienders.org",
        primary: true,
      },
      {
        name: "IASP crisis centres",
        contact: "iasp.info",
        url: "https://www.iasp.info/crisis-centres-helplines/",
      },
      { name: "Emergency", contact: "Your local number", primary: true },
    ],
    links: [],
  },
};

/** The short list a crisis surface shows — never the whole directory. */
export function crisisLines(region: HelplineRegion) {
  const primary = region.lines.filter((l) => l.primary);
  return primary.length ? primary : region.lines.slice(0, 3);
}

/** The best single href for an entry: dial it, text it, or open its site. */
export function helplineHref(h: {
  tel?: string;
  sms?: string;
  smsBody?: string;
  url?: string;
}): string | undefined {
  if (h.tel) return `tel:${h.tel}`;
  // `?&body=` is the cross-platform spelling: iOS wants `&`, Android wants `?`.
  if (h.sms) return h.smsBody ? `sms:${h.sms}?&body=${encodeURIComponent(h.smsBody)}` : `sms:${h.sms}`;
  return h.url;
}
