"use client";

import Link from "next/link";

export function HomeLogo() {
  return (
    <Link
      href="/"
      className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(0,13,113,0.7)] px-3 py-2 backdrop-blur-sm transition-colors hover:border-[rgba(255,255,255,0.4)] hover:bg-[rgba(0,13,113,0.9)]"
      aria-label="Home"
    >
      <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#0F9C00]">IP</span>
      <span className="hidden text-xs font-bold text-white sm:block">Ingles Practico</span>
    </Link>
  );
}
