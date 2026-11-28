import { LogoMark } from "@/components/brand/logo";
import { loginAction } from "./actions";

export const metadata = { title: "Sign in" };

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <LogoMark size={44} />
          <div>
            <h1 className="font-display text-4xl text-fg">
              Welcome <span className="italic text-accent-text">back</span>
            </h1>
            <p className="mt-1 text-sm text-muted">Sign in to keep your skill chart growing.</p>
          </div>
        </div>

        <div className="card p-7">
          {error && (
            <p role="alert" className="mb-5 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              That email and password don&apos;t match. Check both and try again.
            </p>
          )}

          <form action={loginAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg">Email</span>
              <input name="email" type="email" required autoComplete="email" className="field" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg">Password</span>
              <input name="password" type="password" required autoComplete="current-password" className="field" />
            </label>
            <button type="submit" className="btn btn-primary mt-2 w-full py-3">
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-subtle">
          Accounts are created by the owner. Want to teach a subject? Get in touch.
        </p>
      </div>
    </main>
  );
}
