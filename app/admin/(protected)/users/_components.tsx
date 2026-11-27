const inputClass =
  "rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent-text";

export function UserFields({
  defaults,
}: {
  defaults?: { name?: string; email?: string; role?: string };
} = {}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="name"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-muted"
        >
          Full name <span className="text-accent-text">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaults?.name}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-muted"
        >
          Email <span className="text-accent-text">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaults?.email}
          className={inputClass}
        />
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
