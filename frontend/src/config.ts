/**
 * How often an open page re-fetches. Declared once so the two views cannot
 * drift apart.
 *
 * 5 seconds is a teaching choice, not a production one: the whole point of this
 * app in class is watching a queue change while you look at it, and a 15 second
 * wait reads as "nothing is happening".
 */
export const REFRESH_MS = 5_000;
