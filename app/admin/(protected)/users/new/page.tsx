import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { createUserAction } from "../actions";
import { UserFields } from "../_components";

export default async function NewUserPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/users"
        className="text-sm font-semibold text-[rgba(255,255,255,0.55)] transition-colors hover:text-white"
      >
        ← Users
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Admin · Users
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--foreground)]">New user</h1>
      </div>

      <form
        action={createUserAction}
        className="flex flex-col gap-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8"
      >
        <UserFields />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]"
          >
            Password <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white outline-none focus:border-white"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[#0F9C00] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Create user
          </button>
        </div>
      </form>
    </div>
  );
}
