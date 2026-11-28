const inputClass =
  "rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent-text";

export function UserFields({
  defaults,
}: {
  defaults?: { name?: string; username?: string; email?: string | null; role?: string };
} = {}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="name"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-muted"
        >
          Display name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaults?.name}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Username <span className="text-accent-text">*</span>
        </label>
        <input
          id="username"
          name="username"
          required
          pattern="[a-z0-9_.]{3,20}"
          title="3–20 characters: lowercase letters, numbers, _ or ."
          defaultValue={defaults?.username}
          className={inputClass}
        />
        <p className="text-xs text-subtle">Used to sign in. 3–20 characters: a–z, 0–9, _ or .</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Email <span className="normal-case tracking-normal text-subtle">(optional)</span>
        </label>
        <input id="email" name="email" type="email" defaultValue={defaults?.email ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="role"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-muted"
        >
          Role <span className="text-accent-text">*</span>
        </label>
        <select
          id="role"
          name="role"
          defaultValue={defaults?.role ?? "STUDENT"}
          className={inputClass}
        >
          <option value="STUDENT">Learner</option>
          <option value="TEACHER">Expert (teaches subjects)</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
    </>
  );
}
