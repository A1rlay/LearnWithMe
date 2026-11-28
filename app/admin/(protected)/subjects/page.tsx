import Link from "next/link";

import { editableSubjectIds, requireRole } from "@/lib/auth";
import { adminGetSubjects } from "@/server/data/subjects";

export const metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  const session = await requireRole("ADMIN", "TEACHER");
  const isAdmin = session.role === "ADMIN";
  const subjects = await adminGetSubjects(await editableSubjectIds(session));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{isAdmin ? "Subjects & experts" : "My subjects"}</p>
          <h1 className="mt-2 font-display text-4xl text-fg">Subjects</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            A subject appears to learners only while at least one expert is assigned to it.
          </p>
        </div>
        {isAdmin && (
          <Link href="/admin/subjects/new" className="btn btn-primary">
            New subject
          </Link>
        )}
      </div>

      {subjects.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-muted">
            {isAdmin ? "No subjects yet." : "You're not assigned to any subject yet. Ask the owner to add you."}
          </p>
          {isAdmin && (
            <Link href="/admin/subjects/new" className="btn btn-primary mt-4">
              Create the first subject
            </Link>
          )}
        </div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {subjects.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/subjects/${s.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-2"
              >
                <div>
                  <p className="font-semibold text-fg">{s.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {s._count.skills} skills · {s._count.topics + s._count.qmTopics + s._count.spellRightSets} activities
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-subtle">
                    {s.experts.length === 0
                      ? "No expert"
                      : `${s.experts.length} expert${s.experts.length === 1 ? "" : "s"}`}
                  </span>
                  {s.experts.length === 0 ? (
                    <span className="chip border-warning/30 text-warning">Hidden</span>
                  ) : (
                    <span className="chip border-success/30 text-success">Live</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
