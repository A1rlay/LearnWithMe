import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { needsOnboarding } from "@/server/data/me";
import { getVisibleSubjects } from "@/server/data/subjects";

export default async function HomePage() {
  const [subjects, session] = await Promise.all([getVisibleSubjects(), getSession()]);
  if (session && (await needsOnboarding(session.userId))) redirect("/welcome");
  const firstName = session?.name.split(" ")[0];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
      {/* Hero */}
      <section className="flex flex-col items-start gap-6">
        <span className="chip border-accent-text/25 text-accent-text">
          <LogoMark size={14} /> Learn from people, not just content
        </span>
        <h1 className="max-w-3xl font-display text-5xl leading-[1.02] tracking-tight text-fg sm:text-7xl">
          {firstName ? (
            <>
              Welcome back, <span className="italic text-accent-text">{firstName}</span>.
              <br />
              What are we learning today?
            </>
          ) : (
            <>
              Learn <span className="italic text-accent-text">with</span> people who love
              teaching what they know.
            </>
          )}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Every subject is taught by an expert. Practise with short videos, quizzes and speaking
          drills. Each one trains a specific skill, and your skill chart shows how you grow.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#subjects" className="btn btn-primary px-6 py-3">
            Browse subjects
          </a>
          {session ? (
            <Link href="/me" className="btn btn-ghost px-6 py-3">
              See my skills
            </Link>
          ) : (
            <Link href="/signup" className="btn btn-ghost px-6 py-3">
              Join free with just a username
            </Link>
          )}
        </div>
      </section>

      {/* Subjects — the front door */}
      <section id="subjects" aria-labelledby="subjects-h" className="flex scroll-mt-24 flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Subjects</p>
            <h2 id="subjects-h" className="mt-2 font-display text-4xl text-fg">Pick something to learn</h2>
          </div>
          <p className="hidden text-sm text-subtle sm:block">
            {subjects.length} subject{subjects.length === 1 ? "" : "s"} with an expert
          </p>
        </div>

        {subjects.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-12 text-center">
            <p className="font-display text-2xl text-fg">No subjects open yet</p>
            <p className="max-w-sm text-sm text-muted">
              Subjects appear here as soon as an expert joins to teach them. Check back soon.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s, i) => {
              const activities = s.videoTopicCount + s.quizCount + s.spellingSetCount;
              return (
                <li key={s.id}>
                  <Link
                    href={`/subjects/${s.id}`}
                    className="card card-interactive group relative flex h-full flex-col gap-5 overflow-hidden p-6"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-25 blur-3xl transition-opacity group-hover:opacity-45"
                      style={{ background: i % 2 ? "var(--color-series-then)" : "var(--color-series-now)" }}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-3xl text-fg">{s.name}</h3>
                      <span className="chip font-mono">{activities} activities</span>
                    </div>
                    {s.description && <p className="text-sm leading-relaxed text-muted">{s.description}</p>}
                    {s.skills.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5" aria-label="Skills you'll train">
                        {s.skills.map((k) => (
                          <li key={k} className="chip">{k}</li>
                        ))}
                      </ul>
                    )}
                    <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-accent-text">
                      Start learning
                      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* How it works — the pedagogy, in plain words */}
      <section aria-labelledby="how-h" className="flex flex-col gap-6">
        <h2 id="how-h" className="eyebrow">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            ["Pick a subject", "Each one is taught by an expert who builds its activities."],
            ["Practise a skill", "Every activity says which skills it trains, so you know why you're doing it."],
            ["Find study buddies", "Learn alongside people studying the same things, and watch your skill chart grow."],
          ].map(([title, body], i) => (
            <li key={title} className="card flex flex-col gap-2 p-5">
              <span className="font-mono text-xs text-subtle">0{i + 1}</span>
              <p className="font-semibold text-fg">{title}</p>
              <p className="text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
