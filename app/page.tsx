import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.55)]">
        Ingles Practico
      </p>
      <h1 className="mt-3 text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
        WordCatch
      </h1>
      <p className="mt-4 text-base font-medium text-[rgba(255,255,255,0.6)]">
        Watch. Listen. Answer. Learn.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/learn"
          className="rounded-full bg-[#0F9C00] px-10 py-4 text-base font-bold text-white transition-opacity hover:opacity-90"
        >
          Start Learning
        </Link>
        <Link
          href="/admin"
          className="rounded-full border border-[rgba(255,255,255,0.3)] px-10 py-4 text-base font-bold text-white transition-colors hover:bg-[rgba(255,255,255,0.1)]"
        >
          Admin
        </Link>
      </div>
    </main>
  );
}
