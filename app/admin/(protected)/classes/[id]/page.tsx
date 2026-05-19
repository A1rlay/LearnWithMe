import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { requireRole } from "@/lib/auth";
import { adminGetClass } from "@/server/data/classes";
import { prisma } from "@/server/db";
import { addStudentAction, deleteClassAction, removeStudentAction, updateClassAction } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function ClassDetailPage({ params }: Props) {
  const session = await requireRole("ADMIN", "TEACHER");
  const { id } = await params;
  const cls = await adminGetClass(id);
  if (!cls) notFound();

  const enrolledIds = new Set(cls.students.map((s) => s.studentId));
  const allStudents = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  const unenrolled = allStudents.filter((s) => !enrolledIds.has(s.id));

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
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/classes"
        className="flex items-center gap-1.5 text-sm font-semibold text-[rgba(255,255,255,0.55)] hover:text-white"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Classes
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Class
          </p>
          <h1 className="mt-1 font-serif text-3xl text-[var(--foreground)]">{cls.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Teacher: {cls.teacher.name} · Code:{" "}
            <code className="rounded bg-[rgba(255,255,255,0.08)] px-2 py-0.5 font-mono text-[var(--accent)]">
              {cls.code}
            </code>
          </p>
        </div>
        <DeleteButton action={deleteClassAction.bind(null, cls.id)} label="Delete class" />
      </div>

      {/* Edit class */}
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
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-[#0F9C00] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Save changes
          </button>
        </form>
      </details>

      {/* Enrolled students */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Students ({cls.students.length})
        </h2>
        {cls.students.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
            No students enrolled yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--panel)]">
            {cls.students.map((s, i) => (
              <div
                key={s.studentId}
                className={`flex items-center justify-between gap-4 px-6 py-4 ${i < cls.students.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/profile/${s.studentId}`}
                    className="text-sm font-semibold text-[var(--foreground)] hover:underline"
                  >
                    {s.student.name}
                  </Link>
                  <span className="text-xs text-[var(--muted)]">{s.student.email}</span>
                </div>
                <form action={removeStudentAction.bind(null, cls.id, s.studentId)}>
                  <button
                    type="submit"
                    className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:border-red-400 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add student */}
      {unenrolled.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Add student
          </h2>
          <form action={addStudentAction.bind(null, cls.id)} className="flex gap-3">
            <select name="studentId" required className={`flex-1 ${inputClass}`}>
              <option value="">Select student…</option>
              {unenrolled.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.email}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-[#0F9C00] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
