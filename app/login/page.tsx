import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const inputClass =
  "rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.55)]">
            Ingles Practico
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-white">Learn With Me</h1>
        </div>

        <div className="rounded-3xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] p-8 backdrop-blur-sm">
          <h2 className="text-xl font-extrabold text-white">Sign in</h2>

          {error && (
            <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm text-red-300">
              Incorrect email or password.
            </p>
          )}

          <form action={loginAction} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.55)]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.55)]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-full bg-[#0F9C00] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
