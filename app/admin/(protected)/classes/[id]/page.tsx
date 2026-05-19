import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { requireRole } from "@/lib/auth";
import { adminGetClass, getClassAssignments } from "@/server/data/classes";
import { prisma } from "@/server/db";
import {
  addStudentAction,
  assignTopicAction,
  deleteClassAction,
  removeAssignmentAction,
  removeStudentAction,
  updateClassAction,
} from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function ClassDetailPage({ params }: Props) {
  const session = await requireRole("ADMIN", "TEACHER");
  const { id } = await params;

  const [cls, assignments, allTopics] = await Promise.all([
    adminGetClass(id),
    getClassAssignments(id),
    prisma.qMTopic.findMany({
      select: { id: true, title: true, _count: { select: { questions: true } } },
      orderBy: { order: "asc" },
    }),
  ]);
  if (!cls) notFound();

  const enrolledIds = new Set(cls.students.map((s) => s.studentId));
  const assignedTopicIds = new Set(assignments.map((a) => a.topicId));

  const allStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  const unenrolled = allStudents.filter((s) => !enrolledIds.has(s.id));
  const unassignedTopics = allTopics.filter((t) => !assignedTopicIds.has(t.id));

  // Completion count per assigned topic
  const completionCounts =
    assignments.length > 0 && enrolledIds.size > 0
      ? await prisma.qMSession.groupBy({
          by: ["topicId"],
          where: {
            topicId: { in: assignments.map((a) => a.topicId) },
            userId: { in: [...enrolledIds] },
            completedAt: { not: null },
          },
          _count: { _all: true },
        })
      : [];
  const completionMap = new Map(completionCounts.map((c) => [c.topicId, c._count._all]));

  const teachers =
    session.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: { in: ["TEACHER", "ADMIN"] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [{ id: session.userId, name: session.name }];

  const inputClass =
    "rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white outline-none focus:border-white";

  return (
    <div className="flex flex-col gap-10">
      <Link
        href="/admin/classes"
        className="flex items-center gap-1.5 text-sm font-semibold text-[rgba(255,255,255,0.55)] hover:text-white"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Classes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Class</p>
          <h1 className="mt-1 font-serif text-3xl text-[var(--foreground)]">{cls.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <span>Teacher: {cls.teacher.name}</span>
            <span>·</span>
            <span>
              Join code:{" "}
              <code className="rounded bg-[rgba(255,255,255,0.08)] px-2 py-0.5 font-mono text-[var(--accent)]">
                {cls.code}
              </code>
            </span>
            <span>·</span>
            <span>{cls.students.length} student{cls.students.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <DeleteButton action={deleteClassAction.bind(null, cls.id)} label="Delete class" />
      </div>

      {/* Edit */}
      <details className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)]">
        <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-[var(--foreground)]">
          Edit class details
        </summary>
        <form action={updateClassAction.bind(null, cls.id)} className="flex flex-col gap-4 px-6 pb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Name</label>
            <input name="name" defaultValue={cls.name} required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Teacher</label>
            {teachers.length === 1 ? (
              <>
                <input type="hidden" name="teacherId" value={teachers[0].id} />
                <p className="text-sm text-[var(--foreground)]">{teachers[0].name}</p>
              </>
            ) : (
              <select name="teacherId" defaultValue={cls.teacherId} className={inputClass}>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
          <button type="submit" className="self-start rounded-full bg-[#0F9C00] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
            Save changes
          </button>
        </form>
      </details>

      {/* ── Assignments ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Assignments ({assignments.length})
        </h2>

        {assignments.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
            No activities assigned yet. Add one below.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--panel)]">
            {assignments.map((a, i) => {
              const completed = completionMap.get(a.topicId) ?? 0;
              const total = cls.students.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 px-6 py-4 ${i < assignments.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                >
                  <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{a.topic.title}</span>
                      <span className="text-xs text-[var(--muted)]">{a.topic._count.questions} q</span>
                    </div>
                    {a.note && <p className="text-xs text-[var(--muted)]">{a.note}</p>}
                    {a.dueAt && (
                      <p className="text-xs text-[rgba(255,255,255,0.4)]">
                        Due {new Date(a.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>

                  {/* Completion bar */}
                  <div className="flex w-28 shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs font-semibold text-[var(--muted)]">{completed}/{total} done</span>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-[#0F9C00]" : pct >= 40 ? "bg-yellow-400" : "bg-[rgba(255,255,255,0.2)]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <form action={removeAssignmentAction.bind(null, cls.id, a.id)}>
                    <button type="submit" className="shrink-0 rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:border-red-400 hover:bg-red-500/10">
                      Remove
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}

        {unassignedTopics.length > 0 && (
          <form action={assignTopicAction.bind(null, cls.id)} className="flex flex-col gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--panel)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Assign activity</p>
            <div className="flex flex-wrap gap-3">
              <select name="topicId" required className={`min-w-40 flex-1 ${inputClass}`}>
                <option value="">Select quiz topic…</option>
                {unassignedTopics.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} ({t._count.questions} q)</option>
                ))}
              </select>
              <input name="dueAt" type="date" className={`w-40 ${inputClass}`} title="Due date (optional)" />
            </div>
            <input name="note" placeholder="Note for students (optional)" className={`w-full ${inputClass}`} />
            <button type="submit" className="self-start rounded-full bg-[#0F9C00] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
              Assign
            </button>
          </form>
        )}
      </section>

      {/* ── Students ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Students ({cls.students.length})
        </h2>

        {cls.students.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
            No students enrolled. Share the join code or add manually below.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--panel)]">
            {cls.students.map((s, i) => (
              <div
                key={s.studentId}
                className={`flex items-center justify-between gap-4 px-6 py-4 ${i < cls.students.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div className="flex flex-col gap-0.5">
                  <Link href={`/profile/${s.studentId}`} className="text-sm font-semibold text-[var(--foreground)] hover:underline">
                    {s.student.name}
                  </Link>
                  <span className="text-xs text-[var(--muted)]">{s.student.email}</span>
                </div>
                <form action={removeStudentAction.bind(null, cls.id, s.studentId)}>
                  <button type="submit" className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-400 hover:border-red-400 hover:bg-red-500/10">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {unenrolled.length > 0 && (
          <form action={addStudentAction.bind(null, cls.id)} className="flex gap-3">
            <select name="studentId" required className={`flex-1 ${inputClass}`}>
              <option value="">Add student manually…</option>
              {unenrolled.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.email}</option>
              ))}
            </select>
            <button type="submit" className="rounded-full bg-[#0F9C00] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
              Add
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
