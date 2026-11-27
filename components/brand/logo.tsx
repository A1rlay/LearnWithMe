/** Two overlapping circles: you, and the person you learn with. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="26" cy="32" r="13" fill="var(--color-series-now)" />
      <circle cx="38" cy="32" r="13" fill="var(--color-series-then)" fillOpacity={0.85} />
      <path d="M32 20.4a13 13 0 0 1 0 23.2a13 13 0 0 1 0-23.2z" fill="var(--color-fg)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-fg">
        Learn <span className="font-display text-[18px] italic text-accent-text">with</span> me
      </span>
    </span>
  );
}
