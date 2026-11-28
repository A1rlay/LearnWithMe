/** One-line status banner fed by a ?notice= query param after a server action. */
export function Notice({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p role="status" className="card border-accent-text/30 px-4 py-3 text-sm text-fg">
      {text.slice(0, 200)}
    </p>
  );
}
