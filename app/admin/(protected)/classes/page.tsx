import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { requireRole } from "@/lib/auth";
import { adminGetAllClasses } from "@/server/data/classes";
import { deleteClassAction } from "./actions";

export default async function ClassesPage() {
  const session = await requireRole("ADMIN", "TEACHER");
  const classes = await adminGetAllClasses(
    session.role === "TEACHER" ? session.userId : undefined,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">
            Classes
          </p>
          <h1 className="mt-1 font-display text-3xl text-fg">
            Class Management
          </h1>
        </div>
        <Link
          href="/admin/classes/new"
          className="btn btn-primary"
        >
          New class
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-12 text-center text-sm text-muted">
          No classes yet.
        </div>
      ) : (
        <div className="overflow-hidden card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-6 py-4 text-left text-sm font-medium text-fg">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg">
                  Teacher
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg">
                  Students
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-fg">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} className="border-b border-line last:border-0">
                  <td className="px-6 py-4 font-medium text-fg">
                    <Link href={`/admin/classes/${cls.id}`} className="hover:underline">
                      {cls.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted">{cls.teacher.name}</td>
                  <td className="px-6 py-4">
                    <code className="rounded bg-surface-3 px-2 py-0.5 text-xs font-mono text-accent-text">
                      {cls.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-muted">{cls._count.students}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/classes/${cls.id}`}
                        className="text-xs font-semibold text-accent-text hover:underline"
                      >
                        Manage
                      </Link>
                      <DeleteButton
                        action={deleteClassAction.bind(null, cls.id)}
                        label="Delete"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
