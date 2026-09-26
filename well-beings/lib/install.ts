/**
 * The one thing the install card remembers: that someone said "Not now".
 *
 * Its own key so "Delete all my data" can list it (lib/storage.ts), and so
 * the card can stay quiet for a month without touching the safe place's
 * state. It holds a date and nothing else.
 */
export const INSTALL_KEY = "arun-install-v1";

/** How long "Not now" keeps the card off the Here tab. Settings always has it. */
export const SNOOZE_DAYS = 30;
