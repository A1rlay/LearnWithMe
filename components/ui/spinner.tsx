/** The one loading spinner. Decorative: pair it with visible text or an aria-busy parent. */
export function Spinner({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`spinner ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Spinner with a visible label, announced politely to screen readers. */
export function LoadingLabel({ children = "Loading…", className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <span role="status" className={`inline-flex items-center gap-2 text-sm text-muted ${className}`}>
      <Spinner />
      {children}
    </span>
  );
}
