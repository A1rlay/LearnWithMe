import Link from "next/link";

import { logoutAction } from "@/app/login/actions";
import { Wordmark } from "@/components/brand/logo";
import { Avatar } from "@/components/people/avatar";
import { MobileTabbar } from "@/components/ui/mobile-tabbar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getTheme } from "@/lib/theme";
import { getSession } from "@/lib/session";
import { incomingRequestCount, unreadCount } from "@/server/data/buddies";

const link =
  "rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg";

export async function SiteHeader() {
  const session = await getSession();
  const isStaff = session?.role === "ADMIN" || session?.role === "TEACHER";
  const [unread, requests] = session
    ? await Promise.all([unreadCount(session.userId), incomingRequestCount(session.userId)])
    : [0, 0];

  return (
    <>
    {session && (
      <MobileTabbar unread={unread} requests={requests} isStaff={isStaff} username={session.username} />
    )}
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Learn With Me home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1">
          <ThemeToggle initial={await getTheme()} />
          <Link href="/#subjects" className={`${link} hidden md:inline-flex`}>Subjects</Link>
          {session ? (
            <>
              <Link
                href="/buddies"
                className={`${link} hidden sm:inline-flex`}
                aria-label={requests ? `Buddies, ${requests} new ${requests === 1 ? "request" : "requests"}` : "Buddies"}
              >
                Buddies
                {requests > 0 && <Badge n={requests} />}
              </Link>
              <Link href="/messages" className={`${link} relative hidden sm:inline-flex`} aria-label={unread ? `Messages, ${unread} unread` : "Messages"}>
                Messages
                {unread > 0 && <Badge n={unread} />}
              </Link>
              {isStaff && <Link href="/admin" className={`${link} hidden sm:inline-flex`}>Studio</Link>}
              <Link href="/me" className="ml-1 rounded-full transition-opacity hover:opacity-85" aria-label="Me">
                <Avatar name={session.name} username={session.username || session.name} size={30} />
              </Link>
              <form action={logoutAction} className="hidden sm:block">
                <button type="submit" className={link}>Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={link}>Sign in</Link>
              <Link href="/signup" className="btn btn-primary ml-1 px-4 py-1.5">Join</Link>
            </>
          )}
        </nav>
      </div>
    </header>
    </>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="animate-pop ml-1.5 rounded-full bg-accent px-1.5 text-[11px] leading-5 text-on-accent">
      {n > 9 ? "9+" : n}
    </span>
  );
}
