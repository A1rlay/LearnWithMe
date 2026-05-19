import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { adminGetUser } from "@/server/data/users";
import { updateUserAction } from "../../actions";
import { UserFields } from "../../_components";

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
  await requireRole("ADMIN");
  const { id } = await params;
  const user = await adminGetUser(id);
  if (!user) notFound();

  const action = updateUserAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/users"
        className="flex items-center gap-1.5 text-sm font-semibold text-[rgba(255,255,255,0.55)] transition-colors hover:text-white"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Users
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · Users
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">Edit user</h1>
      </div>

      <form
        action={action}
        className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8"
      >
        <UserFields
          defaults={{ name: user.name, email: user.email, role: user.role }}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]"
          >
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Leave blank to keep current"
            className="rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
