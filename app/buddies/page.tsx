import Link from "next/link";

import { Avatar } from "@/components/people/avatar";
import { InviteButton } from "@/components/people/invite-button";
import { GoalRing } from "@/components/progress/goal-ring";
import { ReportForm } from "@/components/people/report-form";
import { Notice } from "@/components/ui/notice";
import { requireSession } from "@/lib/auth";
import { activityLabel, getWeekProgress } from "@/server/data/activity";
import { getMyConnections, getSuggestions } from "@/server/data/buddies";
import { getMe } from "@/server/data/me";
import {
  acceptAction,
  blockAction,
  cancelAction,
  declineAction,
  requestBuddyAction,
} from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata = { title: "Study buddies" };

type Props = { searchParams: Promise<{ notice?: string }> };

export default async function BuddiesPage({ searchParams }: Props) {
  const { userId } = await requireSession();
  const { notice } = await searchParams;
  const [me, suggestions, conn] = await Promise.all([getMe(userId), getSuggestions(userId), getMyConnections(userId)]);
  // Weekly progress is shared only between accepted buddies.
  const week = await getWeekProgress([userId, ...conn.buddies.map((c) => c.user.id)]);
  const mine = week.get(userId) ?? { done: 0, goal: 3, lastActiveAt: null };
  const together = conn.buddies.reduce(
    (acc, c) => {
      const w = week.get(c.user.id);
      return w ? { done: acc.done + Math.min(w.done, w.goal), goal: acc.goal + w.goal } : acc;
    },
    { done: Math.min(mine.done, mine.goal), goal: mine.goal },
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-24 pt-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Study buddies</p>
        <h1 className="font-display text-5xl leading-tight text-fg sm:text-6xl">
          Learning is easier <span className="italic text-accent-text">together</span>.
        </h1>
        <p className="max-w-2xl text-muted">
          Find people learning the same subjects. Send a request. Once they accept, you can message each other
          here, see each other&apos;s Discord, and cheer each other on toward your weekly goals.
        </p>
        <div>
          <InviteButton className="btn btn-ghost px-4 py-2" />
        </div>
      </header>

      <Notice text={notice} />

      {conn.buddies.length > 0 && (
        <section aria-labelledby="week-h" className="card flex flex-wrap items-center gap-6 p-6">
          <GoalRing done={together.done} goal={together.goal} size={72} label={`Together ${together.done} of ${together.goal} activities this week`} />
          <div className="min-w-0 flex-1">
            <h2 id="week-h" className="font-semibold text-fg">This week, together</h2>
            <p className="mt-1 text-sm text-muted">
              {together.done >= together.goal
                ? "Everyone hit their goal. Nice work."
                : `${together.goal - together.done} more ${together.goal - together.done === 1 ? "activity" : "activities"} between you and your buddies to hit everyone's goal.`}
            </p>
            <p className="mt-1 text-xs text-subtle">
              You: {mine.done} of {mine.goal}.{" "}
              <Link href="/me#goal" className="text-accent-text hover:underline">Change my goal</Link>
            </p>
          </div>
          <Link href="/#subjects" className="btn btn-primary">Do an activity</Link>
        </section>
      )}

      {!me?.lookingForBuddies && (
        <div className="card flex flex-wrap items-center justify-between gap-4 border-accent-text/30 p-6">
          <div>
            <p className="font-semibold text-fg">You&apos;re not visible to other learners yet</p>
            <p className="mt-1 text-sm text-muted">
              Turn on “Show me to study buddies” and pick your subjects on your Me page to see suggestions.
            </p>
          </div>
          <Link href="/me" className="btn btn-primary">Set up my profile</Link>
        </div>
      )}

      {conn.incoming.length > 0 && (
        <section aria-labelledby="incoming-h" className="flex flex-col gap-4">
          <h2 id="incoming-h" className="text-sm font-semibold text-fg">
            Requests for you <span className="ml-1 rounded-full bg-accent px-2 text-xs text-on-accent">{conn.incoming.length}</span>
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {conn.incoming.map((c) => (
              <li key={c.id} className="card flex flex-col gap-4 p-5">
                <PersonHeader user={c.user} />
                {c.user.bio && <p className="text-sm text-muted">{c.user.bio}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <form action={acceptAction.bind(null, c.id)}>
                    <SubmitButton className="btn btn-primary px-4 py-2">Accept</SubmitButton>
                  </form>
                  <form action={declineAction.bind(null, c.id)}>
                    <SubmitButton className="btn btn-ghost px-4 py-2">Decline</SubmitButton>
                  </form>
                  <div className="ml-auto flex items-center gap-3">
                    <form action={blockAction.bind(null, c.user.id)}>
                      <button type="submit" className="text-xs text-muted hover:text-danger">Block</button>
                    </form>
                    <ReportForm reportedId={c.user.id} back="/buddies" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {conn.buddies.length > 0 && (
        <section aria-labelledby="mine-h" className="flex flex-col gap-4">
          <h2 id="mine-h" className="text-sm font-semibold text-fg">Your buddies</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conn.buddies.map((c) => (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="card card-interactive flex items-center gap-3 p-4">
                  <Avatar name={c.user.name} username={c.user.username} size={40} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-fg">{c.user.name}</span>
                    <span className="truncate text-xs text-subtle">
                      @{c.user.username}
                      {c.user.discordHandle ? ` · Discord ${c.user.discordHandle}` : ""}
                    </span>
                    <span className={`truncate text-xs ${activityLabel(week.get(c.user.id)?.lastActiveAt ?? null) === "Studied today" ? "text-success" : "text-muted"}`}>
                      {activityLabel(week.get(c.user.id)?.lastActiveAt ?? null)}
                      {c.unread > 0 ? ` · ${c.unread} new ${c.unread === 1 ? "message" : "messages"}` : ""}
                    </span>
                  </span>
                  {week.get(c.user.id) && <GoalRing done={week.get(c.user.id)!.done} goal={week.get(c.user.id)!.goal} />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {me?.lookingForBuddies && (
        <section aria-labelledby="suggest-h" className="flex flex-col gap-4">
          <div>
            <h2 id="suggest-h" className="font-display text-3xl text-fg">People you might learn with</h2>
            <p className="mt-1 text-sm text-muted">Ranked by shared subjects, then shared interests.</p>
          </div>
          {suggestions.length === 0 ? (
            <div className="card flex flex-col items-center gap-4 p-10 text-center">
              <p className="font-display text-2xl text-fg">No one new to suggest yet</p>
              <p className="max-w-md text-sm text-muted">
                The fastest way to get a study buddy is to bring one. Send a friend the link, then add each other here.
                You can also add more subjects or interests on your{" "}
                <Link href="/me" className="text-accent-text hover:underline">Me page</Link>.
              </p>
              <InviteButton />
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((s) => (
                <li key={s.id} className="card flex flex-col gap-4 p-5">
                  <PersonHeader user={s} />
                  {(s.sharedSubjects.length > 0 || s.sharedInterests.length > 0) && (
                    <p className="text-xs text-success">
                      In common: {[...s.sharedSubjects, ...s.sharedInterests].join(" · ")}
                    </p>
                  )}
                  {s.bio && <p className="line-clamp-3 text-sm text-muted">{s.bio}</p>}
                  {s.interests.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Interests">
                      {s.interests.map((i) => (
                        <li key={i} className={`chip ${s.sharedInterests.includes(i) ? "border-success/40 text-success" : ""}`}>{i}</li>
                      ))}
                    </ul>
                  )}
                  <form action={requestBuddyAction.bind(null, s.id)} className="mt-auto">
                    <SubmitButton className="btn btn-primary w-full py-2">Send buddy request</SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {conn.outgoing.length > 0 && (
        <section aria-labelledby="out-h" className="flex flex-col gap-3">
          <h2 id="out-h" className="text-sm font-semibold text-fg">Waiting for an answer</h2>
          <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-card)] border border-line">
            {conn.outgoing.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={c.user.name} username={c.user.username} size={32} />
                <span className="flex-1 text-sm text-fg">
                  {c.user.name} <span className="text-subtle">@{c.user.username}</span>
                </span>
                <form action={cancelAction.bind(null, c.id)}>
                  <button type="submit" className="text-xs text-muted hover:text-fg">Cancel request</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function PersonHeader({ user }: { user: { name: string; username: string; subjects: string[] } }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={user.name} username={user.username} size={44} />
      <div className="min-w-0">
        <Link href={`/u/${user.username}`} className="block truncate font-semibold text-fg hover:text-accent-text">{user.name}</Link>
        <p className="truncate text-xs text-subtle">
          @{user.username}
          {user.subjects.length > 0 ? ` · learning ${user.subjects.join(", ")}` : ""}
        </p>
      </div>
    </div>
  );
}
