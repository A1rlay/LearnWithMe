import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { adminListReports } from "@/server/data/buddies";
import { resolveReportAction } from "./actions";

export const metadata = { title: "Reports" };

type Props = { searchParams: Promise<{ all?: string }> };

export default async function ReportsPage({ searchParams }: Props) {
  await requireRole("ADMIN");
  const { all } = await searchParams;
  const reports = await adminListReports(all === "1");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Safety</p>
          <h1 className="mt-2 font-display text-4xl text-fg">Reports</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            What learners reported about each other. To act, edit or delete the person under People.
          </p>
        </div>
        <Link href={all === "1" ? "/admin/reports" : "/admin/reports?all=1"} className="btn btn-ghost">
          {all === "1" ? "Open only" : "Include resolved"}
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">Nothing to review. 🎉</div>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((r) => (
            <li key={r.id} className={`card flex flex-col gap-3 p-5 ${r.resolvedAt ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-fg">
                  <span className="text-muted">@{r.reporter.username}</span> reported{" "}
                  <Link href={`/admin/users/${r.reported.id}/edit`} className="font-semibold text-danger hover:underline">
                    @{r.reported.username}
                  </Link>
                </p>
                <time className="text-xs text-subtle" dateTime={r.createdAt.toISOString()}>
                  {r.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </div>
              <p className="text-sm text-fg">{r.reason}</p>
              {r.message && (
                <blockquote className="rounded-xl border-l-2 border-danger/60 bg-surface-2 px-4 py-2 text-sm text-muted">
                  {r.message.body}
                </blockquote>
              )}
              {!r.resolvedAt && (
                <form action={resolveReportAction.bind(null, r.id)} className="self-end">
                  <button type="submit" className="btn btn-ghost px-4 py-2 text-xs">Mark resolved</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
