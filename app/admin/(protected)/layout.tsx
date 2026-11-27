import { redirect } from "next/navigation";

import { StudioNav } from "@/components/studio/studio-nav";
import { getSession } from "@/lib/session";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "STUDENT") redirect("/");

  const isAdmin = session.role === "ADMIN";
  const items = [
    { href: "/admin", label: "Overview", exact: true },
    { href: "/admin/subjects", label: isAdmin ? "Subjects & experts" : "My subjects" },
    { href: "/admin/games", label: "Activities" },
    { href: "/admin/classes", label: "Classes" },
    ...(isAdmin ? [{ href: "/admin/users", label: "People" }] : []),
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-line bg-surface/40">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 sm:px-6">
          <StudioNav items={items} />
          <span className="hidden pb-3 text-xs text-subtle sm:block">
            Studio · {isAdmin ? "Owner" : "Expert"}
          </span>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
