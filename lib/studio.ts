import { editableSubjectIds, requireRole } from "@/lib/auth";
import { getEditableSubjectsWithSkills } from "@/server/data/subjects";

/** Subjects (with skills) the current Studio user may put activities in. */
export async function pickerSubjects() {
  const session = await requireRole("ADMIN", "TEACHER");
  return getEditableSubjectsWithSkills(await editableSubjectIds(session));
}
