import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/people/avatar";
import { SkillRadar } from "@/components/progress/skill-radar";
import { requireSession } from "@/lib/auth";
import { ROLE_BADGE, ROLE_LABEL } from "@/lib/roles";
import { getMyBlocks, getMyConnections } from "@/server/data/buddies";
import { getMe, getPickableSubjects } from "@/server/data/me";
import { getSkillProgress } from "@/server/data/skill-progress";
import { unblockAction } from "./actions";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Me" };

type Props = { searchParams: Promise<{ welcome?: string }> };

export default async function MePage({ searchParams }: Props) {
  const session = await requireSession();
  const { welcome } = await searchParams;
  const me = await getMe(session.userId);
  if (!me) redirect("/login");

  const [subjects, progress, connections, blocks] = await Promise.all([
    getPickableSubjects(),
    getSkillProgress(me.id),
    getMyConnections(me.id),
    getMyBlocks(me.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-24 pt-10 sm:px-6">
      {welcome && (
        <div role="status" className="card flex flex-wrap items-center justify-between gap-3 border-accent-text/30 p-5">
          <p className="text-sm text-fg">
            <span className="font-semibold">Welcome, @{me.username}!</span>{" "}
            Pick the subjects you&apos;re learning and
            turn on “Show me to study buddies” to find people to learn with.
          </p>
          <Link href="/#subjects" className="btn btn-ghost px-4 py-2">Browse subjects</Link>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap items-center gap-5">
        <Avatar name={me.name} username={me.username} size={72} />
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-5xl leading-none text-fg">{me.name}</h1>
            {me.role !== "STUDENT" && <span className={`chip ${ROLE_BADGE[me.role]}`}>{ROLE_LABEL[me.role]}</span>}
          </div>
          <p className="font-mono text-sm text-muted">@{me.username}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href="/buddies" className="btn btn-ghost">
            {connections.buddies.length} {connections.buddies.length === 1 ? "buddy" : "buddies"}
            {connections.incoming.length > 0 && (
              <span className="rounded-full bg-accent px-1.5 text-[11px] text-on-accent">{connections.incoming.length} new</span>
            )}
          </Link>
          <Link href="/messages" className="btn btn-primary">Messages</Link>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        {/* Profile */}
        <section aria-labelledby="profile-h" className="card p-6">
          <h2 id="profile-h" className="mb-5 text-sm font-semibold text-fg">Your profile</h2>
          <ProfileForm
            me={{
              name: me.name,
              bio: me.bio,
              interests: me.interests,
              discordHandle: me.discordHandle,
              email: me.email,
              lookingForBuddies: me.lookingForBuddies,
              learning: me.learning.map((l) => l.subjectId),
            }}
            subjects={subjects}
          />
        </section>

        <div className="flex flex-col gap-6">
          {/* Buddies at a glance */}
          <section aria-labelledby="buddies-h" className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="buddies-h" className="text-sm font-semibold text-fg">Study buddies</h2>
              <Link href="/buddies" className="text-xs text-accent-text hover:underline">Find more →</Link>
            </div>
            {connections.buddies.length === 0 ? (
              <p className="text-sm text-muted">
                {me.lookingForBuddies
                  ? "No buddies yet — send a request from the Buddies page."
                  : "Turn on “Show me to study buddies” to find people learning the same things."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {connections.buddies.slice(0, 6).map((b) => (
                  <li key={b.id}>
                    <Link href={`/messages/${b.id}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-2">
                      <Avatar name={b.user.name} username={b.user.username} size={32} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-fg">{b.user.name}</span>
                        <span className="truncate text-xs text-subtle">@{b.user.username}</span>
                      </span>
                      {b.unread > 0 && <span className="rounded-full bg-accent px-2 text-xs text-on-accent">{b.unread}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Account */}
          <section aria-labelledby="account-h" className="card flex flex-col gap-4 p-5">
            <h2 id="account-h" className="text-sm font-semibold text-fg">Account</h2>
            <PasswordForm />
            {blocks.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-line pt-4">
                <p className="text-xs text-muted">Blocked</p>
                <ul className="flex flex-col gap-1.5">
                  {blocks.map((b) => (
                    <li key={b.blocked.id} className="flex items-center justify-between text-sm">
                      <span className="text-fg">@{b.blocked.username}</span>
                      <form action={unblockAction.bind(null, b.blocked.id)}>
                        <button type="submit" className="text-xs text-muted hover:text-fg">Unblock</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Skills */}
      <section aria-labelledby="skills-h" className="flex flex-col gap-4">
        <div>
          <h2 id="skills-h" className="eyebrow">My skills</h2>
          <p className="mt-1 text-sm text-muted">% correct per skill, now vs 30 days ago.</p>
        </div>
        {progress.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            Finish an activity in any subject and your skill chart will appear here.{" "}
            <Link href="/#subjects" className="text-accent-text hover:underline">Pick a subject →</Link>
          </div>
        ) : (
          <div className={`grid gap-4 ${progress.length > 1 ? "md:grid-cols-2" : "max-w-xl"}`}>
            {progress.map((p) => (
              <div key={p.subjectId} className="card flex flex-col gap-3 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl text-fg">{p.subjectName}</h3>
                  <Link href={`/subjects/${p.subjectId}`} className="text-xs text-accent-text hover:underline">Practise →</Link>
                </div>
                <SkillRadar title={p.subjectName} skills={p.skills.map((k) => ({ name: k.name, pct: k.pct, pctThen: k.pctThen, total: k.total }))} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
