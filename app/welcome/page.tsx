import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { getPickableSubjectsWithCounts, needsOnboarding } from "@/server/data/me";
import { WelcomeFlow } from "./welcome-flow";

export const metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { userId, name } = await requireSession();
  if (!(await needsOnboarding(userId))) redirect("/");
  const subjects = await getPickableSubjectsWithCounts();
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-2xl flex-col justify-center px-4 py-12 sm:px-6">
      <WelcomeFlow name={name} subjects={subjects} />
    </main>
  );
}
