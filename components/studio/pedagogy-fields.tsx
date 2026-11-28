/** Level + instructions, shared by every activity form in Studio. */
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Beginner", "Intermediate", "Advanced"];

export function PedagogyFields({
  defaults,
  withLevel = true,
}: {
  defaults?: { level?: string | null; instructions?: string | null };
  withLevel?: boolean;
}) {
  return (
    <>
      {withLevel && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Level</span>
          <input name="level" list="level-options" maxLength={30} defaultValue={defaults?.level ?? ""} placeholder="e.g. A2 or Beginner" className="field" />
          <datalist id="level-options">
            {LEVELS.map((l) => <option key={l} value={l} />)}
          </datalist>
          <span className="text-xs text-subtle">Learners can filter a subject by level. Use the same spelling across activities.</span>
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">Instructions for learners</span>
        <textarea
          name="instructions"
          rows={3}
          maxLength={600}
          defaultValue={defaults?.instructions ?? ""}
          placeholder="What will learners do, and what does it help them practise? e.g. Watch each clip and pick the verb form you hear."
          className="field"
        />
        <span className="text-xs text-subtle">Shown before the activity starts.</span>
      </label>
    </>
  );
}
