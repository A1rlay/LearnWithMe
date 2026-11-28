import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoMark } from "@/components/brand/logo";
import { getSession } from "@/lib/session";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Join" };

export default async function SignupPage() {
  if (await getSession()) redirect("/me");
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <LogoMark size={44} />
          <div>
            <h1 className="font-display text-4xl text-fg">
              Learn <span className="italic text-accent-text">with</span> us
            </h1>
            <p className="mt-1 text-sm text-muted">Just a username and a password. That&apos;s it.</p>
          </div>
        </div>
        <div className="card p-7">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-text hover:underline">Sign in</Link>
        </p>
        <p className="mt-2 text-center text-xs text-subtle">
          Tip: add an email later on your Me page so you can recover your account.
        </p>
      </div>
    </main>
  );
}
