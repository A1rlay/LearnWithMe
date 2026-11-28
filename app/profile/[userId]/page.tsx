import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SkillRadar } from "@/components/progress/skill-radar";
import { isStaffViewer, requireSession } from "@/lib/auth";
import { ROLE_BADGE, ROLE_LABEL } from "@/lib/roles";
import { getSkillProgress } from "@/server/data/skill-progress";
import { BackLink } from "@/components/ui/nav-link";
import { getStudentStats } from "@/server/data/progress";
import { adminGetUser } from "@/server/data/users";
import { getStudentClasses } from "@/server/data/classes";

type Props = { params: Promise<{ userId: string }> };

function avatarColors(name: string) {
  const hues = [220, 260, 300, 160, 30, 190, 340];
  const h = hues[name.charCodeAt(0) % hues.length];
  return { bg: `hsl(${h},55%,30%)`, text: `hsl(${h},70%,80%)` };
}

export default async function ProfilePage({ params }: Props) {
  const viewer = await requireSession();
  const { userId } = await params;
  if (viewer.userId === userId) redirect("/me");

  // Only the owner, teachers, and admins can view a profile
  // Role from the DB, not the cookie, so a demoted expert loses access at once.
  const canView = viewer.userId === userId || (await isStaffViewer());
  if (!canView) redirect("/");

  const user = await adminGetUser(userId);
  if (!user) notFound();

  const [stats, classes, skillProgress] = await Promise.all([
    getStudentStats(userId),
    user.role === "STUDENT" ? getStudentClasses(userId) : Promise.resolve([]),
    getSkillProgress(userId),
  ]);

  const av = avatarColors(user.name);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isOwnProfile = viewer.userId === userId;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-24 pt-10 sm:px-6">
      <BackLink href={isOwnProfile ? "/" : "/admin/users"}>
        {isOwnProfile ? "Back" : "Users"}
      </BackLink>

      {/* Header card */}
      <div className="flex flex-col gap-6 rounded-[28px] border border-line bg-surface p-8 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-extrabold"
          style={{ backgroundColor: av.bg, color: av.text }}
        >
          {initials}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl text-fg">{user.name}</h1>
            <span className={`chip ${ROLE_BADGE[user.role]}`}>{ROLE_LABEL[user.role]}</span>
          </div>
          <p className="font-mono text-sm text-muted">@{user.username}</p>
          {user.bio && <p className="mt-1 text-sm text-fg/70">{user.bio}</p>}

          {/* Classes the student belongs to */}
          {classes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {classes.map((cs) => (
                <span
                  key={cs.classId}
                  className="rounded-full border border-fg/15 px-3 py-1 text-xs text-fg/60"
                >
                  {cs.class.name} · {cs.class.teacher.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skills — one chart per subject practised */}
      <section aria-labelledby="skills-h" className="flex flex-col gap-4">
        <div>
          <h2 id="skills-h" className="eyebrow">Skills</h2>
          <p className="mt-1 text-sm text-muted">
            % of answers correct per skill, now vs 30 days ago. A skill needs 3 answers before it is scored.
          </p>
        </div>
        {skillProgress.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            {isOwnProfile
              ? "Finish an activity in any subject and your skill chart will appear here."
              : "No scored answers yet."}
          </div>
        ) : (
          <div className={`grid gap-4 ${skillProgress.length > 1 ? "md:grid-cols-2" : "max-w-xl"}`}>
            {skillProgress.map((p) => (
              <div key={p.subjectId} className="card flex flex-col gap-3 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl text-fg">{p.subjectName}</h3>
                  <Link href={`/subjects/${p.subjectId}`} className="text-xs text-accent-text hover:underline">
                    Practise →
                  </Link>
                </div>
                <SkillRadar
                  title={p.subjectName}
                  skills={p.skills.map((k) => ({ name: k.name, pct: k.pct, pctThen: k.pctThen, total: k.total }))}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Quizzes done", value: stats.totalSessions },
          { label: "Avg score", value: stats.totalSessions > 0 ? `${stats.overallPct}%` : "-" },
          { label: "Videos watched", value: stats.videosWatched },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 rounded-[20px] border border-line bg-surface py-6 text-center"
          >
            <p className="font-serif text-4xl text-fg">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Topic breakdown */}
      {stats.topics.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
            Topic performance
          </h2>
          <div className="flex flex-col gap-3">
            {stats.topics
              .sort((a, b) => b.sessions - a.sessions)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-2 rounded-[20px] border border-line bg-surface px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-fg">{t.title}</span>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>{t.sessions} {t.sessions === 1 ? "session" : "sessions"}</span>
                      <span
                        className={`font-bold ${t.avgPct >= 80 ? "text-success" : t.avgPct >= 50 ? "text-warning" : "text-danger"}`}
                      >
                        {t.total > 0 ? `${t.avgPct}%` : "-"}
                      </span>
                    </div>
                  </div>
                  {t.total > 0 && (
                    <div className="h-1.5 w-full rounded-full bg-fg/8">
                      <div
                        className={`h-full rounded-full transition-all ${t.avgPct >= 80 ? "bg-success" : t.avgPct >= 50 ? "bg-warning" : "bg-danger"}`}
                        style={{ width: `${t.avgPct}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats.recentSessions.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-text">
            Recent activity
          </h2>
          <div className="overflow-hidden rounded-[28px] border border-line bg-surface">
            {stats.recentSessions.map((s, i) => (
              <Link
                key={s.id}
                href={`/profile/${userId}/sessions/${s.id}`}
                className={`group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-fg/4 ${i < stats.recentSessions.length - 1 ? "border-b border-line" : ""}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-fg group-hover:underline">
                    {s.topicTitle}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(s.completedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${s.pct >= 80 ? "bg-success/20 text-success" : s.pct >= 50 ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger"}`}
                  >
                    {s.total > 0 ? `${s.pct}%` : "submitted"}
                  </span>
                  <svg className="shrink-0 text-fg/20 transition-colors group-hover:text-fg/50" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {stats.totalSessions === 0 && stats.videosWatched === 0 && (
        <div className="rounded-[28px] border border-dashed border-line p-12 text-center text-sm text-muted">
          No activity yet.
        </div>
      )}
    </main>
  );
}
