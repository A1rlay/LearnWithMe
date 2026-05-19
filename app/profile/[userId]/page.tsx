import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { BackLink } from "@/components/ui/nav-link";
import { getStudentStats } from "@/server/data/progress";
import { adminGetUser } from "@/server/data/users";
import { getStudentClasses } from "@/server/data/classes";

type Props = { params: Promise<{ userId: string }> };

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500/20 text-purple-300",
  TEACHER: "bg-blue-500/20 text-blue-300",
  STUDENT: "bg-green-500/20 text-green-300",
};

function avatarColors(name: string) {
  const hues = [220, 260, 300, 160, 30, 190, 340];
  const h = hues[name.charCodeAt(0) % hues.length];
  return { bg: `hsl(${h},55%,30%)`, text: `hsl(${h},70%,80%)` };
}

export default async function ProfilePage({ params }: Props) {
  const viewer = await requireSession();
  const { userId } = await params;

  // Only the owner, teachers, and admins can view a profile
  const canView =
    viewer.userId === userId ||
    viewer.role === "ADMIN" ||
    viewer.role === "TEACHER";
  if (!canView) redirect("/learn");

  const user = await adminGetUser(userId);
  if (!user) notFound();

  const [stats, classes] = await Promise.all([
    getStudentStats(userId),
    user.role === "STUDENT" ? getStudentClasses(userId) : Promise.resolve([]),
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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12 sm:py-16">
      <BackLink href={isOwnProfile ? "/learn" : "/admin/users"}>
        {isOwnProfile ? "Back" : "Users"}
      </BackLink>

      {/* Header card */}
      <div className="flex flex-col gap-6 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-8 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-extrabold"
          style={{ backgroundColor: av.bg, color: av.text }}
        >
          {initials}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl text-[var(--foreground)]">{user.name}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${ROLE_COLORS[user.role]}`}>
              {user.role}
            </span>
          </div>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
          {user.bio && <p className="mt-1 text-sm text-[rgba(255,255,255,0.7)]">{user.bio}</p>}

          {/* Classes the student belongs to */}
          {classes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {classes.map((cs) => (
                <span
                  key={cs.classId}
                  className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1 text-xs text-[rgba(255,255,255,0.6)]"
                >
                  {cs.class.name} · {cs.class.teacher.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Quizzes done", value: stats.totalSessions },
          { label: "Avg score", value: stats.totalSessions > 0 ? `${stats.overallPct}%` : "—" },
          { label: "Videos watched", value: stats.videosWatched },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 rounded-[20px] border border-[var(--border)] bg-[var(--panel)] py-6 text-center"
          >
            <p className="font-serif text-4xl text-[var(--foreground)]">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Topic breakdown */}
      {stats.topics.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Topic performance
          </h2>
          <div className="flex flex-col gap-3">
            {stats.topics
              .sort((a, b) => b.sessions - a.sessions)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-2 rounded-[20px] border border-[var(--border)] bg-[var(--panel)] px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[var(--foreground)]">{t.title}</span>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                      <span>{t.sessions} {t.sessions === 1 ? "session" : "sessions"}</span>
                      <span
                        className={`font-bold ${t.avgPct >= 80 ? "text-[#0F9C00]" : t.avgPct >= 50 ? "text-yellow-400" : "text-red-400"}`}
                      >
                        {t.total > 0 ? `${t.avgPct}%` : "—"}
                      </span>
                    </div>
                  </div>
                  {t.total > 0 && (
                    <div className="h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.08)]">
                      <div
                        className={`h-full rounded-full transition-all ${t.avgPct >= 80 ? "bg-[#0F9C00]" : t.avgPct >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
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
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Recent activity
          </h2>
          <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
            {stats.recentSessions.map((s, i) => (
              <Link
                key={s.id}
                href={`/profile/${userId}/sessions/${s.id}`}
                className={`group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[rgba(255,255,255,0.04)] ${i < stats.recentSessions.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-[var(--foreground)] group-hover:underline">
                    {s.topicTitle}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(s.completedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${s.pct >= 80 ? "bg-[rgba(15,156,0,0.2)] text-[#0F9C00]" : s.pct >= 50 ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-400"}`}
                  >
                    {s.total > 0 ? `${s.pct}%` : "submitted"}
                  </span>
                  <svg className="shrink-0 text-[rgba(255,255,255,0.2)] transition-colors group-hover:text-[rgba(255,255,255,0.5)]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {stats.totalSessions === 0 && stats.videosWatched === 0 && (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          No activity yet.
        </div>
      )}
    </main>
  );
}
