import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/login/actions";
import { getSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "STUDENT") redirect("/learn");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--panel)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <nav className="flex items-center gap-6 pl-36">
            <Link
              href="/admin"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]"
            >
              Admin
            </Link>
            <Link
              href="/admin/games"
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Games
            </Link>
<Link
              href="/admin/users"
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Users
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[var(--muted)] sm:block">
              {session.name}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
