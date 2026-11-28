import Link from "next/link";

import { Avatar } from "@/components/people/avatar";
import { ReportForm } from "@/components/people/report-form";
import { Notice } from "@/components/ui/notice";
import { requireSession } from "@/lib/auth";
import { getMyConnections, getSuggestions } from "@/server/data/buddies";
import { getMe } from "@/server/data/me";
import {
  acceptAction,
  blockAction,
  cancelAction,
  declineAction,
  requestBuddyAction,
} from "./actions";

export const metadata = { title: "Study buddies" };

type Props = { searchParams: Promise<{ notice?: string }> };

export default async function BuddiesPage({ searchParams }: Props) {
  const { userId } = await requireSession();
  const { notice } = await searchParams;
  const [me, suggestions, conn] = await Promise.all([getMe(userId), getSuggestions(userId), getMyConnections(userId)]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-24 pt-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Study buddies</p>
        <h1 className="font-display text-5xl leading-tight text-fg sm:text-6xl">
          Learning is easier <span className="italic text-accent-text">together</span>.
        </h1>
        <p className="max-w-2xl text-muted">
          Find people learning the same subjects. Send a request. Once they accept, you can message each other
          here and see each other&apos;s Discord.
        </p>
      </header>

      <Notice text={notice} />

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
                    <button type="submit" className="btn btn-primary px-4 py-2">Accept</button>
                  </form>
                  <form action={declineAction.bind(null, c.id)}>
                    <button type="submit" className="btn btn-ghost px-4 py-2">Decline</button>
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
                  </span>
                  {c.unread > 0 ? (
                    <span className="rounded-full bg-accent px-2 text-xs text-on-accent">{c.unread}</span>
                  ) : (
                    <span aria-hidden="true" className="text-subtle">→</span>
                  )}
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
            <div className="card p-10 text-center text-sm text-muted">
              No one new to suggest right now. Add more subjects or interests on your{" "}
              <Link href="/me" className="text-accent-text hover:underline">Me page</Link>, or check back soon.
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
                    <button type="submit" className="btn btn-primary w-full py-2">Send buddy request</button>
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
        <p className="truncate font-semibold text-fg">{user.name}</p>
        <p className="truncate text-xs text-subtle">
          @{user.username}
          {user.subjects.length > 0 ? ` · learning ${user.subjects.join(", ")}` : ""}
        </p>
      </div>
    </div>
  );
}
