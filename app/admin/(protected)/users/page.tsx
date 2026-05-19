import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { requireRole } from "@/lib/auth";
import { adminGetAllUsers } from "@/server/data/users";
import { deleteUserAction } from "./actions";

export default async function UsersPage() {
  const session = await requireRole("ADMIN", "TEACHER");
  const isAdmin = session.role === "ADMIN";
  const users = await adminGetAllUsers();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Users
          </p>
          <h1 className="mt-1 font-serif text-3xl text-[var(--foreground)]">
            User Management
          </h1>
        </div>
        {isAdmin && (
          <Link
            href="/admin/users/new"
            className="rounded-full bg-[#0F9C00] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            New user
          </Link>
        )}
      </div>

      {users.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No users yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Role
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-6 py-4 font-medium text-[var(--foreground)]">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        user.role === "ADMIN"
                          ? "bg-purple-500/20 text-purple-300"
                          : user.role === "TEACHER"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/profile/${user.id}`}
                        className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
                      >
                        Profile
                      </Link>
                      {isAdmin && (
                        <>
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="text-xs font-semibold text-[var(--accent)] hover:underline"
                          >
                            Edit
                          </Link>
                          <DeleteButton
                            action={deleteUserAction.bind(null, user.id)}
                            label="Delete"
                          />
                        </>
                      )}
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
