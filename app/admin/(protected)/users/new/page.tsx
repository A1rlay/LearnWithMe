import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { createUserAction } from "../actions";
import { UserFields } from "../_components";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function NewUserPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/users"
        className="flex items-center gap-1.5 text-sm font-semibold text-subtle transition-colors hover:text-fg"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Users
      </Link>

      <div>
        <p className="eyebrow">
          Studio · People
        </p>
        <h1 className="mt-2 font-display text-4xl text-fg">New user</h1>
      </div>

      <form
        action={createUserAction}
        className="flex flex-col gap-5 card p-8"
      >
        <UserFields />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-fg"
          >
            Password <span className="text-accent-text">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="field"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <SubmitButton className="btn btn-primary">Create user</SubmitButton>
        </div>
      </form>
    </div>
  );
}
