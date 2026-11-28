import Link from "next/link";

import { DeleteButton } from "@/components/admin/delete-button";
import { requireRole } from "@/lib/auth";
import { ROLE_BADGE, ROLE_LABEL } from "@/lib/roles";
import { adminGetAllUsers } from "@/server/data/users";
import { deleteUserAction } from "./actions";

export default async function UsersPage() {
  const session = await requireRole("ADMIN");
  const isAdmin = session.role === "ADMIN";
  const users = await adminGetAllUsers();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">
            Users
          </p>
          <h1 className="mt-1 font-display text-3xl text-fg">
            User Management
          </h1>
        </div>
        {isAdmin && (
          <Link
            href="/admin/users/new"
            className="btn btn-primary"
          >
            New user
          </Link>
        )}
      </div>

      {users.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-12 text-center text-sm text-muted">
          No users yet.
        </div>
      ) : (
        <div className="overflow-hidden card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-6 py-4 text-left text-sm font-medium text-fg">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-fg">
                  Role
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-fg">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-line last:border-0"
                >
                  <td className="px-6 py-4 font-medium text-fg">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-muted">@{user.username}{user.email ? <span className="block text-xs text-subtle">{user.email}</span> : null}</td>
                  <td className="px-6 py-4">
                    <span className={`chip ${ROLE_BADGE[user.role]}`}>{ROLE_LABEL[user.role]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/profile/${user.id}`}
                        className="text-xs font-semibold text-muted hover:text-fg hover:underline"
                      >
                        Profile
                      </Link>
                      {isAdmin && (
                        <>
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="text-xs font-semibold text-accent-text hover:underline"
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
