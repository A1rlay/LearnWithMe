"use client";

import { useActionState, useState } from "react";

import { signupAction, type SignupState } from "@/app/login/actions";
import { Spinner } from "@/components/ui/spinner";

export function SignupForm() {
  const [state, action, pending] = useActionState<SignupState, FormData>(signupAction, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">Username</span>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-subtle">@</span>
          <input
            name="username"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state.username}
            pattern="[A-Za-z0-9_.@]{3,21}"
            className="field pl-8"
            placeholder="your.name"
          />
        </div>
        <span className="text-xs text-subtle">3–20 characters: letters, numbers, _ or .</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-sm font-medium text-fg">
          Password
          <button type="button" onClick={() => setShow((s) => !s)} className="text-xs font-normal text-muted hover:text-fg">
            {show ? "Hide" : "Show"}
          </button>
        </span>
        <input
          name="password"
          type={show ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          className="field"
        />
        <span className="text-xs text-subtle">At least 8 characters.</span>
      </label>
      <button type="submit" disabled={pending} className="btn btn-primary mt-2 w-full py-3">
        {pending ? <><Spinner />Creating your account…</> : "Create account"}
      </button>
    </form>
  );
}
