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
