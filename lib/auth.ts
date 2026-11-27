import { notFound, redirect } from "next/navigation";

import { getSession, type SessionData } from "@/lib/session";
import { getExpertSubjectIds, getUserRole, isSubjectExpert, isSubjectVisible, subjectIdOf } from "@/server/data/subjects";

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * The cookie proves identity only. The role is re-read from the database so a
 * demotion (or deletion) takes effect immediately, not when the 7-day cookie expires.
 */
export async function requireRole(...roles: string[]): Promise<SessionData> {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = await getUserRole(session.userId);
  if (!role || !roles.includes(role)) redirect("/login");
  return { ...session, role };
}

export class ForbiddenError extends Error {
  constructor() {
    super("You are not an expert for this subject.");
    this.name = "ForbiddenError";
  }
}

/**
 * Admins may edit any subject; teachers only subjects they are assigned to.
 * The assignment is read from the database on every call, so unassigning an
 * expert revokes access immediately (the session cookie only proves identity).
 */
export async function requireSubjectEditor(subjectId: string | null): Promise<SessionData> {
  const session = await requireRole("ADMIN", "TEACHER");
  if (!subjectId) notFound();
  if (session.role === "ADMIN") return session;
  if (!(await isSubjectExpert(subjectId, session.userId))) throw new ForbiddenError();
  return session;
}

/** Same check, starting from the record being changed. */
export async function requireEditorOf(
  target: Parameters<typeof subjectIdOf>[0],
): Promise<{ session: SessionData; subjectId: string }> {
  const subjectId = await subjectIdOf(target);
  const session = await requireSubjectEditor(subjectId);
  return { session, subjectId: subjectId! };
}

/** `undefined` = every subject (admin); otherwise the teacher's subject ids. */
export async function editableSubjectIds(session: SessionData): Promise<string[] | undefined> {
  if (session.role === "ADMIN") return undefined;
  return getExpertSubjectIds(session.userId);
}

/**
 * Learner-facing pages of a subject with no expert 404 for everyone but staff,
 * so hiding a subject hides its deep links too, not just its catalog card.
 */
export async function assertSubjectViewable(subjectId: string): Promise<void> {
  if (await isSubjectVisible(subjectId)) return;
  if (await isStaffViewer()) return;
  notFound();
}

/** For Studio pages: an expert opening another subject's record gets a 404, not an error page. */
export async function requireEditorPage(
  target: Parameters<typeof subjectIdOf>[0],
): Promise<{ session: SessionData; subjectId: string }> {
  try {
    return await requireEditorOf(target);
  } catch (e) {
    if (e instanceof ForbiddenError) notFound();
    throw e;
  }
}

/** True when the signed-in user is ADMIN or TEACHER according to the database. */
export async function isStaffViewer(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const role = await getUserRole(session.userId);
  return role === "ADMIN" || role === "TEACHER";
}
