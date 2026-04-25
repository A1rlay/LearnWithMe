import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/admin/login/actions";
import { getSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--panel)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <nav className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]"
            >
              Admin
            </Link>
            <Link
              href="/admin/topics"
              className="text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              WordCatch
            </Link>
            <Link
              href="/admin/question-maker"
              className="text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              QuestionMaker
            </Link>
            <Link
              href="/"
              className="text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              View site
            </Link>
          </nav>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-[rgba(255,255,255,0.25)] px-4 py-2 text-xs font-semibold text-[rgba(255,255,255,0.7)] transition-colors hover:border-white hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
