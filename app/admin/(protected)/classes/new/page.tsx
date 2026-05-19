import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/server/db";
import { createClassAction } from "../actions";

export default async function NewClassPage() {
  const session = await requireRole("ADMIN", "TEACHER");

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

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          New class
        </p>
        <h1 className="mt-1 font-serif text-3xl text-[var(--foreground)]">Create class</h1>
      </div>

      <form action={createClassAction} className="flex flex-col gap-6 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8 max-w-lg">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Class name <span className="text-[var(--accent)]">*</span>
          </label>
          <input name="name" required className={inputClass} placeholder="e.g. English B1 — Morning" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Teacher <span className="text-[var(--accent)]">*</span>
          </label>
          {teachers.length === 1 ? (
            <>
              <input type="hidden" name="teacherId" value={teachers[0].id} />
              <p className="text-sm text-[var(--foreground)]">{teachers[0].name}</p>
            </>
          ) : (
            <select name="teacherId" required className={inputClass}>
              <option value="">Select teacher…</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <button
          type="submit"
          className="rounded-full bg-[#0F9C00] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Create class
        </button>
      </form>
    </div>
  );
}
