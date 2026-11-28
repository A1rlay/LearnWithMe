"use client";

import { useActionState } from "react";

import { saveProfileAction, type FormState } from "./actions";

type Props = {
  me: {
    name: string;
    bio: string | null;
    interests: string[];
    discordHandle: string | null;
    email: string | null;
    lookingForBuddies: boolean;
    learning: string[];
  };
  subjects: { id: string; name: string }[];
};

export function ProfileForm({ me, subjects }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfileAction, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-accent-text/30 bg-accent/10 p-4">
        <input
          type="checkbox"
          name="lookingForBuddies"
          defaultChecked={me.lookingForBuddies}
          className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-fg">Show me to study buddies</span>
          <span className="text-xs text-muted">
            Others who opted in can see your display name, @username, bio, interests and subjects —
            never your email. Your Discord is shared only with buddies you accept.
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Display name</span>
          <input name="name" defaultValue={me.name} maxLength={60} className="field" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Discord username</span>
          <input name="discordHandle" defaultValue={me.discordHandle ?? ""} maxLength={33} placeholder="optional" className="field" autoCapitalize="none" spellCheck={false} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">About you</span>
        <textarea name="bio" defaultValue={me.bio ?? ""} rows={3} maxLength={300} placeholder="What are you learning, and why? When do you like to study?" className="field" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">Interests</span>
        <input name="interests" defaultValue={me.interests.join(", ")} placeholder="music, travel, football, games" className="field" />
        <span className="text-xs text-subtle">Comma-separated, up to 10. Shared interests help match you with buddies.</span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-fg">Subjects I&apos;m learning</legend>
        {subjects.length === 0 ? (
          <p className="text-xs text-subtle">No subjects are open yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <label
                key={s.id}
                className="cursor-pointer rounded-full border border-line-strong px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg has-[:checked]:border-accent-text/60 has-[:checked]:bg-accent/25 has-[:checked]:text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-text"
              >
                <input type="checkbox" name="subjectIds" value={s.id} defaultChecked={me.learning.includes(s.id)} className="sr-only" />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <details className="rounded-2xl border border-line p-4">
        <summary className="cursor-pointer text-sm font-medium text-fg">
          Recovery email <span className="font-normal text-subtle">(optional)</span>
        </summary>
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-xs text-muted">Only used if you ever need to recover your account. Never shown to anyone.</span>
          <input name="email" type="email" defaultValue={me.email ?? ""} className="field" />
        </label>
      </details>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save profile"}
        </button>
        <span role="status" className={`text-sm ${state.error ? "text-danger" : "text-success"}`}>
          {state.error ?? state.ok}
        </span>
      </div>
    </form>
  );
}
