import Link from "next/link";
import { notFound } from "next/navigation";

import { blockAction, endBuddyAction } from "@/app/buddies/actions";
import { Avatar } from "@/components/people/avatar";
import { ReportForm } from "@/components/people/report-form";
import { BackLink } from "@/components/ui/nav-link";
import { Notice } from "@/components/ui/notice";
import { requireSession } from "@/lib/auth";
import { getThread } from "@/server/data/buddies";
import { AutoRefresh, Composer, ScrollAnchor } from "./live";

type Props = {
  params: Promise<{ connectionId: string }>;
  searchParams: Promise<{ notice?: string }>;
};

export const metadata = { title: "Messages" };

const time = (d: Date) => d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function ThreadPage({ params, searchParams }: Props) {
  const { userId } = await requireSession();
  const { connectionId } = await params;
  const { notice } = await searchParams;
  const thread = await getThread(userId, connectionId);
  if (!thread) notFound();
  const { peer, connection, messages } = thread;
  const accepted = connection.status === "ACCEPTED";
  const back = `/messages/${connectionId}`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-10 pt-8 sm:px-6">
      <BackLink href="/messages">Messages</BackLink>
      <Notice text={notice} />

      <header className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={peer.name} username={peer.username} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-3xl leading-tight text-fg">{peer.name}</h1>
          <p className="truncate text-xs text-subtle">
            @{peer.username}
            {peer.subjects.length > 0 ? ` · learning ${peer.subjects.join(", ")}` : ""}
          </p>
          {peer.discordHandle && (
            <p className="mt-1 text-xs text-muted">
              Discord: <span className="select-all font-mono text-fg">{peer.discordHandle}</span>
            </p>
          )}
        </div>
        <div className="flex w-full items-center justify-end gap-4 border-t border-line pt-3 sm:w-auto sm:border-0 sm:pt-0">
          {accepted && (
            <form action={endBuddyAction.bind(null, connectionId)}>
              <button type="submit" className="text-xs text-muted hover:text-fg">End buddy</button>
            </form>
          )}
          <form action={blockAction.bind(null, peer.id)}>
            <button type="submit" className="text-xs text-muted hover:text-danger">Block</button>
          </form>
          <ReportForm reportedId={peer.id} back={back} />
        </div>
      </header>

      {!accepted && (
        <p className="card p-4 text-sm text-muted">
          {connection.view === "waiting"
            ? "Your request is waiting. You can message each other once it's accepted."
            : connection.view === "incoming"
              ? "Accept the request on the Buddies page to start talking."
              : "This conversation is closed. Messages are kept read-only."}
        </p>
      )}

      <section aria-label="Conversation" aria-live="polite" className="card flex max-h-[60vh] min-h-[40vh] flex-col gap-3 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="m-auto max-w-xs text-center text-sm text-muted">
            {accepted ? (
              <>Say hi! Tell {peer.name.split(" ")[0]} what you&apos;re studying and when you like to practise.</>
            ) : (
              "No messages yet."
            )}
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === userId;
            return (
              <div key={m.id} className={`group flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                <p
                  className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "rounded-br-md bg-accent text-on-accent" : "rounded-bl-md bg-surface-3 text-fg"
                  }`}
                >
                  {m.body}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-subtle">
                  <time dateTime={m.createdAt.toISOString()}>{time(m.createdAt)}</time>
                  {mine && m.readAt && <span>Seen</span>}
                  {!mine && (
                    <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <ReportForm reportedId={peer.id} messageId={m.id} back={back} label="Report message" />
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <ScrollAnchor count={messages.length} />
      </section>

      {accepted ? (
        <>
          <Composer connectionId={connectionId} />
          <AutoRefresh />
        </>
      ) : (
        <Link href="/buddies" className="btn btn-ghost self-start">Go to Buddies</Link>
      )}
    </main>
  );
}
