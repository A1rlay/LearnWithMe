/** Weekly goal ring: done of goal. Text carries the number, so the ring is decorative. */
export function GoalRing({ done, goal, size = 44, label }: { done: number; goal: number; size?: number; label?: string }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.min(done / Math.max(goal, 1), 1);
  const met = done >= goal;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
        {frac > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={met ? "var(--color-series-then)" : "var(--color-series-now)"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * frac} ${c}`}
          />
        )}
      </svg>
      <span className="absolute font-mono text-[11px] text-fg">
        {met ? "✓" : `${done}/${goal}`}
      </span>
      <span className="sr-only">{label ?? `${done} of ${goal} activities this week${met ? ", goal met" : ""}`}</span>
    </span>
  );
}
