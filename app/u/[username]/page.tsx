import Link from "next/link";
import { notFound } from "next/navigation";

import { requestBuddyAction } from "@/app/buddies/actions";
import { Avatar } from "@/components/people/avatar";
import { PracticeHeatmap } from "@/components/profile/practice-heatmap";
import { ProjectCard } from "@/components/profile/project-card";
import { ProjectForm } from "@/components/profile/project-form";
import { GoalRing } from "@/components/progress/goal-ring";
import { SkillRadar } from "@/components/progress/skill-radar";
import { ROLE_LABEL } from "@/lib/roles";
import { getSession } from "@/lib/session";
import { getUserRole } from "@/server/data/subjects";
import { getWeekProgress } from "@/server/data/activity";
import { getPickableSubjects } from "@/server/data/me";
import {
  buddyCount,
  canViewProfile,
  completedActivityCount,
  getPracticeDays,
  getProfileByUsername,
  getRecentActivity,
  MAX_PROJECTS,
  streaks,
} from "@/server/data/profile";
import { getSkillProgress } from "@/server/data/skill-progress";
import { prisma } from "@/server/db";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await getSession();
  const profile = await getProfileByUsername(decodeURIComponent(username));
  if (!profile || !session) notFound();
  const role = (await getUserRole(session.userId)) ?? "STUDENT";
  if (!(await canViewProfile({ userId: session.userId, role }, profile))) notFound();

  const isMe = session.userId === profile.id;
  const [practice, recent, buddies, completed, skills, week, connection, pickable] = await Promise.all([
    getPracticeDays(profile.id, profile.timezone),
    getRecentActivity(profile.id),
    buddyCount(profile.id),
    completedActivityCount(profile.id),
    getSkillProgress(profile.id),
    getWeekProgress([profile.id]),
    isMe
      ? null
      : prisma.buddyConnection.findFirst({
          where: {
            ...(session.userId < profile.id
              ? { userAId: session.userId, userBId: profile.id }
              : { userAId: profile.id, userBId: session.userId }),
          },
          select: { id: true, status: true },
        }),
    isMe ? getPickableSubjects() : [],
  ]);
  const streak = streaks(practice.days, practice.today);
  const isBuddy = connection?.status === "ACCEPTED";
  const thisWeek = week.get(profile.id) ?? { done: 0, goal: profile.weeklyGoal, lastActiveAt: null };
  const joined = profile.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const charted = skills.filter((s) => s.skills.some((k) => k.pct !== null));

  const badges = [
    { on: completed >= 1, name: "First steps", hint: "Finished a first activity" },
    { on: streak.longest >= 7, name: "On a roll", hint: "Practised 7 days in a row" },
    { on: streak.longest >= 30, name: "Unstoppable", hint: "Practised 30 days in a row" },
    { on: buddies >= 1, name: "Study buddy", hint: "Has a study buddy" },
    { on: completed >= 25, name: "Regular", hint: "Finished 25 activities" },
    { on: profile.projects.some((p) => p.status === "DONE"), name: "Shipped it", hint: "Finished a learning project" },
  ];
  const earned = badges.filter((b) => b.on);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[280px_1fr]">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="flex flex-col gap-5">
        <div className="flex items-center gap-4 lg:flex-col lg:items-start">
          <span className="lg:hidden"><Avatar name={profile.name} username={profile.username} size={72} /></span>
          <span className="hidden lg:block"><Avatar name={profile.name} username={profile.username} size={220} /></span>
          <div>
            <h1 className="font-display text-4xl leading-tight text-fg">{profile.name}</h1>
            <p className="font-mono text-base text-muted">@{profile.username}</p>
          </div>
        </div>

        {profile.bio && <p className="text-sm text-fg">{profile.bio}</p>}

        {isMe ? (
          <Link href="/me" className="btn btn-ghost w-full py-2">Edit profile</Link>
        ) : isBuddy ? (
          <Link href={`/messages/${connection!.id}`} className="btn btn-primary w-full py-2">Message</Link>
        ) : profile.lookingForBuddies && !connection ? (
          <form action={requestBuddyAction.bind(null, profile.id)}>
            <button type="submit" className="btn btn-primary w-full py-2">Send buddy request</button>
          </form>
        ) : null}

        <ul className="flex flex-col gap-2 text-sm text-muted">
          <li className="flex items-center gap-2">
            <Icon d="M16 11a4 4 0 1 0-8 0M3 21a7 7 0 0 1 18 0" />
            <span><span className="font-semibold text-fg">{buddies}</span> {buddies === 1 ? "buddy" : "buddies"}</span>
          </li>
          <li className="flex items-center gap-2">
            <Icon d="M8 7V3m8 4V3M4 11h16M5 5h14v16H5z" />
            Joined {joined}
          </li>
          {profile.role !== "STUDENT" && (
            <li className="flex items-center gap-2">
              <Icon d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8 9.5 8z" />
              {ROLE_LABEL[profile.role]}
            </li>
          )}
          {(isMe || isBuddy) && profile.discordHandle && (
            <li className="flex items-center gap-2">
              <Icon d="M7 17c3 1.5 7 1.5 10 0M8 12h.01M16 12h.01M6 6c4-2 8-2 12 0 2 4 2.5 8 1.5 11L17 19l-1-2M7 19l-2.5-2C3.5 14 4 10 6 6" />
              Discord <span className="font-mono text-fg">{profile.discordHandle}</span>
            </li>
          )}
        </ul>

        {profile.learning.length > 0 && (
          <section aria-labelledby="learning-h" className="flex flex-col gap-2 border-t border-line pt-5">
            <h2 id="learning-h" className="text-sm font-semibold text-fg">Learning</h2>
            <ul className="flex flex-wrap gap-1.5">
              {profile.learning.map((l) => (
                <li key={l.subject.id}>
                  <Link href={`/subjects/${l.subject.id}`} className="chip hover:text-fg">{l.subject.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile.interests.length > 0 && (
          <section aria-labelledby="interests-h" className="flex flex-col gap-2 border-t border-line pt-5">
            <h2 id="interests-h" className="text-sm font-semibold text-fg">Interests</h2>
            <ul className="flex flex-wrap gap-1.5">
              {profile.interests.map((i) => <li key={i} className="chip">{i}</li>)}
            </ul>
          </section>
        )}

        <section aria-labelledby="badges-h" className="flex flex-col gap-2 border-t border-line pt-5">
          <h2 id="badges-h" className="text-sm font-semibold text-fg">Achievements</h2>
          {earned.length === 0 ? (
            <p className="text-xs text-subtle">{isMe ? "Finish your first activity to earn one." : "None yet."}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {earned.map((b) => (
                <li key={b.name} title={b.hint} className="flex items-center gap-1.5 rounded-full border border-accent-text/30 bg-accent/10 px-2.5 py-1 text-xs text-fg">
                  <span aria-hidden="true" className="text-accent-text">★</span>
                  {b.name}
                  <span className="sr-only">: {b.hint}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-col gap-10">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Current streak" value={`${streak.current} ${streak.current === 1 ? "day" : "days"}`} accent={streak.current > 0}>
            {streak.current > 0 && !streak.practicedToday && isMe ? "Practise today to keep it" : streak.practicedToday ? "Practised today" : null}
          </Stat>
          <Stat label="Longest streak" value={`${streak.longest} ${streak.longest === 1 ? "day" : "days"}`} />
          <Stat label="Activities finished" value={String(completed)} />
          <div className="card flex items-center gap-3 p-4">
            <GoalRing done={thisWeek.done} goal={thisWeek.goal} size={48} />
            <div>
              <dt className="text-xs text-muted">This week</dt>
              <dd className="text-sm text-fg">{thisWeek.done} of {thisWeek.goal}</dd>
            </div>
          </div>
        </dl>

        <section aria-labelledby="projects-h" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="projects-h" className="text-sm font-semibold text-fg">Learning projects</h2>
            {isMe && <span className="text-xs text-subtle">{profile.projects.length} / {MAX_PROJECTS}</span>}
          </div>
          {profile.projects.length === 0 && !isMe ? (
            <p className="text-sm text-subtle">No projects yet.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {profile.projects.map((p) => (
                <ProjectCard key={p.id} p={p} editable={isMe} subjects={pickable} />
              ))}
            </ul>
          )}
          {isMe && profile.projects.length < MAX_PROJECTS && (
            <details className="card p-4" open={profile.projects.length === 0}>
              <summary className="cursor-pointer text-sm font-medium text-fg">
                {profile.projects.length === 0 ? "Pin your first learning project" : "Add a project"}
              </summary>
              <p className="mt-1 text-xs text-muted">
                Something you&apos;re working toward: an exam, a book in another language, a song on the guitar.
              </p>
              <div className="mt-4"><ProjectForm subjects={pickable} /></div>
            </details>
          )}
        </section>

        <section aria-labelledby="practice-h" className="card flex flex-col gap-2 p-5">
          <h2 id="practice-h" className="sr-only">Practice calendar</h2>
          <PracticeHeatmap days={practice.days} today={practice.today} />
        </section>

        {charted.length > 0 && (
          <section aria-labelledby="skills-h" className="flex flex-col gap-4">
            <h2 id="skills-h" className="text-sm font-semibold text-fg">Skills</h2>
            <div className={`grid gap-4 ${charted.length > 1 ? "md:grid-cols-2" : "max-w-xl"}`}>
              {charted.map((s) => (
                <div key={s.subjectId} className="card flex flex-col gap-3 p-5">
                  <h3 className="font-display text-2xl text-fg">{s.subjectName}</h3>
                  <SkillRadar
                    title={s.subjectName}
                    skills={s.skills.map((k) => ({ name: k.name, pct: k.pct, pctThen: k.pctThen, total: k.total }))}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="recent-h" className="flex flex-col gap-3">
          <h2 id="recent-h" className="text-sm font-semibold text-fg">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-subtle">
              {isMe ? (
                <>Nothing yet. <Link href="/#subjects" className="text-accent-text hover:underline">Pick an activity</Link>.</>
              ) : (
                "Nothing yet."
              )}
            </p>
          ) : (
            <ol className="relative flex flex-col gap-0 border-l border-line pl-5">
              {recent.map((r, i) => (
                <li key={i} className="relative py-2.5">
                  <span aria-hidden="true" className="absolute -left-[25px] top-4 h-2 w-2 rounded-full bg-series-now ring-4 ring-canvas" />
                  <p className="text-sm text-muted">
                    Finished {r.kind === "Video" ? "the video" : r.kind === "Quiz" ? "the quiz" : "the sounds set"}{" "}
                    <Link href={r.href} className="font-medium text-fg hover:text-accent-text">{r.title}</Link>
                    <span className="text-subtle"> in {r.subject}</span>
                  </p>
                  <p className="text-xs text-subtle">
                    {new Date(r.at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, accent, children }: { label: string; value: string; accent?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`card flex flex-col gap-1 p-4 ${accent ? "border-accent-text/40" : ""}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono text-xl text-fg">{value}</dd>
      {children && <dd className="text-[11px] text-subtle">{children}</dd>}
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-subtle" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
