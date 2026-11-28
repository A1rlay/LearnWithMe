import { prisma } from "@/server/db";

/**
 * Sliding-window limiter stored in Postgres (works across serverless instances).
 * Returns true and records the event when under the limit; false otherwise.
 * Not strictly atomic under bursts — good enough as abuse friction at stage 0.
 */
export async function allow(key: string, limit: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const used = await prisma.rateEvent.count({ where: { key, createdAt: { gte: since } } });
  if (used >= limit) return false;
  await prisma.rateEvent.create({ data: { key } });
  // Opportunistic cleanup so the table stays small.
  if (Math.random() < 0.02) {
    await prisma.rateEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 2 * 86_400_000) } } });
  }
  return true;
}

/** Counts without recording (e.g. to check a lockout before verifying a password). */
export async function used(key: string, windowMs: number): Promise<number> {
  return prisma.rateEvent.count({ where: { key, createdAt: { gte: new Date(Date.now() - windowMs) } } });
}

export async function record(key: string): Promise<void> {
  await prisma.rateEvent.create({ data: { key } });
}
