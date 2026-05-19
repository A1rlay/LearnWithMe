import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { adminGetDashboardCounts } from "@/server/data/admin";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "ADMIN";
  const {
    topicCount,
    videoCount,
    questionCount,
    qmTopicCount,
    qmQuestionCount,
    userCount,
  } = await adminGetDashboardCounts();

  const stats = isAdmin
    ? [
      { label: "WC Topics", count: topicCount, href: "/admin/topics" },
      { label: "WC Videos", count: videoCount, href: "/admin/topics" },
      { label: "WC Questions", count: questionCount, href: "/admin/topics" },
      { label: "QM Topics", count: qmTopicCount, href: "/admin/question-maker" },
      { label: "QM Questions", count: qmQuestionCount, href: "/admin/question-maker" },
      { label: "Users", count: userCount, href: "/admin/users" },
    ]
    : [
      { label: "QM Topics", count: qmTopicCount, href: "/admin/question-maker" },
      { label: "QM Questions", count: qmQuestionCount, href: "/admin/question-maker" },
    ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Dashboard
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[var(--foreground)]">
          Welcome, {session.name}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_20px_60px_rgba(13,34,66,0.06)] transition-transform duration-200 hover:-translate-y-0.5 sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              {stat.label}
            </p>
            <p className="mt-3 font-serif text-4xl text-[var(--foreground)] sm:text-5xl">
              {stat.count}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Quick actions
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {isAdmin && (
            <Link
              href="/admin/topics"
              className="rounded-full bg-[#0F9C00] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Manage WordCatch
            </Link>
          )}
          <Link
            href="/admin/question-maker"
            className="rounded-full bg-[#0F9C00] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Manage QuestionMaker
          </Link>
          {isAdmin && (
            <Link
              href="/admin/users"
              className="rounded-full border border-[rgba(255,255,255,0.25)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[rgba(255,255,255,0.1)]"
            >
              Manage Users
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
