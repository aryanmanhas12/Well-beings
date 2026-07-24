import { HelplineRegion, Region } from "./types";

export const HELPLINES: Record<Region, HelplineRegion> = {
  us: {
    label: "United States",
    lines: [
      { name: "988 Suicide & Crisis Lifeline", contact: "Call or text 988" },
      { name: "Crisis Text Line", contact: "Text HOME to 741741" },
      { name: "Emergency", contact: "911" },
    ],
  },
  uk: {
    label: "United Kingdom",
    lines: [
      { name: "Samaritans", contact: "116 123" },
      { name: "Shout (text support)", contact: "Text SHOUT to 85258" },
      { name: "Emergency", contact: "999" },
    ],
  },
  ca: {
    label: "Canada",
    lines: [
      { name: "Suicide Crisis Helpline", contact: "Call or text 988" },
      { name: "Kids Help Phone", contact: "1-800-668-6868" },
      { name: "Emergency", contact: "911" },
    ],
  },
  au: {
    label: "Australia",
    lines: [
      { name: "Lifeline", contact: "13 11 14" },
      { name: "Kids Helpline (ages 5–25)", contact: "1800 55 1800" },
      { name: "Emergency", contact: "000" },
    ],
  },
  in: {
    label: "India",
    lines: [
      { name: "Tele-MANAS (Govt., 20+ languages)", contact: "14416" },
      { name: "KIRAN helpline", contact: "1800-599-0019" },
      { name: "Emergency", contact: "112" },
    ],
  },
  nz: {
    label: "New Zealand",
    lines: [
      { name: "Need to Talk?", contact: "Call or text 1737" },
      { name: "Youthline", contact: "0800 376 633" },
      { name: "Emergency", contact: "111" },
    ],
  },
  intl: {
    label: "International",
    lines: [
      { name: "Find a Helpline (130+ countries)", contact: "findahelpline.com" },
      { name: "Befrienders Worldwide", contact: "befrienders.org" },
      { name: "Emergency", contact: "Your local number" },
    ],
  },
};
