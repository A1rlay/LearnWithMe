import Link from "next/link";

import { logoutAction } from "@/app/login/actions";
import { Wordmark } from "@/components/brand/logo";
import { getSession } from "@/lib/session";

const link =
  "rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg";

export async function SiteHeader() {
  const session = await getSession();
  const isStaff = session?.role === "ADMIN" || session?.role === "TEACHER";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Learn With Me — home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          <Link href="/#subjects" className={`${link} hidden sm:inline-flex`}>
            Subjects
          </Link>
          {session && (
            <Link href={`/profile/${session.userId}`} className={link}>
              My progress
            </Link>
          )}
          {isStaff && (
            <Link href="/admin" className={link}>
              Studio
            </Link>
          )}
          {session ? (
            <form action={logoutAction}>
              <button type="submit" className={link}>
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/login" className="btn btn-primary ml-1 px-4 py-1.5">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
