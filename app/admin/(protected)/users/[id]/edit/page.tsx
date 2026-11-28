import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { adminGetUser } from "@/server/data/users";
import { updateUserAction } from "../../actions";
import { UserFields } from "../../_components";
import { SubmitButton } from "@/components/ui/submit-button";

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
        className="flex items-center gap-1.5 text-sm font-semibold text-subtle transition-colors hover:text-fg"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Users
      </Link>

      <div>
        <p className="eyebrow">
          Studio · People
        </p>
        <h1 className="mt-2 font-display text-4xl text-fg">Edit user</h1>
      </div>

      <form
        action={action}
        className="flex flex-col gap-5 card p-8"
      >
        <UserFields
          defaults={{ name: user.name, username: user.username, email: user.email, role: user.role }}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-fg"
          >
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Leave blank to keep current"
            className="field"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <SubmitButton className="btn btn-primary">Save changes</SubmitButton>
        </div>
      </form>
    </div>
  );
}
