import Link from "next/link";

import { ACTIVITY_META, ACTIVITY_TYPES } from "@/lib/activity-types";
import { editableSubjectIds, requireRole } from "@/lib/auth";
import { getStudioSubjectActivities } from "@/server/data/subjects";

type Props = { searchParams: Promise<{ subject?: string }> };

export default async function ActivitiesHubPage({ searchParams }: Props) {
  const session = await requireRole("ADMIN", "TEACHER");
  const subjects = await getStudioSubjectActivities(await editableSubjectIds(session));
  const { subject: wanted } = await searchParams;
  const current = subjects.find((s) => s.id === wanted) ?? subjects[0];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow">Activities</p>
        <h1 className="mt-2 font-display text-4xl text-fg">Activities by subject</h1>
        <p className="mt-1.5 text-sm text-muted">
          Every subject has its own activities, and only the kinds that fit it.
        </p>
      </div>

      {!current ? (
        <div className="card p-10 text-center text-sm text-muted">
          {session.role === "ADMIN" ? (
            <>
              No subjects yet. <Link href="/admin/subjects/new" className="text-accent-text hover:underline">Create the first one</Link>.
            </>
          ) : (
            "You aren't an expert for any subject yet."
          )}
        </div>
      ) : (
        <>
          {subjects.length > 1 && (
            <nav aria-label="Subjects" className="-mb-2 flex flex-wrap gap-2">
              {subjects.map((s) => {
                const on = s.id === current.id;
                return (
                  <Link
                    key={s.id}
                    href={`/admin/games?subject=${s.id}`}
                    aria-current={on ? "page" : undefined}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      on ? "border-accent-text/60 bg-accent/25 text-fg" : "border-line-strong text-muted hover:text-fg"
                    }`}
                  >
                    {s.name}
                  </Link>
                );
              })}
            </nav>
          )}

          <section aria-labelledby="subject-h" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="subject-h" className="font-display text-3xl text-fg">{current.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {current._count.experts === 0 ? "Hidden from learners until an expert is assigned." : "Live for learners."}
                </p>
              </div>
              <Link href={`/admin/subjects/${current.id}#activity-types`} className="btn btn-ghost px-4 py-2 text-xs">
                Choose activity kinds
              </Link>
            </div>

            {current.activityTypes.length === 0 ? (
              <p className="card p-8 text-center text-sm text-muted">
                This subject offers no activity kinds yet. Turn some on from the subject page.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {ACTIVITY_TYPES.filter((t) => current.activityTypes.includes(t)).map((t) => {
                  const m = ACTIVITY_META[t];
                  const count =
                    t === "VIDEO" ? current._count.topics : t === "QUIZ" ? current._count.qmTopics : current._count.spellRightSets;
                  const q = `?subject=${current.id}`;
                  return (
                    <div key={t} className="card flex flex-col gap-3 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-fg">{m.label}</h3>
                          <p className="text-xs text-subtle">{m.studioTitle}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent-text">
                          {m.tag}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted">{m.blurb}</p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                        <span className="font-mono text-xs text-subtle">
                          {count} {count === 1 ? "activity" : "activities"}
                        </span>
                        <div className="flex gap-2">
                          <Link href={`${m.studioHref}/new${q}`} className="btn btn-ghost px-3 py-1.5 text-xs">New</Link>
                          <Link href={`${m.studioHref}${q}`} className="btn btn-primary px-3 py-1.5 text-xs">Manage</Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
