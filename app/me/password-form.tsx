"use client";

import { useActionState } from "react";

import { changePasswordAction, type FormState } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Current password</span>
        <input name="current" type="password" required autoComplete="current-password" className="field py-2" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">New password</span>
        <input name="next" type="password" required minLength={8} autoComplete="new-password" className="field py-2" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-ghost px-4 py-2">Change password</button>
        <span role="status" className={`text-xs ${state.error ? "text-danger" : "text-success"}`}>{state.error ?? state.ok}</span>
      </div>
    </form>
  );
}
