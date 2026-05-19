import Link from "next/link";

const chevronLeft = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const homeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const base = "flex items-center gap-1.5 text-sm font-semibold text-[rgba(255,255,255,0.55)] transition-colors hover:text-white";

export function BackLink({ href, children }: { href: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className={base}>
      {chevronLeft}
      <span>{children ?? "Back"}</span>
    </Link>
  );
}

export function HomeLink() {
  return (
    <Link href="/" className={base}>
      {homeIcon}
      <span>Home</span>
    </Link>
  );
}
