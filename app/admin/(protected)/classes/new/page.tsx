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
    "rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent-text";

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/classes"
        className="flex items-center gap-1.5 text-sm font-semibold text-fg/55 hover:text-fg"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Classes
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
          New class
        </p>
        <h1 className="mt-1 font-serif text-3xl text-fg">Create class</h1>
      </div>

      <form action={createClassAction} className="flex flex-col gap-6 rounded-[28px] border border-line bg-surface p-8 max-w-lg">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Class name <span className="text-accent-text">*</span>
          </label>
          <input name="name" required className={inputClass} placeholder="e.g. English B1 Morning" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Teacher <span className="text-accent-text">*</span>
          </label>
          {teachers.length === 1 ? (
            <>
              <input type="hidden" name="teacherId" value={teachers[0].id} />
              <p className="text-sm text-fg">{teachers[0].name}</p>
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
          className="rounded-full bg-accent py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90"
        >
          Create class
        </button>
      </form>
    </div>
  );
}
