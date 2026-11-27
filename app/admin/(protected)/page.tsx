import Link from "next/link";

import { editableSubjectIds, requireRole } from "@/lib/auth";
import { adminGetDashboardCounts } from "@/server/data/admin";
import { adminGetSubjects } from "@/server/data/subjects";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default async function StudioOverviewPage() {
  const session = await requireRole("ADMIN", "TEACHER");
  const isAdmin = session.role === "ADMIN";
  const [counts, subjects] = await Promise.all([
    adminGetDashboardCounts(),
    adminGetSubjects(await editableSubjectIds(session)),
  ]);

  const hidden = subjects.filter((s) => s.experts.length === 0);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="eyebrow">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-fg sm:text-5xl">
          Welcome back, <span className="italic text-accent-text">{session.name.split(" ")[0]}</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {isAdmin
            ? "Create subjects, invite experts, and keep an eye on what learners see."
            : "Build activities for your subjects and tag them with the skills they train."}
        </p>
      </div>

      {isAdmin && hidden.length > 0 && (
        <div role="status" className="card flex flex-wrap items-center justify-between gap-3 border-warning/30 p-5">
          <p className="text-sm text-fg">
            <span className="font-semibold text-warning">Hidden from learners:</span>{" "}
            {hidden.map((s) => s.name).join(", ")} — no expert assigned yet.
          </p>
          <Link href="/admin/subjects" className="btn btn-ghost">
            Assign experts
          </Link>
        </div>
      )}

      <section aria-labelledby="subjects-h" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="subjects-h" className="text-sm font-semibold text-fg">
            {isAdmin ? "Subjects" : "Your subjects"}
          </h2>
          {isAdmin && (
            <Link href="/admin/subjects/new" className="btn btn-primary px-4 py-2">
              New subject
            </Link>
          )}
        </div>
        {subjects.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            {isAdmin
              ? "No subjects yet. Create one, then assign an expert so learners can find it."
              : "You're not assigned to a subject yet. Ask the owner to add you as an expert."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Link key={s.id} href={`/admin/subjects/${s.id}`} className="card card-interactive flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-2xl text-fg">{s.name}</h3>
                  {s.experts.length === 0 ? (
                    <span className="chip border-warning/30 text-warning">Hidden</span>
                  ) : (
                    <span className="chip border-success/30 text-success">Live</span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  {[
                    plural(s._count.topics, "video topic"),
                    plural(s._count.qmTopics, "quiz", "quizzes"),
                    plural(s._count.spellRightSets, "spelling set"),
                    plural(s._count.skills, "skill"),
                  ].join(" · ")}
                </p>
                <p className="text-xs text-subtle">
                  {s.experts.length > 0 ? `Experts: ${s.experts.map((e) => e.user.name).join(", ")}` : "No experts"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {isAdmin && (
        <section aria-labelledby="totals-h" className="flex flex-col gap-4">
          <h2 id="totals-h" className="text-sm font-semibold text-fg">
            Platform totals
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Subjects", counts.subjectCount],
              ["Videos", counts.videoCount],
              ["Quiz questions", counts.qmQuestionCount],
              ["People", counts.userCount],
            ].map(([label, n]) => (
              <div key={label} className="card p-4">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-1 font-mono text-2xl text-fg">{n}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
