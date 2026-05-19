const inputClass =
  "rounded-xl border border-[rgba(255,255,255,0.2)] bg-[rgba(0,13,113,0.5)] px-4 py-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-white";

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
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]"
        >
          Full name <span className="text-[var(--accent)]">*</span>
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
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]"
        >
          Email <span className="text-[var(--accent)]">*</span>
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
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]"
        >
          Role <span className="text-[var(--accent)]">*</span>
        </label>
        <select
          id="role"
          name="role"
          defaultValue={defaults?.role ?? "STUDENT"}
          className={inputClass}
        >
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
    </>
  );
}
