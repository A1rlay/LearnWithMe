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
        className="flex items-center gap-1.5 text-sm font-semibold text-fg/55 transition-colors hover:text-fg"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Users
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
          Studio · People
        </p>
        <h1 className="mt-2 font-serif text-4xl text-fg">New user</h1>
      </div>

      <form
        action={createUserAction}
        className="flex flex-col gap-5 rounded-[28px] border border-line bg-surface p-8"
      >
        <UserFields />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-[0.22em] text-muted"
          >
            Password <span className="text-accent-text">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent-text"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-fg transition-opacity hover:opacity-90"
          >
            Create user
          </button>
        </div>
      </form>
    </div>
  );
}
