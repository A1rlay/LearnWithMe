import Link from "next/link";
import { notFound } from "next/navigation";

import { SkillRadar } from "@/components/progress/skill-radar";
import { BackLink } from "@/components/ui/nav-link";
import { isStaffViewer } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getSkillProgress } from "@/server/data/skill-progress";
import { getSubjectForLearner } from "@/server/data/subjects";

type Props = { params: Promise<{ subjectId: string }> };

export async function generateMetadata({ params }: Props) {
  const { subjectId } = await params;
  const s = await getSubjectForLearner(subjectId, true);
  return { title: s?.name ?? "Subject" };
}

export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params;
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
      title: "Video lessons",
      blurb: "Watch, and answer a question at each checkpoint.",
      items: subject.topics.map((t) => ({
        id: t.id,
        href: `/topics/${t.id}`,
        title: t.title,
        meta: [t.level, `${t._count.videos} video${t._count.videos === 1 ? "" : "s"}`].filter(Boolean).join(" · "),
        skills: t.skills.map((k) => k.skill.name),
      })),
    },
    {
      key: "quizzes",
      title: "Quizzes",
      blurb: "Multiple choice, matching, sorting and open answers.",
      items: subject.qmTopics.map((t) => ({
        id: t.id,
        href: `/question-maker/${t.id}`,
        title: t.title,
        meta: `${t._count.questions} question${t._count.questions === 1 ? "" : "s"}`,
        skills: t.skills.map((k) => k.skill.name),
      })),
    },
    {
      key: "spelling",
      title: "Sounds & spelling",
      blurb: "Listen and pick the ending sound, or say the word out loud.",
      items: subject.spellRightSets.map((s) => ({
        id: s.id,
        href: `/spell-right/${s.id}/play`,
        title: s.title,
        meta: `${s.mode === "TERMINATION" ? "Listening" : "Speaking"} · ${s._count.words} word${s._count.words === 1 ? "" : "s"}`,
        skills: s.skills.map((k) => k.skill.name),
      })),
    },
  ].filter((g) => g.items.length > 0);

  const skillsCard = (
    <aside aria-labelledby="my-skills-h" className="card p-5 lg:sticky lg:top-20">
      <h2 id="my-skills-h" className="mb-3 text-sm font-semibold text-fg">Your skills in {subject.name}</h2>
      {!session ? (
        <div className="flex flex-col items-start gap-3 text-sm text-muted">
          <p>Sign in and your answers will build a skill chart you can watch grow.</p>
          <Link href="/login" className="btn btn-ghost px-4 py-2">Sign in</Link>
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

          {groups.length === 0 ? (
            <div className="card p-10 text-center text-sm text-muted">
              The expert is still preparing activities for this subject.
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.key} aria-labelledby={`${g.key}-h`} className="flex flex-col gap-4">
                <div>
                  <h2 id={`${g.key}-h`} className="font-display text-3xl text-fg">{g.title}</h2>
                  <p className="mt-1 text-sm text-muted">{g.blurb}</p>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
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
