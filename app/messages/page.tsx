import Link from "next/link";

import { Avatar } from "@/components/people/avatar";
import { requireSession } from "@/lib/auth";
import { getMyConnections } from "@/server/data/buddies";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const { userId } = await requireSession();
  const { buddies, incoming } = await getMyConnections(userId);
  const sorted = [...buddies].sort(
    (a, b) => (b.lastMessage?.createdAt.getTime() ?? 0) - (a.lastMessage?.createdAt.getTime() ?? 0),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-10 sm:px-6">
      <header>
        <p className="eyebrow">Messages</p>
        <h1 className="mt-2 font-display text-5xl text-fg">Conversations</h1>
      </header>

      {incoming.length > 0 && (
        <Link href="/buddies" className="card card-interactive flex items-center justify-between p-4 text-sm">
          <span className="text-fg">
            {incoming.length} buddy request{incoming.length === 1 ? "" : "s"} waiting for you
          </span>
          <span className="text-accent-text">Review →</span>
        </Link>
      )}

      {sorted.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <p className="font-display text-2xl text-fg">No conversations yet</p>
          <p className="max-w-sm text-sm text-muted">When someone accepts your buddy request, you can talk here.</p>
          <Link href="/buddies" className="btn btn-primary mt-2">Find study buddies</Link>
        </div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {sorted.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2">
                <Avatar name={c.user.name} username={c.user.username} size={44} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={`truncate ${c.unread ? "font-semibold text-fg" : "font-medium text-fg"}`}>{c.user.name}</span>
                    {c.lastMessage && (
                      <time className="shrink-0 text-[11px] text-subtle" dateTime={c.lastMessage.createdAt.toISOString()}>
                        {c.lastMessage.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </time>
                    )}
                  </span>
                  <span className={`truncate text-sm ${c.unread ? "text-fg" : "text-muted"}`}>
                    {c.lastMessage
                      ? `${c.lastMessage.senderId === userId ? "You: " : ""}${c.lastMessage.body}`
                      : "Say hi 👋"}
                  </span>
                </span>
                {c.unread > 0 && <span className="rounded-full bg-accent px-2 text-xs text-on-accent">{c.unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
