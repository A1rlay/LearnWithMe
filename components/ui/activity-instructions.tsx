/** "How it works" card: the expert's instructions, or a sensible default for the activity kind. */
export function ActivityInstructions({ text, fallback }: { text: string | null | undefined; fallback: string }) {
  return (
    <div className="card flex items-start gap-3 p-4 text-sm">
      <span aria-hidden="true" className="mt-0.5 text-accent-text">ⓘ</span>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-fg">How it works</p>
        <p className="whitespace-pre-line text-muted">{text || fallback}</p>
      </div>
    </div>
  );
}
