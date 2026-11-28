import Link from "next/link";
import { notFound } from "next/navigation";

import { SkillRadar } from "@/components/progress/skill-radar";
import { BackLink } from "@/components/ui/nav-link";
import { isStaffViewer } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getSkillProgress } from "@/server/data/skill-progress";
import { getSubjectForLearner } from "@/server/data/subjects";

type Props = { params: Promise<{ subjectId: string }>; searchParams: Promise<{ level?: string }> };

export async function generateMetadata({ params }: Props) {
  const { subjectId } = await params;
  const s = await getSubjectForLearner(subjectId, true);
  return { title: s?.name ?? "Subject" };
}

export default async function SubjectPage({ params, searchParams }: Props) {
  const { subjectId } = await params;
  const { level: levelParam } = await searchParams;
  const session = await getSession();
  const isStaff = await isStaffViewer();
  const subject = await getSubjectForLearner(subjectId, isStaff);
  if (!subject) notFound();

  const progress = session
    ? (await getSkillProgress(session.userId)).find((p) => p.subjectId === subject.id)
    : undefined;

  const groups = [
    {
      key: "videos",
      type: "VIDEO",
      title: "Video lessons",
      blurb: "Watch, and answer a question at each checkpoint.",
      items: subject.topics.map((t) => ({
        id: t.id,
        href: `/topics/${t.id}`,
        title: t.title,
        level: t.level,
        meta: [t.level, `${t._count.videos} video${t._count.videos === 1 ? "" : "s"}`].filter(Boolean).join(" · "),
        skills: t.skills.map((k) => k.skill.name),
      })),
    },
    {
      key: "quizzes",
      type: "QUIZ",
      title: "Quizzes",
      blurb: "Multiple choice, matching, sorting and open answers.",
      items: subject.qmTopics.map((t) => ({
        id: t.id,
        href: `/question-maker/${t.id}`,
        title: t.title,
        level: t.level,
        meta: [t.level, `${t._count.questions} question${t._count.questions === 1 ? "" : "s"}`].filter(Boolean).join(" · "),
        skills: t.skills.map((k) => k.skill.name),
      })),
    },
    {
      key: "spelling",
      type: "SPELLING",
      title: "Sounds & spelling",
      blurb: "Listen and pick the ending sound, or say the word out loud.",
      items: subject.spellRightSets.map((s) => ({
        id: s.id,
        href: `/spell-right/${s.id}/play`,
        title: s.title,
        level: s.level,
        meta: [s.level, s.mode === "TERMINATION" ? "Listening" : "Speaking", `${s._count.words} word${s._count.words === 1 ? "" : "s"}`].filter(Boolean).join(" · "),
        skills: s.skills.map((k) => k.skill.name),
      })),
    },
  ].filter((g) => g.items.length > 0 && subject.activityTypes.includes(g.type as (typeof subject.activityTypes)[number]));

  // Level filter: levels are free text set by experts, so "A1 - A2" and "a1-a2" are the same level.
  const norm = (l: string | null) => (l ?? "").toLowerCase().replace(/\s+/g, "");
  const levels = [...new Map(groups.flatMap((g) => g.items).filter((i) => i.level?.trim()).map((i) => [norm(i.level), i.level!.trim()])).values()].sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true }),
  );
  const level = levels.find((l) => norm(l) === norm(levelParam ?? null)) ?? null;
  const shown = level
    ? groups.map((g) => ({ ...g, items: g.items.filter((i) => norm(i.level) === norm(level)) })).filter((g) => g.items.length > 0)
    : groups;

  const skillsCard = (
    <aside aria-labelledby="my-skills-h" className="card p-5 lg:sticky lg:top-20">
      <h2 id="my-skills-h" className="mb-3 text-sm font-semibold text-fg">Your skills in {subject.name}</h2>
      {!session ? (
        <div className="flex flex-col items-start gap-3 text-sm text-muted">
          <p>Create a free account and your answers will build a skill chart you can watch grow.</p>
          <Link href="/signup" className="btn btn-ghost px-4 py-2">Join with just a username</Link>
        </div>
      ) : progress && subject.skills.length > 0 ? (
        <SkillRadar
          title={subject.name}
          skills={progress.skills.map((s) => ({ name: s.name, pct: s.pct, pctThen: s.pctThen, total: s.total }))}
        />
      ) : (
        <p className="text-sm text-muted">No answers yet. Finish any activity and your chart will appear here.</p>
      )}
    </aside>
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-24 pt-10 sm:px-6">
      <BackLink href="/#subjects">All subjects</BackLink>

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-12">
          <header className="flex flex-col gap-4">
            <p className="eyebrow">Subject</p>
            <h1 className="font-display text-6xl leading-none tracking-tight text-fg sm:text-7xl">{subject.name}</h1>
            {subject.description && <p className="max-w-xl text-lg text-muted">{subject.description}</p>}
            {subject.skills.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-subtle">Skills you&apos;ll train</p>
                <ul className="flex flex-wrap gap-1.5">
                  {subject.skills.map((k) => (
                    <li key={k.id} className="chip">{k.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </header>

          {levels.length > 1 && (
            <nav aria-label="Filter by level" className="-mb-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs text-subtle">Level</span>
              <Link href={`/subjects/${subject.id}`} aria-current={!level ? "page" : undefined} className={`chip ${!level ? "border-accent-text/60 bg-accent/25 text-fg" : "hover:text-fg"}`}>
                All
              </Link>
              {levels.map((l) => (
                <Link
                  key={l}
                  href={`/subjects/${subject.id}?level=${encodeURIComponent(l)}`}
                  aria-current={level === l ? "page" : undefined}
                  className={`chip ${level === l ? "border-accent-text/60 bg-accent/25 text-fg" : "hover:text-fg"}`}
                >
                  {l}
                </Link>
              ))}
            </nav>
          )}

          {groups.length === 0 ? (
            <div className="card p-10 text-center text-sm text-muted">
              The expert is still preparing activities for this subject.
            </div>
          ) : (
            shown.map((g) => (
              <section key={g.key} aria-labelledby={`${g.key}-h`} className="flex flex-col gap-4">
                <div>
                  <h2 id={`${g.key}-h`} className="font-display text-3xl text-fg">{g.title}</h2>
                  <p className="mt-1 text-sm text-muted">{g.blurb}</p>
                </div>
                <ul className="stagger grid gap-3 sm:grid-cols-2">
                  {g.items.map((it) => (
                    <li key={it.id}>
                      <Link href={it.href} className="card card-interactive group flex h-full flex-col gap-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-fg">{it.title}</h3>
                          <span aria-hidden="true" className="text-subtle transition-colors group-hover:text-accent-text">→</span>
                        </div>
                        <p className="text-xs text-subtle">{it.meta}</p>
                        {it.skills.length > 0 && (
                          <p className="mt-auto text-xs text-muted">
                            <span className="text-subtle">Trains </span>
                            {it.skills.join(" · ")}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className="order-first lg:order-none">{skillsCard}</div>
      </div>
    </main>
  );
}
