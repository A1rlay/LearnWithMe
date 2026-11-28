import type { ActivityType } from "@prisma/client";

import { editableSubjectIds, requireRole } from "@/lib/auth";
import { prisma } from "@/server/db";
import { getEditableSubjectsWithSkills } from "@/server/data/subjects";

/**
 * Subjects (with skills) the current Studio user may put this kind of activity in.
 * `currentSubjectId` keeps an existing activity's subject listed even if the kind
 * was turned off there later.
 */
export async function pickerSubjects(type: ActivityType, currentSubjectId?: string) {
  const session = await requireRole("ADMIN", "TEACHER");
  return getEditableSubjectsWithSkills(await editableSubjectIds(session), type, currentSubjectId);
}

/**
 * Narrows a Studio list to one subject when `?subject=` names one the user may edit.
 * `ids` is what to pass to the list query (undefined = every subject, owner only).
 */
export async function studioScope(subjectParam: string | undefined) {
  const session = await requireRole("ADMIN", "TEACHER");
  const editable = await editableSubjectIds(session);
  const allowed = subjectParam && (!editable || editable.includes(subjectParam));
  if (!allowed) return { ids: editable, subject: null, q: "" };
  const subject = await prisma.subject.findUnique({ where: { id: subjectParam }, select: { id: true, name: true } });
  if (!subject) return { ids: editable, subject: null, q: "" };
  return { ids: [subject.id], subject, q: `?subject=${subject.id}` };
}
