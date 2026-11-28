/** Validation shared by sign-up, the Me page and Studio → People. */

export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function usernameError(u: string): string | null {
  if (!USERNAME_RE.test(u)) return "Use 3–20 characters: letters, numbers, _ or .";
  return null;
}

export function passwordError(p: string): string | null {
  if (p.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (p.length > PASSWORD_MAX) return "That password is too long.";
  return null;
}

/** Optional email: empty → null; otherwise lowercase and loosely validated. */
export function normalizeEmail(raw: string): string | null | "invalid" {
  const e = raw.trim().toLowerCase();
  if (!e) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254 ? e : "invalid";
}

/** Discord usernames: 2–32 of a-z 0-9 _ . (new-style handles). Empty → null. */
export function normalizeDiscord(raw: string): string | null | "invalid" {
  const d = raw.trim().replace(/^@/, "").toLowerCase();
  if (!d) return null;
  return /^[a-z0-9_.]{2,32}$/.test(d) ? d : "invalid";
}

/** Comma-separated tags → up to 10 unique lowercase tags of ≤ 24 chars. */
export function parseInterests(raw: string): string[] {
  const out: string[] = [];
  for (const t of raw.split(",")) {
    const tag = t.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 24);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length === 10) break;
  }
  return out;
}

/** Activities per week, 1..14 (DB CHECK matches). Falls back to 3. */
export function parseWeeklyGoal(raw: FormDataEntryValue | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 14 ? n : 3;
}

/** IANA timezone from the browser, or UTC if missing/unknown (it goes into SQL AT TIME ZONE). */
export function normalizeTimezone(raw: FormDataEntryValue | null): string {
  const tz = raw?.toString() ?? "";
  if (tz === "UTC") return tz;
  try {
    return Intl.supportedValuesOf("timeZone").includes(tz) ? tz : "UTC";
  } catch {
    return "UTC";
  }
}

export const VISIBILITIES = ["MEMBERS", "BUDDIES", "ONLY_ME"] as const;
export function parseVisibility(raw: FormDataEntryValue | null): (typeof VISIBILITIES)[number] {
  const v = raw?.toString();
  return (VISIBILITIES as readonly string[]).includes(v ?? "") ? (v as (typeof VISIBILITIES)[number]) : "MEMBERS";
}
