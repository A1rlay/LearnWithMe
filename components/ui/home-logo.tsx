"use client";

import Image from "next/image";
import Link from "next/link";

import icon from "@/app/icon.png";

export function HomeLogo() {
  return (
    <Link
      href="/"
      className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(0,13,113,0.7)] px-2 py-1.5 backdrop-blur-sm transition-colors hover:border-[rgba(255,255,255,0.4)] hover:bg-[rgba(0,13,113,0.9)]"
      aria-label="Home"
    >
      <Image src={icon} width={28} height={28} alt="" className="rounded-full" />
      <span className="hidden text-xs font-bold text-white sm:block">Ingles Practico</span>
    </Link>
  );
}
