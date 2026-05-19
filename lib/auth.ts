import { redirect } from "next/navigation";

import { getSession, type SessionData } from "@/lib/session";

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(...roles: string[]): Promise<SessionData> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.role)) redirect("/login");
  return session;
}
