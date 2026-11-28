import { headers } from "next/headers";

/**
 * Client IP for rate-limit keys. Prefers headers set by the hosting platform
 * (Vercel's x-vercel-forwarded-for / x-real-ip, which clients can't override);
 * falls back to the LAST x-forwarded-for hop (appended by the nearest proxy),
 * never the first, which the client controls.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const platform = h.get("x-vercel-forwarded-for") ?? h.get("x-real-ip");
  if (platform) return platform.split(",")[0].trim();
  const hops = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return hops.at(-1) ?? "unknown";
}
