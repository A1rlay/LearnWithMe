"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; match: (p: string) => boolean; d: string; badge?: number };

/** Bottom tab bar on phones: the top bar has no room for every section. */
export function MobileTabbar({ unread, requests, isStaff, username }: { unread: number; requests: number; isStaff: boolean; username: string }) {
  const path = usePathname();
  const tabs: Tab[] = [
    { href: "/", label: "Learn", match: (p) => p === "/" || p.startsWith("/subjects") || p.startsWith("/topics") || p.startsWith("/question-maker") || p.startsWith("/spell-right"), d: "M4 19V6a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h12" },
    { href: "/buddies", label: "Buddies", match: (p) => p.startsWith("/buddies"), d: "M17 20a5 5 0 0 0-10 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20a4 4 0 0 0-3-3.9M2 20a4 4 0 0 1 3-3.9", badge: requests },
    { href: "/messages", label: "Messages", match: (p) => p.startsWith("/messages"), d: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z", badge: unread },
    { href: `/u/${username}`, label: "Profile", match: (p) => p.startsWith("/u/") || p.startsWith("/me"), d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
    ...(isStaff ? [{ href: "/admin", label: "Studio", match: (p: string) => p.startsWith("/admin"), d: "M4 5h16v4H4zM4 13h7v6H4zM15 13h5v6h-5z" }] : []),
  ];
  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
      <ul className="flex">
        {tabs.map((t) => {
          const on = t.match(path);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${on ? "text-fg" : "text-subtle"}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-1/4 top-0 h-0.5 rounded-full bg-accent-text transition-[transform,opacity] duration-300 ${on ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}
                />
                <svg className={`transition-transform duration-200 ${on ? "-translate-y-px scale-110" : ""}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={t.d} />
                </svg>
                {t.label}
                {t.badge ? (
                  <span className="animate-pop absolute right-[calc(50%-18px)] top-1 rounded-full bg-accent px-1 text-[9px] leading-4 text-on-accent">
                    {t.badge > 9 ? "9+" : t.badge}
                    <span className="sr-only"> new</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
